# Smart Home Documentation & Handover Project — Implementation Plan

**Purpose of this document:** a self-contained brief for an AI coding assistant (e.g. Claude Code) to implement.
It assumes the assistant has shell/file access to the "kelder" home server and access to a private GitHub account,
but does **not** assume it can log into the FRITZ!Box UI, physically inspect devices, take photographs, or scan a
floorplan — those steps are marked `[HUMAN]` and must be done by Geert, with the assistant preparing
checklists/scripts to make them fast.

---

## 0. Context

- Home network: FRITZ!Box 6591 Cable (Vodafone, Germany) as router/DHCP server, subnet `192.168.178.0/24`.
- GL.iNet GL-AR300M ("LittleJerry") runs in **bridged access-point mode** (not router mode) — deliberately, because
  Home Assistant needs all Shelly devices on one broadcast domain for local discovery (mDNS/SSDP). Do not change
  this back to router mode.
- ~33 Shelly-family devices (shutters, relays, switches, plugs, globes) + 1 WiZ bulb (HA-only, no direct IP) +
  1 Shelly Wall Display (has a built-in relay channel controlling the kitchen light).
- Home Assistant runs in Docker on "kelder," an old Lenovo ThinkCentre M900q.
- **Primary project goal:** build and maintain a small documentation app that records every smart-home device,
  channel, integration path, network detail, and installation context (including physical location and photos)
  in one versioned source of truth.
- **End goal A (near-term):** a clean, versioned, self-documenting record of the whole setup, browsable from
  multiple angles (by device, by room, by physical location on a floorplan) rather than a single fixed structure.
- **End goal B (sale-time):** the next owner receives both LittleJerry (bridge AP) and kelder (Home Assistant
  host), connects them to their internet provider router, and can inherit the full setup with minimal friction.
- Existing artifacts to reuse as source data (already produced in this conversation, attached/available to the assistant):
  - `Smart_Home_Device_Registry.xlsx` — device-level inventory (names, MACs, current IPs, types, control methods).
  - `Smart_Home_Network_Documentation.md` — narrative writeup of the network topology.

**Open decision to confirm with Geert before Phase 1 work begins:**
Keep every device's _current_ IP and just reserve it (low risk, no re-pairing needed), **or** renumber everything
into the clean block scheme below (tidier, but means touching ~15 devices whose current IP falls outside its
target block, with a small risk of any that need factory re-provisioning). **Default recommendation: keep current
IPs, reserve as-is.** Treat renumbering as an optional later cleanup phase, not part of this project.

---

## 1. Target logical IP scheme

Subnet: `192.168.178.0/24` (matches the FRITZ!Box default and is very likely to also be the range on a
replacement Vodafone-issued FRITZ!Box, since Vodafone/AVM defaults to this subnet).

| Range     | Category                                          |
| --------- | ------------------------------------------------- |
| .1        | FRITZ!Box (fixed, not configurable)               |
| .2–.19    | Reserved (FRITZ!Box infrastructure / repeater)    |
| .20–.29   | Reserved (LittleJerry uplink, kelder, misc infra) |
| .80–.89   | Relays & wall switches                            |
| .90–.99   | Plugs & socket controllers                        |
| .100–.119 | Roller shutters                                   |
| .120–.139 | Lights & globes                                   |
| .140–.149 | Control panels (Shelly Wall Display)              |
| .150–.199 | Spare / future smart-home devices                 |
| .200+     | Personal devices (phones, laptops) — not reserved |

If "keep current IPs" is chosen, this table still describes the _intended_ long-term layout — new devices added
from now on should get an IP from the correct block even if legacy devices don't perfectly fit it yet.

---

## 2. Phases

### Phase 1 — Finalize the addressing decision `[HUMAN decision, then assistant documents it]`

1. Confirm with Geert: keep-current-IPs vs renumber (see recommendation above).
2. Assistant produces a final `network/ip-plan.csv`: one row per device with `name, mac, current_ip, target_ip, block`.
   For "keep current" devices, `current_ip == target_ip`.

**Done when:** `ip-plan.csv` exists and every device from the xlsx registry appears exactly once.

