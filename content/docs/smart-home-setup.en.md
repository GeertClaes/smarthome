# Smart home setup — how everything works together

This apartment uses **Shelly** Wi‑Fi devices for shutters, lights, switches, and plugs. They are managed locally through **Home Assistant**, and can be controlled by voice through **Amazon Alexa** when the Shelly Cloud link is set up.

The sections below describe the network hardware, Home Assistant, and the steps to get Alexa working.

---

## Network overview

| Component | Name / model | Role |
|-----------|--------------|------|
| **Router** | FRITZ!Box 6591 Cable (or buyer equivalent) | Internet, DHCP, main Wi‑Fi for phones and laptops |
| **Access point** | GL.iNet GL‑AR300M (“**LittleJerry**”) | Dedicated Wi‑Fi for Shelly devices — **bridge mode**, not a router |
| **Automation server** | “**Kelder**” (Lenovo ThinkCentre) | Runs **Home Assistant** in Docker |

**Subnet:** `192.168.178.0/24` (AVM/Vodafone default — often the same on a replacement FRITZ!Box).

**Why LittleJerry?** Shelly devices need to see each other and Home Assistant on one LAN segment (mDNS / local discovery). LittleJerry is wired to a **LAN port** on the FRITZ!Box and broadcasts a separate SSID for IoT devices, while still being on the same IP subnet.

### Physical connections

1. FRITZ!Box WAN → cable modem / fibre ONT  
2. LittleJerry **WAN/uplink** → FRITZ!Box **LAN** port  
3. Kelder **Ethernet** → FRITZ!Box **LAN** port (or a switch on the same LAN)  
4. Power: router first, then LittleJerry, then Kelder  

### FRITZ!Box (router)

- Web UI: [http://fritz.box](http://fritz.box) (or `192.168.178.1`)  
- Assigns fixed IP addresses (DHCP reservations) to Shelly devices by MAC address  
- IP blocks used in this installation (last octet):  
  - `.80–.89` — relays & wall switches  
  - `.90–.99` — plugs & power  
  - `.100–.119` — roller shutters  
  - `.120–.139` — lights & globes  
  - `.140–.149` — control panels (e.g. Shelly Wall Display)  

After replacing the router, recreate reservations from the device list in this app or from the handover IP plan.

### LittleJerry (access point)

- **Mode:** Bridge / access point (do **not** enable router/NAT mode)  
- **Purpose:** All Shelly-family devices should join **LittleJerry’s Wi‑Fi**, not the main FRITZ!Box Wi‑Fi  
- Admin panel: typically `192.168.8.1` when connected to its Wi‑Fi, or via the address assigned on the LAN after bridging  
- Keeps IoT traffic on a dedicated radio while remaining on `192.168.178.0/24`  

If a device appears on the FRITZ!Box client list instead of LittleJerry, reconnect it to LittleJerry’s SSID.

---

## Home Assistant (Kelder)

Home Assistant is **already configured** on the Kelder server for this property.

- **What it does:** Local control, automations, dashboards, and integrations that do not depend on Shelly Cloud or Alexa  
- **Shelly integration:** Discovers and controls Shelly devices on the LAN  
- **Other integrations:** e.g. WiZ smart bulbs (no fixed IP in the device list — managed through HA)  
- **When to use it:** Scenes, schedules, combined logic, and backup control if cloud voice assistants are unavailable  

**After handover:** Open Home Assistant in the browser (URL/credentials provided separately), confirm entities load, and test one shutter, one light, and one switch locally.

Wall switches wired to Shelly inputs continue to work even when Wi‑Fi or Home Assistant is down (depending on each device’s input mode — see device notes in this app).

---

## Voice control with Amazon Alexa

Alexa does **not** talk to Shelly devices directly on the LAN. The usual path is:

**Shelly device → Shelly Cloud → Alexa “Shelly Cloud” skill → your Echo**

Local wall switches and Home Assistant are separate paths and keep working without Alexa.

### Step 1 — Devices online in Shelly Cloud

1. Install **Shelly Smart Control** (Shelly app) on a phone.  
2. Sign in to the **Shelly Cloud** account that owns these devices (or transfer devices at handover).  
3. Confirm each device shows **online** in the app.  
4. If a device is missing, check that it is on **LittleJerry’s Wi‑Fi** and has a stable IP (FRITZ!Box reservation).  

Dual-channel relays (e.g. table + lounge lights) appear as **two outputs** in Shelly Cloud when both channels are enabled and named.

### Step 2 — Enable the Shelly skill in Alexa

1. Open the **Amazon Alexa** app.  
2. Go to **More → Skills & Games**.  
3. Search for **Shelly** (official **Shelly Cloud** skill).  
4. **Enable** the skill and **Link account** — sign in with the same Shelly Cloud credentials.  
5. Run **Discover devices** (Devices → + → Add device → “Discover”).  
6. New devices appear under **Devices**; assign them to rooms in Alexa if desired.  

### Step 3 — Naming and daily use

- Names in Alexa follow Shelly Cloud / device names — keep them aligned with this documentation app for clarity.  
- Say e.g. *“Alexa, turn on lounge light”* using the name shown in Alexa.  
- If a device does not respond: check Shelly app (online?), LittleJerry Wi‑Fi, then re-run discovery in Alexa.  

### What Alexa may not cover

- Some devices are **Home Assistant only** (e.g. certain WiZ bulbs) — they will not appear in the Shelly skill.  
- Not every channel is exposed to Alexa; see the **Channels** section elsewhere in this site for wall switch / HA / Alexa coverage per output.  

---

## Quick checklist for a new owner

- [ ] FRITZ!Box online; DHCP reservations restored  
- [ ] LittleJerry in **bridge mode**, Shelly devices on its Wi‑Fi  
- [ ] Kelder / Home Assistant reachable; entities respond  
- [ ] Shelly Cloud account access; all devices online in the app  
- [ ] Alexa Shelly Cloud skill linked; devices discovered  
- [ ] Test: one shutter, one light, one Alexa command  

For full network handover (cabling, subnet change, credential rotation), see also **Network setup** in the site navigation if published.
