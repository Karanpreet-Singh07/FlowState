import { useState, useEffect } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import AnalyticsPage from "./components/AnalyticsPage";


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("workspace"); // "workspace" or "analytics"
  const [isDark, setIsDark] = useState(false);

  // App States
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isSlouching, setIsSlouching] = useState(false);
  const [waterCount, setWaterCount] = useState(0);
  const [postureScore, setPostureScore] = useState(85);
  const [secondsActive, setSecondsActive] = useState(0);
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("flowstate_user");
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch (e) { localStorage.removeItem("flowstate_user"); }
    }
    const savedHistory = localStorage.getItem("flowstate_history");
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { localStorage.removeItem("flowstate_history"); }
    }
    setLoading(false);
  }, []);

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isSessionActive) {
      interval = setInterval(() => setSecondsActive((p) => p + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isSessionActive]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const secs = (totalSeconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleToggleSession = () => {
    if (isSessionActive) {
      if (secondsActive > 0) {
        const newEntry = {
          id: Date.now(),
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
          duration: `${Math.max(1, Math.round(secondsActive / 60))} mins`,
          avgPosture: postureScore,
          waterCount: waterCount,
        };
        const updated = [newEntry, ...history];
        setHistory(updated);
        localStorage.setItem("flowstate_history", JSON.stringify(updated));
      }
      setIsSessionActive(false);
      setIsSlouching(false);
      setSecondsActive(0);
      setPostureScore(85);
      setWaterCount(0); // Resets water to 0
    } else {
      setIsSessionActive(true);
    }
  };

  if (loading) return null;
  if (!user) return <Login onLogin={(u) => setUser(u)} />;

  if (currentView === "analytics") {
    return (
      <AnalyticsPage
        user={user}
        streak={3}
        history={history}
        onBackToWorkspace={() => setCurrentView("workspace")}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />
    );
  }

  return (
    <Dashboard
      user={user}
      onLogout={() => setUser(null)}
      isSessionActive={isSessionActive}
      isSlouching={isSlouching}
      postureScore={postureScore}
      waterCount={waterCount}
      sessionTime={formatTime(secondsActive)}
      onToggleSession={handleToggleSession}
      onLogWater={() => setWaterCount((p) => p + 1)}
      onTestSlouch={() => setIsSlouching((p) => !p)}
      history={history}
      isHistoryOpen={isHistoryOpen}
      onOpenHistory={() => setIsHistoryOpen(true)}
      onCloseHistory={() => setIsHistoryOpen(false)}
      onClearHistory={() => { setHistory([]); localStorage.removeItem("flowstate_history"); }}
      onOpenDashboard={() => setCurrentView("analytics")}
      streak={3}
      isDark={isDark}
      onToggleTheme={() => setIsDark(!isDark)}
    />
  );
}

export default App;