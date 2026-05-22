// Calendario de ocasiones relevantes para México + industria hospitality / F&B.
// Archivo puro de datos + lógica: sin React, sin Supabase.
//
// El agente usa esto para PROPONER una ocasión por default; el usuario siempre
// puede sobrescribirla en la UI.

export interface Occasion {
  id: string
  name: string
  description: string
  /** Fecha puntual (eventos de un día). */
  date?: Date
  /** Rango (temporadas o eventos de varios días). */
  season?: { start: Date; end: Date }
  category: "holiday" | "season" | "commercial"
}

type Resolved = { date?: Date; season?: { start: Date; end: Date } }

interface OccasionDef {
  id: string
  name: string
  description: string
  category: Occasion["category"]
  /** Produce la fecha/temporada concreta para un año dado. */
  resolve: (year: number) => Resolved
}

// ---------------------------------------------------------------------------
// Helpers de fecha
// ---------------------------------------------------------------------------

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

/** N-ésimo día de la semana de un mes. weekday: 0=domingo … 6=sábado. n: 1..5. */
function nthWeekdayOfMonth(year: number, month0: number, weekday: number, n: number): Date {
  const first = new Date(year, month0, 1)
  const offset = (weekday - first.getDay() + 7) % 7
  return new Date(year, month0, 1 + offset + (n - 1) * 7)
}

/** Domingo de Pascua (algoritmo gregoriano de Meeus/Jones/Butcher). */
function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) // 3=marzo, 4=abril
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

// month1 = mes 1..12 (más legible que el 0-indexado de JS).
function onDate(month1: number, day: number) {
  return (year: number): Resolved => ({ date: new Date(year, month1 - 1, day) })
}

function onSeason(sMonth1: number, sDay: number, eMonth1: number, eDay: number) {
  return (year: number): Resolved => ({
    season: {
      start: new Date(year, sMonth1 - 1, sDay),
      end: new Date(year, eMonth1 - 1, eDay),
    },
  })
}

// ---------------------------------------------------------------------------
// Definiciones de ocasiones
// (orden: holidays primero, luego seasons, luego commercial — para desempates)
// ---------------------------------------------------------------------------

const OCCASION_DEFS: OccasionDef[] = [
  // ----- Días festivos -----
  {
    id: "ano-nuevo",
    name: "Año Nuevo",
    description: "Inicio de año: propósitos, brindis, celebraciones.",
    category: "holiday",
    resolve: onDate(1, 1),
  },
  {
    id: "dia-de-reyes",
    name: "Día de Reyes",
    description: "Rosca de reyes, regalos, fin de la temporada decembrina.",
    category: "holiday",
    resolve: onDate(1, 6),
  },
  {
    id: "san-valentin",
    name: "San Valentín",
    description: "Día del amor y la amistad: parejas, cenas, escapadas románticas.",
    category: "holiday",
    resolve: onDate(2, 14),
  },
  {
    id: "dia-de-la-mujer",
    name: "Día Internacional de la Mujer",
    description: "8M: reconocimiento y mensajes con causa.",
    category: "holiday",
    resolve: onDate(3, 8),
  },
  {
    id: "dia-del-nino",
    name: "Día del Niño",
    description: "Familias con niños, actividades infantiles, paquetes familiares.",
    category: "holiday",
    resolve: onDate(4, 30),
  },
  {
    id: "dia-de-las-madres",
    name: "Día de las Madres",
    description: "10 de mayo en México: brunch, regalos, celebración familiar.",
    category: "holiday",
    resolve: onDate(5, 10),
  },
  {
    id: "dia-del-padre",
    name: "Día del Padre",
    description: "Tercer domingo de junio: celebración para papás.",
    category: "holiday",
    resolve: (year) => ({ date: nthWeekdayOfMonth(year, 5, 0, 3) }),
  },
  {
    id: "independencia",
    name: "Día de la Independencia",
    description: "15-16 sep: el Grito, fiestas patrias, gastronomía mexicana.",
    category: "holiday",
    resolve: onSeason(9, 15, 9, 16),
  },
  {
    id: "dia-de-muertos",
    name: "Día de Muertos",
    description: "1-2 nov: altares, tradición, estética muy visual.",
    category: "holiday",
    resolve: onSeason(11, 1, 11, 2),
  },
  {
    id: "dia-de-la-revolucion",
    name: "Día de la Revolución",
    description: "20 de noviembre: fin de semana largo, puente.",
    category: "holiday",
    resolve: onDate(11, 20),
  },
  {
    id: "navidad",
    name: "Navidad",
    description: "25 dic: cenas, posadas, regalos, ambiente familiar.",
    category: "holiday",
    resolve: onDate(12, 25),
  },

  // ----- Temporadas -----
  {
    id: "semana-santa",
    name: "Semana Santa",
    description: "Semana Santa (móvil): vacaciones, viajes, alta ocupación.",
    category: "season",
    resolve: (year) => {
      const easter = easterSunday(year)
      return { season: { start: addDays(easter, -7), end: easter } }
    },
  },
  {
    id: "verano",
    name: "Verano",
    description: "Julio-agosto: temporada vacacional alta, familias, calor.",
    category: "season",
    resolve: onSeason(7, 1, 8, 31),
  },
  {
    id: "regreso-a-clases",
    name: "Regreso a clases",
    description: "Mediados de agosto: vuelta a la rutina, promociones.",
    category: "season",
    resolve: onSeason(8, 12, 8, 26),
  },
  {
    id: "vacaciones-invierno",
    name: "Vacaciones de invierno",
    description: "Mediados de diciembre a inicios de enero: temporada decembrina alta.",
    category: "season",
    resolve: (year) => ({
      season: { start: new Date(year, 11, 15), end: new Date(year + 1, 0, 6) },
    }),
  },

  // ----- Comerciales (fechas aproximadas; varían cada año) -----
  {
    id: "hot-sale",
    name: "Hot Sale",
    description:
      "Venta en línea de la segunda mitad de mayo (fechas oficiales se anuncian cada año): promociones y paquetes.",
    category: "commercial",
    resolve: onSeason(5, 15, 5, 31),
  },
  {
    id: "buen-fin",
    name: "El Buen Fin",
    description:
      "Fin de semana de descuentos (vie–lun) del tercer lunes de noviembre (fechas oficiales se anuncian cada año).",
    category: "commercial",
    resolve: (year) => {
      const thirdMonday = nthWeekdayOfMonth(year, 10, 1, 3) // noviembre, lunes, 3°
      return { season: { start: addDays(thirdMonday, -3), end: thirdMonday } }
    },
  },
  {
    id: "black-friday",
    name: "Black Friday",
    description: "Viernes después de Thanksgiving (EE.UU.): ofertas.",
    category: "commercial",
    resolve: (year) => ({ date: addDays(nthWeekdayOfMonth(year, 10, 4, 4), 1) }),
  },
  {
    id: "cyber-monday",
    name: "Cyber Monday",
    description: "Lunes después de Black Friday: ofertas en línea.",
    category: "commercial",
    resolve: (year) => ({ date: addDays(nthWeekdayOfMonth(year, 10, 4, 4), 4) }),
  },
]

