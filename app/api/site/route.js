import { revalidateDocumentationPaths } from "@/lib/revalidateDocs";
import { assertAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiResponse";
import { getSiteRaw, saveSite } from "@/lib/dataStore";
import { normalizeSitePayload } from "@/lib/siteCopy";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return jsonOk(getSiteRaw());
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request) {
  try {
    assertAdmin(request);
    const payload = await request.json();
    const site = normalizeSitePayload(payload);
    saveSite(site);
    revalidateDocumentationPaths();

    return jsonOk(site);
  } catch (error) {
    return jsonError(error);
  }
}
