<p align="center">
  <img src="apps/web/public/assets/agromilk/logo-desktop.png" alt="Agromilk" width="280">
</p>

<h1 align="center">Agromilk</h1>

<p align="center">
  Full-stack платформа для продажи заменителей цельного молока:
  публичный сайт, каталог, база знаний, заявки и административная панель.
</p>

<p align="center">
  <a href="https://github.com/nepovtor/agromilk/actions/workflows/ci.yml">
    <img src="https://github.com/nepovtor/agromilk/actions/workflows/ci.yml/badge.svg" alt="CI">
  </a>
  <img src="https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white" alt="Node.js 22">
  <img src="https://img.shields.io/badge/pnpm-10.13-F69220?logo=pnpm&logoColor=white" alt="pnpm 10.13">
  <img src="https://img.shields.io/badge/TypeScript-5%2F6-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
</p>

<p align="center">
  <a href="#локальный-запуск">Локальный запуск</a> ·
  <a href="#возможности">Возможности</a> ·
  <a href="docs/DEPLOYMENT.md">Деплой</a> ·
  <a href="docs/PRODUCTION_CHECKLIST.md">Production checklist</a> ·
  <a href="SECURITY.md">Безопасность</a>
</p>

---

## О проекте

Agromilk — готовое к развёртыванию монорепо с адаптивной витриной бренда и полноценным контуром управления контентом. Посетители могут изучать продукцию и инструкции и оставлять заявки, а команда — управлять каталогом, публикациями и обращениями из защищённой админ-панели.

## Готовые разделы сайта

- современная адаптивная главная страница в фирменной стилистике Agromilk;
- каталог продукции с подробным просмотром состава и приготовления;
- редактирование и публикация продукции из админ-панели;
- база знаний и отдельные страницы инструкций;
- консультационный, сертификатный и продающий CTA-блоки;
- форма расчёта поставки с сохранением заявки и уведомлениями;
- политика конфиденциальности, SEO-метаданные и favicon.

## Возможности

- заявки с валидацией, согласием, honeypot, UTM-метками и rate limit;
- SMTP- и Telegram-уведомления, ошибки которых не отменяют сохранение заявки;
- серверные сессии администратора в `HttpOnly` cookie;
- вход администратора по паролю или через Google OAuth;
- поиск, фильтрация, сортировка, пагинация, статусы и комментарии к заявкам;
- управляемый каталог продукции: состав, применение, приготовление, изображение, порядок, публикация и архив;
- CRUD инструкций, черновики, публикация, архив, TipTap и безопасный preview;
- изображения JPEG, PNG, WebP и GIF с проверкой фактического типа;
- обезличенная аналитика посетителей, просмотров, заявок и конверсии;
- Docker Compose, GitHub Actions и Render Blueprint.

## Стек и структура

| Слой | Технологии |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Wouter, TipTap, Recharts |
| API | Node.js 22, Fastify 5, Zod, bcryptjs, Nodemailer |
| Данные | PostgreSQL 17, Drizzle ORM |
| Инфраструктура | pnpm workspaces, Docker Compose, GitHub Actions, Render, Netlify |

```text
apps/web/       React-приложение
apps/api/       Fastify API, схема и миграции Drizzle, тесты
packages/shared Общие Zod-схемы и типы
scripts/        Smoke-тест
docs/           Инструкция по деплою
```

## Локальный запуск

Самый простой способ запуска требует Docker, Docker Compose, Make и OpenSSL:

```bash
make
```

При первом запуске команда:

1. Создаёт `.env` на основе `.env.example`.
2. Генерирует безопасные `COOKIE_SECRET` и пароль администратора.
3. Показывает созданный пароль — сохраните его, повторно он не выводится.
4. Собирает и запускает PostgreSQL, API и frontend в Docker.
5. Автоматически применяет миграции и создаёт администратора.

После запуска доступны:

- приложение — `http://localhost:3000`;
- админ-панель — `http://localhost:3000/admin/login`;
- API healthcheck — `http://localhost:3000/api/v1/health`;
- PostgreSQL — `localhost:55432`.

Чтобы запустить frontend и API в режиме разработки с hot reload, нужны Node.js 22+ и pnpm 10+:

```bash
make dev
```

`make dev` оставляет PostgreSQL в Docker, устанавливает зависимости, применяет миграции и запускает frontend на `http://localhost:5173`, а API — на `http://localhost:3000`. Если `pnpm` не установлен глобально, Makefile использует `npx pnpm@10.13.1`.

## Переменные окружения

Полный шаблон находится в `.env.example`. Обязательные production-переменные:

```env
NODE_ENV=production
APP_URL=https://example.com
APP_ORIGIN=https://example.com
DATABASE_URL=postgresql://...
DATABASE_SSL=true
COOKIE_SECRET=случайная-строка-не-короче-32-символов
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=уникальный-сложный-пароль
ADMIN_NAME=Администратор
UPLOAD_DIR=/var/data/uploads
MAX_UPLOAD_SIZE=5242880
```

Production не запускается со стандартным паролем или шаблонным cookie secret. Пароль должен содержать не менее 12 символов, буквы обоих регистров, цифру и специальный символ.

