# course-system — Academia Control Panel

## Stack
- **React 19 + TypeScript 6 + Vite 8** — SPA (no Next.js)
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (v4 API: `@import "tailwindcss"` in CSS, `@theme` directive)
- **Zustand** with `persist` middleware → state saved to localStorage key `academy-billing-system-state`
- **react-router-dom v7** — `<BrowserRouter>` with `DashboardLayout` wrapping all routes
- **date-fns** locale `es` for Spanish formatting
- **Zod v4** + **react-hook-form** (resolver: `@hookform/resolvers`)
- **lucide-react** icons (direct imports via barrel is fine — Vite optimizes)

## Commands
| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Vite) |
| `npm run build` | `tsc -b && vite build` — run BOTH |
| `npm run lint` | ESLint flat config |
| `npm run preview` | Preview production build |

No test framework is configured (no vitest/jest).

## Architecture
- **State**: All data lives in a single Zustand store (`src/store/academyStore.ts`). Courses, teachers, students, payments, cash closures, cuotas all in one store.
- **Persistence**: Adapter pattern (`src/adapters/`). `StorageAdapter` interface → `LocalStorageAdapter` (sync) / `SupabaseAdapter` (async mock, ready for future migration). `DbService` (`src/services/db.service.ts`) wraps the adapter. Zustand persist middleware uses `dbService.getZustandStorage()`.
- **Routing**: All routes nested under `/` → `<DashboardLayout>` (sidebar + header + `<Outlet/>`). Pages: `/enroll`, `/courses`, `/courses/:id`, `/teachers`, `/students`, `/cash-register`, `/payments`, `/settings`.
- **Types**: All in `src/types/index.ts`.
- **UI Components**: `src/components/ui/` — Button, Card, Table, Input, Select, Modal, Badge, Alert, EmptyState, Loader, SummaryCard.

## Conventions
- Spanish UI throughout (labels, messages, date-fns locale `es`)
- Currency: DOP (Dominican Peso), formatted via `Intl.NumberFormat('es-DO')` in `src/utils/formatters.ts`
- ID prefixes: `cur-{timestamp}`, `prof-{timestamp}`, `est-{timestamp}`, `FAC-{1000+n}`, `CON-{1000+n}`, `cuota-{estId}-{n}`, `closure-{YYYY-MM-DD}`
- Student matrícula format: `MAT-{year}-{padded}`
- TypeScript `erasableSyntaxOnly: true` → no enums, no `namespace`, no `constructor parameter properties`
- `noUnusedLocals` / `noUnusedParameters` enabled — clean imports required
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- Print system: `#closure-printable` and `#invoice-printable` divs shown on `@media print`. Classes `.no-print` / `.print-only` control visibility.

## Key behaviors
- Cash closure auto-created per day via `checkOrCreateDailyClosure()` on app rehydrate
- Daily closure must be OPEN to register payments; closed closure blocks new payments
- Enrollment generates a full cuota schedule automatically based on course frequency/duration
- Duplicate cédula check on enrollment
- Payment cancellation (anulación) creates a `CON-` invoice and reverses cuotas
