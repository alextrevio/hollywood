# CLAUDE.md — Hollywood

Guía para Claude Code (y para cualquiera que trabaje en este repo). **Léela antes de hacer cambios.**

## Qué es

Hollywood es un "estudio creativo" interno para gestionar la **identidad de marca** y el **stock visual** de varios clientes (hoteles, restaurantes, etc.). Empezó como **Fase 1: Brand Vault** (la fundación) y crece por fases.

**Implementado hasta ahora:** Fase 1 (Brand Vault) y **Fase 2 (Idea Agent)** — ver la sección "Fase 2" más abajo.

## Stack y versiones

| Pieza | Versión / nota |
|---|---|
| Vite | 8 (dev server en puerto **5173**) |
| React | 19 |
| TypeScript | 6, **modo strict** |
| Tailwind CSS | **v3** (NO v4 — v4 da problemas con shadcn) |
| shadcn/ui | estilo `new-york`, base color `zinc`, CSS variables |
| Supabase | Auth + Postgres + Storage (`@supabase/supabase-js`) |
| React Router | **v6** |
| TanStack Query | data fetching y caché |
| Zod + react-hook-form | validación y formularios |
| lucide-react | íconos |

## Comandos importantes

```bash
npm run dev       # Dev server en http://localhost:5173
npm run build     # tsc -b && vite build (build de producción + type-check completo)
npm run lint      # ESLint
npm run preview   # Sirve el build de producción localmente
npx tsc -b        # Solo type-check (sin emitir)
```

> **Dependencias:** este repo usa `legacy-peer-deps=true` (en `.npmrc`). Instala con `npm install` normal; ya aplica la resolución correcta para React 19 + shadcn.

### Aplicar migraciones (Supabase CLI)

```bash
supabase login                                    # una vez (abre el navegador)
supabase link --project-ref kkydesabgmsoailjslsv  # pide el password de la DB
supabase db push                                  # aplica las migraciones pendientes
```

## Estructura de carpetas

```
src/
  components/
    ui/        # componentes de shadcn (no editar a mano salvo necesidad)
    layout/    # AppLayout, Sidebar, Topbar
    auth/      # ProtectedRoute
    brand/     # IdentityTab, LogosTab, StockTab, ReferencesTab, IdeasTab, BriefCard, BriefDetailDialog, GenerateIdeasDialog
    shared/    # FileDropzone, AssetImage
    settings/  # CostsCard
  context/     # AuthProvider + auth-context (estado de sesión)
  hooks/       # use-auth, use-brands, use-brand-*, use-stock-assets, use-profile, use-signed-url, use-briefs, use-costs
  lib/         # supabase (cliente), queryClient, storage, utils, calendar, edge-functions
  pages/       # una por ruta (Login, Dashboard, NewBrand, BrandDetail, Settings, NotFound)
  types/       # database.ts (GENERADO por Supabase) + db.ts + briefs.ts
supabase/
  migrations/  # migraciones SQL versionadas
  functions/   # Edge Functions Deno: generate-briefs/ + _shared/ (anthropic, cors, types)
  config.toml
```

## Convenciones de naming

- **Componentes** → `PascalCase` (archivo y export): `AppLayout.tsx`, `BrandCard.tsx`.
- **Hooks** → `camelCase` con prefijo `use`, archivo en `kebab-case`: `useBrands()` en `use-brands.ts`.
- **Utilidades / libs** → archivos en `kebab-case`: `storage.ts`, `query-client`.
- **Rutas/páginas** → un componente `*Page` por ruta en `src/pages/`.

## Cómo agregar una nueva tabla

1. Crea la migración: `supabase/migrations/NNNN_descripcion.sql` (numera de forma incremental).
2. En el SQL: crea la tabla, **activa RLS** y añade policies (mínimo: SELECT/INSERT/UPDATE/DELETE para `authenticated`). Añade índices a las FKs.
3. Aplica: `supabase db push`.
4. Regenera los tipos:
   ```bash
   supabase gen types typescript --linked > src/types/database.ts
   ```
5. (Opcional) Agrega un alias en `src/types/db.ts`: `export type MiTabla = Tables<"mi_tabla">`.
6. Verifica que compila: `npm run build`.

## Reglas de seguridad (NO negociables)

