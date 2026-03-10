import { useRef } from "react";
import { useToast } from "../hooks/useToast";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "video/mp4",
  "application/pdf",
]);
const ALLOWED_EXTS = new Set([".png", ".jpg", ".jpeg", ".mp4", ".pdf"]);

function isAllowed(file: File): boolean {
  if (ALLOWED_TYPES.has(file.type)) {
    return true;
  }
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  return ALLOWED_EXTS.has(ext);
}

interface AddDocumentCardProps {
  onFiles: (files: File[]) => void;
  isUploading?: boolean;
}

export function AddDocumentCard(props: AddDocumentCardProps) {
  const toast = useToast();
  const { onFiles, isUploading } = props;
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col w-full gap-1">
      <div
        onClick={() => !isUploading && inputRef.current?.click()}
        className="border-[1.5px] flex w-full border-dashed rounded-lg overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5"
        style={{
          cursor: isUploading ? "default" : "pointer",
          opacity: isUploading ? 0.6 : 1,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          hidden
          accept=".pdf,.mp4,.png,.jpg,.jpeg"
          multiple
          onChange={(e) => {
            const all = Array.from(e.target.files ?? []);
            const valid = all.filter(isAllowed);
            const rejected = all.filter((f) => !isAllowed(f));
            e.target.value = "";
            if (rejected.length > 0) {
              toast.error(
                `Only PNG, JPG, MP4 and PDF files are allowed. ${rejected.length} unsupported file${rejected.length > 1 ? "s" : ""} ignored.`,
              );
            }
            if (valid[0] != null) {
              onFiles(valid);
            }
          }}
        />
        <div
          className="h-full flex w-full items-center justify-center border-b min-h-58 min-w-58"
          style={{
            borderColor: "var(--color-border)",
          }}
        >
          {isUploading === true ? (
            <div className="w-7 h-7 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
          ) : (
            <p className="text-[26px] text-(--secondary-color)">+</p>
          )}
        </div>
      </div>
    </div>
  );
}
