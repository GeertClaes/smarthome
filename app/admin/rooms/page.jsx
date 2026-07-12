import Link from "next/link";
import { getData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default function AdminRoomsPage() {
  const { rooms } = getData();

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <p className="section-kicker">Rooms</p>
        <div className="admin-page-title-row">
          <div>
            <h1 className="admin-page-title">Rooms</h1>
            <p className="admin-page-lead">Names, floor assignment, and photos for each room.</p>
          </div>
          <Link href="/admin/rooms/new" className="btn btn-primary btn-sm">
            Add room
          </Link>
        </div>
      </header>

      <div className="admin-table-wrap">
        <table className="admin-table admin-table-interactive">
          <thead>
            <tr>
              <th>Name</th>
              <th>Floor</th>
              <th>Photos</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id}>
                <td>
                  <Link href={`/admin/rooms/${room.id}/edit`} className="admin-table-row-link">
                    <span className="admin-table-primary">{room.name}</span>
                  </Link>
                </td>
                <td>{room.floor_id}</td>
                <td>{room.images?.length ?? 0}</td>
                <td className="admin-table-actions">
                  <Link href={`/admin/rooms/${room.id}/edit`} className="btn btn-ghost btn-xs">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
