import { Link } from "react-router-dom";

import type { Task } from "../types/types";

type TaskTableProps = {
  tasks: Task[];
};

export function TaskTable({ tasks }: TaskTableProps) {
  if (tasks.length === 0) {
    return <div className="emptyState">No tasks yet.</div>;
  }

  return (
    <div className="panel">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Report</th>
            <th>Status</th>
            <th>Attempts</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>
                <Link className="tableLink" to={`/tasks/${task.id}`}>
                  {task.id}
                </Link>
              </td>
              <td>{task.reportName ?? task.type}</td>
              <td>
                <span className={`status status-${task.status}`}>{task.status}</span>
              </td>
              <td>{task.attempts}</td>
              <td>{formatDate(task.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}
