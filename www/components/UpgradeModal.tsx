import React from "react";
import SVGIcon from "./SVGIcon";
import { USAGE_LIMITS } from "../pages/dashboard";

function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--ai-bg)",
        }}
        className="rounded-2xl p-10 w-fit mx-4 opacity-100 flex flex-col items-center gap-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
          <SVGIcon name="lock" size={32} className="text-accent" />
        </div>

        {/* Copy */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-primary mb-2">
            Free Trial Limit Reached
          </h2>
          <p className="text-sm leading-relaxed">
            You've used all
            <span className="font-semibold">
              {USAGE_LIMITS.studyMaterials.max} study materials
            </span>
            {""}
            included in your free plan. Upgrade to Pro for unlimited uploads, AI
            conversations, and more.
          </p>
        </div>

        {/* Progress bar at limit */}
        <div className="w-full">
          <div className="flex justify-between text-xs mb-1.5">
            <span>Study Materials</span>
            <span>
              {USAGE_LIMITS.studyMaterials.max} /{""}
              {USAGE_LIMITS.studyMaterials.max}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden">
            <div className="h-full w-full bg-red-500 rounded-full" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <button
            className="w-full bg-green-600 text-white rounded-full py-3 text-sm font-semibold hover:bg-green-700 transition-colors"
            onClick={onClose}
          >
            Upgrade to Pro
          </button>
          <button
            className="w-full bg- text-sm transition-colors"
            onClick={onClose}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpgradeModal;
