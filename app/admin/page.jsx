import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <p className="section-kicker">Settings</p>
        <h1 className="admin-page-title">Property documentation</h1>
        <p className="admin-page-lead">
          Edit rooms, devices, site copy, and photos. Changes save directly to the YAML data files.
        </p>
      </header>

      <div className="admin-hub-grid">
        <Link href="/admin/devices" className="admin-hub-card">
          <i className="fa-solid fa-microchip" aria-hidden="true" />
          <span>Devices</span>
          <p>Registry of all hardware — add, edit, delete, and assign floor plan points.</p>
        </Link>

        <Link href="/admin/models" className="admin-hub-card">
          <i className="fa-solid fa-layer-group" aria-hidden="true" />
          <span>Device models</span>
          <p>Catalog of hardware models from any manufacturer, with manuals and category hints.</p>
        </Link>

        <Link href="/admin/rooms" className="admin-hub-card">
          <i className="fa-solid fa-door-open" aria-hidden="true" />
          <span>Rooms</span>
          <p>Room names, floor assignment, and installation photos.</p>
        </Link>

        <Link href="/admin/content" className="admin-hub-card">
          <i className="fa-solid fa-language" aria-hidden="true" />
          <span>Site & floor copy</span>
          <p>Homepage, header, docs intros, and floor summaries in EN/DE.</p>
        </Link>

        <Link href="/floorplan" className="admin-hub-card">
          <i className="fa-solid fa-map" aria-hidden="true" />
          <span>Floor plan</span>
          <p>Assign devices to points, edit locations, and upload point photos — without deleting from the registry.</p>
        </Link>
      </div>
    </div>
  );
}
