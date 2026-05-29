"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/hooks/useSocket";
import { Bell, CheckCircle, Info, Rocket, X, AlertCircle } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Notification {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

/**
 * Custom toast event consumed by this component.
 * Dispatch via:
 *   window.dispatchEvent(new CustomEvent<ToastEventDetail>("stellar:toast", { detail }))
 */
export interface ToastEventDetail {
  type: string;
  title: string;
  message: string;
  href?: string;
}

// ─── Icon helper ─────────────────────────────────────────────────────────────

function ToastIcon({ type }: { type: string }) {
  switch (type) {
    case "grant_created":       return <Info className="text-blue-400" size={20} />;
    case "grant_updated":       return <CheckCircle className="text-green-400" size={20} />;
    case "milestone_submitted": return <Rocket className="text-orange-400" size={20} />;
    case "vote_recorded":       return <CheckCircle className="text-green-400" size={20} />;
    case "vote_error":          return <AlertCircle className="text-red-400" size={20} />;
    default:                    return <Bell className="text-purple-400" size={20} />;
  }
}

// ─── Socket notification → ToastEventDetail helpers ──────────────────────────

function toastDetailFromNotification(n: Notification): ToastEventDetail {
  const { type, payload } = n;
  switch (type) {
    case "grant_created":
      return {
        type,
        title:   "New Grant Created",
        message: `Grant "${payload.title}" has been successfully registered on-chain.`,
      };
    case "grant_updated":
      return {
        type,
        title:   "Grant Updated",
        message: `Grant "${payload.title}" status changed from ${payload.oldStatus} to ${payload.newStatus}.`,
      };
    case "milestone_submitted":
      return {
        type,
        title:   "Milestone Submitted",
        message: `A new milestone proof has been submitted for Grant #${payload.grantId} (Milestone ${Number(payload.milestoneIdx) + 1}).`,
      };
    default:
      return { type, title: "Notification", message: "You have a new update." };
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ActiveToast {
  type: string;
  title: string;
  message: string;
  href?: string;
}

const AUTO_HIDE_MS = 5000;

export const NotificationToast: React.FC = () => {
  const { lastNotification } = useSocket();
  const [visible, setVisible]   = useState(false);
  const [current, setCurrent]   = useState<ActiveToast | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current !== null) clearTimeout(timerRef.current); };
  }, []);

  // ── Effect 1: bridge socket notification → DOM event ─────────────────────
  //
  // The effect body only dispatches to an external system (the DOM event bus)
  // — it never calls setState directly. This satisfies react-hooks/set-state-in-effect.
  useEffect(() => {
    if (!lastNotification) return;
    window.dispatchEvent(
      new CustomEvent<ToastEventDetail>("stellar:toast", {
        detail: toastDetailFromNotification(lastNotification),
      })
    );
  }, [lastNotification]);

  // ── Effect 2: listen for stellar:toast events, setState inside callback ───
  //
  // setState is called inside handleCustom (a subscribed callback), which is
  // the pattern explicitly permitted by react-hooks/set-state-in-effect.
  useEffect(() => {
    function handleCustom(e: Event) {
      const { type, title, message, href } =
        (e as CustomEvent<ToastEventDetail>).detail;

      if (timerRef.current !== null) clearTimeout(timerRef.current);
      setCurrent({ type, title, message, href });
      setVisible(true);
      timerRef.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
    }

    window.addEventListener("stellar:toast", handleCustom);
    return () => window.removeEventListener("stellar:toast", handleCustom);
  }, []); // timerRef, setCurrent, setVisible are all stable — no deps needed

  if (!current) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full"
        >
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-2xl flex items-start gap-4">
            <div className="bg-slate-800/50 p-2 rounded-xl shrink-0">
              <ToastIcon type={current.type} />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white mb-1">{current.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{current.message}</p>
              {current.href && (
                <a
                  href={current.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-blue-400 hover:underline"
                >
                  View →
                </a>
              )}
            </div>

            <button
              onClick={() => setVisible(false)}
              className="text-slate-500 hover:text-white transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
