import { Route, Routes } from "react-router-dom";
import { TabBar } from "./components/TabBar";
import { TodayPage } from "./pages/TodayPage";
import { HistoryPage } from "./pages/HistoryPage";
import { StatsPage } from "./pages/StatsPage";

function App() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-[var(--bg)]">
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </div>
      <TabBar />
    </div>
  );
}

export default App;
