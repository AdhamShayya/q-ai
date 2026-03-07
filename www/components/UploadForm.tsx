// ── Upload Form ───────────────────────────────────────────────────────────────

import { useState } from "react";
import {
  formatFileSize,
  getDocumentIcon,
  getInputType,
  PendingUpload,
} from "../shared";

interface UploadFormProps {
  pending: PendingUpload;
  isUploading: boolean;
  onSubmit: (vaultName: string, courseName: string) => void;
  onCancel: () => void;
}
// ── Helpers ───────────────────────────────────────────────────────────────────

export function UploadForm({
  pending,
  isUploading,
  onSubmit,
  onCancel,
}: UploadFormProps) {
  const [vaultName, setVaultName] = useState("");
  const [courseName, setCourseName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultName.trim()) return;
    onSubmit(vaultName.trim(), courseName.trim() || vaultName.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-[1.5px] border-accent rounded-xl p-8 flex flex-col gap-5"
    >
      <div>
        <h3 className="text-lg font-bold text-primary mb-1">Upload to Vault</h3>
        <p className="text-sm">
          {pending.files.length} file{pending.files.length !== 1 ? "s" : ""}
          ready — add vault details to continue.
        </p>
      </div>

      {/* File list preview */}
      <ul className="text-sm space-y-1.5 max-h-32 overflow-y-auto">
        {pending.files.map((f) => (
          <li key={f.name} className="flex items-center gap-2">
            <span>{getDocumentIcon(getInputType(f))}</span>
            <span className="truncate">{f.name}</span>
            <span className="ml-auto shrink-0 text-xs opacity-60">
              {formatFileSize(f.size)}
            </span>
          </li>
        ))}
      </ul>

      {/* Vault metadata inputs */}
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide">
            Vault Name *
          </span>
          <input
            required
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            placeholder="e.g. Physics"
            value={vaultName}
            onChange={(e) => setVaultName(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide">
            Course / Topic
          </span>
          <input
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            placeholder="e.g. Quantum Mechanics"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
          />
        </label>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isUploading || !vaultName.trim()}
          className="bg-primary text-white rounded-full px-7 py-2.5 text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? "Uploading…" : "Upload to Vault"}
        </button>
        <button
          type="button"
          disabled={isUploading}
          onClick={onCancel}
          className="text-sm transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
