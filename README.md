# Kapoeta Logistics & Parcels

Logistics management system for tracking parcels along the Nairobi → Juba corridor.

## Branches
- Nairobi (HQ) - Agent
- Nadapal (Border) - Driver/Assistant Driver
- Narus - Driver/Assistant Driver  
- Kapoeta - Agent
- Torit - Driver/Assistant Driver
- Juba - Agent

## Tech Stack
- Backend: NestJS, TypeScript, PostgreSQL, Redis
- Frontend: React, TypeScript, Vite, Material-UI

## Development

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Setup

\`\`\`bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
\`\`\`

## Features
- QR code tracking
- Offline-first mobile support
- Multi-currency payments (KES, SSP, USD)
- Real-time vehicle tracking
- Automated SMS/WhatsApp notifications
- Incident and refund management
