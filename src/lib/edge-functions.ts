import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import type { GenerateBriefsInput, GenerateBriefsResult } from "@/types/briefs"

/**
 * Llama a la Edge Function generate-briefs. Devuelve la sesión + los briefs,
 * o lanza un Error con un mensaje legible (red / auth / error de la función).
 */
export async function generateBriefs(
  input: GenerateBriefsInput,
): Promise<GenerateBriefsResult> {
  // La generación puede tardar 30-40s (hasta 15 ideas). La función tiene un
  // timeout interno de 50s; damos 90s en el cliente para recibir su respuesta
  // (incluido su propio error de timeout) sin cortar antes de tiempo.
  const { data, error } = await supabase.functions.invoke<GenerateBriefsResult>(
    "generate-briefs",
    { body: input, timeout: 90_000 },
  )

  if (error) {
    throw new Error(await functionErrorMessage(error))
  }
  if (!data) {
    throw new Error("La función no devolvió datos.")
  }
  return data
}

/** Extrae el mensaje del cuerpo JSON de la función ({ error }) cuando hay un error HTTP. */
async function functionErrorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json()
      if (body && typeof body.error === "string") return body.error
    } catch {
      // El cuerpo no era JSON; usamos un mensaje genérico.
    }
    return "La generación falló en el servidor."
  }
  if (error instanceof FunctionsFetchError) {
    return "No se pudo conectar con la función (timeout o red). Intenta de nuevo."
  }
  if (error instanceof Error) return error.message
  return "Error desconocido al generar las ideas."
}
