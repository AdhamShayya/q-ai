import _ from "lodash";
import SVGIcon from "./SVGIcon";
import type { IDocumentSchema } from "@src/db/schemas/Document.schema";
import { formatFileSize, getDocumentIcon, Serialised } from "../shared";

interface DocumentCardProps {
  doc: Serialised<IDocumentSchema>;
  courseLabel: string;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function DocumentCard(props: DocumentCardProps) {
  const { doc, courseLabel, onDelete, isDeleting } = props;
  const meta = doc.metadataJson as {
    inputType?: string;
    courseVault?: string;
  } | null;
  const inputType = meta?.inputType ?? "file";

  return (
    <div className="border-[1.5px] border-(--secondary-color) rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="h-36 flex items-center justify-center text-4xl select-none border-b border-(--secondary-color) bg-(--bg-card)">
        {getDocumentIcon(inputType)}
      </div>

      <div className="px-4 py-3 space-y-1.5 bg-white">
        <p className="text-sm font-medium leading-snug truncate flex justify-between items-center">
          {_.truncate(doc.filename, { length: 24 })}
          <div
            onClick={(e) => {
              if (isDeleting === true) {
                return;
              }
              e.stopPropagation();
              onDelete?.();
            }}
            style={{
              cursor: isDeleting ? "default" : "pointer",
              flexShrink: 0,
            }}
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
            ) : (
              <SVGIcon name="trash" size={16} color="red" />
            )}
          </div>
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold py-0.5 rounded-sm uppercase">
            {doc.fileType}
          </span>
          <span className="text-xs">{formatFileSize(doc.fileSize)}</span>
        </div>
        <p className="text-xs opacity-70 truncate">
          {meta?.courseVault ?? courseLabel}
        </p>
      </div>
    </div>
  );
}
