# Smart-Home-Einrichtung — wie alles zusammenspielt

Diese Wohnung nutzt **Shelly**-WLAN-Geraete fuer Rolllaeden, Licht, Schalter und Steckdosen. Sie werden lokal ueber **Home Assistant** verwaltet und koennen per Sprache ueber **Amazon Alexa** gesteuert werden, sobald die Shelly-Cloud-Anbindung eingerichtet ist.

Die folgenden Abschnitte beschreiben die Netzwerk-Hardware, Home Assistant und die Schritte fuer Alexa.

---

## Netzwerk-Ueberblick

| Komponente | Name / Modell | Aufgabe |
|------------|---------------|---------|
| **Router** | FRITZ!Box 6591 Cable (oder Ersatz des Kauefers) | Internet, DHCP, Haupt-WLAN fuer Telefone und Laptops |
| **Access Point** | GL.iNet GL‑AR300M („**LittleJerry**“) | Eigenes WLAN fuer Shelly-Geraete — **Bridge-Modus**, kein Router |
| **Automations-Server** | „**Kelder**“ (Lenovo ThinkCentre) | **Home Assistant** in Docker |

**Subnetz:** `192.168.178.0/24` (AVM/Vodafone-Standard — oft identisch bei einer Ersatz-FRITZ!Box).

**Warum LittleJerry?** Shelly-Geraete muessen sich gegenseitig und Home Assistant im selben LAN-Segment sehen (mDNS / lokale Erkennung). LittleJerry haengt an einem **LAN-Port** der FRITZ!Box und sendet ein separates SSID fuer IoT-Geraete, bleibt aber im gleichen IP-Netz.

### Physische Anschluesse

1. FRITZ!Box WAN → Kabelmodem / Glasfaser-ONT  
2. LittleJerry **WAN/Uplink** → FRITZ!Box **LAN**-Port  
3. Kelder **Ethernet** → FRITZ!Box **LAN**-Port (oder Switch im selben LAN)  
4. Einschalten: zuerst Router, dann LittleJerry, dann Kelder  

### FRITZ!Box (Router)

