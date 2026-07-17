# JWS11 Smart Home Docs

Documentation and inventory app for **property JWS11 / apartment 4.2**: devices, rooms, channels, floor plan points, manuals, and handover docs.

It is a bilingual (English / German) Next.js site meant to run at home (e.g. on **kelder** next to Home Assistant) and optionally behind Cloudflare Access.

## What it does

| Area | Description |
|------|-------------|
| **Building overview** | Home page with building diagram and ground-floor / basement overview images |
| **Floor plan** | Interactive SVG map: select rooms and device points, assign devices, edit notes/photos |
| **Devices & rooms** | Browse installed devices and rooms; channel documentation (switches, covers, etc.) |
| **Admin** | CRUD for devices, models, rooms, and site copy (`/admin`) |
| **Docs** | Markdown handover / setup guides under `/docs` |
| **Network / quickstart** | Buyer-facing pages for LittleJerry + kelder handover |

Live edits are stored as YAML (and uploaded photos) on disk — no external database.

## Tech stack

- **Next.js 15** (App Router) + React 18
- **Tailwind CSS** + DaisyUI
- **js-yaml** for `data/*.yaml`
- **Docker** multi-stage build (`output: "standalone"`)
- Optional publish to **GHCR** via GitHub Actions

## Quick start (local)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build      # production build
npm start          # run production build
npm run lint       # oxlint
npm run format     # oxfmt
```

Node 20+ recommended (matches the Docker image).

## Project layout

```text
app/                 Next.js routes and UI
  admin/             Admin console
  floorplan/         Interactive floor plan
  api/               REST handlers (devices, rooms, uploads, …)
  docs/              Docs pages
content/docs/        Markdown source for handover docs
data/                Seed YAML (devices, rooms, floor plan points, …)
public/
  floorplans/        FloorMap.svg + overview PNGs
  app-icons/         Favicons / PWA icons
  uploads/           Uploaded photos (local/dev; prod uses a volume)
lib/                 Data access, floor plan helpers, auth stubs
FloorMap.svg         Working copy of the interactive SVG (sync to public/)
Dockerfile
docker-compose.yml       Local / build-friendly compose
docker-compose.prod.yml  Kelder / Dockge (image pull only)
```

## Data model (`data/`)

| File | Role |
|------|------|
| `devices.yaml` | Device registry (IP, MAC, room, floor plan marker, …) |
| `rooms.yaml` | Rooms and floor assignment |
| `floors.yaml` | Floor metadata and map assets |
| `device_points.yaml` | Floor plan point labels ↔ `svg_marker_id` |
| `device_models.yaml` | Hardware model catalog + manuals |
| `device_types.yaml` | Functional categories |
| `channels.yaml` | Per-device switch/cover channels |
| `integrations.yaml` | How channels are controlled (HA, Alexa, wall switch, …) |
| `site.yaml` | Site copy / branding strings |
| `network.yaml` | Network / IP plan notes |
| `documents.yaml` | Document index |
| `floorplan_figma_ids.yaml` | SVG naming conventions (reference) |

### Runtime vs seed (Docker)

Writes go to **`DATA_DIR`** (default `runtime-data/`). Seed files live in **`SEED_DATA_DIR`** (repo `data/` or image `/app/data`).

On first read, if a YAML file is missing from runtime, it is **copied once** from seed. After that, runtime wins — redeploys **do not** overwrite live edits.

```text
Image / git `data/`     → seed defaults
runtime-data/           → live YAML (volume on kelder)
runtime-uploads/        → uploaded photos (volume on kelder)
```

## Floor plan SVG

- Source of truth for the interactive map: `FloorMap.svg`
- App loads: `public/floorplans/FloorMap.svg` (keep these in sync)
- Rooms: `room_{code}` (e.g. `room_ld`, `room_bm`)
- Points: group `points_{code}`, markers `{code}_{suffix}` (e.g. `ld_cp`, `ba_li`)
- Human-readable names live in `device_points.yaml` / `rooms.yaml`, not in the SVG

After editing the SVG:

1. Copy to `public/floorplans/FloorMap.svg`
2. Add any new markers to `data/device_points.yaml`
3. Bind new rooms in `app/floorplan/FloorMapWorkspace.jsx` if needed

See `data/floorplan_figma_ids.yaml` for zone codes.

## Admin

Open `/admin` (gear icon in the header).

Admin write APIs are currently **open to anyone who can reach the app** (token gate removed). Protect production with **Cloudflare Access** (or similar) and avoid exposing port `8124` to the public internet unprotected.

## Docker

### Local build / run

```bash
docker compose up -d --build
```

App: [http://localhost:8124](http://localhost:8124)  
(Host port **8124** sits next to Home Assistant’s **8123**.)

### Production (kelder / Dockge)

Use `docker-compose.prod.yml` (image only, no git build on the server):

```yaml
image: ghcr.io/geertclaes/smarthome:latest
ports:
  - "8124:3000"
volumes:
  - ./runtime-data:/app/runtime-data
  - ./runtime-uploads:/app/public/uploads
```

Typical stack path: `/opt/stacks/smarthome/`.

**Update flow**

1. Push to `main` → GitHub Actions builds and pushes `ghcr.io/geertclaes/smarthome:latest`
2. On kelder: `docker compose pull && docker compose up -d` (or Dockge **Update**)

Private GHCR images require `docker login ghcr.io` on kelder (`read:packages` token).

**Do not** run `docker compose down -v` — that can wipe volumes.

### Permissions

The container runs as UID **1001**. Host volumes must be writable by that user (or use the image entrypoint that `chown`s them on start):

```bash
sudo chown -R 1001:1001 runtime-data runtime-uploads
```

## Environment

| Variable | Purpose |
|----------|---------|
| `DATA_DIR` | Writable YAML directory (default `/app/runtime-data`) |
| `SEED_DATA_DIR` | Read-only seed YAML (default `/app/data` in the image) |
| `SMARTHOME_DATA_DIR` | Host path override for compose bind mount |
| `SMARTHOME_UPLOADS_DIR` | Host path override for uploads |
| `SMARTHOME_SEED_DATA_DIR` | Host path override for seed mount (dev compose) |

See `.env.example`.

## Internationalization

UI strings: `app/i18n.js` (EN / DE).  
Site/marketing copy: `data/site.yaml` via `SiteContentProvider`.  
Language switcher is in the header.

## Related home stack

| Service | Typical URL / port |
|---------|-------------------|
| Home Assistant | `:8123` / `home.kwokah.com` |
| This docs app | `:8124` / `jws11.kwokah.com` |
| Dockge | `:5001` / `docker.kwokah.com` |

Cloudflare Tunnel routes should target `http://127.0.0.1:<port>` when `cloudflared` runs on the **host**. Prefer a **single** cloudflared connector (avoid duplicate token + local-config processes).

## License

Private project for property documentation and handover.
