import { getData } from "@/lib/data";
import ContentEditor from "./ContentEditor";

export const dynamic = "force-dynamic";

export default function AdminContentPage() {
  const { site, floors } = getData();

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <p className="section-kicker">Site copy</p>
        <h1 className="admin-page-title">Site & floor copy</h1>
        <p className="admin-page-lead">
          Edit homepage, header, and documents page text in English and German. Floor tabs control per-level summaries
          and map legend labels.
        </p>
      </header>

      <ContentEditor site={site} floors={floors} />
    </div>
  );
}
