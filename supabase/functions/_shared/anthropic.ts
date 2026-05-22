const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
const ANTHROPIC_VERSION = "2023-06-01"

// Precios de Claude Opus 4.7 en USD por 1M de tokens.
// VERIFICAR periódicamente en https://www.anthropic.com/pricing y actualizar.
export const OPUS_PRICING = {
  inputPerMTok: 15,
  outputPerMTok: 75,
}

export function computeCostUsd(tokensInput: number, tokensOutput: number): number {
  return (
    (tokensInput / 1_000_000) * OPUS_PRICING.inputPerMTok +
    (tokensOutput / 1_000_000) * OPUS_PRICING.outputPerMTok
  )
}

export class AnthropicError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "AnthropicError"
    this.status = status
  }
}

interface ToolDef {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

export interface ToolCallResult {
  toolInput: unknown
  tokensInput: number
  tokensOutput: number
}

/**
 * Llama a la API de Mensajes de Anthropic forzando una tool call.
 * NUNCA loguea la API key ni la incluye en errores.
 */
export async function callClaudeWithTool(params: {
  apiKey: string
  model: string
  system: string
  userMessage: string
  tool: ToolDef
  maxTokens: number
  signal?: AbortSignal
}): Promise<ToolCallResult> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": params.apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: params.maxTokens,
      system: params.system,
      messages: [{ role: "user", content: params.userMessage }],
      tools: [params.tool],
      tool_choice: { type: "tool", name: params.tool.name },
    }),
    signal: params.signal,
  })

  if (!res.ok) {
    // Mapeamos a un mensaje claro por código. No incluimos la API key ni el
    // cuerpo crudo del error en lo que devolvemos.
    throw new AnthropicError(res.status, friendlyAnthropicError(res.status))
  }

  const data = await res.json()
  const content = Array.isArray(data?.content) ? data.content : []
  const toolUse = content.find((b: { type?: string }) => b?.type === "tool_use")
  if (!toolUse) {
    throw new AnthropicError(
      502,
      "El modelo no devolvió la llamada a la herramienta esperada.",
    )
  }

  return {
    toolInput: toolUse.input,
    tokensInput: data?.usage?.input_tokens ?? 0,
    tokensOutput: data?.usage?.output_tokens ?? 0,
  }
}

function friendlyAnthropicError(status: number): string {
  switch (status) {
    case 401:
    case 403:
      return "Error de autenticación con la API de Anthropic (revisa el secret ANTHROPIC_API_KEY)."
    case 429:
      return "Se alcanzó el límite de tasa de la API de Anthropic. Intenta de nuevo en unos momentos."
    case 500:
      return "La API de Anthropic tuvo un error interno. Intenta de nuevo."
    case 529:
      return "La API de Anthropic está sobrecargada en este momento. Intenta de nuevo en unos minutos."
    default:
      return `La API de Anthropic devolvió un error (${status}).`
  }
}
