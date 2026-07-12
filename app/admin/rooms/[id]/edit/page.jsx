import Link from "next/link";
import { notFound } from "next/navigation";
import { getData } from "@/lib/data";
import RoomForm from "../../../components/RoomForm";

export const dynamic = "force-dynamic";

export default async function EditRoomPage({ params }) {
  const { id } = await params;
  const { rooms, floors } = getData();
  const room = rooms.find((entry) => entry.id === id);

  if (!room) {
    notFound();
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <p className="section-kicker">
          <Link href="/admin/rooms" className="admin-breadcrumb-link">
            Rooms
          </Link>{" "}
          / Edit
        </p>
        <h1 className="admin-page-title">{room.name}</h1>
      </header>

      <RoomForm room={room} floors={floors} mode="edit" />
    </div>
  );
}
