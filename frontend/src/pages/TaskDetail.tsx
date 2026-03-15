import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { EventTimeline } from "../components/EventTimeline";
import { getTask, getTaskEvents } from "../services/api";
import type { Task, TaskEvent } from "../types/types";

export function TaskDetail() {
  const { id = "" } = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timerId: number | undefined;

    async function load() {
      try {
        const [taskResult, eventResult] = await Promise.all([getTask(id), getTaskEvents(id)]);

        if (cancelled) {
          return;
        }

        setTask(taskResult);
        setEvents(eventResult);
        setError(null);
        setLoading(false);

        if (taskResult.status !== "completed" && taskResult.status !== "failed") {
          timerId = window.setTimeout(() => {
            void load();
          }, 2000);
        }
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load task");
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (timerId) {
        window.clearTimeout(timerId);
      }
    };
  }, [id]);

  if (loading) {
    return <div className="emptyState">Loading task details...</div>;
  }

  if (error) {
    return <div className="errorBox">{error}</div>;
  }

  if (!task) {
    return <div className="emptyState">Task not found.</div>;
  }

  return (
    <section className="stack">
      <div className="sectionHeader">
        <div>
          <h1>Task Detail</h1>
          <p className="subtle">Inspect task state and lifecycle events.</p>
        </div>
        <Link className="button button-secondary" to="/">
          Back to Tasks
        </Link>
      </div>

      <div className="panel detailGrid">
        <DetailRow label="ID" value={task.id} />
        <DetailRow label="Report Name" value={task.reportName ?? "Not provided"} />
        <DetailRow label="Type" value={task.type} />
        <DetailRow label="Status" value={task.status} />
        <DetailRow label="Attempts" value={String(task.attempts)} />
        <DetailRow label="Created At" value={formatDate(task.createdAt)} />
        <DetailRow label="Last Error" value={task.lastError || "None"} />
      </div>

      <div className="stack">
        <h2>Event Timeline</h2>
        <EventTimeline events={events} />
      </div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="detailRow">
      <span className="detailLabel">{label}</span>
      <span className="detailValue">{value}</span>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}
