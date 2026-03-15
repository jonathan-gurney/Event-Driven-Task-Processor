import { Navigate, Route, Routes } from "react-router-dom";

import { Layout } from "./components/Layout";
import { CreateTask } from "./pages/CreateTask";
import { TaskDashboard } from "./pages/TaskDashboard";
import { TaskDetail } from "./pages/TaskDetail";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<TaskDashboard />} />
        <Route path="/create" element={<CreateTask />} />
        <Route path="/tasks/:id" element={<TaskDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
