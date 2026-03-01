import React, { useEffect, useRef, useState } from "react";
import { useLoaderData } from "react-router";
import _ from "lodash";
import Navbar from "../components/Navbar";
import SVGIcon from "../components/SVGIcon";
import { vaultApi, userApi } from "../trpc";
import { UploadForm } from "../components/UploadForm";
import UpgradeModal from "../components/UpgradeModal";
import type { IVaultSchema } from "@src/db/schemas/Vault.schema";
import type { IDocumentSchema } from "@src/db/schemas/Document.schema";

import {
  formatFileSize,
  getDocumentIcon,
  PendingUpload,
  Serialised,
} from "../shared";

// backend
export async function loader() {
  const user = await userApi.ensureUser.mutate({
    email: DEMO_EMAIL,
    name: DEMO_NAME,
  });
  const vaults = await vaultApi.listByUser.query({ userId: user.id });
  return { userId: user.id, vaults };
}

// Temporary demo identity — replaced by real auth session later
const DEMO_NAME = "Demo User";
const DEMO_EMAIL = "demo@q-ai.app";

const USAGE_LIMITS = {
  plan: "Free Plan",
  studyMaterials: { max: 5 },
  aiConversations: { used: 7, max: 10 },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface VaultWithDocuments {
  vault: Serialised<IVaultSchema>;
  documents: Serialised<IDocumentSchema>[];
}

const Upload_Webhook_API =
  "https://techflow12.app.n8n.cloud/webhook-test/q-ai/ingest";

// ── Webhook helper ────────────────────────────────────────────────────────────

async function sendFileToWebhook({
  file,
  userId,
  vaultId,
  documentId,
}: {
  file: File;
  userId: string;
  vaultId: string;
  documentId: string;
}) {
  const form = new FormData();
  form.append("file", file);
  form.append("userId", userId);
  form.append("vaultId", vaultId);
  form.append("documentId", documentId);
  form.append("filename", file.name);
  form.append("mimeType", file.type ?? "application/octet-stream");
  try {
    console.log("Sending file to webhook:", file.name, {
      userId,
      vaultId,
      documentId,
    });
    await fetch(Upload_Webhook_API, { method: "POST", body: form });
    console.log("sent file to webhook:", file.name, {
      userId,
      vaultId,
      documentId,
    });
  } catch (err) {
    console.error("Webhook ingest failed for", file.name, err);
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FileBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-start gap-1 font-medium">
      <span>{icon}</span>
      {label}
    </div>
  );
}

function ProgressBar({ used, max }: { used: number; max: number }) {
  const pct = Math.round((Math.min(used, max) / max) * 100);
  return (
    <div className="h-2 rounded-full overflow-hidden">
      <div
        className="h-full bg-accent rounded-full transition-[width] duration-600"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Upload Dropzone ───────────────────────────────────────────────────────────

function UploadDropzone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileList = (list: FileList | null) => {
    if (list?.[0] == null) {
      return;
    }
    onFiles(Array.from(list));
  };

  return (
    <div
      className="border-[1.5px] bg-white border-(--secondary-color) border-dashed rounded-xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-colors hover:border-accent"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFileList(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
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
        <FileBadge icon="📄" label="PDF" />
        <FileBadge icon="📝" label="DOCX" />
        <FileBadge icon="🎬" label="MP4" />
        <span className="pl-3 border-l">Max 500 MB</span>
      </div>

      <button
        className="bg-primary text-white rounded-full px-7 py-2.5 text-sm font-semibold hover:bg-primary-hover transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
      >
        Choose Files
      </button>
    </div>
  );
}

function AddDocumentCard({
  onFiles,
  isUploading,
}: {
  onFiles: (files: File[]) => void;
  isUploading?: boolean;
}) {
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
        className="h-full flex w-full items-center justify-center border-b"
        style={{
          borderColor: "var(--color-border)",
        }}
      >
        {isUploading ? (
          <div className="w-7 h-7 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
        ) : (
          <p className="text-[26px] text-(--secondary-color)">+</p>
        )}
      </div>
    </div>
  );
}

function DocumentCard({
  doc,
  courseLabel,
  onDelete,
  isDeleting,
}: {
  doc: Serialised<IDocumentSchema>;
  courseLabel: string;
  onDelete?: () => void;
  isDeleting?: boolean;
}) {
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
              if (isDeleting) return;
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
          <span className="text-xs font-semibold px-2 py-0.5 rounded-sm uppercase">
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

// ── Page ────────────────────────────────────────────────────────────────────

function HomePage() {
  const { userId, vaults } = useLoaderData<typeof loader>();
  const [docsLoading, setDocsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [vaultData, setVaultData] = useState<VaultWithDocuments[] | null>(null);
  const [uploadingVaultIds, setUploadingVaultIds] = useState<Set<string>>(
    new Set(),
  );
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(
    null,
  );

  async function loadDocuments() {
    setDocsLoading(true);
    try {
      const withDocs = await Promise.all(
        vaults.map(async (vault) => ({
          vault,
          documents: await vaultApi.getDocuments.query({ vaultId: vault.id }),
        })),
      );
      setVaultData(withDocs);
    } finally {
      setDocsLoading(false);
    }
  }

  useEffect(() => {
    void loadDocuments();
  }, []);

  const allDocuments = vaultData?.flatMap((v) => v.documents) ?? [];

  const items = [
    {
      label: "Study Materials",
      used: allDocuments.length,
      max: USAGE_LIMITS.studyMaterials.max,
    },
    {
      label: "AI Conversations",
      used: USAGE_LIMITS.aiConversations.used,
      max: USAGE_LIMITS.aiConversations.max,
    },
  ];

  async function handleUpload(vaultName: string, courseName: string) {
    if (pendingUpload == null) {
      return;
    }

    if (allDocuments.length >= USAGE_LIMITS.studyMaterials.max) {
      setPendingUpload(null);
      setShowUpgradeModal(true);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const vault = await vaultApi.create.mutate({
        userId,
        name: vaultName,
        courseName,
      });
      // 1️⃣ Save every document record to the DB
      const savedDocs = await Promise.all(
        pendingUpload.files.map((file) =>
          vaultApi.addDocument.mutate({
            vaultId: vault.id,
            filename: file.name,
            fileType: file.name.split(".").pop()?.toUpperCase() ?? "FILE",
            fileSize: file.size,
            mimeType: file.type || undefined,
            courseVault: courseName,
          }),
        ),
      );
      // 2️⃣ Forward each file to the ingest webhook (fire-and-forget per file)
      await Promise.allSettled(
        pendingUpload.files.map((file, i) =>
          sendFileToWebhook({
            file,
            userId,
            vaultId: vault.id,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            documentId: savedDocs[i]!.id,
          }),
        ),
      );
      setPendingUpload(null);
      await loadDocuments();
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleAddToVault(
    vaultId: string,
    files: File[],
    courseName: string,
  ) {
    if (allDocuments.length >= USAGE_LIMITS.studyMaterials.max) {
      setShowUpgradeModal(true);
      return;
    }
    setUploadingVaultIds((prev) => new Set(prev).add(vaultId));
    try {
      // 1️⃣ Save document records to the DB
      const savedDocs = await Promise.all(
        files.map((file) =>
          vaultApi.addDocument.mutate({
            vaultId,
            filename: file.name,
            fileType: file.name.split(".").pop()?.toUpperCase() ?? "FILE",
            fileSize: file.size,
            mimeType: file.type || undefined,
            courseVault: courseName,
          }),
        ),
      );
      // 2️⃣ Forward each file to the ingest webhook
      await Promise.allSettled(
        files.map((file, i) =>
          sendFileToWebhook({
            file,
            userId,
            vaultId,
            documentId: savedDocs[i]!.id,
          }),
        ),
      );
      await loadDocuments();
    } catch (err) {
      console.error("Add to vault failed:", err);
    } finally {
      setUploadingVaultIds((prev) => {
        const next = new Set(prev);
        next.delete(vaultId);
        return next;
      });
    }
  }

  async function handleDelete(docId: string) {
    setDeletingIds((prev) => new Set(prev).add(docId));
    try {
      await vaultApi.deleteDocument.mutate({ id: docId });
      setVaultData(
        (prev) =>
          prev?.map((v) => ({
            ...v,
            documents: v.documents.filter((d) => d.id !== docId),
          })) ?? null,
      );
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex flex-col container w-full py-10">
        <h3>Knowledge Vault</h3>
        <p className="pt-2 mb-6">
          Your personal library of study materials, powered by AI
        </p>

        {showUpgradeModal && (
          <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
        )}

        {/* Upload zone */}
        <div className="mb-10 py-10 space-y-4">
          {pendingUpload == null ? (
            <UploadDropzone
              onFiles={(files) => {
                if (allDocuments.length >= USAGE_LIMITS.studyMaterials.max) {
                  setShowUpgradeModal(true);
                  return;
                }
                setPendingUpload({ files });
              }}
            />
          ) : (
            <UploadForm
              pending={pendingUpload}
              isUploading={isUploading}
              onSubmit={handleUpload}
              onCancel={() => setPendingUpload(null)}
            />
          )}
          {uploadError != null && (
            <p className="text-sm text-red-500 text-center">{uploadError}</p>
          )}
        </div>

        {/* Vault content */}
        <div className="grid grid-cols-[1fr_auto] gap-8 items-start">
          <div>
            <h5 className="text-lg font-bold text-primary mb-4">
              Your Materials ({allDocuments.length})
            </h5>

            {docsLoading ? (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="shrink-0 w-52 border-[1.5px] rounded-lg overflow-hidden animate-pulse"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <div
                      className="h-36"
                      style={{ background: "var(--color-bg-muted)" }}
                    />
                    <div className="px-4 py-3 space-y-2 bg-white">
                      <div
                        className="h-3 rounded w-3/4"
                        style={{ background: "var(--color-bg-muted)" }}
                      />
                      <div
                        className="h-3 rounded w-1/2"
                        style={{ background: "var(--color-bg-muted)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : allDocuments.length === 0 ? (
              <p className="text-sm">
                No materials yet. Upload your first file above to get started.
              </p>
            ) : (
              <div className="space-y-8">
                {vaultData!.map(({ vault, documents }) =>
                  documents.length === 0 ? null : (
                    <div key={vault.id}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-base font-semibold">
                          {vault.name}
                        </span>
                        {vault.courseName != null && (
                          <span className="text-xs px-2 py-0.5 rounded-full border">
                            {vault.courseName}
                          </span>
                        )}
                        <span className="text-xs ml-auto">
                          {documents.length} file
                          {documents.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex gap-4 overflow-x-auto p-2">
                        {documents.map((doc) => (
                          <div key={doc.id} className="shrink-0 w-52">
                            <DocumentCard
                              doc={doc}
                              courseLabel={vault.courseName ?? vault.name}
                              isDeleting={deletingIds.has(doc.id)}
                              onDelete={() => handleDelete(doc.id)}
                            />
                          </div>
                        ))}
                        <div className="flex shrink-0 w-52">
                          <AddDocumentCard
                            isUploading={uploadingVaultIds.has(vault.id)}
                            onFiles={(files) =>
                              handleAddToVault(
                                vault.id,
                                files,
                                vault.courseName ?? vault.name,
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
          <div className="border border-(--secondary-color) bg-white rounded-lg p-8 min-w-100">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-primary">Usage Metrics</h4>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border">
                {USAGE_LIMITS.plan}
              </span>
            </div>

            {items.map(({ label, used, max }) => {
              const pct = Math.round((Math.min(used, max) / max) * 100);
              return (
                <div key={label} className="mb-3.5 last:mb-0">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs">{label}</span>
                    <span className="text-xs">
                      {used} / {max}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-[width] duration-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>{" "}
        </div>
      </main>
    </div>
  );
}

export default HomePage;
