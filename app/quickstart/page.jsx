export default function QuickstartPage() {
  const steps = [
    "Connect LittleJerry LAN uplink to buyer router LAN.",
    "Connect Kelder server to buyer router LAN.",
    "Power on router, LittleJerry, then Kelder.",
    "Apply DHCP reservations from ip-plan.csv (or preserve last-octet layout on another subnet).",
    "Open Home Assistant and verify one shutter, one light, and one switch.",
    "Hand over and rotate all credentials.",
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Owner Quickstart</h1>
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <ol className="steps steps-vertical w-full">
            {steps.map((step) => (
              <li key={step} className="step step-primary">
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
