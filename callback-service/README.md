# Notion OAuth callback service

This Cloudflare Worker owns the Notion OAuth client secret. It uses a SQLite-backed Durable Object per transaction so multiple users can authorize concurrently and each handoff is single-use.

## Routes

- `POST /auth/start` creates a short-lived transaction and returns the Notion authorization URL.
- `GET /auth/callback` receives the Notion HTTPS redirect, validates state, exchanges the code, and redirects to VS Code with an opaque handoff.
- `POST /auth/redeem` consumes the handoff and returns tokens over HTTPS.
- `POST /auth/refresh` refreshes a user's token without exposing the client secret.

## Deployment

```powershell
npm install
npx wrangler login
npx wrangler secret put NOTION_CLIENT_SECRET
npx wrangler deploy
```

The Worker will use its free `workers.dev` hostname. After deployment, replace `defaultAuthServiceUrl` in the extension with the resulting URL, and set the Notion connection redirect URI to:

`https://notion-sidebar-auth.<your-account-subdomain>.workers.dev/auth/callback`

Do not commit the client secret. This service is intentionally not deployed by the extension build.
