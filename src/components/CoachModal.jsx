import React, { useState, useEffect, useRef } from 'react';

/**
 * CoachModal Component
 *
 * Handles in-page popup modals for:
 *   1. Posture Alert — dismissible slouch warning (1-15s of slouching)
 *   2. Screen Distance — "Too Close" warning after 15s of sustained close proximity
 *   3. Stretch Mode Modal — full-screen overlay for vision-verified stretching
 *
 * Styled with warm off-white backgrounds to match the dashboard's light-cream theme.
 */
export default function CoachModal({
  isSlouching,
  postureScore,
  distanceStatus,
  isStretchModeActive = false,
  isStretching = false,
  stretchLabel = '',
  onResumeWork = () => {},
}) {
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // ── Distance "Too Close" popup state ──
  const [showDistanceWarning, setShowDistanceWarning] = useState(false);
  const [distanceDismissed, setDistanceDismissed] = useState(false);
  const distanceStartRef = useRef(null);
  const distanceIntervalRef = useRef(null);

  const DISTANCE_WARN_DELAY = 15000; // 15 seconds of sustained "Too close" before showing popup

  // Slouch alert timing refs
  const slouchStartRef = useRef(null);
  const intervalRef = useRef(null);

  // ── Stretch Timer State (Synced with verified stretch) ──
  const [countdown, setCountdown] = useState(15);
  const [isCompleted, setIsCompleted] = useState(false);
  const [stretchSeconds, setStretchSeconds] = useState(0);

  // Reset stretch countdown when stretch mode activates
  useEffect(() => {
    if (isStretchModeActive) {
      setCountdown(15);
      setStretchSeconds(0);
      setIsCompleted(false);
      setAlertVisible(false);
    }
  }, [isStretchModeActive]);

  // Verified stretch countdown (ticks down ONLY when isStretching is true)
  useEffect(() => {
    let timer;
    if (isStretchModeActive && isStretching && !isCompleted && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIsCompleted(true);
            return 0;
          }
          return prev - 1;
        });
        setStretchSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isStretchModeActive, isStretching, isCompleted, countdown]);

  // ── Slouch alert timing (show alert between 1-15s, at 15s stretch mode takes over) ──
  useEffect(() => {
    if (isStretchModeActive) {
      setAlertVisible(false);
      return;
    }

    if (isSlouching) {
      if (slouchStartRef.current === null) {
        slouchStartRef.current = Date.now();
      }

      intervalRef.current = setInterval(() => {
        const duration = Date.now() - slouchStartRef.current;
        if (duration >= 1000 && duration < 15000) {
          setAlertVisible(true);
        } else if (duration >= 15000) {
          setAlertVisible(false);
        }
      }, 200);
    } else {
      clearInterval(intervalRef.current);
      slouchStartRef.current = null;
      setAlertVisible(false);
      setAlertDismissed(false);
    }

    return () => clearInterval(intervalRef.current);
  }, [isSlouching, isStretchModeActive]);

  // ── Distance "Too Close" detection with 15s sustained timing ──
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
      clearInterval(distanceIntervalRef.current);
      distanceStartRef.current = null;
      setShowDistanceWarning(false);
      setDistanceDismissed(false);
    }

    return () => clearInterval(distanceIntervalRef.current);
  }, [distanceStatus, distanceDismissed]);

  const handleDismissAlert = () => {
    setAlertDismissed(true);
  };

  const handleDismissDistance = () => {
    setDistanceDismissed(true);
    setShowDistanceWarning(false);
  };

  const progressPercent = ((15 - countdown) / 15) * 100;
  const isPaused = !isStretching;

  // ── STRETCH MODE POPUP ──
  const stretchModal = isStretchModeActive ? (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[55] backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F5] border border-[#e8ddd0] p-6 sm:p-8 rounded-2xl max-w-lg w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🧘</span>
            <h2 className="text-xl font-bold text-gray-900">Time to Stretch</h2>
          </div>

          {/* Verification Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              isStretching
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isStretching ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            {isStretching ? (stretchLabel || 'Stretch Detected ✓') : 'Raise arms overhead'}
          </div>
        </div>

        <p className="text-gray-600 mb-6 text-[15px] leading-relaxed">
          You've been slouching for 15 seconds. Raise your arms overhead, interlace your fingers,
          and stretch upward to unlock your focus session!
        </p>

        {/* Live Status + Timer Card */}
        <div
          className={`p-6 rounded-2xl text-center mb-6 transition-all ${
            isCompleted
              ? 'bg-emerald-50 border border-emerald-200'
              : isPaused
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-[#F3EDE4] border border-[#e0d6c8]'
          }`}
        >
          {isCompleted ? (
            <>
              <p className="text-xs text-emerald-600 font-extrabold uppercase tracking-wider mb-1">
                ✅ Verified Stretch Complete!
              </p>
              <span className="text-4xl font-extrabold text-emerald-700">All Done!</span>
              <p className="text-xs text-emerald-600 mt-2 font-medium">
                Great job! {stretchSeconds}s of verified stretching completed.
              </p>
            </>
          ) : (
            <>
              <p
                className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                  isPaused ? 'text-amber-700' : 'text-gray-500'
                }`}
              >
                {isPaused ? '⏸ Timer paused — raise arms to continue' : '⏱ Hold your stretch'}
              </p>
              <span
                className={`text-5xl font-extrabold tracking-tight ${
                  isPaused ? 'text-amber-700' : 'text-gray-900'
                }`}
              >
                {countdown}s
              </span>

              {/* Progress Bar */}
              <div className="mt-4 w-full bg-[#e0d6c8] rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-linear"
                  style={{
                    width: `${progressPercent}%`,
                    background: isPaused
                      ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                      : 'linear-gradient(90deg, #10b981, #059669)',
                  }}
                />
              </div>

              {isPaused && (
                <p className="text-xs text-amber-600 mt-3 font-medium animate-pulse">
                  🙌 Raise your arms overhead or extend them outward to resume timer
                </p>
              )}
            </>
          )}
        </div>

        {/* Action Button */}
        <button
          disabled={!isCompleted}
          onClick={onResumeWork}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
            isCompleted
              ? 'bg-gradient-to-r from-[#10b981] to-[#059669] text-white hover:opacity-95 active:scale-[0.98] cursor-pointer shadow-lg'
              : 'bg-[#F3EDE4] text-gray-400 cursor-not-allowed border border-[#e0d6c8]'
          }`}
        >
          {isCompleted ? '✓ Stretch Verified — Resume Work' : 'Complete Verified Stretch to Continue'}
        </button>
      </div>
    </div>
  ) : null;

  // ── DISTANCE WARNING POPUP ──
  const distanceWarningPopup = showDistanceWarning && !distanceDismissed && !isStretchModeActive ? (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm p-4">
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

  // ── POSTURE ALERT POPUP (1-15s slouch) ──
  const alertPopup = alertVisible && !alertDismissed && !isStretchModeActive ? (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[51] backdrop-blur-sm p-4">
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
  ) : null;

  return (
    <>
      {stretchModal}
      {distanceWarningPopup}
      {alertPopup}
    </>
  );
}