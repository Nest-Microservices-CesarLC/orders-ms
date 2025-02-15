# orders-ms

<!-- # Description

Orders MS -->

## Deploy in development

1. Clone repository
2. Create a copy of `.env.template`, rename to `.env` and change environment variables
3. Install dependencies

```
npm install
```

4. Deploy database

```
docker compose up -d
```

5. Execute the migrations of Prisma

```
npx prisma migrate dev
```

6. Start the project

```
npm run start:dev
```
