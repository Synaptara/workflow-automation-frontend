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
    const ws = new WebSocket(`ws://localhost:8000/ws/runs/${runId}/?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (msg) => {
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
    };

    return () => ws.close();
  }, [runId]);

  return { stepStatus, runStatus };
}
