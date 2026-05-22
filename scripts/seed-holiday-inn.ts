/**
 * Seed script: Holiday Inn Monterrey Parque Fundidora.
 *
 * Crea la marca + identidad + 3 fotos de stock usando el cliente con
 * service_role (bypassa RLS para inserts directos). Idempotente: si la marca
 * ya existe, pregunta qué hacer.
 *
 * Correr:  npm run seed:holiday-inn
 * (Las fotos se buscan en ~/Downloads por default; override con SEED_UPLOADS_DIR.)
 */
import { existsSync, readFileSync, statSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { createInterface } from "node:readline/promises"
import { createClient } from "@supabase/supabase-js"

const SLUG = "holiday-inn-monterrey-parque-fundidora"
const STOCK_BUCKET = "stock"
const UPLOADS_DIR = process.env.SEED_UPLOADS_DIR ?? join(homedir(), "Downloads")

// ---------------------------------------------------------------------------
// Entorno (cargador nativo de Node 20.12+, sin dotenv).
// La service_role se lee SOLO de process.env, nunca de argumentos.
// ---------------------------------------------------------------------------
try {
  process.loadEnvFile(".env.local")
} catch {
  // Si .env.local no existe, las validaciones de abajo dan el error claro.
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) {
  throw new Error("Falta VITE_SUPABASE_URL en .env.local")
}
if (!SERVICE_ROLE_KEY) {
  throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en .env.local")
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ---------------------------------------------------------------------------
// Datos
// ---------------------------------------------------------------------------
const BRAND = {
  name: "Holiday Inn Monterrey Parque Fundidora",
  slug: SLUG,
  industry: "hospitality",
  description:
    "Hotel del centro de Monterrey junto al Parque Fundidora, parte de la cadena Holiday Inn (IHG). Espacios renovados, servicio cálido, ideal para huéspedes de negocio y familias.",
}

const IDENTITY = {
  color_palette: [
    { name: "Holiday Green", hex: "#1F8A4C", usage: "Color principal de marca, logo" },
    { name: "Warm Orange", hex: "#E84C24", usage: "CTAs, headlines, acentos cálidos" },
    { name: "Soft Cream", hex: "#F5F0E6", usage: "Fondos cálidos" },
    { name: "Charcoal", hex: "#2C2C2C", usage: "Texto principal" },
    { name: "Sky Blue", hex: "#5BA3D0", usage: "Acentos secundarios" },
  ],
  typography: [
    { family: "Inter", usage: "body, captions, copy", weights: [400, 500] },
    { family: "Inter", usage: "headlines, CTAs", weights: [600, 700] },
  ],
  voice_description:
    "Cercano, profesional, cálido. Habla de tú con respeto. Comunica confort y experiencia sin pretensión. Mexicano natural, evita anglicismos innecesarios. Optimista sin caer en cursi.",
  voice_examples_good: [
    "Tu próxima escapada en el corazón de Monterrey.",
    "Descansa, conecta, disfruta. Estás como en casa.",
    "Espacios renovados, mismo sabor de siempre.",
    "Donde cada detalle hace la diferencia.",
  ],
  voice_examples_bad: [
    "¡¡HOSPÉDATE YA Y AHORRA MUCHO!!",
    "El hotel más increíble de toda la zona",
    "Book now for amazing deals",
  ],
  dos: [
    "Usar imágenes de experiencias reales (familias, parejas, profesionales)",
    "Mencionar la ubicación junto al Parque Fundidora como ventaja",
    "Mostrar la calidez del personal y servicio",
    "Comunicar confort y descanso",
    "Resaltar la conveniencia para viaje de negocios y familia",
  ],
  donts: [
    "No inventar premios, ratings o certificaciones",
    "No prometer descuentos específicos sin confirmar",
    "No usar fotos que no sean del hotel real",
    "No usar tono agresivo de venta",
    "No usar anglicismos innecesarios",
  ],
  notes:
    "Hotel parte de IHG (InterContinental Hotels Group), categoría Holiday Inn. Marca con personalidad cálida y accesible.",
}

interface Photo {
  file: string
  category: string
  tags: string[]
  title: string
  description: string
}

const PHOTOS: Photo[] = [
  {
    file: "701445715_1319488490300189_5697847467340043111_n.jpg",
    category: "lobby",
    tags: ["pareja", "viaje", "descanso", "tecnología", "moderno"],
    title: "Pareja en lobby moderno",
    description: "Pareja revisando contenido en el lobby renovado del hotel",
  },
  {
    file: "701460725_1322792636636441_6432040791377122992_n.jpg",
    category: "room",
    tags: ["negocio", "trabajo", "escritorio", "profesional", "habitación"],
    title: "Habitación con espacio de trabajo",
    description: "Habitación con escritorio funcional, ideal para huéspedes de negocio",
  },
  {
    file: "704326949_1325287269720311_3581060344339186364_n.jpg",
    category: "restaurant",
    tags: ["familia", "desayuno", "niños", "espacios renovados", "comedor"],
    title: "Familia en restaurante",
    description: "Familia disfrutando los espacios renovados del restaurante del hotel",
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Propaga errores de Supabase con contexto en vez de silenciarlos. */
function unwrap<T>(
  res: { data: T; error: { message: string } | null },
  context: string,
): NonNullable<T> {
  if (res.error) throw new Error(`${context}: ${res.error.message}`)
  if (res.data == null) throw new Error(`${context}: la operación no devolvió datos.`)
  return res.data as NonNullable<T>
}

/** Dimensiones de un JPEG leyendo el marcador SOF (sin dependencias). */
function jpegSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null
  let offset = 2
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset++
      continue
    }
    const marker = buf[offset + 1]
    if (marker === 0xff) {
      offset++ // bytes de relleno
      continue
    }
    // SOF0..SOF15 (excepto DHT/JPG/DAC) → contienen las dimensiones
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      const height = buf.readUInt16BE(offset + 5)
      const width = buf.readUInt16BE(offset + 7)
      return { width, height }
    }
    // marcadores sin payload de longitud
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2
      continue
    }
    const segLen = buf.readUInt16BE(offset + 2)
    if (segLen < 2) return null
    offset += 2 + segLen
  }
  return null
}

