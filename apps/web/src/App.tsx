import { Outlet, Route, Routes } from "react-router-dom";
import { TabBar } from "./components/TabBar";
import { TodayPage } from "./pages/TodayPage";
import { HistoryPage } from "./pages/HistoryPage";
import { StatsPage } from "./pages/StatsPage";
import { ActiveWorkoutPage } from "./pages/ActiveWorkoutPage";
import { LogResultPage } from "./pages/LogResultPage";
import { SettingsPage } from "./pages/SettingsPage";
import { WarmupPage } from "./pages/WarmupPage";
import { CooldownPage } from "./pages/CooldownPage";

function TabbedLayout() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-[var(--bg)]">
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Outlet />
      </div>
      <TabBar />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<TabbedLayout />}>
        <Route path="/" element={<TodayPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route
        path="/workout/:assignmentId"
        element={
          <div className="mx-auto max-w-md">
            <ActiveWorkoutPage />
          </div>
        }
      />
      <Route path="/log/:assignmentId" element={<LogResultPage />} />
      <Route path="/warmup/:assignmentId" element={<WarmupPage />} />
      <Route path="/cooldown/:assignmentId" element={<CooldownPage />} />
    </Routes>
  );
}

export default App;
