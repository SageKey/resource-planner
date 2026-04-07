import { NavLink } from "react-router-dom";
import {
  BarChart3,
  FolderKanban,
  Users,
  GitBranch,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { to: "/capacity", label: "Capacity", icon: BarChart3 },
  { to: "/portfolio", label: "Portfolio", icon: FolderKanban },
  { to: "/roster", label: "Roster", icon: Users },
  { to: "/planning", label: "Planning", icon: GitBranch },
  { to: "/settings", label: "Settings", icon: SlidersHorizontal },
];

export function Sidebar() {
  return (
    <aside className="flex w-56 flex-col border-r border-slate-200 bg-white">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b border-slate-100 px-5">
        <BarChart3 className="h-5 w-5 text-indigo-600" />
        <span className="text-sm font-semibold tracking-tight text-slate-800">
          Resource Planner
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 px-5 py-3">
        <p className="text-[10px] text-slate-400">Resource Planner v0.1</p>
      </div>
    </aside>
  );
}