async function askChoice(): Promise<"abort" | "reload" | "stock-only"> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    console.log("\n¿Qué quieres hacer?")
    console.log("  1) Abortar (no hacer nada)")
    console.log("  2) Recargar (borrar la marca existente y recrearla desde cero)")
    console.log("  3) Solo añadir stock faltante (asume que la identidad ya existe)")
    const ans = (await rl.question("Elige 1 / 2 / 3: ")).trim()
    if (ans === "2") return "reload"
    if (ans === "3") return "stock-only"
    return "abort"
  } finally {
    rl.close()
  }
}

async function uploadPhoto(brandId: string, photo: Photo): Promise<string> {
  const filePath = join(UPLOADS_DIR, photo.file)
  if (!existsSync(filePath)) {
    throw new Error(
      `No se encontró la imagen: ${filePath} (mueve las fotos a esa carpeta o define SEED_UPLOADS_DIR).`,
    )
  }
  const buffer = readFileSync(filePath)
  const dims = jpegSize(buffer)
  const fileSize = statSync(filePath).size
  const storagePath = `${brandId}/${photo.file}`

  const up = await supabase.storage
    .from(STOCK_BUCKET)
    .upload(storagePath, buffer, { contentType: "image/jpeg", upsert: true })
  if (up.error) throw new Error(`Subiendo "${photo.file}" a Storage: ${up.error.message}`)

  const inserted = unwrap(
    await supabase
      .from("stock_assets")
      .insert({
        brand_id: brandId,
        storage_path: storagePath,
        title: photo.title,
        description: photo.description,
        category: photo.category,
        tags: photo.tags,
        width: dims?.width ?? null,
        height: dims?.height ?? null,
        file_size_bytes: fileSize,
        mime_type: "image/jpeg",
        uploaded_by: null,
      })
      .select("id")
      .single(),
    `Insertando stock_asset "${photo.title}"`,
  )
  const id = inserted.id as string
  console.log(
    `  ✓ ${photo.title} — ${dims ? `${dims.width}x${dims.height}` : "dim?"}, ${fileSize} bytes → ${id}`,
  )
  return id
}

