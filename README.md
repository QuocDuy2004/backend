<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/544cf690-8f15-4237-88c1-00d2f2961ad4

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Project structure

- `server.ts`: backend entrypoint kept small for existing npm scripts.
- `src/server`: Express API organized by backend responsibility.
  - `config`: environment and shared constants.
  - `router.ts`: one central router file for all API URL mappings.
  - `auth`, `users`, `categories`, `products`, `ai`: domain folders that export handlers from `index.ts`.
  - `services`: database and external-service workflows.
  - `utils`: reusable backend helpers.
- `src/components`: React admin UI organized by frontend domain (`auth`, `layout`, `features`, `shared`).
- `src/lib`: shared runtime libraries such as MySQL connection pooling.
- `database`: importable SQL schema and database maintenance scripts.

## MySQL database

1. Copy `.env.example` to `.env.local` and update `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`.
2. Set `JWT_SECRET` to a long random value and optionally adjust `JWT_EXPIRES_IN` (default example: `7d`).
3. Start MySQL locally or point the variables to your MySQL server.
4. Import the full schema:
   `npm run db:init`
5. Test the connection:
   `npm run db:test`

Direct import file: `database.sql`

## Auth API

Base URL: `http://localhost:3000`

### Register

`POST /api/auth/register`

Headers:

```http
Content-Type: application/json
```

Body:

```json
{
  "username": "nguyenvana",
  "password": "123456",
  "name": "Nguyen Van A",
  "email": "nguyenvana@example.com",
  "phone": "0912345678",
  "address": "TP.HCM",
  "role": "member"
}
```

### Login

`POST /api/auth/login`

Headers:

```http
Content-Type: application/json
```

Body:

```json
{
  "usernameOrEmail": "nguyenvana",
  "password": "123456"
}
```

You can also login with email:

```json
{
  "usernameOrEmail": "nguyenvana@example.com",
  "password": "123456"
}
```

Successful response includes a JWT access token:

```json
{
  "ok": true,
  "message": "Dang nhap thanh cong.",
  "jwt-token": "<jwt>",
  "tokenType": "Bearer",
  "expiresIn": "7d",
  "user": {
    "id": "user_...",
    "username": "nguyenvana",
    "role": "member"
  }
}
```

Seed accounts after `npm run db:init`:

- `admin` / `admin123`
- `vanhung` / `member123`

### Main schema

- `users`: one table for customers, sellers, and admins. Permissions are controlled by `role` (`member`, `seller`, `admin`). The login password is stored in `password` as an MD5 value. The default seed creates one `admin` and one `member`; cart and favorites start empty.
- `categories`, `banners`, `products`, `users`, `user_address`, `reviews`, `user_vouchers`, `notifications`, `user_notifications`, `payments`, `settings`: compact ecommerce tables matched to the Expo frontend and admin dashboard.
- `notifications` and `user_notifications` cover global notices plus per-user read/archive state for the app.
- `products.images`, `products.attributes`, `products.specification`, `payments.config`, and settings values are JSON so the mobile checkout/admin screens can keep rich UI data without many extra join tables.
