import { useCallback, useEffect, useState } from "react";
import { WS_BASE } from "../lib/config";
import { getUnreadCount } from "../api/workflows";

export function useGlobalSocket() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;
    let ws, timer, tries = 0, closed = false;

    const sync = () => getUnreadCount().then(setUnreadCount).catch(() => {});
    sync();

    const connect = () => {
      ws = new WebSocket(`${WS_BASE}/ws/notifications/?token=${token}`);
      ws.onopen = () => { tries = 0; };
      ws.onmessage = (e) => {
        try {
          const { event } = JSON.parse(e.data);
          if (event === "run_finished" || event === "notification_created") sync();
        } catch { /* ignore malformed frames */ }
      };
      ws.onclose = () => {
        if (!closed) timer = setTimeout(connect, Math.min(30000, 1000 * 2 ** tries++));
      };
    };
    connect();

    return () => { closed = true; clearTimeout(timer); ws?.close(); };
  }, []);

  const clearUnread = useCallback(() => setUnreadCount(0), []);
  return { unreadCount, clearUnread };
}
