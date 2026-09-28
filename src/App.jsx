import { useState, useEffect, useRef } from 'react';
import Dashboard from './components/Dashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import VisionEngine from './components/VisionEngine';
import CoachModal from './components/CoachModal';
import FlowStatePiP from './components/FlowStatePiP';
import Login from './components/Login';
import LoadingScreen from './components/LoadingScreen';
import ViewTransitionLoader from './components/ViewTransitionLoader';
import {
  saveWaterEvent,
  getSessionData,
  getStoredHistory,
  saveStoredHistory,
  clearStoredHistory,
  calculateStreak,
  getDailyWaterGoal,
  saveDailyWaterGoal,
  getTodayWaterCount,
} from './utils/storage';

function App() {
  // ── Auth & Loading state ──
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  // ── Posture, Distance & Lighting state (driven by VisionEngine) ──
  const [postureScore, setPostureScore] = useState(100);
  const [isSlouching, setIsSlouching] = useState(false);
  const [distanceStatus, setDistanceStatus] = useState('Optimal');
  const [lightingStatus, setLightingStatus] = useState('Good');

  // ── Water tracking & Goal state ──
  const [sessionWaterCount, setSessionWaterCount] = useState(0);
  const [dailyWaterGoal, setDailyWaterGoal] = useState(() => getDailyWaterGoal());

  // ── Session state & Timer ──
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionStartTimeRef = useRef(null);
  const postureScoresRef = useRef([]);

  // ── PiP (Picture-in-Picture) state & ref ──
  const [isPiPActive, setIsPiPActive] = useState(false);
  const pipRef = useRef(null);

  // ── Theme state ──
  const [isDark, setIsDark] = useState(false);

  // ── Stretch mode state — VisionEngine switches to stretch verification ──
  const [isStretchModeActive, setIsStretchModeActive] = useState(false);
  const [isStretching, setIsStretching] = useState(false);
  const [stretchLabel, setStretchLabel] = useState('Raise arms to stretch');

  // ── Navigation view state ('dashboard' | 'analytics') & Transition Loader ──
  const [currentView, setCurrentView] = useState('dashboard');
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetView, setTargetView] = useState(null);

  // ── Session history & drawer ──
  const [history, setHistory] = useState(() => getStoredHistory());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Live streak from history & today's water count
  const streak = calculateStreak(history);
  const todayWaterCount = getTodayWaterCount(history, sessionWaterCount);

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

    if (typeof data.isStretching !== 'undefined') {
      setIsStretching(data.isStretching);
    }
    if (data.stretchLabel) {
      setStretchLabel(data.stretchLabel);
    }
    if (data.postureStatus === 'stretch' && !isStretchModeActive) {
      setIsStretchModeActive(true);
    }
  };

  const handleResumeFromStretch = () => {
    setIsStretchModeActive(false);
    setIsStretching(false);
  };

  const handleLogWater = () => {
    saveWaterEvent();
    setSessionWaterCount((prev) => prev + 1);
  };

  const handleUpdateWaterGoal = (newGoal) => {
    const saved = saveDailyWaterGoal(newGoal);
    setDailyWaterGoal(saved);
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
        waterCount: sessionWaterCount,
      };

      const updatedHistory = [newSession, ...history];
      setHistory(updatedHistory);
      saveStoredHistory(updatedHistory);

      postureScoresRef.current = [];
      sessionStartTimeRef.current = null;
      setIsSessionActive(false);
      setSessionSeconds(0);
      setSessionWaterCount(0);
      pipRef.current?.closePiP();
      setIsPiPActive(false);
      // Drawer is NOT auto-opened — user opens it manually
    } else {
      sessionStartTimeRef.current = Date.now();
      postureScoresRef.current = [];
      setSessionSeconds(0);
      setSessionWaterCount(0);
      setIsSessionActive(true);

      // Auto-start Picture-in-Picture mode on session start
      if (pipRef.current) {
        pipRef.current.openPiP();
      }
    }
  };

  const handleTogglePiP = async () => {
    if (!('documentPictureInPicture' in window)) {
      alert('Picture-in-Picture window is supported in Chrome, Edge, and Chromium-based browsers.');
      return;
    }

    if (!isSessionActive) {
      sessionStartTimeRef.current = Date.now();
      postureScoresRef.current = [];
      setSessionSeconds(0);
      setSessionWaterCount(0);
      setIsSessionActive(true);

      if (pipRef.current) {
        await pipRef.current.openPiP();
      }
    } else {
      if (pipRef.current) {
        await pipRef.current.togglePiP();
      }
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
    const fullUser = { name: 'User', goal: 'Stay focused', ...userData };
    setPendingUser(fullUser);
    setIsAuthLoading(true);
  };

  const handleLoadingComplete = () => {
    setUser(pendingUser);
    setIsAuthLoading(false);
    setPendingUser(null);
  };

  const handleNavigateTo = (view) => {
    setTargetView(view);
    setCurrentView(view);
    setIsNavigating(true);
  };

  const handleNavigationComplete = () => {
    setIsNavigating(false);
    setTargetView(null);
  };

  const handleLogout = () => {
    pipRef.current?.closePiP();
    setIsPiPActive(false);
    if (isSessionActive) {
      postureScoresRef.current = [];
      sessionStartTimeRef.current = null;
      setIsSessionActive(false);
      setSessionSeconds(0);
      setSessionWaterCount(0);
    }
    setCurrentView('dashboard');
    setIsHistoryOpen(false);
    setIsAuthLoading(false);
    setIsNavigating(false);
    setPendingUser(null);
    setUser(null);
  };

  // ── Show Loading Screen during login transition ──
  if (!user && isAuthLoading && pendingUser) {
    return <LoadingScreen user={pendingUser} onComplete={handleLoadingComplete} />;
  }

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
          onStartSession={() => handleNavigateTo('dashboard')}
          onLogout={handleLogout}
          todayWaterCount={todayWaterCount}
          dailyWaterGoal={dailyWaterGoal}
          onUpdateWaterGoal={handleUpdateWaterGoal}
        />
      ) : (
        <Dashboard
          postureScore={postureScore}
          isSlouching={isSlouching}
          distanceStatus={distanceStatus}
          lightingStatus={lightingStatus}
          waterCount={sessionWaterCount}
          todayWaterCount={todayWaterCount}
          dailyWaterGoal={dailyWaterGoal}
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
          onOpenDashboard={() => handleNavigateTo('analytics')}
          user={user}
          onLogout={handleLogout}
          isPiPActive={isPiPActive}
          onTogglePiP={handleTogglePiP}
          cameraFeed={isSessionActive ? (
            <VisionEngine
              onUpdate={handleVisionUpdate}
              isStretchMode={isStretchModeActive}
            />
          ) : null}
        />
      )}

      {/* View Transition Animation: Pink Winking Flowie Mascot */}
      {isNavigating && targetView && (
        <ViewTransitionLoader
          targetView={targetView}
          onComplete={handleNavigationComplete}
        />
      )}

      {/* CoachModal: in-page alert, distance popups & stretch modal */}
      <CoachModal
        isSlouching={isSlouching}
        postureScore={postureScore}
        distanceStatus={distanceStatus}
        isStretchModeActive={isStretchModeActive}
        isStretching={isStretching}
        stretchLabel={stretchLabel}
        onResumeWork={handleResumeFromStretch}
      />

      {/* PiP: always-on-top Flowie widget + stretch mode */}
      <FlowStatePiP
        ref={pipRef}
        isSessionActive={isSessionActive}
        isSlouching={isSlouching}
        distanceStatus={distanceStatus}
        postureScore={postureScore}
        isStretchModeActive={isStretchModeActive}
        isStretching={isStretching}
        stretchLabel={stretchLabel}
        onStretchModeChange={setIsStretchModeActive}
        onResumeWork={handleResumeFromStretch}
        onPiPActiveChange={setIsPiPActive}
        onLogWater={handleLogWater}
        sessionWaterCount={sessionWaterCount}
        todayWaterCount={todayWaterCount}
        dailyWaterGoal={dailyWaterGoal}
      />
    </>
  );
}

export default App;