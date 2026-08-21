# {{EXT_NAME}}

{{DESCRIPTION}}

TypeScript Worker and React settings panel for SOPIA/ZIZI.

## Install and build

With pnpm:

```bash
pnpm install --ignore-workspace
pnpm --dir renderer install --ignore-workspace
pnpm build
```

With npm:

```bash
npm install --workspaces=false
npm --prefix renderer install --workspaces=false
npm run build
```

Expected output:

- `dist/index.js`
- `renderer/dist/index.html`

## Load

Open SOPIA/ZIZI → extensions → add local folder, then select this directory.

## Permissions

- `read:lives`: receive chat and room-join events.
- `write:lives`: send command replies and greetings.

No first-party HTTP endpoint or internal package is used.
