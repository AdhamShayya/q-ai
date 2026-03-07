import { useRef } from "react";

interface AddDocumentCardProps {
  onFiles: (files: File[]) => void;
  isUploading?: boolean;
}

export function AddDocumentCard(props: AddDocumentCardProps) {
  const { onFiles, isUploading } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  return (
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
        accept=".pdf,.docx,.mp4,.png,.jpg,.jpeg"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
      <div
        className="h-full flex w-full items-center justify-center border-b min-h-50 min-w-50"
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
  );
}
