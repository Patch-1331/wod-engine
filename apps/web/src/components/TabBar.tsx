import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/", label: "Today" },
  { to: "/history", label: "History" },
  { to: "/stats", label: "Stats" },
];

export function TabBar() {
  return (
    <nav className="flex border-t border-[var(--border)] bg-[var(--surface)]">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          className={({ isActive }) =>
            `flex-1 py-3 text-center font-mono text-[11px] tracking-wide ${
              isActive ? "text-[var(--accent)]" : "text-[var(--ink-faint)]"
            }`
          }
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {tab.label.toUpperCase()}
        </NavLink>
      ))}
    </nav>
  );
}
