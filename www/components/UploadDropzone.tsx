import { useRef } from "react";
import SVGIcon from "./SVGIcon";

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
  const { onFiles, disabled, onDisabledClick } = props;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileList = (list: FileList | null) => {
    if (list?.[0] == null) {
      return;
    }
    onFiles(Array.from(list));
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
      className="border-[1.5px] bg-white border-(--secondary-color) border-dashed rounded-xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-colors hover:border-accent"
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
        accept=".pdf,.docx,.mp4,.png,.jpg,.jpeg"
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
        <FileBadge icon="📄" label="PNG" />
        <FileBadge icon="📝" label="PDF" />
        <FileBadge icon="🎬" label="MP4" />
        <span className="pl-3 border-l">Max 500 MB</span>
      </div>

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
