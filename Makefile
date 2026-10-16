.PHONY: install dev test coverage lint format typecheck build check migrate

install:
	pnpm install --frozen-lockfile

dev:
	pnpm dev

test:
	pnpm test

coverage:
	pnpm test:coverage

lint:
	pnpm lint

format:
	pnpm format

typecheck:
	pnpm typecheck

build:
	BETTER_AUTH_SECRET=$${BETTER_AUTH_SECRET:-build-only} pnpm build

check:
	pnpm check

migrate:
	pnpm db:migrate
