import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Capacity } from "@/pages/Capacity";
import { Portfolio } from "@/pages/Portfolio";
import { TeamRoster } from "@/pages/TeamRoster";
import { Planning } from "@/pages/Planning";
import { Settings } from "@/pages/Settings";

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
    ],
  },
]);
