import React, { useState, useEffect, useRef, useCallback } from 'react';
import StretchVerifier from './StretchVerifier';

/**
 * CoachModal Component
 *
 * Implements an internal timing state machine for posture status progression.
 * Since App.jsx cannot be modified, CoachModal derives its own activeMode
 * from the isSlouching prop by tracking elapsed slouch duration:
 *   - < 1000ms slouching  → 'good' (no modal)
 *   - ≥ 1000ms & < 5000ms → 'alert' (dismissible warning)
 *   - ≥ 5000ms            → 'stretch' (full stretch timer + AI coaching)
 *
 * Additionally shows a "Too Close" warning popup when screen distance
 * becomes too close for a sustained period (≥ 2000ms).
 *
 * In STRETCH mode, the component notifies the parent via onStretchModeChange
 * so the main VisionEngine can be paused for performance optimization.
 *
 * Styled with warm off-white backgrounds to match the dashboard's light-cream theme.
 */
export default function CoachModal({ isSlouching, postureScore, distanceStatus, onStretchModeChange }) {
  const [activeMode, setActiveMode] = useState('good'); // 'good' | 'alert' | 'stretch'
  const [advice, setAdvice] = useState('Analyzing your posture...');
  const [countdown, setCountdown] = useState(15);
  const [isCompleted, setIsCompleted] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // ── Stretch verification state ──
  const [isStretchDetected, setIsStretchDetected] = useState(false);
  const [stretchSeconds, setStretchSeconds] = useState(0); // total seconds of verified stretch
  const [isPaused, setIsPaused] = useState(true); // timer paused until stretch detected

  // ── Distance "Too Close" popup state ──
  const [showDistanceWarning, setShowDistanceWarning] = useState(false);
  const [distanceDismissed, setDistanceDismissed] = useState(false);
  const distanceStartRef = useRef(null);
  const distanceIntervalRef = useRef(null);

  const STRETCH_DURATION = 15; // seconds of verified stretch required
  const DISTANCE_WARN_DELAY = 15000; // ms of sustained "Too close" before showing popup

  // Internal timing refs
  const slouchStartRef = useRef(null);
  const intervalRef = useRef(null);
  const hasCalledApiRef = useRef(false);

  // ── Notify parent about stretch mode changes for VisionEngine optimization ──
  useEffect(() => {
    if (typeof onStretchModeChange === 'function') {
      onStretchModeChange(activeMode === 'stretch');
    }
  }, [activeMode, onStretchModeChange]);

  // ── Internal timing state machine ──
  // Polls slouch duration to derive activeMode independently of App.jsx
  useEffect(() => {
    if (isSlouching) {
      if (slouchStartRef.current === null) {
        slouchStartRef.current = Date.now();
      }

      intervalRef.current = setInterval(() => {
        const duration = Date.now() - slouchStartRef.current;
        if (duration < 1000) {
          setActiveMode('good');
        } else if (duration < 15000) {
          setActiveMode('alert');
        } else {
          setActiveMode('stretch');
        }
      }, 200);
    } else {
      // User sat up straight — reset everything UNLESS stretch is active
      clearInterval(intervalRef.current);
      if (activeMode !== 'stretch') {
        slouchStartRef.current = null;
        setActiveMode('good');
        setAlertDismissed(false);
        hasCalledApiRef.current = false;
      }
    }

    return () => clearInterval(intervalRef.current);
  }, [isSlouching, activeMode]);

  // ── Distance "Too Close" detection with sustained timing ──
  useEffect(() => {
    if (distanceStatus === 'Too close') {
      if (distanceStartRef.current === null) {
        distanceStartRef.current = Date.now();
      }

      distanceIntervalRef.current = setInterval(() => {
        const duration = Date.now() - distanceStartRef.current;
        if (duration >= DISTANCE_WARN_DELAY && !distanceDismissed) {
          setShowDistanceWarning(true);
        }
      }, 300);
    } else {
      // Distance is now OK — reset
      clearInterval(distanceIntervalRef.current);
      distanceStartRef.current = null;
      setShowDistanceWarning(false);
      setDistanceDismissed(false);
    }

    return () => clearInterval(distanceIntervalRef.current);
  }, [distanceStatus, distanceDismissed]);

  // ── Fetch coaching advice ONLY when entering stretch mode ──
  useEffect(() => {
    if (activeMode === 'stretch' && !hasCalledApiRef.current) {
      hasCalledApiRef.current = true;
      setCountdown(STRETCH_DURATION);
      setStretchSeconds(0);
      setIsCompleted(false);
      setIsPaused(true);
      setIsStretchDetected(false);
      fetchCoachingAdvice();
    }
  }, [activeMode]);

  const fetchCoachingAdvice = async () => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `The user's posture score is ${postureScore}. Give a 1-sentence strict correction and a 10-second stretch instruction. The stretch should involve raising arms overhead or extending them outward since we verify this via camera. Keep it under 30 words.` }]
          }]
        })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0].content) {
        setAdvice(data.candidates[0].content.parts[0].text);
      } else {
        setAdvice("Raise your arms overhead, interlace your fingers, and stretch upward! Hold for the full duration.");
      }
    } catch (error) {
      console.error("API Error:", error);
      setAdvice("Raise your arms overhead, interlace your fingers, and stretch upward! Hold for the full duration.");
    }
  };

  // ── Stretch verification callback from StretchVerifier ──
  const handleStretchStatus = useCallback((isStretching) => {
    setIsStretchDetected(isStretching);
    setIsPaused(!isStretching);
  }, []);

  // ── Verified stretch countdown timer — ONLY ticks when stretch is detected ──
  useEffect(() => {
    let timer;
    if (activeMode === 'stretch' && !isPaused && !isCompleted && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          const next = prev - 1;
          if (next <= 0) {
            setIsCompleted(true);
            return 0;
          }
          return next;
        });
        setStretchSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeMode, isPaused, isCompleted, countdown]);

  const handleDismissAlert = () => {
    setAlertDismissed(true);
  };

  const handleDismissDistance = () => {
    setDistanceDismissed(true);
    setShowDistanceWarning(false);
  };

  const handleResumeWork = () => {
    setActiveMode('good');
    setCountdown(STRETCH_DURATION);
    setStretchSeconds(0);
    setIsCompleted(false);
    setAlertDismissed(false);
    setIsPaused(true);
    setIsStretchDetected(false);
    hasCalledApiRef.current = false;
    slouchStartRef.current = null;
  };

  // ── DISTANCE WARNING POPUP — shown independently of posture modals ──
  // Rendered as a separate popup that can coexist alongside other modals
  const distanceWarningPopup = showDistanceWarning && !distanceDismissed && activeMode !== 'stretch' ? (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[#FAF8F5] border border-[#e8ddd0] p-6 rounded-2xl max-w-md w-full shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📏</span>
          <h2 className="text-lg font-semibold text-gray-900">
            Too Close to Screen
          </h2>
        </div>

        <p className="text-gray-600 mb-5 text-[15px] leading-relaxed">
          You're sitting too close to your screen. Please move back to maintain
          a healthy viewing distance of at least an arm's length away.
        </p>

        <div className="flex items-center justify-between bg-rose-50 rounded-xl px-4 py-3 mb-5 border border-rose-200">
          <span className="text-sm text-rose-500 font-medium">Screen Distance</span>
          <span className="text-lg font-bold text-rose-600">Too Close ⚠️</span>
        </div>

        <div className="bg-[#F3EDE4] rounded-xl px-4 py-3 mb-5">
          <p className="text-xs text-gray-500 font-semibold mb-1.5">💡 Quick Tips</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Keep your screen at arm's length (~50-70 cm)</li>
            <li>• Position the top of screen at eye level</li>
            <li>• Follow the 20-20-20 rule for eye health</li>
          </ul>
        </div>

        <button
          onClick={handleDismissDistance}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all
                     bg-[#F3EDE4] text-gray-700 hover:bg-[#ebe3d8] active:scale-[0.98]
                     cursor-pointer"
        >
          Got it, I'll move back
        </button>
      </div>
    </div>
  ) : null;

  // ── Render nothing in 'good' mode (but still show distance warning if needed) ──
  if (activeMode === 'good') return distanceWarningPopup;

  // ── ALERT MODE: Dismissible warning (no timer, no API call) ──
  if (activeMode === 'alert') {
    if (alertDismissed) return distanceWarningPopup;

    return (
      <>
        {distanceWarningPopup}
        <div className={`fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm ${distanceWarningPopup ? 'z-[51]' : ''}`}>
          <div className="bg-[#FAF8F5] border border-[#e8ddd0] p-6 rounded-2xl max-w-md w-full shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🪑</span>
              <h2 className="text-lg font-semibold text-gray-900">
                Posture Check
              </h2>
            </div>

            <p className="text-gray-600 mb-5 text-[15px] leading-relaxed">
              You've been slouching for a few seconds. Try sitting up straight and
              rolling your shoulders back.
            </p>

            <div className="flex items-center justify-between bg-[#F3EDE4] rounded-xl px-4 py-3 mb-5">
              <span className="text-sm text-gray-500 font-medium">Current Score</span>
              <span className="text-lg font-bold text-gray-900">{postureScore}/100</span>
            </div>

            <button
              onClick={handleDismissAlert}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all
                         bg-[#F3EDE4] text-gray-700 hover:bg-[#ebe3d8] active:scale-[0.98]
                         cursor-pointer"
            >
              Got it, thanks
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── STRETCH MODE: Vision-verified stretch timer + AI coaching ──
  const progressPercent = ((STRETCH_DURATION - countdown) / STRETCH_DURATION) * 100;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[#FAF8F5] border border-[#e8ddd0] p-6 rounded-2xl max-w-lg w-full shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧘</span>
            <h2 className="text-lg font-semibold text-gray-900">
              Time to Stretch
            </h2>
          </div>

          {/* Live verification badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${isStretchDetected
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-amber-100 text-amber-700 border border-amber-200'
            }`}>
            <span className={`h-2 w-2 rounded-full ${isStretchDetected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`} />
            {isStretchDetected ? 'Verified' : 'Not detected'}
          </div>
        </div>

        <p className="text-gray-600 mb-4 text-[15px] leading-relaxed">{advice}</p>

        {/* ── Camera feed with stretch verification ── */}
        <div className="mb-4">
          <StretchVerifier onStretchStatus={handleStretchStatus} />
        </div>

        {/* ── Timer section ── */}
        <div className={`p-4 rounded-xl text-center mb-4 transition-all duration-300 ${isPaused && !isCompleted
            ? 'bg-amber-50 border border-amber-200'
            : isCompleted
              ? 'bg-emerald-50 border border-emerald-200'
              : 'bg-[#F3EDE4]'
          }`}>
          {isCompleted ? (
            <>
              <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide mb-1">
                ✅ Stretch Verified!
              </p>
              <span className="text-3xl font-extrabold text-emerald-700">Complete</span>
              <p className="text-xs text-emerald-500 mt-1 font-medium">
                Great job! {stretchSeconds}s of verified stretching
              </p>
            </>
          ) : (
            <>
              <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${isPaused ? 'text-amber-600' : 'text-gray-500'
                }`}>
                {isPaused ? '⏸ Timer paused — stretch to continue' : '⏱ Hold your stretch'}
              </p>
              <span className={`text-4xl font-extrabold ${isPaused ? 'text-amber-600' : 'text-gray-900'
                }`}>{countdown}s</span>
              <div className="mt-3 w-full bg-[#e0d6c8] rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-linear"
                  style={{
                    width: `${progressPercent}%`,
                    background: isPaused
                      ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                      : 'linear-gradient(90deg, #10b981, #059669)',
                  }}
                />
              </div>
              {isPaused && (
                <p className="text-xs text-amber-500 mt-2 font-medium animate-pulse">
                  🙌 Raise your arms or extend them outward
                </p>
              )}
            </>
          )}
        </div>

        <button
          disabled={!isCompleted}
          onClick={handleResumeWork}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${isCompleted
              ? 'bg-gradient-to-r from-[#10b981] to-[#059669] text-white hover:opacity-90 active:scale-[0.98] cursor-pointer shadow-md'
              : 'bg-[#F3EDE4] text-gray-400 cursor-not-allowed'
            }`}
        >
          {isCompleted ? '✓ Stretch Verified — Resume Work' : 'Complete Verified Stretch First'}
        </button>
      </div>
    </div>
  );
}