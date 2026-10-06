# Admin V2 — shadcn/ui migration notes

## Current decision

This application does not use shadcn/ui or Tailwind. It is a JavaScript React Router application with an existing CSS system, and the supplied `p.distribution` components carry dependencies and assumptions from a different Next.js application. Copying those components directly would pull in routing, state, and server-action behavior that does not exist here.

The implementation reuses the useful design patterns while preserving the current stack:

- Radix Dialog for the mobile navigation sheet and taxonomy editor dialogs.
- Radix Tooltip for collapsed desktop navigation labels.
- TanStack Query v5 for API-backed loading/cache state.
- TanStack Table v8 for the Products, Stock, and Orders data grids.
- `src/admin/admin-v2.css` for the warm-neutral Gallery theme, shell, forms, and responsive behavior.

## Component mapping

| Reference pattern | Current implementation |
|---|---|
| Sidebar provider / collapsible sidebar | `AdminShell` local persisted state and `Ctrl/Cmd+B` shortcut |
| Sidebar menu button / tooltip | Radix Tooltip and semantic links |
| Sheet / mobile navigation | Radix Dialog with focus trapping and Escape-to-close |
| Data table | TanStack Table with query-backed cursor loading |
| Form controls | Existing labels/controls with shared admin CSS |
| Alert dialog | Native confirmation remains only for order cancellation; destructive catalog deletes are absent |

## Future migration path

If the project later adopts a complete shadcn/ui installation, add components in place and convert one admin area at a time. Keep the existing API boundary, URL query contract, selection model, and page semantics. Do not import the reference app's providers, route files, server actions, or store. The remaining small reference tables can move to the shared TanStack grid when their volume and interaction needs justify cursor pagination.