- Web-Oberflaeche: [http://fritz.box](http://fritz.box) (oder `192.168.178.1`)  
- Vergibt **feste IP-Adressen** (DHCP-Reservierungen) an Shelly-Geraete per MAC  
- IP-Bloecke in dieser Installation (letztes Oktett):  
  - `.80–.89` — Relais & Wandschalter  
  - `.90–.99` — Steckdosen & Strom  
  - `.100–.119` — Rolllaeden  
  - `.120–.139` — Lampen & Kugeln  
  - `.140–.149` — Bedienpanels (z. B. Shelly Wall Display)  

Nach Router-Tausch Reservierungen aus der Geraeteliste in dieser App oder aus dem Uebergabe-IP-Plan neu anlegen.

### LittleJerry (Access Point)

- **Modus:** Bridge / Access Point (**kein** Router/NAT aktivieren)  
- **Zweck:** Alle Shelly-Geraete am **WLAN von LittleJerry**, nicht am Haupt-WLAN der FRITZ!Box  
- Admin: typisch `192.168.8.1` im LittleJerry-WLAN, oder LAN-Adresse im Bridge-Betrieb  
- Haelt IoT auf einer eigenen Funkzelle, bleibt aber in `192.168.178.0/24`  

Erscheint ein Geraet in der FRITZ!Box-Liste statt bei LittleJerry, erneut mit LittleJerry-WLAN verbinden.

---

## Home Assistant (Kelder)

Home Assistant ist auf dem Kelder-Server **bereits fuer diese Wohnung eingerichtet**.

- **Funktion:** Lokale Steuerung, Automationen, Dashboards — unabhaengig von Shelly Cloud oder Alexa  
- **Shelly-Integration:** Findet und steuert Shelly-Geraete im LAN  
- **Weitere Integrationen:** z. B. WiZ-Lampen (ohne feste IP in der Geraeteliste — nur ueber HA)  
- **Wann nutzen:** Szenen, Zeitplaene, kombinierte Logik, Reserve-Steuerung wenn Cloud-Sprachassistenten ausfallen  

**Nach Uebergabe:** Home Assistant im Browser oeffnen (URL/Zugangsdaten separat), pruefen ob Entitaeten laden, einen Rollladen, ein Licht und einen Schalter lokal testen.

Wandschalter an Shelly-Eingaengen funktionieren auch bei WLAN- oder HA-Ausfall weiter (je nach Eingabe-Modus — siehe Geraetenotizen in dieser App).

---

## Sprachsteuerung mit Amazon Alexa

Alexa spricht **nicht** direkt mit Shelly-Geraeten im LAN. Der uebliche Weg:

**Shelly-Geraet → Shelly Cloud → Alexa-Skill „Shelly Cloud“ → Ihr Echo**

Lokale Wandschalter und Home Assistant sind separate Wege und funktionieren ohne Alexa.

### Schritt 1 — Geraete in der Shelly Cloud online

1. **Shelly Smart Control** (Shelly-App) auf dem Handy installieren.  
2. Mit dem **Shelly-Cloud-Konto** anmelden, dem die Geraete gehoeren (oder Geraete bei Uebergabe uebertragen).  
3. Jedes Geraet sollte in der App **online** sein.  
4. Fehlt ein Geraet: **LittleJerry-WLAN** und stabile IP (FRITZ!Box-Reservierung) pruefen.  

Zweikanal-Relais (z. B. Esstisch + Lounge) erscheinen in der Shelly Cloud als **zwei Ausgaenge**, wenn beide Kanaele aktiv und benannt sind.

### Schritt 2 — Shelly-Skill in Alexa aktivieren

1. **Amazon Alexa**-App oeffnen.  
2. **Mehr → Skills & Spiele**.  
3. Nach **Shelly** suchen (offizieller Skill **Shelly Cloud**).  
4. Skill **aktivieren** und **Konto verknuepfen** — mit denselben Shelly-Cloud-Zugangsdaten anmelden.  
5. **Geraete suchen** (Geraete → + → Geraet hinzufuegen → „Suchen“).  
6. Geraete erscheinen unter **Geraete**; Raeume in Alexa optional zuweisen.  

### Schritt 3 — Benennung und Alltag

- Namen in Alexa folgen Shelly Cloud / Geraetenamen — Abgleich mit dieser Dokumentation empfohlen.  
- z. B. *„Alexa, schalte Lounge-Licht ein“* mit dem in Alexa angezeigten Namen.  
- Reagiert ein Geraet nicht: Shelly-App (online?), LittleJerry-WLAN, dann erneut in Alexa suchen.  

### Was Alexa ggf. nicht abdeckt

- Manche Geraete sind **nur in Home Assistant** (z. B. bestimmte WiZ-Lampen) — erscheinen nicht im Shelly-Skill.  
- Nicht jeder Kanal ist fuer Alexa freigegeben; siehe **Kanaele** an anderer Stelle dieser Site.  

---

## Kurz-Checkliste fuer einen neuen Eigentuemer

- [ ] FRITZ!Box online; DHCP-Reservierungen wiederhergestellt  
- [ ] LittleJerry im **Bridge-Modus**, Shelly-Geraete in seinem WLAN  
- [ ] Kelder / Home Assistant erreichbar; Entitaeten reagieren  
- [ ] Zugang Shelly Cloud; alle Geraete in der App online  
- [ ] Alexa Shelly-Cloud-Skill verknuepft; Geraete gefunden  
- [ ] Test: ein Rollladen, ein Licht, ein Alexa-Befehl  

Fuer die vollstaendige Netzwerk-Uebergabe (Verkabelung, Subnetzwechsel, Passwoerter) ggf. auch **Network setup** in der Navigation dieser Site.
