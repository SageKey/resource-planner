import { NavLink } from "react-router-dom";
import {
  BarChart3,
  FolderKanban,
  Users,
  GitBranch,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/capacity", label: "Capacity", icon: BarChart3 },
  { to: "/portfolio", label: "Portfolio", icon: FolderKanban },
  { to: "/roster", label: "Roster", icon: Users },
  { to: "/planning", label: "Planning", icon: GitBranch },
  { to: "/settings", label: "Settings", icon: SlidersHorizontal },
  // Simplified SDLC (v2) — parallel 3-phase view alongside the main app.
  { to: "/v2/capacity", label: "Capacity", icon: BarChart3, section: "Simplified SDLC" },
  { to: "/v2/portfolio", label: "Portfolio", icon: FolderKanban, section: "Simplified SDLC" },
  // Direct Model (round 1) — explicit hours per role per phase, no percentages.
  { to: "/direct/capacity", label: "Capacity", icon: BarChart3, section: "Direct Model" },
];

export function Sidebar() {
  // Split items into ungrouped first, then grouped by section
  const ungrouped = NAV_ITEMS.filter((i) => !i.section);
  const grouped: Record<string, NavItem[]> = {};
  for (const item of NAV_ITEMS) {
    if (item.section) {
      if (!grouped[item.section]) grouped[item.section] = [];
      grouped[item.section].push(item);
    }
  }
  const sectionNames = Object.keys(grouped);

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
        {ungrouped.map((item) => (
          <NavItemRow key={item.to} item={item} />
        ))}

        {sectionNames.map((section) => (
          <div key={section} className="pt-4">
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {section}
            </div>
            <div className="space-y-0.5">
              {grouped[section].map((item) => (
                <NavItemRow key={item.to} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 px-5 py-3">
        <p className="text-[10px] text-slate-400">Resource Planner v0.1</p>
      </div>
    </aside>
  );
}

function NavItemRow({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end
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
      {item.label}
    </NavLink>
  );
}
