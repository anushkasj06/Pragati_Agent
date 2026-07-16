import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DOCS_DIR = path.resolve(__dirname, "..", "..", "uploads", "applications");

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function saveApplicationDocuments(application, files) {
  ensureDirectory(APP_DOCS_DIR);
  const saved = {};

  Object.entries(files).forEach(([fieldName, fileArray]) => {
    if (!fileArray || !fileArray.length) return;
    const file = fileArray[0];
    const safeName = `${application.id}_${fieldName}_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.\-_%]/g, "_")}`;
    const outPath = path.join(APP_DOCS_DIR, safeName);
    fs.writeFileSync(outPath, file.buffer);
    saved[fieldName] = {
      fileName: file.originalname,
      storedFile: safeName,
      mimeType: file.mimetype,
      size: file.size,
      path: outPath,
    };
  });

  return saved;
}
