import { useEffect, useRef, useState } from "react";

export function useRunSocket(runId) {
  const [stepStatus, setStepStatus] = useState({});
  const [runStatus, setRunStatus] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!runId) return;
    setStepStatus({});
    setRunStatus("running");

    const token = localStorage.getItem("access");
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";

    // Convert http:// to ws:// and https:// to wss:// automatically
    const wsBase = apiBase.replace(/^http/, "ws");

    const ws = new WebSocket(`${wsBase}/ws/runs/${runId}/?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (msg) => {
      try {
        const { event, data } = JSON.parse(msg.data);

        if (event === "step_started") {
          setStepStatus((prev) => ({ ...prev, [data.step_id]: "running" }));
        }
        if (event === "step_finished") {
          setStepStatus((prev) => ({ ...prev, [data.step_id]: data.status }));
        }
        if (event === "run_finished") {
          setRunStatus(data.status);
        }
      } catch {
        /* ignore malformed frames */
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [runId]);

  return { stepStatus, runStatus };
}
