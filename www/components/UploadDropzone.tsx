import { useRef } from "react";
import SVGIcon from "./SVGIcon";
import { useToast } from "../hooks/useToast";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "video/mp4",
  "application/pdf",
]);

const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".mp4", ".pdf"]);

function isAllowed(file: File): boolean {
  if (ALLOWED_TYPES.has(file.type) === true) {
    return true;
  }
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
}

function FileBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-start gap-1 font-medium">
      <span>{icon}</span>
      {label}
    </div>
  );
}

interface UploadDropzoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  onDisabledClick?: () => void;
}

export function UploadDropzone(props: UploadDropzoneProps) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const { onFiles, disabled, onDisabledClick } = props;

  const handleFileList = (list: FileList | null) => {
    if (list?.[0] == null) {
      return;
    }
    const all = Array.from(list);
    const valid = all.filter(isAllowed);
    const rejected = all.filter((f) => !isAllowed(f));
    if (rejected.length > 0) {
      const names = rejected.map((f) => f.name).join(", ");
      toast.error(
        `Unsupported file${rejected.length > 1 ? "s" : ""} removed: ${names}. Only PNG, JPG, MP4, and PDF are supported.`,
      );
    }
    if (valid.length > 0) {
      onFiles(valid);
    }
  };

  const handleClick = () => {
    if (disabled) {
      onDisabledClick?.();
      return;
    }
    inputRef.current?.click();
  };

  return (
    <div
      className="border-[1.5px] bg-(--ai-surface) border-(--secondary-color) border-dashed rounded-xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-colors hover:border-accent"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (disabled) {
          onDisabledClick?.();
          return;
        }
        handleFileList(e.dataTransfer.files);
      }}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        hidden
        accept=".pdf,.mp4,.png,.jpg,.jpeg"
        multiple
        onChange={(e) => handleFileList(e.target.files)}
      />

      <SVGIcon name="upload" size={40} strokeWidth={1.5} />
      <div className="text-center">
        <h3 className="text-xl font-bold text-primary mb-1.5">
          What are we mastering today?
        </h3>
        <p className="text-sm mx-auto">
          Drag and drop your PDFs, documents, or lecture videos here, or click
          to browse
        </p>
      </div>

      <div className="flex items-center justify-center gap-4">
        <FileBadge icon="🖼️" label="PNG-JPG" />
        <FileBadge icon="📄" label="PDF" />
        <FileBadge icon="🎬" label="MP4" />
      </div>
      <span className="pl-3">Max 500 MB</span>

      <button
        className="bg-primary text-white rounded-full px-7 py-2.5 text-sm font-semibold hover:bg-primary-hover transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
      >
        Choose Files
      </button>
    </div>
  );
}
