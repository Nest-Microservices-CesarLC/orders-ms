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

6. Deploy NATS server

```
docker run -d --name nats-main -p 4222:4222 -p 8222:8222 nats
```

7. Start the project

```
npm run start:dev
```
