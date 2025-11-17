# Docker setup

This stack packages both the backend API (Express) and the frontend (Vite build served by nginx).

## Prerequisites
- Docker Desktop / Engine with Compose v2
- Update `server/.env` with your MongoDB, SMTP, and RabbitMQ values (set `ENABLE_RABBITMQ=false` if you are not running RabbitMQ).

## Build & run
```bash
# from the repo root
docker compose build
docker compose up -d
```

Services:
- Backend API at http://localhost:5000
- Frontend at http://localhost:4173 (built once and served via nginx)
- RabbitMQ at amqp://guest:guest@localhost:5672/ (management UI http://localhost:15672, guest/guest)

Logs:
```bash
docker compose logs -f server
docker compose logs -f frontend
```

## Customization
- API base URL used by the frontend: override at build time with
  `docker compose build --build-arg VITE_API_BASE=http://localhost:5000 frontend`
- RabbitMQ: Compose includes RabbitMQ by default. Update username/password if desired and update `RABBITMQ_URL`.
- PDF storage is persisted to `./pdfs` on the host via a bind mount.

## Stop / clean up
```bash
docker compose down            # stop
docker compose down -v         # stop and remove the pdfs volume/bind mount data
```
