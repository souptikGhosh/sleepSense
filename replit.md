# SleepSense — Medical Sleep Monitor

A cross-platform medical sleep monitoring mobile app built with Expo/React Native. Tracks SpO2, heart rate, temperature, and movement in real time during sleep sessions, with live graph rendering, sleep stage detection, and session analysis.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo 54, Expo Router v6 (file-based routing)
- UI: React Native + react-native-svg (charts) + expo-linear-gradient
- State: React Context + AsyncStorage (no backend needed for first build)
- API: Express 5 (mock WebSocket streaming via setInterval)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`

## Where things live

- `artifacts/mobile/` — Expo mobile app
- `artifacts/mobile/app/` — Expo Router screens
- `artifacts/mobile/app/(auth)/` — Onboarding, Login, Signup screens
- `artifacts/mobile/app/(tabs)/` — Dashboard + Profile tabs
- `artifacts/mobile/app/session.tsx` — Live Session screen
- `artifacts/mobile/app/analysis.tsx` — Session Analysis screen
- `artifacts/mobile/context/` — AuthContext, SessionContext
- `artifacts/mobile/components/` — RealtimeChart, SleepBarChart, MetricCard, GlowCard
- `artifacts/mobile/constants/colors.ts` — Dark medical theme tokens
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)

## Architecture decisions

- **Frontend-only first build**: All data is stored in AsyncStorage (no DB needed). The mock sensor streaming (setInterval @ 1s) can be swapped for a real WebSocket without changing the consumer interface.
- **Context-based state**: AuthContext handles session persistence; SessionContext manages live recording, mock data generation, and session summaries.
- **react-native-svg for charts**: Custom SVG path rendering gives full control over the medical waveform aesthetic without third-party chart library constraints.
- **Dark-only theme**: `colors.light` and `colors.dark` both use the same deep navy palette (`#050B18`) — forces dark appearance on all devices.

## Product

- **5 screens**: Onboarding → Login/Signup → Dashboard → Live Session → Session Analysis
- **Real-time waveform simulation**: Generates SpO2 (92–100%), heart rate (48–105 bpm), temperature (36–38°C), and movement events every second
- **Sleep stage detection**: Cycles through NREM/REM/Awake based on elapsed time
- **Session analysis**: Full timeline charts, REM/NREM segmentation, movement events, AI insight placeholders, 7-day calendar history
- **Device status**: Sensor diagnostics panel with animated reconnect and diagnostic run
- **Emergency alerts**: Color-coded status (Normal/Mild Concern/Emergency) based on SpO2 thresholds

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The mock sensor stream uses `setInterval` in `SessionContext`. When replacing with a real WebSocket, update `startSession()` and `stopSession()` only — all consumers stay the same.
- `userInterfaceStyle: "dark"` is set in `app.json` so the system always uses dark mode.
- The `(tabs)/index.tsx` file just redirects to `/(tabs)/dashboard` — it exists to satisfy Expo Router's default tab expectations.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