### SMTP

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=
MAIL_TO=
```

### Telegram

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

SMTP и Telegram необязательны. Токены и пароли нельзя добавлять в Git или frontend-переменные `VITE_*`.

### Вход через Google

Создайте OAuth 2.0 Client ID типа **Web application** в Google Cloud Console. В список **Authorized redirect URIs** добавьте точный адрес:

```text
https://example.com/api/v1/auth/google/callback
```

Для локальной разработки используйте `http://localhost:3000/api/v1/auth/google/callback`. Затем задайте:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Кнопка Google появляется только при наличии обеих переменных. Google-вход не создаёт новых администраторов: email подтверждённого Google-аккаунта должен совпадать с email активной записи в таблице `admins` (для первого администратора — `ADMIN_EMAIL`).

## Команды

Основные команды Makefile:

```bash
make          # собрать и полностью запустить проект в Docker
make dev      # запустить режим разработки
make stop     # остановить контейнеры
make restart  # перезапустить проект
make logs     # показать логи приложения
make ps       # показать состояние контейнеров
make build    # собрать Docker-образы
make migrate  # применить миграции в запущенном контейнере
make seed     # создать или обновить администратора
make test     # запустить интеграционные тесты
make check    # проверить типы, ESLint и production-сборку
make clean    # удалить контейнеры и локальные volumes
make help     # показать список команд
```

`make clean` удаляет базу данных и загруженные файлы, поэтому перед выполнением запрашивает подтверждение. Интеграционные тесты используют PostgreSQL на `localhost:55432`; перед `make test` запустите проект через `make` или базу командой `docker compose up -d postgres`. Внешние уведомления в тестах не вызываются.

Команды pnpm также остаются доступны напрямую:

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm start
pnpm smoke-test
```

## Docker

`make` является рекомендуемой оболочкой над Docker Compose. Эквивалентный ручной запуск:

```bash
cp .env.example .env
# Задайте безопасные COOKIE_SECRET, ADMIN_EMAIL и ADMIN_PASSWORD
docker compose build
docker compose up -d
curl http://localhost:3000/api/v1/health
docker compose down
```

Образ собирается в несколько стадий, запускается от пользователя `node`, имеет встроенный healthcheck и обслуживает API, SPA и `/uploads`. Именованный volume сохраняет PostgreSQL и загрузки между перезапусками.

## База данных и администратор

`pnpm db:migrate` безопасно применяет только ещё не выполненные миграции. `pnpm db:seed` нормализует email, хеширует пароль bcrypt (12 раундов) и не создаёт дубликаты. Для однократной смены пароля существующего администратора задайте `ADMIN_FORCE_RESET=true`, выполните seed и сразу верните `false`.

Основные таблицы: `admins`, `admin_sessions`, `applications`, `products`, `articles`, `media_files`, `analytics_events`. Миграция каталога также добавляет стартовые карточки Агромилк и четыре базовые инструкции, которые можно сразу изменить в административной панели.

Резервная копия PostgreSQL:

```bash
docker compose exec -T postgres pg_dump -U postgres -d landing_admin -Fc > landing_admin.dump
docker compose exec -T postgres pg_restore -U postgres -d landing_admin --clean --if-exists < landing_admin.dump
```

Отдельно копируйте volume uploads. В Render он монтируется в `/var/data/uploads`; для нескольких экземпляров приложения следует перейти на S3-совместимое хранилище.

## Production: Netlify + Render

Frontend готов к публикации на Netlify, а Fastify API, PostgreSQL и постоянный каталог загрузок разворачиваются на Render. Netlify проксирует `/api/*` и `/uploads/*` к API, поэтому формы и `HttpOnly`-сессии работают на одном публичном origin.

1. Создайте backend через Render Blueprint из `render.yaml`.
2. В Render задайте `APP_URL` и `APP_ORIGIN`, равные HTTPS-адресу будущего сайта Netlify, а также `ADMIN_EMAIL`, `ADMIN_PASSWORD` и нужные секреты.
3. Создайте сайт Netlify из корня репозитория. Команда и каталог публикации уже заданы в `netlify.toml`.
4. Добавьте в Netlify переменную `API_PROXY_URL` со значением origin Render API без завершающего пути, например `https://agromilk-api.onrender.com`.
5. Запустите deploy и проверьте `/`, `/admin/login` и `/api/v1/health` на домене Netlify.

`API_PROXY_URL` обязательна: без неё Netlify-сборка завершится с понятной ошибкой вместо публикации сайта с неработающими формами. `VITE_API_BASE_URL` задавать не нужно — запросы должны оставаться same-origin.

Подробный checklist: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Безопасность

Сессии хранятся серверно, в БД находится SHA-256-хеш токена. Cookie использует `HttpOnly`, `SameSite=Lax` и `Secure` в production. Включены Helmet/CSP, origin-проверка изменяющих production-запросов, rate limit, параметризованные Drizzle-запросы, HTML-санитизация и whitelist YouTube embed. Файлы проверяются по сигнатуре и получают случайные имена.

## Известные ограничения

- локальное файловое хранилище не подходит для горизонтального масштабирования без общего persistent disk;
- уведомления отправляются синхронно после записи заявки; для высокой нагрузки нужен job queue;
- аналитика предназначена для продуктовой сводки, а не заменяет специализированную аналитическую платформу;
- проект не включает готовый юридический текст политики под конкретную организацию — его нужно согласовать перед production.
