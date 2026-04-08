# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server (uses Turbopack)
npm run dev

# Build for production (uses Turbopack)
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode enabled
- **Styling**: Tailwind CSS v4 with `@theme inline` syntax in `app/globals.css`
- **Database**: MySQL2 (for database connectivity)
- **Build Tool**: Turbopack (enabled for `dev` and `build` scripts)

## Project Structure

- `app/` - Next.js App Router directory
  - `layout.tsx` - Root layout with Geist font configuration
  - `page.tsx` - Home page
  - `globals.css` - Tailwind CSS v4 imports with CSS custom properties for theming
- `public/` - Static assets (SVGs for Next.js, Vercel, and UI icons)

## Architecture Notes

- Uses Next.js App Router (not Pages Router)
- Path alias `@/*` maps to root directory for imports
- Dark mode support via CSS media query (`prefers-color-scheme: dark`)
- Font variables: `--font-geist-sans` and `--font-geist-mono` are configured in layout and globals.css

## ESLint Configuration

Configured with:
- `next/core-web-vitals` preset
- `next/typescript` preset
- Ignores: `node_modules/`, `.next/`, `out/`, `build/`, `next-env.d.ts`
