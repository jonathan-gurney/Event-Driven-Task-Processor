import { Link, NavLink, Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <Link className="brand" to="/">
            Event Driven Task Processor
          </Link>
          <p className="subtle">Small UI for debugging task flow and event history.</p>
        </div>
        <nav className="nav">
          <NavLink className="navLink" to="/">
            Tasks
          </NavLink>
          <NavLink className="navLink" to="/create">
            Create Task
          </NavLink>
        </nav>
      </header>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
