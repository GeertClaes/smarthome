import { getData } from "@/lib/data";
import { getSmartHomeGuideContents } from "@/lib/guides";
import DocumentLibrary from "./DocumentLibrary";

export default function DocsPage() {
  const { documents } = getData();
  const guides = getSmartHomeGuideContents();

  return <DocumentLibrary documents={documents} guides={guides} />;
}
