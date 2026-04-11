import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Capacity } from "@/pages/Capacity";
import { Portfolio } from "@/pages/Portfolio";
import { TeamRoster } from "@/pages/TeamRoster";
import { Planning } from "@/pages/Planning";
import { Settings } from "@/pages/Settings";
import { Wireframes } from "@/pages/Wireframes";
import { CapacityV2 } from "@/pages/CapacityV2";
import { PortfolioV2 } from "@/pages/PortfolioV2";
import { DirectCapacity } from "@/features/direct/pages/DirectCapacity";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/capacity" replace /> },
      { path: "capacity", element: <Capacity /> },
      { path: "portfolio", element: <Portfolio /> },
      { path: "roster", element: <TeamRoster /> },
      { path: "planning", element: <Planning /> },
      { path: "settings", element: <Settings /> },
      // Hidden — not in Sidebar. Reachable only via direct URL.
      { path: "wireframes", element: <Wireframes /> },
      // Simplified SDLC (v2) — parallel 3-phase capacity view.
      { path: "v2/capacity", element: <CapacityV2 /> },
      { path: "v2/portfolio", element: <PortfolioV2 /> },
      // Direct Model (round 1) — explicit hours/week, no percentages.
      { path: "direct/capacity", element: <DirectCapacity /> },
    ],
  },
]);
