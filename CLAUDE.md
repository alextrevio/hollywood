# CLAUDE.md — Hollywood

Guía para Claude Code (y para cualquiera que trabaje en este repo). **Léela antes de hacer cambios.**

## Qué es

Hollywood es un "estudio creativo" interno para gestionar la **identidad de marca** y el **stock visual** de varios clientes (hoteles, restaurantes, etc.). Esta es la **Fase 1: Brand Vault** — la fundación sobre la que se construirán fases posteriores (agente de ideas, composer visual, video corto).

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
    brand/     # IdentityTab, LogosTab, StockTab, ReferencesTab
    shared/    # FileDropzone, AssetImage
  context/     # AuthProvider + auth-context (estado de sesión)
  hooks/       # use-auth, use-brands, use-brand-*, use-stock-assets, use-profile, use-signed-url
  lib/         # supabase (cliente), queryClient, storage, utils
  pages/       # una por ruta (Login, Dashboard, NewBrand, BrandDetail, Settings, NotFound)
  types/       # database.ts (GENERADO por Supabase) + db.ts (aliases y tipos de app)
supabase/
  migrations/  # migraciones SQL versionadas
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

## Notas para Claude

- El usuario es **Alejandro**, opera en **Mac**, es un operador no-experto pero dispuesto a aprender.
- Prefiere que le **expliques el *por qué*** antes de cada cambio importante.
- Trabaja **paso a paso**: después de un bloque grande, resume y espera confirmación.
- Cuidado con comillas curvas/tipográficas de macOS que pueden romper comandos.
