# Paws Unite - AI Copilot Instructions

## Project Overview

**Paws Unite** is a pet adoption and rescue management portal built with React + TypeScript. It facilitates lost pet reunifications, adoption workflows, and real-time communication between pet owners, rescuers, and administrators.

**Stack**: Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui + React Router + React Hook Form + TanStack React Query + Lovable (AI design platform)

---

## Architecture & Data Flow

### Core Components & Routing

The app is structured around three main user flows:

1. **Lost Pet Workflow** (`/pets/lost` → `/pets/new/lost`) - Pet owners report missing pets and receive live matches against found pets
2. **Found Pet Workflow** (`/pets/found` → `/pets/new/found`) - Rescuers report found pets and facilitate reunifications
3. **Adoption Workflow** (`/pets/adopt`) - 15-day adoption process with admin verification and email notifications

**Key files**:
- `src/App.tsx` - Route definitions (add routes ABOVE the catch-all `*` route)
- `src/pages/` - Page components organized by feature (auth/, pets/)
- `src/components/` - Reusable UI components (layout/, pets/, ui/)

### Authentication & Authorization

- **Provider**: `AuthProvider` in `src/lib/auth.tsx` wraps entire app (see `App.tsx`)
- **Context**: Exposes `useAuth()` hook with `user`, `isAuthenticated`, `isAdmin`, and auth methods
- **Storage**: User data cached in localStorage (key: `'user'`)
- **Roles**: `'user'` (default) and `'admin'` (determined at login)
- **Pattern**: Every page that needs auth should call `const { user, isAdmin } = useAuth()` and check `isAuthenticated` or `isAdmin`

### API Layer (Mock & Extensible)

Located in `src/services/api.ts` - currently uses mock in-memory data:

```typescript
// Namespaced API exports:
export const authAPI = { login(), register(), getMe(), logout() }
export const petsAPI = { getAll(params), getById(id), create(), update(), delete() }
export const chatsAPI = { ... }
export const notificationsAPI = { ... }
```

**Key Pattern**: Mock uses in-memory storage (`mockData` object). To replace with real API:
1. Change `API_URL` / `WS_URL` environment variables
2. Replace mock functions with actual HTTP/WebSocket calls
3. Keep function signatures identical for zero-impact switching

---

## Critical Patterns & Conventions

### Form Handling

