import React from "react";
import SVGIcon from "./SVGIcon";
import { PLAN_LIMITS } from "../pages/dashboard";

function UpgradeModal({
  onClose,
  onUpgrade,
}: {
  onClose: () => void;
  onUpgrade?: () => void;
}) {
  const freeMax = PLAN_LIMITS.free.docs;
  const premiumMax = PLAN_LIMITS.premium.docs;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: "var(--ai-bg)" }}
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
            Free Plan Limit Reached
          </h2>
          <p className="text-sm leading-relaxed">
            You've used all{" "}
            <span className="font-semibold">{freeMax} documents</span> included
            in the free plan. Upgrade to Premium for {premiumMax} documents,
            unlimited AI chats, and more.
          </p>
        </div>

        {/* Progress bar at limit */}
        <div className="w-full">
          <div className="flex justify-between text-xs mb-1.5">
            <span>Study Materials</span>
            <span>
              {freeMax} / {freeMax}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden">
            <div className="h-full w-full bg-red-500 rounded-full" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <button
            className="w-full rounded-full py-3 text-sm font-semibold transition-colors"
            style={{ background: "#b8893a", color: "#fff" }}
            onClick={onUpgrade ?? onClose}
          >
            Upgrade to Premium — $24.99/mo
          </button>
          <button
            className="w-full text-sm transition-colors"
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
