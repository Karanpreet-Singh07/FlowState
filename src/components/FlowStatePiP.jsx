import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MeshGradientSVG } from './ui/shader-svg';

/**
 * FlowStatePiP Component
 *
 * Uses the Document Picture-in-Picture API to create a small always-on-top
 * floating window containing the Flowie mascot.
 *
 * COMPACT mode (~220×260):
 *   - Clean Flowie logo with green/red glow based on posture & distance.
 *   - No clutter, no scores, minimal unobtrusive footprint.
 *
 * STRETCH mode:
 *   - Automatically calls pipWindow.resizeTo(380, 500).
 *   - Includes an explicit "⛶ Expand" button (user gesture ensures 100% reliable OS window resize).
 *   - Live stretch verification status driven directly by VisionEngine (single webcam stream).
 *   - Timer pauses if stretch is not detected; resumes when user raises arms overhead.
 *   - Camera feed is kept on the main website (no feed in PiP, verification status only).
 */

const COMPACT_SIZE = { width: 125, height: 150 };
const EXPANDED_SIZE = { width: 380, height: 500 };

// Capture origin once at module level for PiP image URLs
const ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';

export default function FlowStatePiP({
  isSessionActive,
  isSlouching,
  distanceStatus,
  postureScore,
  isStretchModeActive,
  isStretching = false,
  stretchLabel = '',
  onStretchModeChange,
  onResumeWork,
}) {
  const [pipWindow, setPipWindow] = useState(null);
  const [pipSupported] = useState(() => 'documentPictureInPicture' in window);
  const [pipContainer, setPipContainer] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // ── Stretch state ──
  const [advice, setAdvice] = useState('Raise your arms overhead, interlace your fingers, and stretch upward!');
  const [countdown, setCountdown] = useState(15);
  const [isCompleted, setIsCompleted] = useState(false);
  const [stretchSeconds, setStretchSeconds] = useState(0);

  const STRETCH_DURATION = 15;
  const hasCalledApiRef = useRef(false);
  const pipMountedRef = useRef(true);

  // ── Warning state for Flowie color ──
  const isWarning = isSlouching || distanceStatus === 'Too close';

  // ── Track PiP size changes via native resize event ──
  useEffect(() => {
    if (!pipWindow) return;
    const handleResize = () => {
      setIsExpanded(pipWindow.innerWidth >= 280);
    };
    handleResize();
    pipWindow.addEventListener('resize', handleResize);
    return () => pipWindow.removeEventListener('resize', handleResize);
  }, [pipWindow]);

  // ── Auto-resize attempt on stretch mode change ──
  useEffect(() => {
    if (isStretchModeActive) {
      if (pipWindow) {
        try {
          pipWindow.resizeTo(EXPANDED_SIZE.width, EXPANDED_SIZE.height);
        } catch {
          // Browser requires user gesture for resizeTo
        }
      }
    } else {
      if (pipWindow) {
        try {
          pipWindow.resizeTo(COMPACT_SIZE.width, COMPACT_SIZE.height);
        } catch { }
      }
    }
  }, [isStretchModeActive, pipWindow]);

  // ── Fetch coaching advice when stretch mode triggers ──
  useEffect(() => {
    if (isStretchModeActive && !hasCalledApiRef.current) {
      hasCalledApiRef.current = true;
      setCountdown(STRETCH_DURATION);
      setStretchSeconds(0);
      setIsCompleted(false);
      fetchCoachingAdvice();
    } else if (!isStretchModeActive) {
      hasCalledApiRef.current = false;
      setCountdown(STRETCH_DURATION);
      setStretchSeconds(0);
      setIsCompleted(false);
    }
  }, [isStretchModeActive]);

  const fetchCoachingAdvice = async () => {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) return;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `The user was slouching (score: ${postureScore}). Give a 1-sentence quick posture tip and a 15-second stretch instruction involving raising arms overhead. Keep under 25 words.`,
                  },
                ],
              },
            ],
          }),
        }
      );
      const data = await response.json();
      if (data.candidates && data.candidates[0].content) {
        setAdvice(data.candidates[0].content.parts[0].text);
      }
    } catch {
      // Keep default fallback
    }
  };

  // ── Verified stretch countdown (ticks down ONLY when isStretching is true) ──
  useEffect(() => {
    let timer;
    if (isStretchModeActive && isStretching && !isCompleted && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            setIsCompleted(true);
            return 0;
          }
          return next;
        });
        setStretchSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isStretchModeActive, isStretching, isCompleted, countdown]);

  const handleFinishStretch = () => {
    if (pipWindow) {
      try {
        pipWindow.resizeTo(COMPACT_SIZE.width, COMPACT_SIZE.height);
      } catch { }
    }
    setIsExpanded(false);
    if (typeof onResumeWork === 'function') {
      onResumeWork();
    }
  };

  const handleToggleWindowSize = () => {
    if (!pipWindow) return;
    try {
      if (isExpanded) {
        pipWindow.resizeTo(COMPACT_SIZE.width, COMPACT_SIZE.height);
        setIsExpanded(false);
      } else {
        pipWindow.resizeTo(EXPANDED_SIZE.width, EXPANDED_SIZE.height);
        setIsExpanded(true);
      }
    } catch (e) {
      console.warn('Resize failed:', e);
    }
  };

  const handleFocusMainTab = () => {
    try {
      window.focus();
    } catch { }
  };

  // ── Helper: inject styles into a PiP window ──
  function injectPipStyles(pip) {
    // Copy stylesheets from main document
    for (const sheet of [...document.styleSheets]) {
      try {
        if (sheet.href) {
          const link = pip.document.createElement('link');
          link.rel = 'stylesheet';
          link.href = sheet.href;
          pip.document.head.appendChild(link);
        } else if (sheet.cssRules) {
          const style = pip.document.createElement('style');
          for (const rule of sheet.cssRules) {
            style.textContent += rule.cssText + '\n';
          }
          pip.document.head.appendChild(style);
        }
      } catch {
        // Safe to ignore cross-origin sheet errors
      }
    }

    // PiP-specific styles & animations
    const pipStyle = pip.document.createElement('style');
    pipStyle.textContent = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body {
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #FAF8F5;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }
      #pip-root {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      @keyframes floatAnim {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-5px); }
      }
      @keyframes pulseGlow {
        0%, 100% { filter: drop-shadow(0 0 4px currentColor); }
        50% { filter: drop-shadow(0 0 12px currentColor); }
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-3px); }
        40% { transform: translateX(3px); }
        60% { transform: translateX(-2px); }
        80% { transform: translateX(2px); }
      }
      .pip-float { animation: floatAnim 3s ease-in-out infinite; }
      .pip-shake { animation: shake 0.6s ease-in-out infinite; }
      .pip-glow-green { animation: pulseGlow 2s ease-in-out infinite; color: #10B981; }
      .pip-glow-red { animation: pulseGlow 1s ease-in-out infinite; color: #EF4444; }
    `;
    pip.document.head.appendChild(pipStyle);
  }

  // ── Open a PiP window at the given size ──
  async function openPipWindow(size) {
    if (pipWindow) {
      try { pipWindow.close(); } catch { }
    }

    const pip = await window.documentPictureInPicture.requestWindow({
      width: size.width,
      height: size.height,
    });

    injectPipStyles(pip);

    const container = pip.document.createElement('div');
    container.id = 'pip-root';
    pip.document.body.appendChild(container);

    pip.addEventListener('pagehide', () => {
      setPipWindow(null);
      setPipContainer(null);
      setIsExpanded(false);
    });

    return { window: pip, container };
  }

  // ── Open compact PiP when session starts ──
  useEffect(() => {
    pipMountedRef.current = true;

    if (!isSessionActive || !pipSupported) {
      if (pipWindow) {
        try { pipWindow.close(); } catch { }
        setPipWindow(null);
        setPipContainer(null);
      }
      setIsExpanded(false);
      return;
    }

    if (!pipWindow) {
      openPipWindow(COMPACT_SIZE)
        .then(({ window: pw, container: pc }) => {
          if (pipMountedRef.current) {
            setPipWindow(pw);
            setPipContainer(pc);
          } else {
            pw.close();
          }
        })
        .catch((err) => {
          console.warn('Could not open PiP:', err);
        });
    }

    return () => {
      pipMountedRef.current = false;
    };
  }, [isSessionActive, pipSupported]);

  // ── Build PiP Content ──
  const progressPercent = ((STRETCH_DURATION - countdown) / STRETCH_DURATION) * 100;
  const isPaused = !isStretching;

  const pipContent = isStretchModeActive ? (
    // ═══════════════════════════════════════════
    // STRETCH MODE UI (Clean & Responsive)
    // ═══════════════════════════════════════════
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#FAF8F5',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      {/* Top Controls Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #EBE4D8',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '18px' }}>🧘</span>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>
            Time to Stretch
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={handleToggleWindowSize}
            title={isExpanded ? 'Shrink Window' : 'Expand Window'}
            style={{
              background: '#F3EDE4',
              border: '1px solid #E0D6C8',
              borderRadius: '6px',
              padding: '3px 7px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#4B5563',
              cursor: 'pointer',
            }}
          >
            {isExpanded ? '↙ Shrink' : '⛶ Expand'}
          </button>
          <button
            onClick={handleFocusMainTab}
            title="Go to main tab"
            style={{
              background: '#F3EDE4',
              border: '1px solid #E0D6C8',
              borderRadius: '6px',
              padding: '3px 7px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#4B5563',
              cursor: 'pointer',
            }}
          >
            ↗ Tab
          </button>
        </div>
      </div>

      {/* Live Verification Status Badge */}
      <div
        style={{
          margin: '8px 0',
          padding: '8px 10px',
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: isStretching ? '#D1FAE5' : '#FEF3C7',
          color: isStretching ? '#065F46' : '#92400E',
          border: `1px solid ${isStretching ? '#A7F3D0' : '#FDE68A'}`,
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isStretching ? '#10B981' : '#F59E0B',
            boxShadow: isStretching ? '0 0 8px #10B981' : 'none',
          }}
        />
        <span style={{ flex: 1 }}>
          {isStretching ? (stretchLabel || '✓ Stretch Detected!') : '🙌 Raise arms overhead to count down'}
        </span>
      </div>

      {/* Coaching Advice */}
      <p
        style={{
          fontSize: '11px',
          color: '#4B5563',
          lineHeight: '1.4',
          margin: '4px 0 8px 0',
        }}
      >
        {advice}
      </p>

      {/* Countdown Timer Block */}
      <div
        style={{
          background: isCompleted ? '#ECFDF5' : isPaused ? '#FFFBEB' : '#F3EDE4',
          border: `1px solid ${isCompleted ? '#A7F3D0' : isPaused ? '#FDE68A' : '#E0D6C8'}`,
          borderRadius: '12px',
          padding: '10px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}
      >
        {isCompleted ? (
          <>
            <p
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#059669',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              ✅ Verified Stretch Done!
            </p>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#047857', margin: '4px 0' }}>
              Complete
            </span>
            <p style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
              Great job! {stretchSeconds}s completed
            </p>
          </>
        ) : (
          <>
            <p
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: isPaused ? '#D97706' : '#6B7280',
              }}
            >
              {isPaused ? '⏸ Timer Paused — Stretch to Continue' : '⏱ Hold Stretch'}
            </p>
            <span
              style={{
                fontSize: '36px',
                fontWeight: 800,
                color: isPaused ? '#D97706' : '#111827',
                lineHeight: 1.1,
                margin: '4px 0',
              }}
            >
              {countdown}s
            </span>

            {/* Progress Bar */}
            <div
              style={{
                width: '100%',
                background: '#E0D6C8',
                borderRadius: '9999px',
                height: '6px',
                overflow: 'hidden',
                marginTop: '4px',
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  borderRadius: '9999px',
                  transition: 'width 0.4s ease',
                  background: isPaused
                    ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                    : 'linear-gradient(90deg, #10B981, #059669)',
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Action Button */}
      <button
        disabled={!isCompleted}
        onClick={handleFinishStretch}
        style={{
          width: '100%',
          marginTop: '8px',
          padding: '9px',
          borderRadius: '10px',
          fontWeight: 700,
          fontSize: '12px',
          border: 'none',
          cursor: isCompleted ? 'pointer' : 'not-allowed',
          background: isCompleted ? 'linear-gradient(135deg, #10B981, #059669)' : '#E8DFD3',
          color: isCompleted ? '#FFFFFF' : '#9CA3AF',
          transition: 'all 0.2s',
          boxShadow: isCompleted ? '0 2px 8px rgba(16,185,129,0.3)' : 'none',
        }}
      >
        {isCompleted ? '✓ Stretch Complete — Resume Work' : 'Complete Stretch First'}
      </button>
    </div>
  ) : (
    // ═══════════════════════════════════════════
    // COMPACT FLOWIE STATUS MODE
    // ═══════════════════════════════════════════
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FAF8F5 0%, #F3EDE4 100%)',
        padding: '8px',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Discreet Expand Toggle */}
      <button
        onClick={handleToggleWindowSize}
        title={isExpanded ? 'Shrink' : 'Expand'}
        style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          background: 'rgba(255,255,255,0.7)',
          border: '1px solid #E0D6C8',
          borderRadius: '4px',
          padding: '2px 5px',
          fontSize: '10px',
          color: '#6B7280',
          cursor: 'pointer',
        }}
      >
        {isExpanded ? '↙' : '⛶'}
      </button>

      {/* Animated Mesh Gradient Flowie Mascot */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0',
          marginTop: '-4px',
        }}
      >
        <div style={{ width: '78px', maxWidth: '78px' }}>
          <MeshGradientSVG
            isSessionActive={isSessionActive}
            isSlouching={isWarning}
            isDark={false}
            clipId="shapeClipPip"
          />
        </div>
      </div>

      {/* Status Text synchronized with slouch & screen distance */}
      <p
        style={{
          fontSize: '11.5px',
          fontWeight: 700,
          color: isWarning ? '#991B1B' : '#0B2936',
          textAlign: 'center',
          lineHeight: '1.3',
          marginTop: '4px',
          padding: '0 6px',
          letterSpacing: '-0.01em',
        }}
      >
        {isSlouching && distanceStatus === 'Too close'
          ? 'Fix posture & move back!'
          : distanceStatus === 'Too close'
          ? 'Too close! Move further back'
          : isSlouching
          ? 'Fix your posture to calm Flowie down!'
          : 'Flowie is keeping an eye on your focus'}
      </p>
    </div>
  );

  return <>{pipContainer && createPortal(pipContent, pipContainer)}</>;
}
