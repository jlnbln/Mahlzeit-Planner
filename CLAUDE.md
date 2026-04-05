# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server on http://localhost:3000
npm run build    # TypeScript compile + Vite production build (output: dist/)
npm run preview  # Preview production build locally
```

There is no test runner or linter configured.

## Architecture

This is a single-page React 19 + TypeScript app (Vite) for AI-powered German household meal planning.

### State & Data Flow

All application state lives in `App.tsx`. There is no state management library. The component tree is flat — `App.tsx` owns all state and passes handlers down as props to pure view components.

Persistence uses a single Firestore document per authenticated user at `households/{uid}`, which stores the entire app state: `profiles`, `plans`, `shoppingList`, `settings`, `savedRecipes`. Every mutation calls `saveToFirebase()` immediately after updating local state.

### Key Data Model (`types.ts`)

```
UserProfile → has homeTimes (day+meal availability map)
WeeklyPlan  → keyed by ISO start date in the plans Record
  DayPlan[] → DayPlan has meals: MealSlot[]
    MealSlot → type (Frühstück/Mittagessen/Abendessen) + Recipe + eaters (user IDs)
Recipe      → id, name, ingredients, instructions, calories, cookingTime, tags, rating, isFavorite
ShoppingList → items: ShoppingItem[] + estimatedTotal
AppSettings → preferredStore, theme, weekStartDay, includeWeekends, useThermomix, useLeftovers
```

### AI Integration (`services/geminiService.ts`)

All Gemini API calls are in `geminiService.ts`. It exports four functions:
- `generateWeeklyPlan` — uses `gemini-3-pro-preview` with structured JSON output schema
- `generateShoppingList` — uses `gemini-3-flash-preview`, merges ingredients, estimates German store prices
- `generateAlternativeRecipes` — generates 5 replacement options for a single meal slot
- `generateICalString` — converts a plan to `.ics` format

The API uses `responseMimeType: "application/json"` with explicit `responseSchema` objects (defined inline in the service file) to get typed responses. The system prompt (`SYSTEM_PROMPT_CORE` in `constants.ts`) enforces German localization throughout.

The Gemini API key is hardcoded in `geminiService.ts`. The Firebase config is hardcoded in `firebase.ts`.

### Routing

There is no router. Navigation is a `ViewState` union type (`'dashboard' | 'user_list' | 'user_edit' | 'plan' | 'shopping' | 'favorites' | 'settings'`) managed with `useState` in `App.tsx`. Views are rendered with inline conditionals.

### UI Language

The entire UI is in German. All labels, alerts, day names, meal types, and AI prompts use German. Day names use the `DAYS_OF_WEEK` array from `constants.ts` (`['Montag', ..., 'Sonntag']`). Meal availability keys follow the pattern `'{DayName}_{MealType}'` (e.g., `'Montag_Frühstück'`).

### Auth

Firebase Email/Password auth via `components/Auth.tsx`. The `onAuthStateChanged` listener in `App.tsx` gates the entire app — unauthenticated users see only `<Auth />`.

### Styling

Tailwind CSS (via CDN, not installed as a package — check `index.html`). Dark mode uses the `dark:` prefix with a class toggle on `document.documentElement`. Theme state is in `AppSettings.theme`.
