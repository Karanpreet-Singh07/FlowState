import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { MeshGradientSVG } from './ui/shader-svg';

/**
 * FlowStatePiP Component
 *
 * Uses the Document Picture-in-Picture API to create a small always-on-top
 * floating window containing the Flowie mascot.
 *
 * COMPACT mode (~190×235):
 *   - FlowState header with focus status indicator & window expand toggle.
 *   - Animated MeshGradient Flowie mascot.
 *   - Real-time posture warning / posture watching badge.
 *   - Quick Log Water (+ 💧 Log) button with live session & daily water progress.
 *
 * STRETCH mode (~390×530):
 *   - Live stretch verification status driven directly by VisionEngine.
 *   - Coaching advice, holding timer countdown, water log button, and finish stretch button.
 */

const COMPACT_SIZE = { width: 190, height: 235 };
const EXPANDED_SIZE = { width: 390, height: 530 };

const FlowStatePiP = forwardRef(function FlowStatePiP({
  isSessionActive,
  isSlouching,
  distanceStatus,
  postureScore,
  isStretchModeActive,
  isStretching = false,
  stretchLabel = '',
  onStretchModeChange,
  onResumeWork,
  onPiPActiveChange,
  onLogWater,
  sessionWaterCount = 0,
  todayWaterCount = 0,
  dailyWaterGoal = 8,
}, ref) {
  const [pipWindow, setPipWindow] = useState(null);
  const [pipSupported] = useState(() => 'documentPictureInPicture' in window);
  const [pipContainer, setPipContainer] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isWaterClicked, setIsWaterClicked] = useState(false);

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

  const autoExpandPip = () => {
    setIsExpanded(true);
    if (pipWindow) {
      try {
        pipWindow.resizeTo(EXPANDED_SIZE.width, EXPANDED_SIZE.height);
      } catch (err) {
        console.warn('Auto-expand PiP window failed:', err);
      }
    }
  };

  // ── Auto-expand PiP whenever stretch mode activates ──
  useEffect(() => {
    if (isStretchModeActive) {
      autoExpandPip();
    } else {
      if (pipWindow) {
        try {
          pipWindow.resizeTo(COMPACT_SIZE.width, COMPACT_SIZE.height);
        } catch { }
        setIsExpanded(false);
      }
    }
  }, [isStretchModeActive, isStretching, pipWindow]);

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

  const handleWaterClick = (e) => {
    if (e) e.stopPropagation();
    if (typeof onLogWater === 'function') {
      onLogWater();
    }
    setIsWaterClicked(true);
    setTimeout(() => setIsWaterClicked(false), 300);
  };

  // ── Inject styles & site fonts into PiP window ──
  function injectPipStyles(pip) {
    // Inject FontShare Clash Grotesk font stylesheet
    const fontLink1 = pip.document.createElement('link');
    fontLink1.rel = 'stylesheet';
    fontLink1.href = 'https://api.fontshare.com/v2/css?f[]=clash-grotesk@500,600,700&display=swap';
    pip.document.head.appendChild(fontLink1);

    // Inject Google Fonts (Outfit & Space Mono)
    const fontLink2 = pip.document.createElement('link');
    fontLink2.rel = 'stylesheet';
    fontLink2.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap';
    pip.document.head.appendChild(fontLink2);

    // Copy existing stylesheets from main document
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

    // Custom CSS rules & animations for PiP
    const pipStyle = pip.document.createElement('style');
    pipStyle.textContent = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body {
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #FAF8F5;
        font-family: 'Clash Grotesk', 'Outfit', system-ui, -apple-system, sans-serif;
        color: #073642;
      }
      #pip-root {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      button {
        font-family: 'Clash Grotesk', 'Outfit', system-ui, sans-serif;
      }
      @keyframes floatAnim {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-4px); }
      }
      @keyframes waterPop {
        0% { transform: scale(1); }
        50% { transform: scale(1.15); }
        100% { transform: scale(1); }
      }
      .pip-float { animation: floatAnim 3.2s ease-in-out infinite; }
      .water-anim { animation: waterPop 0.3s ease-out; }
    `;
    pip.document.head.appendChild(pipStyle);
  }

  // ── Open a PiP window ──
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
      if (typeof onPiPActiveChange === 'function') {
        onPiPActiveChange(false);
      }
    });

    return { window: pip, container };
  }

  const handleOpenPip = async () => {
    if (!pipSupported) return false;
    try {
      const size = isStretchModeActive ? EXPANDED_SIZE : COMPACT_SIZE;
      const { window: pw, container: pc } = await openPipWindow(size);
      if (pipMountedRef.current) {
        setPipWindow(pw);
        setPipContainer(pc);
        if (typeof onPiPActiveChange === 'function') {
          onPiPActiveChange(true);
        }
        return true;
      } else {
        pw.close();
        return false;
      }
    } catch (err) {
      console.warn('Could not open PiP:', err);
      return false;
    }
  };

  const handleClosePip = () => {
    if (pipWindow) {
      try {
        pipWindow.close();
      } catch { }
      setPipWindow(null);
      setPipContainer(null);
      setIsExpanded(false);
      if (typeof onPiPActiveChange === 'function') {
        onPiPActiveChange(false);
      }
    }
  };

  const handleTogglePip = async () => {
    if (pipWindow) {
      handleClosePip();
      return false;
    } else {
      return await handleOpenPip();
    }
  };

  useImperativeHandle(ref, () => ({
    openPiP: handleOpenPip,
    closePiP: handleClosePip,
    togglePiP: handleTogglePip,
    isPiPActive: !!pipWindow,
  }), [pipWindow, isStretchModeActive, pipSupported]);

  // ── Auto-close PiP when session ends ──
  useEffect(() => {
    pipMountedRef.current = true;

    if (!isSessionActive || !pipSupported) {
      if (pipWindow) {
        try { pipWindow.close(); } catch { }
        setPipWindow(null);
        setPipContainer(null);
        if (typeof onPiPActiveChange === 'function') {
          onPiPActiveChange(false);
        }
      }
      setIsExpanded(false);
      return;
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
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        fontFamily: "'Clash Grotesk', 'Outfit', system-ui, sans-serif",
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
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>
            Time to Stretch
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={handleToggleWindowSize}
            title={isExpanded ? 'Shrink Window' : 'Expand Window'}
            style={{
              background: isExpanded ? '#F3EDE4' : '#10B981',
              border: `1px solid ${isExpanded ? '#E0D6C8' : '#059669'}`,
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 700,
              color: isExpanded ? '#4B5563' : '#FFFFFF',
              cursor: 'pointer',
              boxShadow: isExpanded ? 'none' : '0 0 8px rgba(16,185,129,0.4)',
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
              padding: '4px 8px',
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
        onClick={!isExpanded ? handleToggleWindowSize : undefined}
        title={!isExpanded ? 'Click to expand' : undefined}
        style={{
          margin: '8px 0',
          padding: '9px 12px',
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: !isExpanded ? 'pointer' : 'default',
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
          fontSize: '12px',
          color: '#4B5563',
          lineHeight: '1.4',
          margin: '4px 0 10px 0',
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
          padding: '12px',
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
                fontSize: '11px',
                fontWeight: 800,
                color: '#059669',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              ✅ Verified Stretch Done!
            </p>
            <span style={{ fontSize: '26px', fontWeight: 800, color: '#047857', margin: '4px 0' }}>
              Complete
            </span>
            <p style={{ fontSize: '11.5px', color: '#10B981', fontWeight: 600 }}>
              Great job! {stretchSeconds}s completed
            </p>
          </>
        ) : (
          <>
            <p
              style={{
                fontSize: '10.5px',
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
                fontSize: '38px',
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
          padding: '10px',
          borderRadius: '10px',
          fontWeight: 800,
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
        justifyContent: 'space-between',
        background: 'linear-gradient(145deg, #FAF8F5 0%, #F3EDE4 100%)',
        padding: '10px 12px',
        position: 'relative',
        userSelect: 'none',
        fontFamily: "'Clash Grotesk', 'Outfit', system-ui, sans-serif",
      }}
    >
      {/* Top Controls Header */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(230, 220, 205, 0.8)',
          paddingBottom: '5px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: isWarning ? '#EF4444' : '#10B981',
              boxShadow: isWarning ? '0 0 6px #EF4444' : '0 0 6px #10B981',
            }}
          />
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#073642', letterSpacing: '0.02em' }}>
            FlowState
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={handleToggleWindowSize}
            title={isExpanded ? 'Shrink' : 'Expand'}
            style={{
              background: 'rgba(255,255,255,0.85)',
              border: '1px solid #E0D6C8',
              borderRadius: '5px',
              padding: '2px 5px',
              fontSize: '10px',
              fontWeight: 700,
              color: '#4B5563',
              cursor: 'pointer',
            }}
          >
            {isExpanded ? '↙' : '⛶'}
          </button>
          <button
            onClick={handleFocusMainTab}
            title="Focus main tab"
            style={{
              background: 'rgba(255,255,255,0.85)',
              border: '1px solid #E0D6C8',
              borderRadius: '5px',
              padding: '2px 5px',
              fontSize: '10px',
              fontWeight: 700,
              color: '#4B5563',
              cursor: 'pointer',
            }}
          >
            ↗
          </button>
        </div>
      </div>

      {/* Animated Mesh Gradient Flowie Mascot */}
      <div
        className="pip-float"
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '2px 0',
        }}
      >
        <div style={{ width: '82px', maxWidth: '82px' }}>
          <MeshGradientSVG
            isSessionActive={isSessionActive}
            isSlouching={isWarning}
            isDark={false}
            clipId="shapeClipPip"
          />
        </div>
      </div>

      {/* Posture Status Badge */}
      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: isWarning ? '#991B1B' : '#065F46',
          background: isWarning ? '#FEE2E2' : '#D1FAE5',
          border: `1px solid ${isWarning ? '#FCA5A5' : '#A7F3D0'}`,
          borderRadius: '8px',
          padding: '3px 6px',
          textAlign: 'center',
          lineHeight: '1.2',
          width: '100%',
        }}
      >
        {isSlouching && distanceStatus === 'Too close'
          ? '⚠️ Fix Posture & Move Back'
          : distanceStatus === 'Too close'
          ? '⚠️ Too Close To Screen'
          : isSlouching
          ? '⚠️ Posture Warning'
          : '✨ Flowie Active'}
      </div>

      {/* Water Control Box in PiP */}
      <div
        style={{
          width: '100%',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #E0D6C8',
          borderRadius: '9px',
          padding: '5px 7px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '9.5px', fontWeight: 600, color: '#6B7280' }}>
            Session Water
          </span>
          <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0369A1' }}>
            💧 {sessionWaterCount} <span style={{ fontSize: '9px', color: '#64748B', fontWeight: 600 }}>({todayWaterCount}/{dailyWaterGoal})</span>
          </span>
        </div>

        <button
          onClick={handleWaterClick}
          className={isWaterClicked ? 'water-anim' : ''}
          title="Log 1 glass of water"
          style={{
            background: 'linear-gradient(135deg, #0284C7, #0369A1)',
            border: 'none',
            borderRadius: '6px',
            padding: '5px 8px',
            fontSize: '11px',
            fontWeight: 800,
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            boxShadow: '0 2px 5px rgba(3, 105, 161, 0.3)',
          }}
        >
          + 💧 Log
        </button>
      </div>
    </div>
  );

  return <>{pipContainer && createPortal(pipContent, pipContainer)}</>;
});

export default FlowStatePiP;