---

### Phase 2 — Configure DHCP static leases on the FRITZ!Box `[HUMAN, assistant provides checklist]`

FRITZ!Box has no public API endpoint for creating DHCP reservations (TR-064 exposes host status, not reservation
writes), so this step is manual.

1. Assistant generates a step-by-step checklist from `ip-plan.csv`:
   `Home Network → Network → Network Connections → [device] → edit (pencil icon) → "Always assign this device the
same IPv4 address" → save.` One line per device, checkbox format, grouped by block/room, so Geert can work
   through it in one sitting.
2. `[HUMAN]` Geert works through the checklist in the FRITZ!Box UI.
3. Assistant (optional, nice-to-have): write a small Python script using the `fritzconnection` library to
   _read back_ the current host list via TR-064 and diff it against `ip-plan.csv`, to confirm every reservation
   took effect — this part _can_ be automated even though the write step can't.

**Done when:** the read-back script reports zero _hard mismatches_ between planned and actual IPs, and any
currently offline/unreachable devices are listed separately for a later re-check window.

---

### Phase 3 — Build the structured data files `[Assistant, autonomous]`

Convert `Smart_Home_Device_Registry.xlsx` into version-controlled YAML, split by concern:

```
data/
  rooms.yaml
  floors.yaml
  devices.yaml
  channels.yaml
  integrations.yaml   # which channels are reachable via wall switch / HA / Alexa / wall display
  network.yaml         # subnet, block scheme, AP config, this project's ip-plan.csv folded in
```

**Key modeling point:** a device's _physical installed location_ is not always the same as the room a channel
serves (e.g. a relay can sit in a ceiling void near the hallway but control the bathroom light). Keep these as
two separate fields rather than one `room` field, so both facts are representable instead of one silently
overwriting the other.

Suggested schema (adjust as needed, but keep IDs as the join key rather than repeating names):

```yaml
# floors.yaml
- id: ground_floor
  name: Ground floor
  floorplan_image: /floorplans/ground-floor.png # see Phase 3b

# rooms.yaml
- id: kitchen
  name: Kitchen
  floor_id: ground_floor

# devices.yaml
- id: relay_table_lounge
  name: RelayTableAndLounge
  mac: "80:64:6F:C8:4E:E8"
  ip: 192.168.178.80
  model: Shelly 2.5 (confirm)
  connects_via: littlejerry
  shelly_cloud_name: ""
  status: online
  installed_location: "Living room, behind TV unit" # where the physical hardware actually sits
  installed_room_id: living_room # FK into rooms.yaml, for the floorplan pin
  floorplan_position: { x: 62, y: 41 } # percentage coords on the room's floorplan image
  images: # wiring / installation photos, see Phase 3b
    - /images/devices/relay_table_lounge/wiring-1.jpg
    - /images/devices/relay_table_lounge/mounted.jpg

# channels.yaml
- id: ch_table_light
  device_id: relay_table_lounge
  channel_index: 0
  controls: Table light
  room_id: living_room # the room this OUTPUT serves — may differ from the device's installed_room_id
  type: light

# integrations.yaml
- channel_id: ch_table_light
  wall_switch: true
  home_assistant: true
  alexa: true
  wall_display: false
  ha_entity_id: light.table_lamp
```

**Done when:** every device/channel from the xlsx has a corresponding YAML entry, and a quick Python script
(`scripts/validate_data.py`) confirms referential integrity (every `device_id`/`room_id`/`floor_id`/`channel_id`
reference resolves, no orphans, every `floorplan_position` is between 0-100).

---

### Phase 3b — Floorplan images & device wiring photography `[HUMAN, ongoing/incremental]`

**Ground floor floorplan: done.** Geert has supplied the ground floor plan (`floorplan-ground-floor.png`), and
room usage has been confirmed against it, resolving several open questions from Phase 3:

