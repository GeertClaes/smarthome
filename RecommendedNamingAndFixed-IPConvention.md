Recommended naming & fixed-IP convention

1. One canonical name, mirrored everywhere
   Pick a single name per device and use it identically in all four places: the Shelly device's own "Name" field (set in the Shelly app / Shelly Cloud), the FRITZ!Box "Name" shown in Home Network > Network (this is set via the device's DHCP hostname or can be overridden per-device on the FRITZ!Box), the LittleJerry client list, and the Home Assistant entity name/area. Today these already mostly agree, which is a good foundation - the main gap is the two mislabeled rooms and a few devices that need cleaner descriptors (see the "Canonical Name" column on the Device Registry tab).

2. Suggested pattern: <Type>-<Room>-<Descriptor>
   Example: Shutter-Office-Left, Relay-Bathroom-HeaterMirror, Globe-Lounge, Plug-Dishwasher. Grouping by Type first makes the FRITZ!Box and LittleJerry lists sort alphabetically by device category, which is what you want when scanning 30+ entries. Keep Room as the second element so devices in the same room are still easy to find with a text search.

3. Fixed IP addressing by device type (DHCP reservations on the FRITZ!Box)
   Reserve a small IP block per device type so a glance at the IP tells you the category, e.g.: .80-.89 Relays & Switches, .90-.99 Plugs & misc power, .100-.119 Roller Shutters, .120-.139 Lights & Globes, .140-.149 Control panels (Shelly Wall Display), .150-.199 spare/growth. Set these as static DHCP leases (by MAC) on the FRITZ!Box under Home Network > Network > Network Settings > IPv4 Addresses, so a factory reset or firmware update never causes a device to silently change IP and break a Home Assistant automation.

4. Keep one AP for all Shelly Wi-Fi devices
   Right now most Shelly devices sit on LittleJerry's radio while a few (SwitchKitchen, Blink-Mini) connect straight to the FRITZ!Box. Standardizing all Shelly-family devices onto LittleJerry keeps them on one manageable client list and away from your phones/laptops on the main FRITZ!Box Wi-Fi.

5. Home Assistant entity IDs
   Match the HA entity_id to the canonical name where possible, e.g. cover.shutter_office_left, switch.relay_bathroom_heater, light.globe_lounge. This keeps automations and dashboards readable without needing to cross-reference a separate device list.

6. Multiple control surfaces on one relay (wall switch + Alexa + HA + Wall Display)
   For lights with more than one control path, the input mode on the Shelly relay matters: "Normal/attached" mode ties the switch input directly to the relay in the device's own firmware, so the wall switch keeps working even if Wi-Fi, Home Assistant, or Alexa are unavailable - use this for momentary/push-button wall switches. "Detached" mode is only needed for maintained rocker switches, where the physical position can otherwise fall out of sync after an Alexa or HA toggle; in that case wire the load always-hot to the relay output and use a small on-device script to bind input to output locally, rather than routing every press through Home Assistant. Recorded in column P (Wall Switch) of the Device Registry per device.

7. Maintenance routine
   Whenever a Shelly device is added, renamed, or moved to a new room: rename it in the Shelly app, update the FRITZ!Box DHCP reservation name, rename the HA entity, and update this spreadsheet - in that order, so the FRITZ!Box and HA never fall out of sync with what the device is actually called.
