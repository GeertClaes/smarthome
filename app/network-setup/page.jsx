export default function NetworkSetupPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Owner Network Setup (Full Guide)</h1>

      <div className="alert alert-info">
        <span>
          This handover assumes LittleJerry and Kelder are included in the sale and connected to the
          buyer router LAN.
        </span>
      </div>

      <section className="card bg-base-100 shadow">
        <div className="card-body space-y-3">
          <h2 className="card-title">1. Physical wiring</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Connect LittleJerry uplink port to a LAN port on the buyer router.</li>
            <li>
              Connect Kelder server LAN port to a LAN port on the buyer router (or switch on the
              same LAN).
            </li>
            <li>Power on router, then LittleJerry, then Kelder.</li>
          </ul>
        </div>
      </section>

      <section className="card bg-base-100 shadow">
        <div className="card-body space-y-3">
          <h2 className="card-title">2. Addressing and reservations</h2>
          <p>
            If the buyer router supports 192.168.178.0/24, keep the current subnet and restore
            reservations from ip-plan.csv.
          </p>
          <p>
            If it uses a different subnet, preserve the same last-octet pattern where possible and
            document final assignments in network.yaml.
          </p>
        </div>
      </section>

      <section className="card bg-base-100 shadow">
        <div className="card-body space-y-3">
          <h2 className="card-title">3. Home Assistant check</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Open Home Assistant from Kelder and verify device entities load.</li>
            <li>Test one shutter, one light, and one switch channel locally.</li>
            <li>Confirm wall switch control still works if cloud integrations are unavailable.</li>
          </ul>
        </div>
      </section>

      <section className="card bg-base-100 shadow">
        <div className="card-body space-y-3">
          <h2 className="card-title">4. Credentials and rotation</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Hand over router admin, HA admin, Wi-Fi credentials, and cloud app credentials
              separately from git repos.
            </li>
            <li>Rotate credentials at handover so ownership is cleanly transferred.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
