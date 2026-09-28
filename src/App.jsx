import { useState, useEffect, useRef } from 'react';
import Dashboard from './components/Dashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import VisionEngine from './components/VisionEngine';
import CoachModal from './components/CoachModal';
import Login from './components/Login';
import {
  saveWaterEvent,
  getSessionData,
  getStoredHistory,
  saveStoredHistory,
  clearStoredHistory,
  calculateStreak,
} from './utils/storage';

function App() {
  // ── Auth state ──
  const [user, setUser] = useState(null);

  // ── Posture, Distance & Lighting state (driven by VisionEngine) ──
  const [postureScore, setPostureScore] = useState(100);
  const [isSlouching, setIsSlouching] = useState(false);
  const [distanceStatus, setDistanceStatus] = useState('Optimal');
  const [lightingStatus, setLightingStatus] = useState('Good');

  // ── Water tracking state ──
  const [waterCount, setWaterCount] = useState(() => getSessionData().waterCount);

  // ── Session state & Timer ──
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionStartTimeRef = useRef(null);
  const sessionWaterStartRef = useRef(waterCount);
  const postureScoresRef = useRef([]);

  // ── Theme state ──
  const [isDark, setIsDark] = useState(false);

  // ── Navigation view state ('dashboard' | 'analytics') ──
  const [currentView, setCurrentView] = useState('dashboard');

  // ── Session history & drawer ──
  const [history, setHistory] = useState(() => getStoredHistory());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Live streak from history
  const streak = calculateStreak(history);

  // ── Dark mode at root level so it works in ALL views ──
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // ── Session timer ──
  useEffect(() => {
    let interval = null;
    if (isSessionActive) {
      interval = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSessionSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionActive]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    if (hours > 0) return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
    return `${pad(mins)}:${pad(secs)}`;
  };

  const sessionTime = formatTime(sessionSeconds);

  // ── VisionEngine callback ──
  const handleVisionUpdate = (data) => {
    if (!data) return;
    if (typeof data.postureScore !== 'undefined') {
      setPostureScore(data.postureScore);
      setIsSlouching(data.isSlouching);
      if (isSessionActive) {
        postureScoresRef.current.push(data.postureScore);
      }
    }
    if (data.distanceStatus) setDistanceStatus(data.distanceStatus);
    if (data.lightingStatus) setLightingStatus(data.lightingStatus);
  };

  const handleLogWater = () => {
    const updatedData = saveWaterEvent();
    setWaterCount(updatedData.waterCount);
  };

  const handleToggleSession = () => {
    if (isSessionActive) {
      const elapsedMs = sessionStartTimeRef.current
        ? Date.now() - sessionStartTimeRef.current
        : sessionSeconds * 1000;
      const durationSecs = Math.max(1, Math.round(elapsedMs / 1000));

      const avgPosture =
        postureScoresRef.current.length > 0
          ? Math.round(
              postureScoresRef.current.reduce((a, b) => a + b, 0) /
                postureScoresRef.current.length
            )
          : postureScore || 100;

      const durationStr =
        durationSecs < 60
          ? `${durationSecs}s`
          : `${Math.floor(durationSecs / 60)}m ${durationSecs % 60}s`;

      const sessionWater = Math.max(0, waterCount - sessionWaterStartRef.current);

      const newSession = {
        id: String(Date.now()),
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: new Date().toISOString(),
        duration: durationStr,
        avgPosture,
        waterCount: sessionWater,
      };

      const updatedHistory = [newSession, ...history];
      setHistory(updatedHistory);
      saveStoredHistory(updatedHistory);

      postureScoresRef.current = [];
      sessionStartTimeRef.current = null;
      setIsSessionActive(false);
      setSessionSeconds(0);
      // Drawer is NOT auto-opened — user opens it manually
    } else {
      sessionStartTimeRef.current = Date.now();
      sessionWaterStartRef.current = waterCount;
      postureScoresRef.current = [];
      setSessionSeconds(0);
      setIsSessionActive(true);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    clearStoredHistory();
  };

  const handleTestSlouch = () => {
    setIsSlouching(true);
    setTimeout(() => setIsSlouching(false), 500);
  };

  // ── Auth handlers ──
  const handleLogin = (userData) => {
    setUser({ name: 'User', goal: 'Stay focused', ...userData });
  };

  const handleLogout = () => {
    if (isSessionActive) {
      postureScoresRef.current = [];
      sessionStartTimeRef.current = null;
      setIsSessionActive(false);
      setSessionSeconds(0);
    }
    setCurrentView('dashboard');
    setIsHistoryOpen(false);
    setUser(null);
  };

  // ── Show Login if not authenticated ──
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      {currentView === 'analytics' ? (
        <AnalyticsDashboard
          user={user}
          history={history}
          streak={streak}
          isDark={isDark}
          onToggleTheme={() => setIsDark((prev) => !prev)}
          onStartSession={() => setCurrentView('dashboard')}
          onLogout={handleLogout}
        />
      ) : (
        <Dashboard
          postureScore={postureScore}
          isSlouching={isSlouching}
          distanceStatus={distanceStatus}
          lightingStatus={lightingStatus}
          waterCount={waterCount}
          isSessionActive={isSessionActive}
          sessionTime={sessionTime}
          streak={streak}
          isDark={isDark}
          onToggleTheme={() => setIsDark((prev) => !prev)}
          onLogWater={handleLogWater}
          onTestSlouch={handleTestSlouch}
          onToggleSession={handleToggleSession}
          history={history}
          isHistoryOpen={isHistoryOpen}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onCloseHistory={() => setIsHistoryOpen(false)}
          onClearHistory={handleClearHistory}
          onOpenDashboard={() => setCurrentView('analytics')}
          user={user}
          onLogout={handleLogout}
          cameraFeed={isSessionActive ? <VisionEngine onUpdate={handleVisionUpdate} /> : null}
        />
      )}

      {/* CoachModal at root level so it overlays the entire app */}
      <CoachModal
        isSlouching={isSlouching}
        postureScore={postureScore}
      />
    </>
  );
}

export default App;