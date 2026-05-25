import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const repoRootDir = path.resolve(__dirname, "..", "..");
export const uploadsDir = path.join(repoRootDir, "uploads");
export const outputsDir = path.join(repoRootDir, "outputs");
