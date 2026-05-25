import path from "path";

const cwd = process.cwd();
const isMonorepoServerCwd = path.basename(cwd).toLowerCase() === "server";
export const repoRootDir = isMonorepoServerCwd ? path.resolve(cwd, "..") : cwd;

export const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(repoRootDir, "uploads");

export const outputsDir = process.env.OUTPUTS_DIR
  ? path.resolve(process.env.OUTPUTS_DIR)
  : path.join(repoRootDir, "outputs");
