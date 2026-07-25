# Production deployment

## Вариант 1. Netlify + Render

Netlify обслуживает React SPA, а Render — Fastify API, PostgreSQL и постоянное хранилище загрузок. Запускать API как Netlify Function не следует: текущему приложению нужны PostgreSQL, миграции и persistent storage для `/uploads`.

### 1. Создать сайт Netlify

1. Разместить проект в GitHub-репозитории.
2. В Netlify выбрать **Add new project → Import an existing project** и подключить репозиторий.
3. Оставить Base directory пустой: конфигурация рассчитана на корень monorepo.
4. Netlify прочитает готовые параметры из `netlify.toml`:
   - Build command: `pnpm build:netlify`;
   - Publish directory: `apps/web/dist`;
   - Node.js: `22`.
5. Скопировать назначенный HTTPS-адрес сайта, например `https://agromilk.netlify.app`.

В репозитории обязательно должны присутствовать `packages/shared/package.json`, `packages/shared/tsconfig.json` и `packages/shared/src/index.ts`: frontend использует общие схемы и типы из этого пакета. Netlify-команда собирает его напрямую по пути, не полагаясь на автоматическое определение workspace-фильтра.

Первая сборка может завершиться ошибкой до задания `API_PROXY_URL` — это ожидаемая защита от публикации frontend без API.

### 2. Развернуть backend на Render

В корне проекта находится `render.yaml`. Он создаёт:

- Docker web service;
- PostgreSQL;
- persistent disk для загруженных изображений;
- health-check `/api/v1/health`;
- автоматически генерируемый `COOKIE_SECRET`.

1. В Render выбрать **New → Blueprint** и подключить тот же репозиторий.
2. Заполнить обязательные переменные:
   - `APP_URL=https://agromilk.netlify.app`;
   - `APP_ORIGIN=https://agromilk.netlify.app`;
   - `ADMIN_EMAIL`;
   - `ADMIN_PASSWORD`;
   - SMTP-параметры;
   - `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET` (если нужен вход через Google);
   - `MAIL_TO`;
   - `TELEGRAM_BOT_TOKEN`;
   - `TELEGRAM_CHAT_ID`.
3. Запустить Blueprint Sync и скопировать origin сервиса, например `https://agromilk-api.onrender.com`.

`APP_URL` и `APP_ORIGIN` должны указывать на публичный сайт Netlify, а не на Render: они используются для проверки origin, ссылок, cookie и OAuth redirect URI.

### 3. Связать Netlify с API

В **Project configuration → Environment variables** добавьте:

```env
API_PROXY_URL=https://agromilk-api.onrender.com
```

Значение должно быть HTTPS-origin без `/api`, завершающего пути, query или hash. Переменная нужна только на этапе Build и не является секретом. Не задавайте `VITE_API_BASE_URL`: скрипт сборки создаёт `_redirects`, и Netlify same-origin proxy направляет `/api/*` и `/uploads/*` на Render.

Запустите **Retry deploy**. После успешной сборки проверьте:

```text
https://agromilk.netlify.app/
https://agromilk.netlify.app/admin/login
https://agromilk.netlify.app/api/v1/health
```

Если позже подключён собственный домен, обновите `APP_URL` и `APP_ORIGIN` в Render, Google OAuth redirect URI и выполните redeploy backend.

`ADMIN_FORCE_RESET=false` не позволяет каждому перезапуску контейнера менять пароль существующего администратора. Для однократной принудительной смены пароля установите `ADMIN_FORCE_RESET=true`, выполните deploy и затем верните `false`.

## Вариант 2. Render без Netlify

Docker-образ уже содержит собранный frontend, поэтому Render может обслуживать весь проект самостоятельно. В этом случае укажите Render URL в `APP_URL` и `APP_ORIGIN`; Netlify не нужен.

## Вариант 3. Любой Docker-хостинг

```bash
docker build -t agromilk-platform .
docker run -p 3000:3000 \
  --env-file .env \
  -e DATABASE_URL='postgresql://...' \
  -v agromilk_uploads:/app/apps/api/uploads \
  agromilk-platform
```

Для production необходим постоянный том для каталога загрузок. Без него изображения будут удалены при пересоздании контейнера.

## Проверка после развёртывания

1. `GET /api/v1/health` возвращает `200`.
2. Открывается главная страница.
3. Работает вход в `/admin/login`.
4. Тестовая заявка появляется в админ-панели.
5. Приходят email- и Telegram-уведомления.
6. Создаётся и публикуется инструкция.
7. Загруженное изображение сохраняется после redeploy.
8. Статистика изменяется после публичных просмотров.
9. Google OAuth использует redirect URI `https://ваш-домен-netlify/api/v1/auth/google/callback`, а разрешённый аккаунт совпадает по email с активным администратором.

## DNS и HTTPS

После добавления собственного домена укажите DNS-записи, предложенные хостингом. Cookie автоматически получает флаг `Secure`, когда `NODE_ENV=production`, поэтому production-сайт должен работать по HTTPS.

## Резервное копирование

Регулярно создавайте резервные копии PostgreSQL и каталога загрузок. Для крупных проектов рекомендуется заменить локальный storage на S3-совместимое объектное хранилище.