const HORIZON_DAYS = 42 // hoy + 6 semanas

/**
 * Distancia (en ms) entre `today` y la ocasión, si cae dentro de
 * [today, horizon]; null si no es relevante en esa ventana.
 * Una temporada activa hoy tiene distancia 0 (máxima relevancia).
 */
function relevanceDistance(occ: Occasion, today: Date, horizon: Date): number | null {
  if (occ.date) {
    if (occ.date >= today && occ.date <= horizon) {
      return occ.date.getTime() - today.getTime()
    }
    return null
  }
  if (occ.season) {
    const { start, end } = occ.season
    if (end < today || start > horizon) return null
    const effectiveStart = start < today ? today : start
    return effectiveStart.getTime() - today.getTime()
  }
  return null
}

function resolveOccasion(def: OccasionDef, year: number): Occasion {
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    category: def.category,
    ...def.resolve(year),
  }
}

/**
 * Devuelve la ocasión más relevante para hoy + las próximas 6 semanas,
 * o null si no hay nada cerca. "Más relevante" = la más próxima (o activa hoy).
 */
export function getRelevantOccasion(date: Date): Occasion | null {
  const today = startOfDay(date)
  const horizon = addDays(today, HORIZON_DAYS)
  // Dos años por si la ventana cruza el cambio de año (p. ej. mediados de dic).
  const years = [today.getFullYear(), today.getFullYear() + 1]

  let best: { occ: Occasion; distance: number } | null = null
  for (const def of OCCASION_DEFS) {
    for (const year of years) {
      const occ = resolveOccasion(def, year)
      const dist = relevanceDistance(occ, today, horizon)
      if (dist === null) continue
      if (!best || dist < best.distance) best = { occ, distance: dist }
    }
  }
  return best ? best.occ : null
}

/**
 * Todas las ocasiones resueltas para el año de `date` (y el siguiente),
 * ordenadas por fecha. Útil para el autocompletado de la UI.
 */
export function getAllOccasions(date: Date): Occasion[] {
  const years = [date.getFullYear(), date.getFullYear() + 1]
  const all: Occasion[] = []
  for (const def of OCCASION_DEFS) {
    for (const year of years) {
      all.push(resolveOccasion(def, year))
    }
  }
  const sortKey = (o: Occasion) => (o.date ?? o.season?.start ?? new Date(0)).getTime()
  return all.sort((a, b) => sortKey(a) - sortKey(b))
}