async function createBrandAndIdentity(): Promise<string> {
  const brand = unwrap(
    await supabase
      .from("brands")
      .insert({ ...BRAND, created_by: null })
      .select("id")
      .single(),
    "Creando la marca",
  )
  const brandId = brand.id as string

  const identity = await supabase
    .from("brand_identities")
    .insert({ brand_id: brandId, ...IDENTITY })
    .select("id")
    .single()
  if (identity.error) throw new Error(`Creando la identidad: ${identity.error.message}`)

  console.log(`  ✓ Marca creada: ${brandId}`)
  console.log("  ✓ Identidad creada")
  return brandId
}

/** Borra los archivos de Storage del stock de una marca (la cascada DB no toca Storage). */
async function deleteStockFiles(brandId: string): Promise<void> {
  const res = await supabase.from("stock_assets").select("storage_path").eq("brand_id", brandId)
  if (res.error) throw new Error(`Listando stock para limpiar Storage: ${res.error.message}`)
  const paths = ((res.data ?? []) as { storage_path: string }[]).map((r) => r.storage_path)
  if (paths.length > 0) {
    const rm = await supabase.storage.from(STOCK_BUCKET).remove(paths)
    if (rm.error) throw new Error(`Borrando archivos de Storage: ${rm.error.message}`)
    console.log(`  ✓ ${paths.length} archivo(s) de Storage eliminados`)
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log("🌱 Seed: Holiday Inn Monterrey Parque Fundidora\n")

  const existing = await supabase.from("brands").select("id").eq("slug", SLUG).maybeSingle()
  if (existing.error) throw new Error(`Buscando marca existente: ${existing.error.message}`)

  let brandId: string
  const stockIds: string[] = []

  if (existing.data) {
    const existingId = existing.data.id as string
    console.log(`⚠️  Ya existe una marca con slug "${SLUG}" (id ${existingId}).`)
    const choice = await askChoice()

    if (choice === "abort") {
      console.log("\nAbortado. No se hizo ningún cambio.")
      return
    }

    if (choice === "reload") {
      console.log("\nRecargando (borrado en cascada + recreación)…")
      await deleteStockFiles(existingId)
      const del = await supabase.from("brands").delete().eq("id", existingId)
      if (del.error) throw new Error(`Borrando la marca existente: ${del.error.message}`)
      console.log("  ✓ Marca anterior borrada (identidad, stock, sesiones y briefs por cascada)")
      brandId = await createBrandAndIdentity()
      for (const photo of PHOTOS) stockIds.push(await uploadPhoto(brandId, photo))
    } else {
      console.log("\nSolo añadiendo stock faltante…")
      brandId = existingId
      const existingStock = unwrap(
        await supabase.from("stock_assets").select("title").eq("brand_id", brandId),
        "Listando stock existente",
      )
      const titles = new Set((existingStock as { title: string | null }[]).map((r) => r.title))
      for (const photo of PHOTOS) {
        if (titles.has(photo.title)) {
          console.log(`  — Ya existe, omito: ${photo.title}`)
          continue
        }
        stockIds.push(await uploadPhoto(brandId, photo))
      }
    }
  } else {
    console.log("Creando marca, identidad y stock desde cero…")
    brandId = await createBrandAndIdentity()
    for (const photo of PHOTOS) stockIds.push(await uploadPhoto(brandId, photo))
  }

  // Confirmar que la identidad existe
  const idCheck = await supabase
    .from("brand_identities")
    .select("id")
    .eq("brand_id", brandId)
    .maybeSingle()
  if (idCheck.error) throw new Error(`Verificando identidad: ${idCheck.error.message}`)
  const hasIdentity = !!idCheck.data

  console.log("\n========== RESUMEN ==========")
  console.log(`brand_id:       ${brandId}`)
  console.log(`stock creados:  ${stockIds.length}`)
  stockIds.forEach((id, i) => console.log(`   [${i + 1}] ${id}`))
  console.log(`identidad:      ${hasIdentity ? "✓ existe" : "✗ NO existe"}`)
  console.log(
    `Total:          1 marca + ${hasIdentity ? 1 : 0} identidad + ${stockIds.length} assets`,
  )
  console.log("=============================")
}

main()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error("\n❌ Error:", err instanceof Error ? err.message : err)
    process.exit(1)
  })
