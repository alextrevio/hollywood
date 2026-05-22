import { z } from "npm:zod@3.23.8"

// ---------------------------------------------------------------------------
// Request (lo que el frontend envía)
// ---------------------------------------------------------------------------
export const requestSchema = z.object({
  brand_id: z.string().uuid(),
  occasion: z.string().min(1),
  objective: z.enum(["awareness", "promotion", "event", "engagement"]),
  num_ideas: z.number().int().min(1).max(15),
  format_preferences: z.array(z.string()),
  extra_notes: z.string().optional(),
})
export type GenerateBriefsRequest = z.infer<typeof requestSchema>

// ---------------------------------------------------------------------------
// Salida del modelo (validamos la ENTRADA de la herramienta con esto)
// ---------------------------------------------------------------------------
export const formatSuggestionSchema = z.object({
  type: z.string(),
  dimensions: z
    .string()
    .regex(/^\d{3,5}x\d{3,5}$/, "Formato esperado: AnchoxAlto (ej. 1080x1080)"),
})

export const visualBriefSchema = z.object({
  uses_stock: z.boolean(),
  image_description: z.string(),
  style: z.enum([
    "photographic",
    "illustration",
    "minimalist",
    "collage",
    "typography_focused",
  ]),
  mood: z.string(),
  composition: z.string(),
  text_position: z.enum([
    "top",
    "center",
    "bottom",
    "left",
    "right",
    "overlay",
    "none",
  ]),
  colors: z.array(z.string()),
})

export const briefSchema = z.object({
  concept: z.string().min(1),
  headline: z.string().min(1),
  copy_body: z.string().min(1),
  cta: z.string().optional(),
  hashtags: z.array(
    z.string().regex(/^[^#].*/, "Los hashtags no deben incluir el símbolo #"),
  ),
  format_suggestions: z.array(formatSuggestionSchema),
  visual_brief: visualBriefSchema,
  suggested_stock_ids: z.array(z.string()),
})

export const briefsResponseSchema = z.object({
  briefs: z.array(briefSchema),
})
export type GeneratedBrief = z.infer<typeof briefSchema>

// ---------------------------------------------------------------------------
// Definición de la herramienta (JSON Schema) que se le pasa a Claude.
// tool_choice fuerza a Claude a llamarla → estructura garantizada.
// ---------------------------------------------------------------------------
export const BRIEFS_TOOL = {
  name: "entregar_briefs",
  description:
    "Entrega los briefs de campaña generados. Llama SIEMPRE a esta herramienta con el número exacto de briefs solicitado.",
  input_schema: {
    type: "object",
    properties: {
      briefs: {
        type: "array",
        description: "Lista de briefs de campaña, distintos entre sí.",
        items: {
          type: "object",
          properties: {
            concept: {
              type: "string",
              description: "Concepto creativo central de la pieza (1-2 frases).",
            },
            headline: {
              type: "string",
              description: "Titular principal, corto y con gancho.",
            },
            copy_body: {
              type: "string",
              description: "Texto del cuerpo, listo para publicar, en el tono de la marca.",
            },
            cta: { type: "string", description: "Llamado a la acción (ej. 'Reserva hoy')." },
            hashtags: {
              type: "array",
              items: { type: "string" },
              description: "Hashtags SIN el símbolo #, relevantes y en español.",
            },
            format_suggestions: {
              type: "array",
              description: "Formatos sugeridos para la pieza.",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    description: "Tipo de formato (post, story, carousel, banner, flyer…).",
                  },
                  dimensions: {
                    type: "string",
                    pattern: "^\\d{3,5}x\\d{3,5}$",
                    description: "Dimensiones en formato AnchoxAlto (ej. '1080x1080').",
                  },
                },
                required: ["type", "dimensions"],
              },
            },
            visual_brief: {
              type: "object",
              description: "Brief visual para el diseñador / la fase de generación de imagen.",
              properties: {
                uses_stock: {
                  type: "boolean",
                  description: "true si la idea funciona con una imagen de stock existente.",
                },
                image_description: {
                  type: "string",
                  description: "Descripción de la imagen ideal para la pieza.",
                },
                style: {
                  type: "string",
                  enum: [
                    "photographic",
                    "illustration",
                    "minimalist",
                    "collage",
                    "typography_focused",
                  ],
                  description: "Estilo visual de la pieza.",
                },
                mood: {
                  type: "string",
                  description: "Ambiente o sensación (ej. 'cálido y acogedor', 'energético', 'lujoso').",
                },
                composition: {
                  type: "string",
                  description: "Composición sugerida (ej. 'primer plano de comida', 'wide shot del lobby').",
                },
                text_position: {
                  type: "string",
                  enum: ["top", "center", "bottom", "left", "right", "overlay", "none"],
                  description: "Dónde colocar el texto sobre la imagen.",
                },
                colors: {
                  type: "array",
                  items: { type: "string" },
                  description: "Colores sugeridos en hex, preferentemente de la paleta de la marca.",
                },
              },
              required: [
                "uses_stock",
                "image_description",
                "style",
                "mood",
                "composition",
                "text_position",
                "colors",
              ],
            },
            suggested_stock_ids: {
              type: "array",
              items: { type: "string" },
              description:
                "IDs (UUID) de imágenes de stock provistas que encajan con la pieza. Usa SOLO IDs de la lista dada; deja vacío si ninguna aplica. No inventes IDs.",
            },
          },
          required: [
            "concept",
            "headline",
            "copy_body",
            "hashtags",
            "format_suggestions",
            "visual_brief",
            "suggested_stock_ids",
          ],
        },
      },
    },
    required: ["briefs"],
  },
} as const

// ---------------------------------------------------------------------------
// Contexto de marca cargado desde la DB para construir el prompt
// ---------------------------------------------------------------------------
export interface BrandContext {
  name: string
  industry: string | null
  description: string | null
  identity: {
    color_palette: unknown
    typography: unknown
    voice_description: string | null
    voice_examples_good: string[] | null
    voice_examples_bad: string[] | null
    dos: string[] | null
    donts: string[] | null
    notes: string | null
  } | null
  stock: {
    id: string
    title: string | null
    category: string | null
    tags: string[] | null
  }[]
  goodReferences: {
    title: string | null
    notes: string | null
    performance_notes: string | null
  }[]
}
