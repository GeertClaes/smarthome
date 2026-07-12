import fs from "fs";
import path from "path";

export function loadSvgFromPublic(svgPath) {
  if (!svgPath) {
    return "";
  }

  const normalizedPath = svgPath.startsWith("/") ? svgPath.slice(1) : svgPath;
  const fullPath = path.join(process.cwd(), "public", normalizedPath);

  if (!fs.existsSync(fullPath)) {
    return "";
  }

  return fs.readFileSync(fullPath, "utf8");
}
