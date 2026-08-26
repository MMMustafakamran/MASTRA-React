# CopilotKit CLI Testing — Mastra

Quick guide to scaffold, install, and run Mastra starters across package managers (`npm`, `pnpm`, `yarn`, `bun`).

---

## 1. Scaffold Projects

Run from this directory to create the project:

```bash
# npm
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

> **Automate all 4:** Run `.\install-all.ps1` (or `install-all.bat`)

---

## 3. Run Dev Server

Start the local development server in each folder:

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

> **Automate all 4:** Run `.\run-all.ps1` (or `run-all.bat`)

---

## Notes

- **Environment**: Ensure `OPENAI_API_KEY` is set in `.env` (scripts automatically copy it to each app).
- **Cleanup**: Run `.\delete-projects.ps1` (or `delete-projects.bat`) to delete generated apps and reset the workspace.

