import React, { useEffect, useRef, useState } from "react";
import SVGIcon from "./SVGIcon";
import { paymentApi, invalidateCache } from "../trpc";

type Step = "idle" | "loading" | "waiting" | "success" | "error";

interface PaymentModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function PaymentModal({ userId, onClose, onSuccess }: PaymentModalProps) {
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (pollRef.current != null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => () => stopPolling(), []);

  async function handleStart() {
    setStep("loading");
    setError(null);

    try {
      const { sessionId, link } = await paymentApi.createSession.mutate({
        userId,
      });
      sessionIdRef.current = sessionId;

      // Open the hosted payment page in a new tab
      window.open(link, "_blank", "noopener,noreferrer");
      setStep("waiting");

      // Poll every 4 s for up to 10 minutes
      let elapsed = 0;
      pollRef.current = setInterval(async () => {
        elapsed += 4000;
        if (elapsed > 10 * 60 * 1000) {
          stopPolling();
          setError(
            "Payment timed out. If you completed the payment, please refresh the page.",
          );
          setStep("error");
          return;
        }

        try {
          // Bypass the cache so every poll is a fresh request
          invalidateCache(`payment.getSessionStatus:${sessionId}`);
          const { status } = await paymentApi.getSessionStatus.query({
            sessionId,
          });

          if (status === "COMPLETED") {
            stopPolling();
            await paymentApi.confirmUpgrade.mutate({ sessionId });
            setStep("success");
            onSuccess();
          }
        } catch {
          // Silently ignore transient poll errors
        }
      }, 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      setStep("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      onClick={step === "waiting" ? undefined : onClose}
    >
      <div
        className="rounded-2xl p-8 w-full max-w-sm mx-4 flex flex-col items-center gap-6 shadow-2xl"
        style={{ backgroundColor: "var(--ai-bg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(212,168,67,0.15)" }}
        >
          <SVGIcon name="zap" size={32} color="#b8893a" />
        </div>

        {/* Content */}
        {step !== "success" ? (
          <>
            <div className="text-center">
              <h2 className="text-xl font-bold text-primary mb-1">
                Upgrade to Premium
              </h2>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Unlock <strong>30 documents</strong> and{" "}
                <strong>unlimited AI chats</strong> for $24.99/mo.
              </p>
            </div>

            {/* Plan comparison */}
            <div className="w-full space-y-2 text-sm">
              {[
                { label: "Documents", free: "3", premium: "30" },
                { label: "AI Chats", free: "10", premium: "Unlimited" },
              ].map(({ label, free, premium }) => (
                <div
                  key={label}
                  className="grid grid-cols-3 px-3 py-2 rounded-lg text-center"
                  style={{
                    background: "rgba(139,158,108,0.07)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <span
                    className="text-left text-xs font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {label}
                  </span>
                  <span style={{ color: "var(--color-text-muted)" }}>
                    {free}
                  </span>
                  <span style={{ color: "var(--color-info)", fontWeight: 600 }}>
                    {premium}
                  </span>
                </div>
              ))}
            </div>

            {error != null && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            {step === "waiting" ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                    style={{
                      borderColor: "var(--color-info)",
                      borderTopColor: "transparent",
                    }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Waiting for payment…
                  </span>
                </div>
                <p
                  className="text-xs text-center"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Complete payment in the tab that opened. This will update
                  automatically.
                </p>
                <button
                  className="text-xs underline mt-1"
                  style={{ color: "var(--color-text-muted)" }}
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 w-full">
                <button
                  className="w-full rounded-full py-3 text-sm font-semibold transition-colors disabled:opacity-60"
                  style={{ background: "#b8893a", color: "#fff" }}
                  disabled={step === "loading"}
                  onClick={handleStart}
                >
                  {step === "loading" ? "Opening payment…" : "Pay $24.99/mo →"}
                </button>
                <button
                  className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                  onClick={onClose}
                >
                  Maybe later
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-xl font-bold text-primary mb-1">
                You're Premium!
              </h2>
              <p
                className="text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Enjoy 30 documents and unlimited AI chats.
              </p>
            </div>
            <button
              className="w-full rounded-full py-3 text-sm font-semibold"
              style={{ background: "#b8893a", color: "#fff" }}
              onClick={onClose}
            >
              Let's go!
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentModal;
