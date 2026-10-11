# AfterSpend Architecture

## Current structure

- `src/App.tsx` — application composition, navigation state, financial state coordination, and top-level actions.
- `src/components/` — presentational UI, screens, charts, and dialogs.
- `src/services/financeCalculations.ts` — deterministic financial calculations and forecast rules.
- `src/services/storage.ts` — browser persistence, validation, and import/export helpers.
- `src/services/themePreference.ts` — theme preference persistence.
- `src/hooks/` — reusable React behavior, including dialog accessibility.
- `src/types/finance.ts` — shared domain types.
- `src/services/*.test.ts` — focused tests for financial rules, storage, and theme preferences.

## Dependency direction

Prefer this direction when extending the application:

`components/screens → hooks/services → types`

- Keep calculations independent from React and browser UI where possible.
- Keep browser storage access inside the storage service rather than duplicating it across screens.
- Keep shared domain types in `src/types/`.
- Components should receive data and callbacks through props instead of reaching into unrelated screens.
- Avoid circular imports between components and services.

## Recommended refactoring sequence

1. Keep financial rules in `financeCalculations.ts` and add tests before changing behavior.
2. Extract repeated stateful UI behavior into hooks only when at least two call sites share the behavior.
3. Split `App.tsx` by responsibility (state/persistence, report generation, and screen composition) in small, reviewable changes.
4. Split large components only when their responsibilities can be described independently; avoid splitting solely to reduce line count.
5. After each refactor, run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.

## Data and security boundaries

Browser storage is untrusted input. Validate data when reading/importing it, and do not treat client-side data as authoritative financial records. Do not commit real `.env` files or secrets. PDF report generation should remain client-side unless a reviewed server-side design is introduced.
