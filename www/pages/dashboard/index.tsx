import { useLoaderData } from "react-router";
import React, { useEffect, useState } from "react";

import SVGIcon from "../../components/SVGIcon";
import { vaultApi, userApi, personaApi } from "../../trpc";
import { UploadForm } from "../../components/UploadForm";
import UpgradeModal from "../../components/UpgradeModal";
import { PendingUpload, Serialised } from "../../shared";
import { DocumentCard } from "../../components/DocumentCard";
import { UploadDropzone } from "../../components/UploadDropzone";
import type { IVaultSchema } from "@src/db/schemas/Vault.schema";
import { AddDocumentCard } from "../../components/AddDocumentCard";
import type { IDocumentSchema } from "@src/db/schemas/Document.schema";
import ConfirmModal, { ConfirmModalProps } from "../../components/ConfirmModal";

// backend
export async function loader() {
  const user = await userApi.me.query();
  if (user == null) return Response.redirect("/sign-in");
  const persona = await personaApi.get.query().catch(() => null);
  if (persona == null) return Response.redirect("/onboarding");
  const vaults = await vaultApi.listByUser.query({ userId: user.id });
  return { userId: user.id, vaults };
}

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
async function sendFileToWebhook(props: {
  file: File;
  userId: string;
  vaultId: string;
  documentId: string;
}) {
  const { file, userId, vaultId, documentId } = props;
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

// ── Page ────────────────────────────────────────────────────────────────────

function DashboardPage() {
  const [docsLoading, setDocsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { userId, vaults } = useLoaderData<typeof loader>();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [vaultData, setVaultData] = useState<VaultWithDocuments[] | null>(null);

  const [deletingVaultIds, setDeletingVaultIds] = useState<Set<string>>(
    new Set(),
  );

  const [confirmModal, setConfirmModal] = useState<ConfirmModalProps>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  function openConfirmModal(opts: Omit<ConfirmModalProps, "isOpen">) {
    setConfirmModal({ isOpen: true, ...opts });
  }

  function closeConfirmModal() {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  }
  const [uploadingVaultIds, setUploadingVaultIds] = useState<Set<string>>(
    new Set(),
  );
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(
    null,
  );
  const allDocuments = vaultData?.flatMap((v) => v.documents) ?? [];

  async function loadDocuments() {
    setDocsLoading(true);
    try {
      const latestVaults = await vaultApi.listByUser.query({ userId });
      const withDocs = await Promise.all(
        latestVaults.map(async (vault) => ({
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

    if (
      allDocuments.length + pendingUpload.files.length >
      USAGE_LIMITS.studyMaterials.max
    ) {
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
            courseVault: courseName || vaultName,
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
    if (allDocuments.length + files.length > USAGE_LIMITS.studyMaterials.max) {
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
            mimeType: file.type ?? undefined,
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

  function requestDeleteDocument(docId: string, docName: string) {
    openConfirmModal({
      title: "Delete Document",
      message: `Are you sure you want to delete "${docName}"? This cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: () => {
        closeConfirmModal();
        void handleDelete(docId);
      },
    });
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

  function requestDeleteVault(vaultId: string, vaultName: string) {
    openConfirmModal({
      title: "Delete Vault",
      message: `Are you sure you want to delete "${vaultName}" and all its documents? This cannot be undone.`,
      confirmLabel: "Delete Vault",
      onConfirm: () => {
        closeConfirmModal();
        void handleDeleteVault(vaultId);
      },
    });
  }

  async function handleDeleteVault(vaultId: string) {
    setDeletingVaultIds((prev) => new Set(prev).add(vaultId));
    try {
      await vaultApi.delete.mutate({ id: vaultId });
      setVaultData(
        (prev) => prev?.filter((v) => v.vault.id !== vaultId) ?? null,
      );
    } finally {
      setDeletingVaultIds((prev) => {
        const next = new Set(prev);
        next.delete(vaultId);
        return next;
      });
    }
  }

  return (
    <main className="flex flex-col container w-full py-4">
      <h3>Knowledge Vault</h3>
      <p className="pt-2 mb-6">
        Your personal library of study materials, powered by AI
      </p>

      {showUpgradeModal === true && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />

      {/* Upload zone */}
      <div className="mb-10 py-10 space-y-4">
        {pendingUpload == null ? (
          <UploadDropzone
            disabled={allDocuments.length >= USAGE_LIMITS.studyMaterials.max}
            onDisabledClick={() => setShowUpgradeModal(true)}
            onFiles={(files) => {
              if (
                allDocuments.length + files.length >
                USAGE_LIMITS.studyMaterials.max
              ) {
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
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <div
                  className="h-5 rounded w-14"
                  style={{ background: "var(--color-bg-muted)" }}
                />
                <div
                  className="h-5 rounded-full w-20"
                  style={{ background: "var(--color-bg-muted)" }}
                />
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="shrink-0 w-52 border-[1.5px] rounded-lg overflow-hidden animate-pulse"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <div
                      className="h-38"
                      style={{ background: "var(--color-bg-muted)" }}
                    />
                    <div className="px-4 py-8 space-y-2 bg-(--ai-surface)">
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
            </div>
          ) : vaultData!.length === 0 ? (
            <p className="text-sm">
              No materials yet. Upload your first file above to get started.
            </p>
          ) : (
            <div className="space-y-8">
              {vaultData!.map(({ vault, documents }) => (
                <div key={vault.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base font-semibold">
                      {vault.name}
                    </span>
                    {vault.courseName?.[0] != null && (
                      <span className="text-xs px-2 py-0.5 rounded-full border">
                        {vault.courseName}
                      </span>
                    )}
                    <span className="text-xs ml-auto">
                      {documents.length} file
                      {documents.length !== 1 ? "s" : ""}
                    </span>
                    <div
                      onClick={() =>
                        !deletingVaultIds.has(vault.id) &&
                        requestDeleteVault(vault.id, vault.name)
                      }
                      style={{
                        cursor: deletingVaultIds.has(vault.id)
                          ? "default"
                          : "pointer",
                      }}
                    >
                      {deletingVaultIds.has(vault.id) ? (
                        <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                      ) : (
                        <SVGIcon name="trash" size={16} color="red" />
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4 max-w-240 overflow-x-auto py-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="shrink-0 w-52">
                        <DocumentCard
                          doc={doc}
                          courseLabel={vault.courseName ?? vault.name}
                          isDeleting={deletingIds.has(doc.id)}
                          onDelete={() =>
                            requestDeleteDocument(doc.id, doc.filename)
                          }
                        />
                      </div>
                    ))}
                    <div className="flex shrink-0 ">
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
              ))}
            </div>
          )}
        </div>
        <div className="border border-(--secondary-color) bg-(--ai-surface) rounded-lg p-8 min-w-100">
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
                    className="h-full bg-info rounded-full transition-[width] duration-600"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>{" "}
      </div>
    </main>
  );
}

export default DashboardPage;
