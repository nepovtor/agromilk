.DEFAULT_GOAL := start

SHELL := /bin/sh
COMPOSE := docker compose
PNPM := npx --yes pnpm@10.13.1

.PHONY: start init stop restart logs ps build migrate seed test check dev clean help

## Полностью подготовить и запустить приложение в Docker.
start: init
	$(COMPOSE) up --build -d
	@$(COMPOSE) ps
	@printf '\nПриложение запущено: http://localhost:3000\n'
	@printf 'Админ-панель: http://localhost:3000/admin/login\n'

## Создать .env с безопасными локальными секретами, если файла ещё нет.
init:
	@if [ ! -f .env ]; then \
		command -v openssl >/dev/null 2>&1 || { echo "Ошибка: для генерации секретов нужен openssl"; exit 1; }; \
		cookie_secret="$$(openssl rand -hex 32)"; \
		admin_password="$$(openssl rand -hex 12)Aa1!"; \
		awk -v cookie="$$cookie_secret" -v password="$$admin_password" \
			'/^COOKIE_SECRET=/{print "COOKIE_SECRET=" cookie; next} /^ADMIN_PASSWORD=/{print "ADMIN_PASSWORD=" password; next} {print}' \
			.env.example > .env; \
		printf 'Создан .env\nEmail администратора: admin@example.com\nПароль администратора: %s\n\nСохраните пароль — он показывается только при создании .env.\n' "$$admin_password"; \
	else \
		echo ".env уже существует"; \
	fi

stop:
	$(COMPOSE) down

restart: stop start

logs:
	$(COMPOSE) logs -f app

ps:
	$(COMPOSE) ps

build:
	$(COMPOSE) build

migrate:
	$(COMPOSE) run --rm app node dist/db/migrate.js

seed:
	$(COMPOSE) run --rm app node dist/db/seed.js

test:
	$(PNPM) test

check:
	$(PNPM) typecheck
	$(PNPM) lint
	$(PNPM) build

## Запуск frontend и API в режиме разработки; PostgreSQL остаётся в Docker.
dev: init
	$(COMPOSE) up -d postgres
	$(PNPM) install --frozen-lockfile
	$(PNPM) db:migrate
	$(PNPM) db:seed
	$(PNPM) dev

## Удалить контейнеры и volumes с локальными данными.
clean:
	@printf 'Будут удалены контейнеры и данные PostgreSQL/uploads. Продолжить? [y/N] '
	@read answer; [ "$$answer" = "y" ] || [ "$$answer" = "Y" ]
	$(COMPOSE) down -v --remove-orphans

help:
	@printf '%s\n' \
		'make          Полностью запустить проект в Docker' \
		'make dev      Запустить режим разработки' \
		'make stop     Остановить проект' \
		'make restart  Перезапустить проект' \
		'make logs     Показать логи приложения' \
		'make ps       Показать состояние контейнеров' \
		'make test     Запустить тесты' \
		'make check    Проверить типы, lint и сборку' \
		'make clean    Удалить контейнеры и локальные данные'
