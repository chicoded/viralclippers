declare module "ffmpeg-static" {
  const path: string | null;
  export default path;
}

declare module "ffprobe-static" {
  const ffprobeStatic: { path: string };
  export default ffprobeStatic;
}

declare module "fluent-ffmpeg" {
  const ffmpeg: any;
  export default ffmpeg;
}
