import React from "react";
import SVGIcon from "./SVGIcon";

export type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel?: () => void;
};

function ConfirmModal(props: ConfirmModalProps) {
  if (props.isOpen === false) {
    return null;
  }

  const variant = props.variant ?? "danger";

  const confirmBtnClass =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-yellow-500 hover:bg-yellow-600 text-white";

  const iconBgClass = variant === "danger" ? "bg-red-100" : "bg-yellow-100";

  const iconColor = variant === "danger" ? "#dc2626" : "#d97706";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={props.onCancel}
    >
      <div
        className="bg-(--ai-surface) opacity-100 rounded-2xl p-8 w-full max-w-sm mx-4 flex flex-col items-center gap-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center ${iconBgClass}`}
        >
          <SVGIcon name="trash" size={28} color={iconColor} />
        </div>

        {/* Text */}
        <div className="text-center">
          <h2 className="text-lg font-bold text-primary mb-1.5">
            {props.title}
          </h2>
          <p className="text-sm leading-relaxed opacity-80">{props.message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            className="flex-1 rounded-full py-2.5 text-sm font-semibold border border-(--secondary-color) hover:bg-gray-100 transition-colors"
            onClick={props.onCancel}
          >
            {props.cancelLabel ?? "Cancel"}
          </button>
          <button
            className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors ${confirmBtnClass}`}
            onClick={props.onConfirm}
          >
            {props.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
