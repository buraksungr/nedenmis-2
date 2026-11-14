import { useEffect, useRef, useState } from "react";
import type { Job } from "./api.ts";

/** İş durumunu SSE ile canlı izler; SSE koparsa yoklamaya düşer. */
export function useJob(jobId: string | null, onDone?: (job: Job) => void) {
  const [job, setJob] = useState<Job | null>(null);
  const doneRef = useRef<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }
    let timer: number | undefined;
    let cancelled = false;
    let source: EventSource | undefined;

    const handle = (j: Job) => {
      if (cancelled) return;
      setJob(j);
      if ((j.status === "done" || j.status === "failed") && doneRef.current !== j.id) {
        doneRef.current = j.id;
        onDone?.(j);
      }
    };

    try {
      source = new EventSource(`/api/jobs/${jobId}/events`);
      source.onmessage = (ev) => {
        try {
          handle(JSON.parse(ev.data) as Job);
        } catch {
          /* yoksay */
        }
      };
      source.onerror = () => {
        source?.close();
        source = undefined;
      };
    } catch {
      /* SSE desteklenmiyor: yoklama */
    }

    timer = window.setInterval(async () => {
      if (source) return;
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) return;
        const data = (await res.json()) as { job: Job };
        handle(data.job);
      } catch {
        /* ağ hatası: sonraki turda dene */
      }
    }, 1400);

    return () => {
      cancelled = true;
      source?.close();
      if (timer) window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  return job;
}

export function formatSec(sec: number | undefined): string {
  if (!sec || !Number.isFinite(sec)) return "—";
  const s = Math.max(0, sec);
  return `${s.toFixed(1)} sn`;
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}
