import { useLoaderData } from "react-router";
import React, { useEffect, useState } from "react";

import SVGIcon from "../../components/SVGIcon";
import { UploadForm } from "../../components/UploadForm";
import UpgradeModal from "../../components/UpgradeModal";
import { PendingUpload, Serialised } from "../../shared";
import { DocumentCard } from "../../components/DocumentCard";
import { UploadDropzone } from "../../components/UploadDropzone";
import type { IVaultSchema } from "@src/db/schemas/Vault.schema";
import { AddDocumentCard } from "../../components/AddDocumentCard";
import DuplicateVaultModal from "../../components/DuplicateVaultModal";
import type { IDocumentSchema } from "@src/db/schemas/Document.schema";
import { vaultApi, userApi, personaApi, invalidateCache } from "../../trpc";
import ConfirmModal, { ConfirmModalProps } from "../../components/ConfirmModal";

// backend
export async function loader() {
  const [user, persona] = await Promise.all([
    userApi.me.query(),
    personaApi.get.query().catch(() => null),
  ]);
  if (user == null) return Response.redirect("/sign-in");
  if (persona == null) return Response.redirect("/onboarding");
  const vaults = await vaultApi.listByUser.query({ userId: user.id });
  return { userId: user.id, vaults };
}

export const USAGE_LIMITS = {
  plan: "Free Plan",
  studyMaterials: { max: 26 },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface VaultWithDocuments {
  vault: Serialised<IVaultSchema>;
  documents: Serialised<IDocumentSchema>[];
}

const BACKEND_URL = import.meta.env.PROD ? "" : "http://localhost:4000";

// ── Storage upload ────────────────────────────────────────────────────────────
async function uploadFileToStorage(props: { file: File; vaultId: string }) {
  const { file, vaultId } = props;
  const form = new FormData();
  form.append("file", file);
  form.append("vaultId", vaultId);
  form.append("filename", file.name);

  const res = await fetch(`${BACKEND_URL}/upload`, {
    method: "POST",
    credentials: "include",
    body: form,
  });

  if (res.ok === false) {
    const { error } = (await res
      .json()
      .catch(() => ({ error: "Upload failed" }))) as {
      error: string;
    };
    throw new Error(error);
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
  const [duplicateVaultModal, setDuplicateVaultModal] = useState<{
    vaultId: string;
    vaultName: string;
    courseName: string;
  } | null>(null);
  const [isAppending, setIsAppending] = useState(false);
  const allDocuments = vaultData?.flatMap((v) => v.documents) ?? [];

  async function loadDocuments(silent = false) {
    if (silent === false) {
      setDocsLoading(true);
    }
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
      if (silent === false) {
        setDocsLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadDocuments();
  }, []);
  // todo - fix the pulling logic
  // currently it only polls when there's at least 1 doc in pending/processing,
  // but if the user uploads a new vault with 3 docs, then all 3 will be pending but only the first one will trigger the polling, so when it finishes processing and moves to the next doc, \
  // the UI won't know to poll again.
  // Maybe we can add a "processingCount" field to the vault query that returns how many docs are still pending/processing,
  // and use that as the trigger for polling instead of checking the individual doc statuses?

  // Poll every 4 s while any document is still being processed
  useEffect(() => {
    const allDocs = vaultData?.flatMap((v) => v.documents) ?? [];
    const hasProcessing = allDocs.some(
      (d) =>
        d.processingStatus === "pending" || d.processingStatus === "processing",
    );
    if (hasProcessing === false) {
      return;
    }

    const timer = setTimeout(async () => {
      invalidateCache("vault.getDocuments:", "vault.listByUser:");
      await loadDocuments(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, [vaultData]);

  const items = [
    {
      label: "Study Materials",
      used: allDocuments.length,
      max: USAGE_LIMITS.studyMaterials.max,
    },
  ];

  async function handleUpload(vaultName: string, courseName: string) {
    if (pendingUpload == null) {
      return;
    }

    // Check for duplicate vault name (case-insensitive)
    const existingVault = vaultData?.find(
      (v) => v.vault.name.toLowerCase() === vaultName.toLowerCase(),
    );
    if (existingVault != null) {
      setDuplicateVaultModal({
        vaultId: existingVault.vault.id,
        vaultName: existingVault.vault.name,
        courseName: existingVault.vault.courseName ?? courseName,
      });
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
      // 1️⃣ Upload each file to Supabase Storage
      await Promise.all(
        pendingUpload.files.map((file) =>
          uploadFileToStorage({ file, vaultId: vault.id }),
        ),
      );
      // 2️⃣ Create DB records + atomically enqueue ingestion jobs
      await Promise.all(
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
      // 1️⃣ Upload each file to Supabase Storage
      await Promise.all(
        files.map((file) => uploadFileToStorage({ file, vaultId })),
      );
      // 2️⃣ Create DB records + atomically enqueue ingestion jobs
      await Promise.all(
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
    <main className="flex flex-col  w-full py-4">
      <h3 className="container">Knowledge Vault</h3>
      <p className="container pt-2 mb-6">
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

      {duplicateVaultModal != null && (
        <DuplicateVaultModal
          vaultName={duplicateVaultModal.vaultName}
          isAppending={isAppending}
          onChangeName={() => !isAppending && setDuplicateVaultModal(null)}
          onAppend={async () => {
            const { vaultId, courseName } = duplicateVaultModal;
            setIsAppending(true);
            try {
              await handleAddToVault(vaultId, pendingUpload!.files, courseName);
              setPendingUpload(null);
              setDuplicateVaultModal(null);
            } finally {
              setIsAppending(false);
            }
          }}
        />
      )}

      {/* Upload zone */}
      <div className="mb-10 py-10 space-y-4 container">
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
      <div className="relative md:container flex flex-col-reverse md:flex-row gap-8 items-start">
        <div className="flex-4 min-w-0 w-full">
          <h5 className="max-md:container text-lg font-bold text-primary mb-4">
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

              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-themed">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="container flex flex-col shrink-0 w-52 border-[1.5px] rounded-lg overflow-hidden p-0"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <div
                      className="h-28 w-full"
                      style={{ background: "transparent" }}
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
            <p className="container text-sm">
              No materials yet. Upload your first file above to get started.
            </p>
          ) : (
            <div className="space-y-8 max-h-[600px] overflow-y-auto scrollbar-themed pr-2">
              {vaultData!.map(({ vault, documents }) => (
                <div key={vault.id}>
                  <div className="max-md:container flex items-center gap-2 mb-3">
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
                  <div className="relative">
                    {/* Right fade — shows overflow hint */}
                    <div
                      className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 z-10"
                      style={{
                        background:
                          "linear-gradient(to right, transparent, var(--color-bg))",
                      }}
                    />
                    <div className="flex gap-4 overflow-x-auto py-2 scrollbar-themed max-md:pl-6">
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
                </div>
              ))}
            </div>
          )}
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 z-10"
            style={{
              background:
                "linear-gradient(to bottom, transparent, var(--color-bg))",
            }}
          />
        </div>
        <div className="max-md:container flex flex-col w-full md:flex-2">
          <div className=" border border-(--secondary-color) bg-(--ai-surface) rounded-lg p-8">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-primary">Usage Metrics</h4>
              <span className="text-[12px] font-medium px-2 py-0.5 rounded-full border">
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
      </div>
    </main>
  );
}

export default DashboardPage;
