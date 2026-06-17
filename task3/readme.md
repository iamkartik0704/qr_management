# TEDx Ticket & QR Management System

A high-performance, secure backend system designed for event management, featuring Role-Based Access Control (RBAC), real-time ticket validation, and automated QR generation.

---

## Project Overview

This backend provides a secure infrastructure for managing event tickets. It ensures that only authorized administrators can generate tickets or view statistics, while volunteers can efficiently validate QR codes at the gate.

---

## Dependencies

### Production

* express: Web framework.
* mongoose: MongoDB ODM.
* dotenv: Environment variable management.
* cors: Cross-Origin Resource Sharing.
* jsonwebtoken: Secure JWT session management.
* bcrypt: Password hashing.
* cookie-parser: Session cookie parsing.
* express-rate-limit: Brute-force protection.

### Development

* typescript, ts-node, tsx
* @types/express, @types/jsonwebtoken, @types/bcrypt, @types/cookie-parser, @types/cors

---

## Setup & Execution

### 1. Installation

```bash
npm install

```

### 2. Environment Variables

Create a .env file in your root directory:

```env
PORT=5001
MONGO_URI=your_db_connection_string
JWT_SECRET=your_secret_key
SEED_ADMIN_EMAIL=admin@tedx.com
SEED_ADMIN_PASSWORD=your_password
SEED_VOLUNTEER_EMAILS=gate1@tedx.com,gate2@tedx.com
SEED_VOLUNTEER_PASSWORD=your_password

```

### 3. Seed & Run

```bash
# Initialize database with Admin/Volunteer accounts
npx tsx src/seed.ts

# Start the server
npm run dev

```

---

## API Reference

### Authentication (Public)

| Endpoint | Method | Payload |
| --- | --- | --- |
| /api/auth/login | POST | {"email": "..","password": "..."} |
| /api/auth/logout | POST | {"email": "..","password": "..."} |

### QR & Ticket Management (Admin Only)

| Endpoint | Method | Payload |
| --- | --- | --- |
| /api/qr/generate | POST | {"userId": "...", "session": "..."} |
| /api/qr/admin/ticket/revoke | PATCH | {"ticketId": "..."} |
| /api/qr/admin/attendance | GET | N/A |

### Validation (Admin & Volunteer)

| Endpoint | Method | Payload |
| --- | --- | --- |
| /api/qr/validate | POST | {"qrToken": "...", "currentScanningSession": "..."} |

---

Built for TEDx events.
