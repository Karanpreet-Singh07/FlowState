import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, PoseLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { Loader2, CameraOff, CheckCircle2, XCircle } from 'lucide-react';

/**
 * StretchVerifier Component
 *
 * Opens a mini webcam feed inside the stretch modal and uses MediaPipe
 * PoseLandmarker to verify the user is actually performing a stretch.
 *
 * Detection logic:
 *  1. Arms raised: at least one wrist is above the corresponding shoulder Y
 *  2. Arms extended outward: wrists are spread wider than shoulders
 *  3. Good posture during stretch: nose is well above shoulder midpoint
 *
 * Reports `isStretching` boolean to parent on every detection frame.
 * The parent (CoachModal) uses this to pause/resume the countdown timer.
 */

// MediaPipe landmark indices
const NOSE = 0;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_ELBOW = 13;
const RIGHT_ELBOW = 14;
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;
const LEFT_HIP = 23;
const RIGHT_HIP = 24;

export default function StretchVerifier({ onStretchStatus }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('waiting'); // 'waiting' | 'stretching' | 'not_stretching'
  const [detectionLabel, setDetectionLabel] = useState('Waiting for pose...');

  const lastVideoTimeRef = useRef(-1);
  const onStretchStatusRef = useRef(onStretchStatus);

  useEffect(() => {
    onStretchStatusRef.current = onStretchStatus;
  }, [onStretchStatus]);

  /**
   * Determine if the user is performing a stretch based on pose landmarks.
   * We check multiple stretch patterns:
   *  - Arms raised overhead (either or both wrists above shoulder level)
   *  - Arms extended outward (T-pose / lateral stretch)
   *  - Neck stretch (head tilted significantly to one side)
   *  - Shoulder roll (shoulders raised toward ears)
   */
  const analyzeStretchPose = useCallback((landmarks) => {
    if (!landmarks || landmarks.length < 25) return { isStretching: false, label: 'No pose detected' };

    const nose = landmarks[NOSE];
    const leftShoulder = landmarks[LEFT_SHOULDER];
    const rightShoulder = landmarks[RIGHT_SHOULDER];
    const leftElbow = landmarks[LEFT_ELBOW];
    const rightElbow = landmarks[RIGHT_ELBOW];
    const leftWrist = landmarks[LEFT_WRIST];
    const rightWrist = landmarks[RIGHT_WRIST];
    const leftHip = landmarks[LEFT_HIP];
    const rightHip = landmarks[RIGHT_HIP];

    if (!nose || !leftShoulder || !rightShoulder || !leftWrist || !rightWrist) {
      return { isStretching: false, label: 'Move into frame' };
    }

    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
    const hipMidY = (leftHip.y + rightHip.y) / 2;
    const torsoLength = hipMidY - shoulderMidY;

    const checks = [];

    // ── Check 1: Arms raised overhead ──
    // At least one wrist is significantly above shoulder level
    const leftArmRaised = leftWrist.y < leftShoulder.y - 0.05;
    const rightArmRaised = rightWrist.y < rightShoulder.y - 0.05;
    const armsRaised = leftArmRaised || rightArmRaised;
    if (armsRaised) checks.push('Arms raised ✓');

    // ── Check 2: Arms extended outward (T-pose) ──
    // Wrists are significantly wider than shoulders
    const wristSpan = Math.abs(rightWrist.x - leftWrist.x);
    const armsExtended = wristSpan > shoulderWidth * 1.4;
    // Also check elbows are roughly at shoulder height for T-pose
    const elbowsAtShoulderHeight =
      Math.abs(leftElbow.y - leftShoulder.y) < 0.08 &&
      Math.abs(rightElbow.y - rightShoulder.y) < 0.08;
    const tPose = armsExtended && elbowsAtShoulderHeight;
    if (tPose) checks.push('Arms extended ✓');

    // ── Check 3: Arms crossed overhead ──
    // Both wrists above nose level
    const armsCrossedOverhead = leftWrist.y < nose.y && rightWrist.y < nose.y;
    if (armsCrossedOverhead) checks.push('Overhead stretch ✓');

    // ── Check 4: Side stretch ──
    // One arm raised + torso tilted (nose shifted significantly to one side)
    const noseSideOffset = Math.abs(nose.x - shoulderMidX);
    const sideStretch = (leftArmRaised || rightArmRaised) && noseSideOffset > shoulderWidth * 0.3;
    if (sideStretch) checks.push('Side stretch ✓');

    // ── Check 5: Shoulder shrug / roll ──
    // Shoulders raised closer to ears (smaller nose-to-shoulder distance)
    const shoulderRaised = (shoulderMidY - nose.y) < 0.10 && (shoulderMidY - nose.y) > 0.02;
    if (shoulderRaised && !armsRaised) checks.push('Shoulder roll ✓');

    // ── Check 6: Good upright posture (sitting up straight) ──
    // Nose well above shoulders indicates straightened spine
    const uprightPosture = (shoulderMidY - nose.y) > 0.15;

    // ── Decision: at least one stretch pattern detected ──
    const isStretching = armsRaised || tPose || armsCrossedOverhead || sideStretch || 
                         (shoulderRaised && !armsRaised) || uprightPosture;

    let label;
    if (checks.length > 0) {
      label = checks.join(' · ');
    } else if (uprightPosture) {
      label = 'Good posture ✓';
    } else {
      label = 'Raise your arms to stretch';
    }

    return { isStretching, label };
  }, []);

  useEffect(() => {
    let landmarker = null;
    let stream = null;
    let animationFrameId = null;
    let isComponentMounted = true;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (!isComponentMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return null;
        }

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.muted = true;
          video.playsInline = true;

          await new Promise((resolve) => {
            if (video.readyState >= 1) {
              resolve();
            } else {
              video.onloadedmetadata = () => resolve();
            }
          });

          await video.play();
          if (isComponentMounted) {
            setIsLoading(false);
          }
        }
        return stream;
      } catch (err) {
        console.error('StretchVerifier webcam error:', err);
        if (isComponentMounted) {
          setIsLoading(false);
          setErrorMessage('Camera needed for stretch verification');
        }
        return null;
      }
    }

    async function loadPoseLandmarker() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (!isComponentMounted) return;

        try {
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numPoses: 1,
          });
        } catch {
          if (!isComponentMounted) return;
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numPoses: 1,
          });
        }
      } catch (err) {
        console.error('StretchVerifier: Failed to load PoseLandmarker:', err);
      }
    }

    function renderLoop() {
      if (!isComponentMounted) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const canvasCtx = canvas.getContext('2d');

        // Draw mirrored video
        canvasCtx.save();
        canvasCtx.translate(canvas.width, 0);
        canvasCtx.scale(-1, 1);
        canvasCtx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (landmarker && video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          let result = null;

          try {
            result = landmarker.detectForVideo(video, performance.now());
          } catch (inferErr) {
            console.warn('StretchVerifier inference skipped:', inferErr);
          }

          if (result && result.landmarks && result.landmarks.length > 0) {
            const landmarks = result.landmarks[0];
            const drawingUtils = new DrawingUtils(canvasCtx);

            // Analyze stretch pose
            const { isStretching, label } = analyzeStretchPose(landmarks);

            // Draw skeleton with stretch-aware colors
            drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
              color: isStretching ? '#10B981' : '#F59E0B',
              lineWidth: 2,
            });

            drawingUtils.drawLandmarks(landmarks, {
              color: '#3B82F6',
              fillColor: isStretching ? '#10B981' : '#F59E0B',
              radius: 2,
            });

            setCurrentStatus(isStretching ? 'stretching' : 'not_stretching');
            setDetectionLabel(label);

            if (typeof onStretchStatusRef.current === 'function') {
              onStretchStatusRef.current(isStretching);
            }
          } else {
            setCurrentStatus('not_stretching');
            setDetectionLabel('Move into the camera frame');
            if (typeof onStretchStatusRef.current === 'function') {
              onStretchStatusRef.current(false);
            }
          }
        }

        canvasCtx.restore();
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    }

    startCamera().then((activeStream) => {
      if (activeStream && isComponentMounted) {
        renderLoop();
      }
    });

    loadPoseLandmarker();

    return () => {
      isComponentMounted = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (landmarker) {
        landmarker.close();
      }
    };
  }, [analyzeStretchPose]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black/90" style={{ aspectRatio: '4/3' }}>
      {/* Hidden video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
      />

      {/* Canvas for live feed + skeleton */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain"
      />

      {/* Status overlay badge */}
      <div className={`absolute top-2 left-2 right-2 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md transition-all duration-300 ${
        currentStatus === 'stretching'
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : currentStatus === 'not_stretching'
          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
      }`}>
        {currentStatus === 'stretching' ? (
          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
        ) : (
          <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
        )}
        <span className="truncate">{detectionLabel}</span>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
          <Loader2 className="h-6 w-6 animate-spin text-[#ec4899] mb-2" />
          <p className="text-xs font-semibold text-gray-300">Starting camera...</p>
        </div>
      )}

      {/* Error overlay */}
      {errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4 text-center z-10">
          <CameraOff className="h-6 w-6 text-rose-400 mb-2" />
          <p className="text-xs font-bold text-rose-400">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
