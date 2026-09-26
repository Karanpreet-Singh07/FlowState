import { useState } from 'react';
import Dashboard from './components/Dashboard';
import VisionEngine from './components/VisionEngine';
import CoachModal from './components/CoachModal';
import { saveWaterEvent, getSessionData } from './utils/storage';

function App() {
  // ── Posture state (driven by VisionEngine) ──
  const [postureScore, setPostureScore] = useState(100);
  const [isSlouching, setIsSlouching] = useState(false);

  // ── Water tracking state (shared between Dashboard button + WaterTracker) ──
  const [waterCount, setWaterCount] = useState(() => getSessionData().waterCount);

  // ── Session state ──
  const [isSessionActive, setIsSessionActive] = useState(false);

  // ── Theme state ──
  const [isDark, setIsDark] = useState(false);

  // ── Session history ──
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  /**
   * Called by VisionEngine once per second with { postureScore, isSlouching }.
   * Safely updates state only when valid data is received.
   */
  const handleVisionUpdate = (data) => {
    if (data && typeof data.postureScore !== 'undefined') {
      setPostureScore(data.postureScore);
      setIsSlouching(data.isSlouching);
    }
  };

  /** Log a water event — used by Dashboard's "Log Water" button */
  const handleLogWater = () => {
    const updatedData = saveWaterEvent();
    setWaterCount(updatedData.waterCount);
  };

  /** Toggle focus session on/off */
  const handleToggleSession = () => {
    setIsSessionActive((prev) => !prev);
  };

  /** Manually trigger slouch for testing CoachModal */
  const handleTestSlouch = () => {
    setIsSlouching(true);
    // Auto-reset after a short delay so it can be triggered again
    setTimeout(() => setIsSlouching(false), 500);
  };

  return (
    <>
      <Dashboard
        postureScore={postureScore}
        isSlouching={isSlouching}
        waterCount={waterCount}
        isSessionActive={isSessionActive}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        onLogWater={handleLogWater}
        onTestSlouch={handleTestSlouch}
        onToggleSession={handleToggleSession}
        history={history}
        isHistoryOpen={isHistoryOpen}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onCloseHistory={() => setIsHistoryOpen(false)}
        onClearHistory={() => setHistory([])}
        cameraFeed={isSessionActive ? <VisionEngine onUpdate={handleVisionUpdate} /> : null}
      />

      {/* CoachModal at root level so it overlays the entire app */}
      <CoachModal
        isSlouching={isSlouching}
        postureScore={postureScore}
      />
    </>
  );
}

export default App;