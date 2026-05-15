"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Bell, CheckCircle, ArrowRight } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";

interface Notification {
  _id: Id<"notifications">;
  type: string;
  titre: string;
  corps: string;
  lu: boolean;
  lien?: string;
  createdAt: number;
}

const TYPE_ICON: Record<string, string> = {
  suivi_mensuel: "📊",
  analyse_prete: "✅",
  credits_bas: "⚠️",
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `Il y a ${d}j`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const notifications = useQuery(api.notifications.getMine);
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  // Fermer en cliquant hors du panel
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleOpen() {
    setOpen((v) => !v);
  }

  async function handleMarkRead(id: Id<"notifications">) {
    await markRead({ notificationId: id });
  }

  const count = unreadCount ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-sable transition-colors"
        aria-label="Notifications"
      >
        <Bell
          size={18}
          weight={count > 0 ? "duotone" : "regular"}
          className={count > 0 ? "text-savane" : "text-olive"}
        />
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold tabular-nums"
          >
            {count > 9 ? "9+" : count}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 w-80 bg-white border border-bordure rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-bordure">
              <span className="text-[13px] font-semibold text-charbon">Notifications</span>
              {count > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="text-[11px] text-pierre hover:text-charbon transition-colors flex items-center gap-1"
                >
                  <CheckCircle size={12} />
                  Tout marquer lu
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-bordure">
              {!notifications || notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell size={24} className="text-pierre/40 mx-auto mb-2" />
                  <p className="text-[13px] text-pierre">Aucune notification</p>
                </div>
              ) : (
                (notifications as Notification[]).map((n) => (
                  <div
                    key={n._id}
                    className={`px-4 py-3 transition-colors ${n.lu ? "bg-white" : "bg-savane/5"}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-[16px] mt-0.5 shrink-0">
                        {TYPE_ICON[n.type] ?? "🔔"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[12px] font-semibold truncate ${n.lu ? "text-pierre" : "text-charbon"}`}>
                          {n.titre}
                        </p>
                        <p className="text-[11px] text-pierre mt-0.5 leading-relaxed line-clamp-2">
                          {n.corps}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-pierre/60">{timeAgo(n.createdAt)}</span>
                          {n.lien && (
                            <Link
                              href={n.lien}
                              onClick={() => { handleMarkRead(n._id); setOpen(false); }}
                              className="text-[11px] text-savane hover:underline flex items-center gap-0.5"
                            >
                              Voir <ArrowRight size={10} />
                            </Link>
                          )}
                        </div>
                      </div>
                      {!n.lu && (
                        <button
                          onClick={() => handleMarkRead(n._id)}
                          className="shrink-0 mt-1 w-2 h-2 rounded-full bg-savane"
                          title="Marquer comme lu"
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
