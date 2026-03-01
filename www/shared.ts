// tRPC serialises Date fields as ISO strings over the wire, so we widen them
export type Serialised<T> = {
  [K in keyof T]: T[K] extends Date | null
    ? string | null
    : T[K] extends Date
      ? string
      : T[K];
};
export interface PendingUpload {
  files: File[];
}

export function getDocumentIcon(inputType: unknown): string {
  if (inputType === "img") return "🖼️";
  if (inputType === "vid") return "🎬";
  return "📄";
}
export function getInputType(file: File): "file" | "img" | "vid" {
  if (file.type.startsWith("image/")) {
    return "img";
  }
  if (file.type.startsWith("video/")) {
    return "vid";
  }
  return "file";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