Use **React Hook Form + Zod** (not plain useState):

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({ email: z.string().email() });
const form = useForm({ resolver: zodResolver(schema) });
```

Example: `src/pages/auth/Login.tsx`, `src/pages/pets/ReportFound.tsx`

### UI Components (shadcn/ui)

- Import from `@/components/ui/` (e.g., `Button`, `Card`, `Dialog`)
- All components pre-configured in `src/components/ui/` - do NOT create custom versions
- Use Tailwind classes directly; shadcn components handle styling via class composition
- Icons from `lucide-react` for consistency

### State Management

- **Query data**: Use TanStack React Query (already configured in `App.tsx`)
- **Auth state**: Use `useAuth()` context
- **Local UI state**: useState for forms, modals, loading states
- **Custom hooks**: See `src/hooks/useDebounce.ts` and `use-mobile.tsx` for patterns

### Styling

- **Tailwind CSS** with custom color variables (HSL-based in root CSS)
- **Dark mode**: `darkMode: ["class"]` (enabled by `next-themes`)
- **Colors**: Primary, secondary, destructive, success, warning, pending, muted (defined in `tailwind.config.ts`)
- **Spacing**: Use Tailwind's default spacing scale (no custom values)

### Naming & Organization

- **Files**: PascalCase for components, camelCase for utilities (`useDebounce.ts`)
- **Components**: One per file in logical folder structure
- **Routes**: Lowercase with dashes (`/pets/new/found`)
- **Imports**: Use path alias `@/` (resolved in `vite.config.ts`)

### Live Matching (Key Feature)

Located in `src/components/pets/LiveMatchResults.tsx`:
- Debounced search (500ms) using `useDebounce()` hook
- Filters pets in real-time as user types (breed, color, location)
- **Usage**: Imported in `LostPets.tsx` - observe pattern for search + filter UI

---

## Development Workflow

### Setup & Running

```bash
npm install          # Install dependencies
npm run dev          # Start dev server on http://localhost:8080
npm run build        # Production build
npm run lint         # ESLint check
npm run preview      # Preview production build
```

### Environment Configuration

Create `.env.local` for overrides:
```
VITE_API_URL=http://your-backend:8000/api
VITE_WS_URL=ws://your-backend:8000/ws
```

### Key Build Config

- **Vite** with SWC for fast compilation
- **Component tagger** plugin in development (Lovable integration - can be removed)
- **Source alias**: `@` → `./src`
- **Server**: Dev server on `localhost:8080`

### Common Tasks

| Task | Command | Notes |
|------|---------|-------|
| Add new page | Create in `src/pages/`, add route to `App.tsx` | Follow routing comment: add ABOVE catch-all `*` |
| Add UI component | Create in `src/components/` | Import from shadcn if not custom logic |
| Add API endpoint | Add method to appropriate namespace in `api.ts` | Keep mock signature for real backend swap |
| Style page | Use Tailwind classes directly | Refer to `tailwind.config.ts` for custom colors |
| Debug auth | Check `localStorage['user']` and `useAuth()` return | Verify AuthProvider wraps component tree |

---

## Integration Points & Extensibility

### Backend Integration

- **API**: Mock layer (`api.ts`) designed for swap - change HTTP calls, keep signatures
- **Auth**: Currently JWT mock in localStorage - extend with real token refresh logic
- **WebSocket**: WS_URL placeholder in `api.ts` - implement actual real-time chat in `Chat.tsx`
- **Email**: Adoption workflow references email notifications - implement in backend

### Component Composition Examples

- **Dashboard** (`Dashboard.tsx`): Combines stat cards + quick action buttons - good template for overview pages
- **PetCard** (`components/pets/PetCard.tsx`): Reusable pet item - used in galleries and search results
- **PetDetail** (`pages/pets/PetDetail.tsx`): Shows full pet info + actions (claim, adopt, contact) - extends PetCard pattern

### Data Flow (Lost Pet Example)

```
LostPets.tsx
  → useDebounce(searchTerm) → LiveMatchResults.tsx
    → petsAPI.getAll({ location, breed })
      → Mock filters mockData.pets
        → Returns { items, total }
  → useAuth() → Display contact info for matches
```

---

## Project-Specific Conventions

1. **Mock Data**: Always initialize with `initMockData()` in API calls to ensure seed data
2. **Error Handling**: Try-catch in async flows, log to console, show toast notifications
3. **Loading States**: Use boolean `loading` flag with conditional rendering (see Dashboard)
4. **Responsive Design**: Mobile-first Tailwind (no hardcoded breakpoints - use Tailwind defaults)
5. **Accessibility**: shadcn components are ARIA-compliant; add labels to form fields
6. **Status Fields**: Use consistent status strings: `'Listed Found'`, `'Listed Lost'`, `'Available for Adoption'`, `'Pending...'`

---

## Gotchas & Common Mistakes

- ❌ Don't create custom Button component - import from `@/components/ui/button`
- ❌ Don't use `useState` for form validation - use React Hook Form + Zod
- ❌ Don't forget to add new routes ABOVE the `*` catch-all route in `App.tsx`
- ❌ Don't forget `await mockDelay()` in mock API calls - simulates real network latency
- ❌ Don't hardcode colors - use Tailwind color names from `tailwind.config.ts`
- ✅ Always wrap auth-dependent features with `if (!user) return <LoginPrompt />`
- ✅ Always use `useAuth()` context for auth state, not localStorage directly

---

## When to Ask for Clarification

- Real backend API contract (current setup assumes mock)
- Email notification implementation details
- Real-time chat (WebSocket) implementation scope
- Admin moderation workflows (currently UI-only)
- Database schema for production migration
