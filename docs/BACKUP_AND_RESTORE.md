# Backup and restore

Create PostgreSQL and uploads backups before every migration, and test a restore before relying on it. Keep daily backups for at least 30 days and weekly/monthly generations separately. Never keep the only backup on the application server.

## PostgreSQL

For Docker Compose, create a compressed logical backup:

```bash
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "agromilk-$(date +%F).dump"
```

For managed PostgreSQL, use a connection string stored outside the shell history:

```bash
pg_dump --dbname="$DATABASE_URL" --format=custom --file="agromilk-$(date +%F).dump"
```

Restore only into an empty maintenance database after stopping API writes:

```bash
createdb agromilk_restore
pg_restore --clean --if-exists --no-owner --dbname="postgresql://USER:PASSWORD@HOST:5432/agromilk_restore" agromilk-YYYY-MM-DD.dump
```

## Uploads

Archive uploads alongside the matching database backup:

```bash
tar -C apps/api -czf "agromilk-uploads-$(date +%F).tar.gz" uploads
tar -C apps/api -xzf agromilk-uploads-YYYY-MM-DD.tar.gz
```

For a container deployment, copy the mounted uploads volume to encrypted off-site storage. Restore it with ownership suitable for the API process before starting the service.

## Migration runbook

1. Put the application into maintenance mode or stop write traffic.
2. Back up PostgreSQL and uploads, then copy both artifacts off-host.
3. Run `pnpm db:migrate` and verify it can be run a second time without changes.
4. Run `pnpm seed` only where seed data is intended.
5. Check `/api/v1/health`, `/api/v1/readiness`, a login, and a media upload in a restore environment.
6. Compare article/media counts and open a restored article with an image.

Run an automated backup daily at minimum, retain multiple generations, and periodically restore one into an isolated database to validate the procedure.
