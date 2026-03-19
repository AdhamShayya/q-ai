import React from "react";
import SVGIcon from "./SVGIcon";

export type DuplicateVaultModalProps = {
  vaultName: string;
  isAppending: boolean;
  onChangeName: () => void;
  onAppend: () => void;
};

export default function DuplicateVaultModal({
  vaultName,
  isAppending,
  onChangeName,
  onAppend,
}: DuplicateVaultModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => !isAppending && onChangeName()}
    >
      <div
        className="bg-(--ai-surface) rounded-2xl p-8 w-full max-w-sm mx-4 flex flex-col items-center gap-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-yellow-100">
          <SVGIcon name="folder" size={28} color="#d97706" />
        </div>

        <div className="text-center">
          <h2 className="text-lg font-bold text-primary mb-1.5">
            Vault Name Already Exists
          </h2>
          <p className="text-sm leading-relaxed opacity-80">
            A vault named{" "}
            <span className="font-semibold">&ldquo;{vaultName}&rdquo;</span>{" "}
            already exists. Would you like to change the name or append the
            files to the existing vault?
          </p>
        </div>

        <div className="flex gap-3 w-full">
          <button
            disabled={isAppending}
            className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onChangeName}
          >
            Change Name
          </button>
          <button
            disabled={isAppending}
            className="flex-1 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            onClick={onAppend}
          >
            {isAppending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Uploading…
              </>
            ) : (
              "Append Files"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
