import Link from "next/link";
import { getData } from "@/lib/data";
import RoomForm from "../../components/RoomForm";

export const dynamic = "force-dynamic";

export default function NewRoomPage() {
  const { floors } = getData();

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <p className="section-kicker">
          <Link href="/admin/rooms" className="admin-breadcrumb-link">
            Rooms
          </Link>{" "}
          / New
        </p>
        <h1 className="admin-page-title">Add room</h1>
      </header>

      <RoomForm mode="create" floors={floors} />
    </div>
  );
}
