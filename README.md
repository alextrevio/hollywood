# Hollywood

Estudio creativo interno para gestionar la **identidad de marca** y el **stock visual** de varios clientes (hoteles, restaurantes, etc.).

**Fase 1 — Brand Vault:** la fundación. Marcas, su identidad visual (paleta, tipografías, tono de voz, do's/don'ts), logos, stock de imágenes y referencias — todo respaldado por Supabase (Auth + Postgres + Storage).

## Stack

Vite · React 19 · TypeScript (strict) · Tailwind v3 · shadcn/ui · Supabase · React Router v6 · TanStack Query · Zod · react-hook-form.

## Correr localmente

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Crea tu archivo de entorno a partir de la plantilla y rellena los valores reales:
   ```bash
   cp .env.example .env.local
   # edita .env.local con tu VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
   ```
   > `.env.local` está git-ignorado. **Nunca lo commitees.**
3. Levanta el dev server:
   ```bash
   npm run dev
   ```
   Abre http://localhost:5173.

Los usuarios se crean manualmente desde el panel de Supabase (no hay registro público).

## Documentación

Convenciones, estructura, cómo aplicar migraciones y reglas de seguridad: **[CLAUDE.md](./CLAUDE.md)**.
