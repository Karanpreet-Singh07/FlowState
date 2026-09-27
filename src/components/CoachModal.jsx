import React, { useState, useEffect, useRef } from 'react';

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
 * Styled with warm off-white backgrounds to match the dashboard's light-cream theme.
 */
export default function CoachModal({ isSlouching, postureScore }) {
  const [activeMode, setActiveMode] = useState('good'); // 'good' | 'alert' | 'stretch'
  const [advice, setAdvice] = useState('Analyzing your posture...');
  const [countdown, setCountdown] = useState(15);
  const [isCompleted, setIsCompleted] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // Internal timing refs
  const slouchStartRef = useRef(null);
  const intervalRef = useRef(null);
  const hasCalledApiRef = useRef(false);

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
        } else if (duration < 5000) {
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

  // ── Fetch coaching advice ONLY when entering stretch mode ──
  useEffect(() => {
    if (activeMode === 'stretch' && !hasCalledApiRef.current) {
      hasCalledApiRef.current = true;
      setCountdown(15);
      setIsCompleted(false);
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
            parts: [{ text: `The user's posture score is ${postureScore}. Give a 1-sentence strict correction and a 10-second stretch instruction.` }]
          }]
        })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0].content) {
        setAdvice(data.candidates[0].content.parts[0].text);
      } else {
        setAdvice("Sit up straight and roll your shoulders back!");
      }
    } catch (error) {
      console.error("API Error:", error);
      setAdvice("Sit up straight and roll your shoulders back!");
    }
  };

  // ── Stretch countdown timer — ONLY runs in stretch mode ──
  useEffect(() => {
    let timer;
    if (activeMode === 'stretch' && countdown > 0 && !isCompleted) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (activeMode === 'stretch' && countdown === 0) {
      setIsCompleted(true);
    }
    return () => clearInterval(timer);
  }, [activeMode, countdown, isCompleted]);

  const handleDismissAlert = () => {
    setAlertDismissed(true);
  };

  const handleResumeWork = () => {
    setActiveMode('good');
    setCountdown(15);
    setIsCompleted(false);
    setAlertDismissed(false);
    hasCalledApiRef.current = false;
    slouchStartRef.current = null;
  };

  // ── Render nothing in 'good' mode ──
  if (activeMode === 'good') return null;

  // ── ALERT MODE: Dismissible warning (no timer, no API call) ──
  if (activeMode === 'alert') {
    if (alertDismissed) return null;

    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
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
    );
  }

  // ── STRETCH MODE: Full stretch timer + AI coaching ──
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[#FAF8F5] border border-[#e8ddd0] p-6 rounded-2xl max-w-md w-full shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🧘</span>
          <h2 className="text-lg font-semibold text-gray-900">
            Time to Stretch
          </h2>
        </div>

        <p className="text-gray-600 mb-5 text-[15px] leading-relaxed">{advice}</p>

        <div className="bg-[#F3EDE4] p-5 rounded-xl text-center mb-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
            Hold your stretch
          </p>
          <span className="text-4xl font-extrabold text-gray-900">{countdown}s</span>
          <div className="mt-3 w-full bg-[#e0d6c8] rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${((15 - countdown) / 15) * 100}%`,
                background: 'linear-gradient(90deg, #e879a8, #d946a8)',
              }}
            />
          </div>
        </div>

        <button
          disabled={!isCompleted}
          onClick={handleResumeWork}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
            isCompleted
              ? 'bg-gradient-to-r from-[#ec4899] to-[#d946a8] text-white hover:opacity-90 active:scale-[0.98] cursor-pointer shadow-md'
              : 'bg-[#F3EDE4] text-gray-400 cursor-not-allowed'
          }`}
        >
          {isCompleted ? '✓ Resume Work' : 'Complete Stretch First'}
        </button>
      </div>
    </div>
  );
}