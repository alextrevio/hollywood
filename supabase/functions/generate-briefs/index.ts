import { createClient } from "npm:@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"
import {
  BRIEFS_TOOL,
  briefsResponseSchema,
  requestSchema,
  type BrandContext,
  type GenerateBriefsRequest,
} from "../_shared/types.ts"
import {
  AnthropicError,
  callClaudeWithTool,
  computeCostUsd,
} from "../_shared/anthropic.ts"

const MODEL = "claude-opus-4-7"
const TIMEOUT_MS = 50_000

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  })
}

Deno.serve(async (req: Request) => {
  // --- CORS preflight ---
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return json({ error: "Método no permitido." }, 405)
  }

  // --- Secret (nunca se loguea ni se devuelve) ---
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY")
  if (!apiKey) {
    return json({ error: "El servicio no está configurado correctamente." }, 500)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  const authHeader = req.headers.get("Authorization") ?? ""

  // Cliente con el JWT del usuario → respeta RLS y permite getUser().
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  // --- 1) Autenticación ---
  const { data: userData, error: userError } = await supabase.auth.getUser()
  const user = userData?.user
  if (userError || !user) {
    return json({ error: "No autorizado." }, 401)
  }

  // --- 2) Validación del body con Zod ---
  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return json({ error: "Body inválido: se esperaba JSON." }, 400)
  }
  const parsed = requestSchema.safeParse(rawBody)
  if (!parsed.success) {
    return json(
      { error: "Parámetros inválidos.", details: parsed.error.flatten() },
      400,
    )
  }
  const input = parsed.data

  // --- 3) Cargar contexto de la marca ---
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, industry, description")
    .eq("id", input.brand_id)
    .maybeSingle()
  if (brandError) return json({ error: "Error al cargar la marca." }, 500)
  if (!brand) return json({ error: "Marca no encontrada." }, 404)

  const { data: identity } = await supabase
    .from("brand_identities")
    .select(
      "color_palette, typography, voice_description, voice_examples_good, voice_examples_bad, dos, donts, notes",
    )
    .eq("brand_id", brand.id)
    .maybeSingle()

  const { data: stock } = await supabase
    .from("stock_assets")
    .select("id, title, category, tags")
    .eq("brand_id", brand.id)
    .limit(50)

  const { data: goodRefs } = await supabase
    .from("brand_references")
    .select("title, notes, performance_notes")
    .eq("brand_id", brand.id)
    .eq("is_good_example", true)
    .limit(10)

  const ctx: BrandContext = {
    name: brand.name,
    industry: brand.industry,
    description: brand.description,
    identity: identity ?? null,
    stock: stock ?? [],
    goodReferences: goodRefs ?? [],
  }
  const validStockIds = new Set((stock ?? []).map((s) => s.id))

  // --- 4) Crear la sesión (running) ---
  const { data: session, error: sessionError } = await supabase
    .from("generation_sessions")
    .insert({
      brand_id: brand.id,
      user_id: user.id,
      occasion: input.occasion,
      objective: input.objective,
      num_ideas_requested: input.num_ideas,
      format_preferences: input.format_preferences,
      extra_notes: input.extra_notes ?? null,
      status: "running",
    })
    .select()
    .single()
  if (sessionError || !session) {
    return json({ error: "No se pudo iniciar la sesión de generación." }, 500)
  }

  const systemPrompt = buildSystemPrompt(ctx)
  const userMessage = buildUserMessage(input)
  // Escalamos el presupuesto de salida según el número de ideas (techo seguro).
  const maxTokens = Math.min(input.num_ideas * 1200 + 1000, 20_000)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const result = await callClaudeWithTool({
      apiKey,
      model: MODEL,
      system: systemPrompt,
      userMessage,
      tool: BRIEFS_TOOL as unknown as {
        name: string
        description: string
        input_schema: Record<string, unknown>
      },
      maxTokens,
      signal: controller.signal,
    })
    clearTimeout(timeout)

    // --- 5) Validar la salida del modelo ---
    const validated = briefsResponseSchema.safeParse(result.toolInput)
    if (!validated.success) {
      throw new Error("El modelo devolvió briefs con formato inválido.")
    }
    const generated = validated.data.briefs

    // --- 6) Costos ---
    const totalCost = computeCostUsd(result.tokensInput, result.tokensOutput)
    const perBriefCost = generated.length > 0 ? totalCost / generated.length : 0
    const perBriefIn =
      generated.length > 0 ? Math.round(result.tokensInput / generated.length) : 0
    const perBriefOut =
      generated.length > 0 ? Math.round(result.tokensOutput / generated.length) : 0

    // --- 7) Insertar briefs (status pending) ---
    const rawPrompt = `SYSTEM:\n${systemPrompt}\n\nUSER:\n${userMessage}`
    const rawResponse = JSON.stringify(result.toolInput)
    const rows = generated.map((b) => ({
      session_id: session.id,
      brand_id: brand.id,
      status: "pending",
      concept: b.concept,
      headline: b.headline,
      copy_body: b.copy_body,
      cta: b.cta || null,
      hashtags: b.hashtags,
      format_suggestions: b.format_suggestions,
      visual_brief: b.visual_brief,
      // Defensa: solo IDs reales del stock provisto (descarta alucinaciones).
      suggested_stock_ids: b.suggested_stock_ids.filter((id) => validStockIds.has(id)),
      model_used: MODEL,
      tokens_input: perBriefIn,
      tokens_output: perBriefOut,
      cost_usd: Number(perBriefCost.toFixed(6)),
      raw_prompt: rawPrompt,
      raw_response: rawResponse,
      created_by: user.id,
    }))

    const { data: insertedBriefs, error: insertError } = await supabase
      .from("briefs")
      .insert(rows)
      .select()
    if (insertError) {
      throw new Error("Error al guardar los briefs en la base de datos.")
    }

    // --- 8) Completar la sesión ---
    await supabase
      .from("generation_sessions")
      .update({
        status: "completed",
        total_cost_usd: Number(totalCost.toFixed(6)),
        completed_at: new Date().toISOString(),
      })
      .eq("id", session.id)

    return json({ session_id: session.id, briefs: insertedBriefs })
  } catch (err) {
    clearTimeout(timeout)

    const aborted = err instanceof DOMException && err.name === "AbortError"
    const message = aborted
      ? "La generación tardó demasiado (timeout). Intenta con menos ideas."
      : err instanceof AnthropicError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Error desconocido al generar los briefs."
    const status =
      err instanceof AnthropicError
        ? err.status === 429 || err.status === 529
          ? 503
          : 502
        : aborted
          ? 504
          : 500

    // Marcamos la sesión como fallida (sin loguear raw_response ni la API key).
    await supabase
      .from("generation_sessions")
      .update({
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", session.id)

    return json({ error: message, session_id: session.id }, status)
  }
})

