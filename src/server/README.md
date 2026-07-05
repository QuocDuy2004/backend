# Backend Structure

Backend API is grouped by business ownership so features can grow without turning the entrypoint into one large file.

## Folders

- `app.ts`: Express app setup, API mounting, Vite middleware, production static serving.
- `router.ts`: the only central API router. Add URL mappings here.
- `config`: environment and shared constants.
- `auth`, `users`, `categories`, `products`, `ai`: business folders that export page/domain handlers from `index.ts`.
- `services`: database and external-service workflows.
- `utils`: small reusable helpers with no Express dependency.

## Current Domains

- `auth`: register and login.
- `users`: customer/admin user CRUD and profile lookup.
- `categories`: category list, create, update, delete, and product transfer on delete.
- `products`: product list, create, update, and delete.
- `ai`: product, SEO, support, and inventory AI helpers.

When adding a new page/domain, create a folder like `categories/index.ts` or `orders/index.ts`, export its handlers there, then map the URLs once in `router.ts`. Keep reusable database work in `services`, and keep UI code in `src/components`.
