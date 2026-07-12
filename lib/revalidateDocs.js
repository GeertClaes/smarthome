import { revalidatePath } from "next/cache";

export function revalidateDocumentationPaths({ deviceId, roomId } = {}) {
  revalidatePath("/");
  revalidatePath("/floorplan");
  revalidatePath("/devices");
  revalidatePath("/rooms");

  if (deviceId) {
    revalidatePath(`/devices/${deviceId}`);
    revalidatePath(`/admin/devices/${deviceId}/edit`);
  }

  if (roomId) {
    revalidatePath(`/rooms/${roomId}`);
    revalidatePath(`/admin/rooms/${roomId}/edit`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/devices");
  revalidatePath("/admin/models");
  revalidatePath("/admin/rooms");
  revalidatePath("/admin/content");
  revalidatePath("/docs");
}
