# TEDxIITPatna — QR Frontend (Next.js)

Frontend for the `task3` Express backend. Handles login, admin ticket
generation / revocation / live attendance, and gate-side QR validation.

## Prerequisites

The backend (`../task3`) must be running and seeded:

```bash
cd ../task3
npx tsx src/seed.ts   # creates admin + volunteer accounts
npm run dev           # starts on http://localhost:5001
```

## Setup

```bash
npm install
npm run dev           # starts on http://localhost:3000
```

> The frontend **must** run on port 3000 — the backend's CORS is locked to
> `http://localhost:3000` with `credentials: true` so the HttpOnly auth cookie
> is accepted. The dev/start scripts already pin port 3000.

### Environment

`.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

## Pages

| Route    | Who        | What |
| -------- | ---------- | ---- |
| `/login` | everyone   | Email/password login. Redirects by role. |
| `/admin` | ADMIN      | Generate QR tickets, revoke tickets, live attendance counts. |
| `/scan`  | ADMIN + VOLUNTEER | Camera or manual QR validation against the selected gate session. |

## How auth works

Login sets an **HttpOnly** cookie on the backend, so JS can't read it. Every
API call uses `credentials: "include"` to send that cookie. The role returned by
login is cached in `localStorage` only to decide which UI to show — the backend
still enforces real access control on every request.

## Notes

- The camera scanner uses `html5-qrcode`. Browsers only allow camera access over
  `https` or on `localhost`, so test locally on `http://localhost:3000`.
- Failed scans (duplicate / revoked / wrong session) come back as HTTP 403 with a
  body; the UI shows those as red result banners rather than errors.
