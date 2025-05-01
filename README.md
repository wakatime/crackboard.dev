# crackboard.dev

- Prod: https://crackboard.dev
- Dev: http://localhost:3000

## Setup

Install [Postgres](https://postgresapp.com/).

```
git clone git@github.com:wakatime/crackboard.dev.git
cd crackboard.dev
psql -c "CREATE ROLE crackboarddev WITH LOGIN SUPERUSER PASSWORD 'crackboarddev';"
psql -c "CREATE DATABASE crackboarddev WITH OWNER crackboarddev;"
psql -d crackboarddev -c "CREATE EXTENSION citext;"
cp .env.example .env
pnpm i
pnpm migrate
pnpm dev
pnpm android
pnpm ios
```

## Tech Stack

- [Next.js](https://nextjs.org)
- [Drizzle](https://orm.drizzle.team/docs/overview)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com/docs)
- [tRPC](https://trpc.io)
- [Expo](https://expo.dev/)
- [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform) or [Vercel](https://vercel.com/)

## Adding npm dependencies

To add a package, first choose the workspace(s) where it's going to be used then install for a workspace with:

`pnpm add <package> --filter=@workspace/web`

## Authentication

Auth is handled by logging in with WakaTime.
Create a new [WakaTime OAuth App](https://wakatime.com/apps) and add your app’s `App ID` and `App Secret` to your local `.env` or your production app’s env vars:

`.env`

```
WAKATIME_APP_ID=1234
WAKATIME_APP_SECRET=waka_sec_123
```

## Admin

To access your local admin, [get your WakaTime user id](https://wakatime.com/me/id) and add to `ADMIN_USER_IDS` in your `.env` file.
Then visit http://localhost:3000/admin

## Use production API for local mobile

Set the `TEST_PROD` flag to true in `constants/index.ts` to use the production api server.

## Login on Dev Android Mobile Simulator

The Android simulator treats `localhost` as the simulator itself, so when logging in via GitHub just edit the localhost urls and replace with `10.0.2.2`.
