# CopilotKit CLI Testing — Mastra

Quick guide to scaffold, install, and run Mastra starters across package managers (`npm`, `pnpm`, `yarn`, `bun`).

---

## 1. Scaffold Project

Run the create command:

```bash
npx copilotkit@latest create
```

---

## 2. Install Dependencies

Navigate into each generated project folder (`npm/app`, `pnpm/app`, `yarn/app`, `bun/app`) and install:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

> **Automate all (separate terminals):** Double-click or run `install-all.bat`

---

## 3. Run Dev Server

Start the development server in each project folder:

```bash
# npm
npm run dev

# pnpm
pnpm run dev

# yarn
yarn run dev

# bun
bun run dev
```

> **Automate all (separate terminals):** Double-click or run `run-all.bat`

---

## Cleanup

- Run `delete-projects.bat` to clean up all generated project folders.


