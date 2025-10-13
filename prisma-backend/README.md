Prisma backend scaffold

Quick start:

1. cd prisma-backend
2. npm install
3. Set DATABASE_URL in .env (e.g. postgres://user:pass@localhost:5432/travelcrm)
4. npm run prisma:generate
5. npm run prisma:migrate
6. npm run seed
7. npm run dev

Notes: JWT secrets should be set in .env: JWT_SECRET, JWT_REFRESH_SECRET, JWT_RESET_SECRET
