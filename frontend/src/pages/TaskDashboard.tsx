import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { TaskTable } from "../components/TaskTable";
import { getTasks } from "../services/api";
import type { Task } from "../types/types";

export function TaskDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadTasks();
  }, []);

  async function loadTasks() {
    try {
      setLoading(true);
      setError(null);
      setTasks(await getTasks());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="stack">
      <div className="heroCard">
        <div className="heroCopy">
          <p className="eyebrow">Portfolio Showcase</p>
          <h1>Event-driven processing with a visible lifecycle</h1>
          <p className="heroText">
            This demo accepts tasks over HTTP, persists lifecycle events, processes work in the
            background, and retries failures on a schedule. Use the dashboard to inspect how the
            system moves from request to completion.
          </p>
        </div>
        <div className="heroStats" aria-label="Architecture highlights">
          <div className="statCard">
            <strong>API</strong>
            <span>Fastify + Zod</span>
          </div>
          <div className="statCard">
            <strong>Persistence</strong>
            <span>Prisma + SQLite</span>
          </div>
          <div className="statCard">
            <strong>Flow</strong>
            <span>Events, worker, retries</span>
          </div>
        </div>
      </div>

      <div className="architectureStrip panel">
        <div>
          <p className="eyebrow">How It Works</p>
          <p className="flowLine">
            Request accepted <span>&rarr;</span> task persisted <span>&rarr;</span> event emitted
            <span>&rarr;</span> worker runs <span>&rarr;</span> retries scheduled if needed
          </p>
        </div>
      </div>

      <div className="sectionHeader">
        <div>
          <h2>Task Dashboard</h2>
          <p className="subtle">Recent tasks and their current processing state.</p>
        </div>
        <Link className="button" to="/create">
          Create Task
        </Link>
      </div>

      {loading ? <div className="emptyState">Loading tasks...</div> : null}
      {error ? <div className="errorBox">{error}</div> : null}
      {!loading && !error ? <TaskTable tasks={tasks} /> : null}
    </section>
  );
}