| Floorplan room (German label)                                            | Current function                                     | Notes                                                                                                                                                                                                      |
| ------------------------------------------------------------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schlafen (top-left, 16.32 m², originally the builder's "master bedroom") | **Home office**                                      | Devices historically named "MasterBedroom" (Switch-MasterBedroom, Globe-MasterBedroom) are physically here                                                                                                 |
| Zimmer 1 (irregular shape, 14.24 m², originally the builder's "office")  | **Master bedroom**                                   | Switch-Office is physically here                                                                                                                                                                           |
| Zimmer 2 (11.32 m²)                                                      | **Second bedroom**                                   |                                                                                                                                                                                                            |
| Bad (10.30 m², has a window)                                             | Bathroom                                             | Has the roller shutter                                                                                                                                                                                     |
| Duschbad (5.52 m², no window)                                            | Utility bathroom / laundry                           | Houses the washing machine — ShutterLaundry, RelayLaundryAndFridge, PowerWashingMachine are here                                                                                                           |
| Küche (7.02 m²)                                                          | Kitchen                                              | Includes the Shelly Wall Display (built-in relay drives the kitchen light)                                                                                                                                 |
| Diele (10.22 m²)                                                         | Hallway                                              |                                                                                                                                                                                                            |
| Abstell (1.49 m²)                                                        | Storage                                              |                                                                                                                                                                                                            |
| Wohnen/Essen (41.53 m²)                                                  | Living/dining                                        | Table and lounge furniture were swapped; light channel names (`Table light`/`Lounge light`) were **not** renamed to match — left as-is per Geert's preference, can be relabeled directly in the yaml later |
| _(not on this plan)_                                                     | Garden, car park, back gate, back deck, exterior tap | Exterior — will need a second "floor"/overlay (e.g. a simple site plan) if these are to get floorplan pins too; not required to start                                                                      |

This table is now reflected in the `Room` column of `Smart_Home_Device_Registry.xlsx` and should be the source
for populating `rooms.yaml`/`floors.yaml` in Phase 3.

Remaining work in this phase:

1. **Upper floor / other floors,** if the house has more than this one level — same process, additional floorplan image(s).
2. **Exterior plan** (optional) — a simple site sketch to place pins for Shutter-Garden, Shutter-CarPark,
   Shutter-BackGate, Shutter-BackDeck, Switch-Tap.
3. **Device wiring photos:** for each device, 1-2 photos taken _before_ closing up the wall plate/junction box -
   ideally one showing the terminal wiring (which wire goes where) and one showing the device mounted/closed up.
   This is genuinely useful for the next owner (or future-you) troubleshooting a fault without having to
   re-discover the wiring from scratch. Save under `public/images/devices/<device-id>/`, reference from the
   device's `images` list in `devices.yaml`.
4. **Floorplan pin coordinates:** assistant can suggest an approximate `{x, y}` percentage position per device
   based on the room it's in (e.g. centered in that room's area on the ground floor plan) as a starting point —
   `[HUMAN]` Geert nudges each pin to its actual physical spot by eye.

**Done when:** every floor has an image, and every device has at least a room-approximate pin position - exact
photos and precise pins can continue to be filled in gradually via Phase 9 (ongoing maintenance).

---

### Phase 4 — Documentation site (Next.js) `[Assistant, autonomous]`

Framework: **Next.js with static export** (`output: 'export'` in `next.config.js`) — builds to plain static
HTML/CSS/JS at build time; no Node process needs to keep running afterward.

**Why Next.js over a template-per-page generator (MkDocs/Hugo):** the requirement here is several simultaneous
views over one relational dataset (all devices, all rooms, floorplan-by-location), not one markdown file per
page. React components naturally share one data source across multiple views; a static-site generator would
need plugins to fake that interactivity. Also aligns with Geert's existing React/JS experience from the
Databricks Apps work.

**Pages/views to build:**

- `/` — overview/landing page.
- `/devices` — flat table of every device: name, type, MAC, IP, installed location, controlled room(s), status.
  Sortable and filterable (search by name/room/IP) using `@tanstack/react-table`.
- `/rooms` and `/rooms/[room]` — per-room page, split into two sections pulling from the two different fields:
  _devices physically installed here_ (`installed_room_id`) and _channels controlled here_ (`channels.room_id`).
- `/channels` — flat list of every controllable output with control-method badges (wall switch / HA / Alexa /
  wall display), sourced from `integrations.yaml`.
- `/floorplan/[floor]` — the floor's image with an absolutely-positioned marker per device at its
  `floorplan_position`, each marker linking to that device's detail page.
- `/devices/[id]` — device detail page: full metadata, its wiring/installation photo gallery, and a small
  floorplan snippet highlighting its own marker for context.
- `/network-setup`, `/home-assistant` — regular prose pages, written as MDX (`@next/mdx`) so they stay
  markdown-like rather than hand-coded JSX.

**Styling:** Tailwind CSS for fast, clean styling without heavy custom CSS.

**Data loading:** YAML parsed at build time via `js-yaml` inside each page's static generation function - no
runtime data fetching, consistent with the static-export approach.

**Container:** Docker multi-stage build - a Node stage to run `next build && next export`, then a minimal
nginx (or `serve`) stage that only contains the exported static output. The final running container on kelder
never needs Node installed.

**Done when:** `docker compose up` on kelder serves the site locally, and every device/room/floor/channel from
the data files renders correctly across all five views, with floorplan markers clickable through to device pages.

---

### Phase 5 — Keep the docs site in sync `[Assistant, autonomous]`

- Docs source (YAML + Markdown/MDX + Next.js app + Dockerfile) lives in a **private** GitHub repo (e.g.
  `smart-home-docs`).
- Simplest sync approach: a cron job on kelder (`git pull && docker compose up -d --build`) on a schedule (e.g.
  daily), or a GitHub Actions webhook that pings a small endpoint on kelder to trigger the same. Pick whichever
  the assistant finds simpler to implement reliably in this environment — a cron pull is the lower-effort,
  lower-risk default.
- Minimum reliability guardrails for this phase:
  - log each sync run (timestamp + commit SHA + success/failure),
  - run a local health check after deploy, and
  - keep the previous working image/tag so rollback is one command if a build or deploy fails.

**Done when:** a commit pushed to the repo is reflected on the locally-served site within one sync cycle.

---

### Phase 6 — Home Assistant config backup & versioning `[Assistant, autonomous + HUMAN for secrets]`

1. Create a **separate** private repo (e.g. `homeassistant-config`) — kept separate from the docs repo since
   it's operational config, not documentation.
2. `git init` inside HA's config directory on kelder; commit everything **except**:
   - `secrets.yaml` (add to `.gitignore`)
   - `.storage/` (contains tokens/auth — gitignore)
   - any database files
3. `[HUMAN]` Geert confirms `secrets.yaml` contents get copied into the separate credentials handover document
   instead (see Phase 8), not into any git repo.
4. Continue relying on HA's built-in **Backup** feature (Settings → System → Backups) for full point-in-time
   `.tar.gz` snapshots (config + database) on a schedule — git tracks _what changed and when_ in the config,
   the native backup provides _a restorable working snapshot_. Keep both.
5. Docs site links each channel entry to its `ha_entity_id`, so a reader can trace device → channel → HA entity
   without HA automations being re-described in prose.

**Done when:** the config repo has an initial commit, `.gitignore` excludes secrets, and at least one native HA
backup exists and has been test-restored (or at minimum, restore steps are documented and understood).

---

### Phase 7 — "Network Setup for New Owner" page `[Assistant drafts, HUMAN reviews]`

Write as a page in the docs site, assuming the buyer receives both LittleJerry and kelder as part of the sale,
then connects them to their own ISP router (which may be a FRITZ!Box, but should not be required).

Content:

1. Physical setup: connect LittleJerry's uplink port via ethernet to the buyer router's LAN port.
2. Preferred path (FRITZ!Box or router that supports `192.168.178.0/24`): keep the existing subnet and re-create
   DHCP reservations from `ip-plan.csv`.
3. Alternate path (different subnet/router policy): preserve the documented last-octet scheme where possible,
   and record the buyer's actual subnet + reservation mapping in `network.yaml`.
4. Confirming Home Assistant (already running on kelder, included in the sale) picks up all devices — no
   HA-side reconfiguration needed since HA connects by IP already recorded in its config, not by router brand.
5. A note that credentials (router admin password, Shelly Cloud login if used, HA admin login) are provided
   separately at closing, not in this document.

**Done when:** the page reads clearly to a non-technical buyer and a technical reviewer (Geert) confirms accuracy.

---

### Phase 8 — Sale-time handover package `[HUMAN, checklist provided by assistant]`

A final checklist to execute only when the house sale is imminent, not now:

- [ ] Fresh HA native backup taken.
- [ ] Docs site confirmed working by browsing to it from a phone on the home Wi-Fi.
- [ ] All floorplan pins and device photos confirmed present and reasonably complete.
- [ ] Credentials handover document prepared separately (FRITZ!Box admin login, Shelly Cloud login if any device
      uses it, HA admin login, Wi-Fi passwords) — handed over at closing, never committed to git.
- [ ] Credentials rotation completed at handover (router admin, HA admin/users/tokens, Wi-Fi passphrases,
      and any cloud app credentials shared with the buyer).
- [ ] Both GitHub repos (`smart-home-docs`, `homeassistant-config`) either transferred to the buyer's GitHub
      account or exported as a zip, per whatever the buyer is comfortable with.
- [ ] LittleJerry and kelder included in the house sale inventory/contract and physically handed over.

---

### Phase 9 — Ongoing maintenance `[Ongoing, either party]`

Whenever a device is added, renamed, or moved:

1. Update the relevant YAML file(s) — including `installed_location`/`floorplan_position` if it's moved.
2. Add or update its wiring photos if accessible at the time.
3. Run `scripts/validate_data.py`.
4. Commit and push — the docs site picks it up on the next sync cycle (Phase 5).

---

## 3. Summary: what the assistant can do autonomously vs. what needs Geert

| Task                                                          | Who                                              |
| ------------------------------------------------------------- | ------------------------------------------------ |
| Convert xlsx → YAML data files                                | Assistant                                        |
| Build Next.js site (all 5+ views) + Docker packaging          | Assistant                                        |
| Write validation script                                       | Assistant                                        |
| Write FRITZ!Box read-back diff script                         | Assistant                                        |
| Set up both GitHub repos, `.gitignore`, initial commits       | Assistant                                        |
| Draft the New Owner network guide                             | Assistant (drafts), Geert (reviews for accuracy) |
| Draft router-agnostic handover steps for LittleJerry + kelder | Assistant                                        |
| Suggest approximate floorplan pin coordinates per room        | Assistant (starting point)                       |
| Actually click through FRITZ!Box UI to set reservations       | Geert                                            |
| Confirm Wall Display's actual room / which lights it controls | Geert                                            |
| Decide keep-current-IP vs renumber                            | Geert                                            |
| Source/scan a floorplan image per floor                       | Geert                                            |
| Photograph each device's wiring before closing it up          | Geert                                            |
| Nudge each floorplan pin to its exact physical spot           | Geert                                            |
| Provide/withhold secrets from any repo                        | Geert                                            |
| Rotate credentials at buyer handover                          | Geert                                            |
| Physically test-restore an HA backup                          | Geert (assistant can write the restore steps)    |

---

## 4. Suggested repo layout (docs repo)

```
smart-home-docs/
  data/
    floors.yaml
    rooms.yaml
    devices.yaml
    channels.yaml
    integrations.yaml
    network.yaml
  public/
    floorplans/
      ground-floor.png
      first-floor.png
    images/
      devices/
        relay_table_lounge/
          wiring-1.jpg
          mounted.jpg
        ...
  app/                        # Next.js app router
    page.tsx                  # /
    devices/
      page.tsx                # /devices
      [id]/page.tsx            # /devices/[id]
    rooms/
      page.tsx                # /rooms
      [room]/page.tsx          # /rooms/[room]
    channels/
      page.tsx                # /channels
    floorplan/
      [floor]/page.tsx         # /floorplan/[floor]
    network-setup.mdx
    home-assistant.mdx
  scripts/
    validate_data.py
    fritzbox_diff.py
  next.config.js
  Dockerfile
  docker-compose.yml
  README.md
```
