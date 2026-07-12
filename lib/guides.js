import fs from "fs";
import path from "path";

const GUIDES_DIR = path.join(process.cwd(), "content/docs");

export function getSmartHomeGuideContents() {
  return {
    en: readGuide("smart-home-setup.en.md"),
    de: readGuide("smart-home-setup.de.md"),
  };
}

function readGuide(fileName) {
  const fullPath = path.join(GUIDES_DIR, fileName);
  return fs.readFileSync(fullPath, "utf8");
}
