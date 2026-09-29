import { useState, useEffect } from "react";

export function useGlobalSocket() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // We grab the token to authenticate the WebSocket connection
    const token = localStorage.getItem("access");
    if (!token) return;

    // Use ws:// for local HTTP, wss:// for production HTTPS
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/^https?:\/\//, '') : "localhost:8000";

    // Connect to the global notifications channel
    const ws = new WebSocket(`${protocol}//${host}/ws/notifications/?token=${token}`);

    ws.onmessage = (e) => {
      const { event } = JSON.parse(e.data);
      // Whenever ANY workflow finishes successfully or fails, increment the unread bell
      if (event === "run_finished") {
        setUnreadCount((prev) => prev + 1);
      }
    };

    return () => ws.close();
  }, []);

  const clearUnread = () => setUnreadCount(0);

  return { unreadCount, clearUnread };
}