// ---------------------------------------------------------------------------
// Construcción de prompts
// ---------------------------------------------------------------------------

function formatList(arr: string[] | null | undefined): string {
  if (!arr || arr.length === 0) return "(ninguno)"
  return arr.join("; ")
}

function formatPalette(palette: unknown): string {
  if (!Array.isArray(palette) || palette.length === 0) return "(no especificada)"
  const colors = palette as Array<{ name?: string; hex?: string; usage?: string }>
  return colors
    .map((c) => `${c.name ?? "?"} ${c.hex ?? ""} (${c.usage ?? ""})`)
    .join("; ")
}

function formatTypography(typo: unknown): string {
  if (!Array.isArray(typo) || typo.length === 0) return "(no especificada)"
  const faces = typo as Array<{ family?: string; usage?: string }>
  return faces.map((t) => `${t.family ?? "?"} — ${t.usage ?? ""}`).join("; ")
}

function objectiveLabel(o: string): string {
  const map: Record<string, string> = {
    awareness: "Awareness (dar a conocer / visibilidad)",
    promotion: "Promoción (impulsar ventas u ofertas)",
    event: "Evento (anunciar o llenar un evento)",
    engagement: "Engagement (interacción con la comunidad)",
  }
  return map[o] ?? o
}

function buildSystemPrompt(ctx: BrandContext): string {
  const industry = ctx.industry ?? "hospitalidad / F&B"
  const id = ctx.identity

  const stockList =
    ctx.stock.length > 0
      ? ctx.stock
          .map(
            (s) =>
              `- ${s.id} · ${s.title ?? "sin título"} · categoría: ${s.category ?? "n/a"} · tags: ${(s.tags ?? []).join(", ") || "—"}`,
          )
          .join("\n")
      : "(no hay imágenes de stock disponibles)"

  const refsList =
    ctx.goodReferences.length > 0
      ? ctx.goodReferences
          .map(
            (r) =>
              `- ${r.title ?? "sin título"}${r.notes ? ` — ${r.notes}` : ""}${r.performance_notes ? ` (resultado: ${r.performance_notes})` : ""}`,
          )
          .join("\n")
      : "(sin referencias marcadas como buenas)"

  return `Eres un estratega creativo senior especializado en marketing para la industria de ${industry}. Generas ideas de campaña accionables, originales y con un tono de marca impecable, listas para que un community manager las publique.

# Marca
- Nombre: ${ctx.name}
- Industria: ${industry}
- Descripción: ${ctx.description ?? "(sin descripción)"}

# Identidad de marca
- Paleta de color: ${formatPalette(id?.color_palette)}
- Tipografías: ${formatTypography(id?.typography)}
- Tono de voz: ${id?.voice_description ?? "(no especificado)"}
- Ejemplos de BUEN tono (imítalos): ${formatList(id?.voice_examples_good)}
- Ejemplos de MAL tono (evítalos): ${formatList(id?.voice_examples_bad)}
- Sí hacer (do's): ${formatList(id?.dos)}
- No hacer (don'ts): ${formatList(id?.donts)}
- Notas: ${id?.notes ?? "(sin notas)"}

# Imágenes de stock disponibles
(Puedes sugerir imágenes por su ID en "suggested_stock_ids".)
${stockList}

# Referencias que funcionaron bien
${refsList}

# Reglas
- Escribe TODO en español de México: natural, humano, sin sonar a robot ni a traducción.
- Respeta estrictamente el tono de voz y los do's/don'ts de la marca.
- Cada idea debe ser CLARAMENTE distinta de las demás. Busca diversidad en al menos uno de estos ejes: (a) tono (emocional/racional/humorístico), (b) enfoque (producto/experiencia/comunidad/lifestyle), (c) estructura del copy (narrativo/lista/pregunta/testimonial), (d) formato visual sugerido.
- Ata cada idea a la ocasión y al objetivo que te den.
- En "suggested_stock_ids" usa SOLO IDs de la lista de stock de arriba; si ninguna imagen aplica, deja el arreglo vacío. NUNCA inventes IDs.
- NUNCA inventes datos verificables que no estén en el contexto de la marca: precios, descuentos, premios, certificaciones, ratings, número de habitaciones, años de operación, ubicaciones específicas, nombres de chefs/personal, sabores/platillos específicos. Si necesitas mencionar algo así y no está en el contexto, usa lenguaje aspiracional o genérico (ej. "nuestra experiencia" en vez de "30 años de experiencia").
- Los CTAs deben ser accionables pero genéricos en cuanto a ofertas: "Reserva ya", "Aparta tu mesa", "Conoce más", "Pregunta por nuestras promos". NO inventes descuentos específicos ("20% off", "2x1") a menos que estén explícitamente en las notas adicionales del usuario.
- En "visual_brief.colors" usa preferentemente los hex de la paleta de la marca.
- Los hashtags van SIN el símbolo #.
- Longitud del copy_body según formato:
  - Post de Instagram/Facebook: 80-150 palabras
  - Story: 20-40 palabras (texto sobre imagen, breve y punzante)
  - Carrusel: 150-250 palabras (puedes desglosar por slide)
  - Banner de email: 40-80 palabras
  - Flyer: 50-100 palabras
  Si no se especifica formato, asume post de feed (80-150 palabras).
- Entrega el resultado SIEMPRE llamando a la herramienta "entregar_briefs", con el número EXACTO de ideas solicitado. No escribas texto fuera de la herramienta.`
}

function buildUserMessage(input: GenerateBriefsRequest): string {
  const formats =
    input.format_preferences.length > 0
      ? input.format_preferences.join(", ")
      : "los que consideres mejores"

  return `Genera EXACTAMENTE ${input.num_ideas} ideas de campaña distintas para esta petición:

- Ocasión: ${input.occasion}
- Objetivo: ${objectiveLabel(input.objective)}
- Formatos preferidos: ${formats}
- Notas adicionales: ${input.extra_notes ?? "(ninguna)"}

Llama a la herramienta "entregar_briefs" con las ${input.num_ideas} ideas.`
}