- **Nunca** commitear `.env.local` (está en `.gitignore`). Los secretos van solo ahí.
- Solo las variables con prefijo `VITE_` llegan al navegador. La **anon key es pública por diseño**; lo que protege los datos es **RLS**. La `service_role` key **jamás** debe tocar el cliente.
- **Toda tabla nueva** debe tener **RLS activado** con policies explícitas (sin policy = denegado).
- **Validación doble:** Zod en el cliente *y* constraints/CHECK en la base de datos. No confíes solo en el cliente.
- Los buckets de Storage son **privados**: para mostrar archivos se usan **signed URLs** (`createSignedUrl`), no URLs públicas.
- La **`ANTHROPIC_API_KEY`** vive como **secret de Supabase** (`supabase secrets set`), NUNCA en el repo (ni en código, ni en comentarios, ni en `.env.example`). La **`SUPABASE_SERVICE_ROLE_KEY`** solo en `.env.local` (git-ignorado) y jamás en el cliente.

## Fase 2 — Idea Agent

Agente que genera **briefs de campaña** (concepto, headline, copy, CTA, hashtags, formatos, brief visual, stock sugerido) para una marca + ocasión. Corre en una **Supabase Edge Function** (Deno) que llama a **Claude Opus 4.7** vía la API de Anthropic.

### Tablas nuevas (migración `0002_phase2_briefs.sql`)

- **`generation_sessions`** — una fila por llamada de generación (marca, ocasión, objetivo, n.º de ideas, `status` `running|completed|failed`, `total_cost_usd`).
- **`briefs`** — una idea individual (contenido + `status` `pending|approved|rejected` + trazabilidad: `model_used`, tokens, `cost_usd`, `raw_prompt`/`raw_response`). `brand_id` está **denormalizado** para queries rápidas.
- **`brief_comments`** — comentarios libres por brief.

Todas con RLS (modelo Fase 1/2: todo para `authenticated`; se refinará por roles después).

### Flujo del agente

1. Tab **"Ideas"** de una marca → "Generar nuevas ideas": ocasión (prellenada con `getRelevantOccasion` de `src/lib/calendar.ts`), objetivo, n.º de ideas (1-15), formatos, notas.
2. El frontend llama a la función vía `generateBriefs()` (`src/lib/edge-functions.ts`) → `supabase.functions.invoke('generate-briefs', { body, timeout: 90s })`.
3. La función (`supabase/functions/generate-briefs/index.ts`): verifica JWT → valida el body con **Zod** → carga contexto de marca (identidad, stock ≤50, referencias ≤10) → crea sesión `running` → llama a Claude Opus 4.7 con **tool use** (estructura garantizada) → valida la salida con Zod → calcula costos → inserta los briefs (`pending`) → marca la sesión `completed`. Errores → sesión `failed` + `error_message`.
4. Aprobar/rechazar/comentar desde el tab Ideas — hooks en `src/hooks/use-briefs.ts` (con optimistic updates + rollback).

Helpers compartidos: `supabase/functions/_shared/` (`anthropic.ts` con precios y manejo de errores, `cors.ts`, `types.ts` con los esquemas Zod y la definición de la herramienta).

### Edge Functions: deploy + secrets

```bash
# Desplegar — la verificación de JWT está ACTIVA por default; NO pasar --no-verify-jwt:
supabase functions deploy generate-briefs
supabase functions list                 # ver status (debe decir ACTIVE)

# Secrets (córrelos en TU terminal, NUNCA con el prefijo ! del chat):
supabase secrets set ANTHROPIC_API_KEY=<tu-api-key>   # la key real, nunca en el repo
supabase secrets list                   # muestra NAME + hash, nunca el valor
supabase secrets unset ANTHROPIC_API_KEY
```

> ⚠️ **CRÍTICO:** la `ANTHROPIC_API_KEY` y la `SUPABASE_SERVICE_ROLE_KEY` **JAMÁS** van en el repo. La API key vive como **secret de Supabase**; la service_role solo en `.env.local` (git-ignorado).

### Regenerar tipos tras una migración

```bash
supabase db push
supabase gen types typescript --linked > src/types/database.ts
npx tsc -b   # verificar que sigue limpio
```

## Notas para Claude

- El usuario es **Alejandro**, opera en **Mac**, es un operador no-experto pero dispuesto a aprender.
- Prefiere que le **expliques el *por qué*** antes de cada cambio importante.
- Trabaja **paso a paso**: después de un bloque grande, resume y espera confirmación.
- Cuidado con comillas curvas/tipográficas de macOS que pueden romper comandos.
