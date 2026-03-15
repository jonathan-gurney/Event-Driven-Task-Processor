import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createTask } from "../services/api";

export function CreateTask() {
  const navigate = useNavigate();
  const [reportName, setReportName] = useState("weekly-sales");
  const [shouldFail, setShouldFail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      const task = await createTask({
        type: "generate_report_mock",
        payload: {
          reportName,
          shouldFail
        }
      });

      navigate(`/tasks/${task.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="stack narrow">
      <div className="sectionHeader">
        <div>
          <h1>Create Task</h1>
          <p className="subtle">Submit a mock report task to the backend.</p>
        </div>
      </div>

      <form className="panel form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Report Name</span>
          <input
            required
            type="text"
            value={reportName}
            onChange={(event) => setReportName(event.target.value)}
          />
        </label>

        <label className="checkboxRow">
          <input
            type="checkbox"
            checked={shouldFail}
            onChange={(event) => setShouldFail(event.target.checked)}
          />
          <span>Simulate failure</span>
        </label>

        {error ? <div className="errorBox">{error}</div> : null}

        <button className="button" disabled={submitting} type="submit">
          {submitting ? "Creating..." : "Create Task"}
        </button>
      </form>
    </section>
  );
}
