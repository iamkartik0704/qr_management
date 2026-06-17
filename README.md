# TEDx Ticket & QR Management System

Monorepo for the TEDxIITPatna ticketing platform.

| Folder | Stack | Description |
| --- | --- | --- |
| [`task3/`](./task3) | Express + TypeScript + MongoDB | Backend API: auth (JWT/cookies), RBAC, ticket + QR generation, scan validation, attendance stats. |
| [`frontend/`](./frontend) | Next.js + React + Tailwind | Frontend: login, admin dashboard, and volunteer QR scanner. |

## Quick start (local)

```bash
# Backend
cd task3
cp .env.example .env        # fill in MONGO_URI, JWT_SECRET, etc.
npm install
npx tsx src/seed.ts         # seed admin/volunteer accounts (run once)
npm run dev                 # http://localhost:5001

# Frontend (separate terminal)
cd frontend
cp .env.example .env.local  # set NEXT_PUBLIC_API_URL
npm install
npm run dev                 # http://localhost:3000
```

See [`task3/readme.md`](./task3/readme.md) for the full API reference and deployment notes.
