import React, { useEffect, useRef } from 'react';
import { FilesetResolver, PoseLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';

/**
 * VisionEngine Component
 * 
 * Handles live webcam video feed and MediaPipe PoseLandmarker detection.
 * Computes posture score based on vertical nose-to-shoulder distance.
 * Implements a timing pipeline for slouch duration:
 *   - < 1000ms slouching  → postureStatus = 'good'
 *   - ≥ 1000ms & < 5000ms → postureStatus = 'alert'
 *   - ≥ 5000ms            → postureStatus = 'stretch'
 * Fires onUpdate when status changes or at most once per 1000ms.
 * 
 * @param {Object} props
 * @param {Function} props.onUpdate - Callback with { postureScore, isSlouching, postureStatus }
 */
export default function VisionEngine({ onUpdate }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Throttle timestamp ref to ensure onUpdate fires only once every 1000ms
  const lastUpdateRef = useRef(0);

  // Timing pipeline refs for posture status progression
  const slouchStartRef = useRef(null);
  const lastStatusRef = useRef('good');

  // Reference to avoid stale closure in the requestAnimationFrame loop
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    let landmarker = null;
    let stream = null;
    let animationFrameId = null;
    let isComponentMounted = true;

    async function initVisionEngine() {
      try {
        // 1. Initialize MediaPipe FilesetResolver with WASM binaries
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (!isComponentMounted) return;

        // 2. Instantiate PoseLandmarker with the float16 lite model
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });

        if (!isComponentMounted) {
          landmarker.close();
          return;
        }

        // 3. Request user webcam stream and assign to hidden video element
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (!isComponentMounted) {
          stream.getTracks().forEach((track) => track.stop());
          landmarker.close();
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', () => {
            renderLoop();
          });
        }
      } catch (err) {
        console.error('Failed to initialize VisionEngine:', err);
      }
    }

    // 4. Main continuous detection & drawing loop
    function renderLoop() {
      if (!isComponentMounted) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && landmarker) {
        // Synchronize canvas resolution with the native video stream dimensions
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          const canvasCtx = canvas.getContext('2d');
          const startTimeMs = performance.now();

          // Run inference on the current video frame
          const result = landmarker.detectForVideo(video, startTimeMs);

          // Clear previous canvas drawing and render the current webcam frame
          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
          canvasCtx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const drawingUtils = new DrawingUtils(canvasCtx);

          if (result.landmarks && result.landmarks.length > 0) {
            const landmarks = result.landmarks[0];

            // ==========================================
            // MATH & LOGIC: POSTURE DETECTION
            // ==========================================
            // Landmark 0: Nose
            // Landmark 11: Left Shoulder
            // Landmark 12: Right Shoulder
            const nose = landmarks[0];
            const leftShoulder = landmarks[11];
            const rightShoulder = landmarks[12];

            if (nose && leftShoulder && rightShoulder) {
              /**
               * Step 1: Calculate the shoulder midpoint along the Y-axis.
               * In normalized coordinates (0 to 1), y = 0 is the top of the frame and
               * y = 1 is the bottom of the frame.
               */
              const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;

              /**
               * Step 2: Compute the vertical distance between Nose and Shoulder midpoint.
               * Since the nose is located above the shoulders in an upright pose,
               * nose.y < shoulderMidY, making (shoulderMidY - nose.y) positive.
               *
               * When slouching, the head drops forward/downward toward the shoulders,
               * causing this vertical difference to shrink towards 0.
               */
              const verticalDistance = shoulderMidY - nose.y;

              /**
               * Step 3: Convert the vertical distance into a normalized 0 - 100 posture score.
               * Empirical thresholds in normalized coordinate space:
               * - MIN_DISTANCE (0.08): Head has severely dropped towards chest/shoulders -> Score 0
               * - MAX_DISTANCE (0.22): Head is held high with upright posture -> Score 100
               *
               * Linear interpolation formula:
               * rawScore = ((verticalDistance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)) * 100
               */
              const MIN_DISTANCE = 0.08;
              const MAX_DISTANCE = 0.22;
              const normalizedDist = (verticalDistance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE);
              const clampedScore = Math.max(0, Math.min(1, normalizedDist));
              const postureScore = Math.round(clampedScore * 100);

              /**
               * Step 4: Determine slouching status.
               * If postureScore falls below 50 (verticalDistance < 0.15),
               * the user is flagged as slouching.
               */
              const isSlouching = postureScore < 50;

              // Visual feedback: Draw skeleton connectors (Red if slouching, Green if upright)
              drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
                color: isSlouching ? '#EF4444' : '#10B981',
                lineWidth: 3,
              });

              // Draw key landmark points
              drawingUtils.drawLandmarks(landmarks, {
                color: '#3B82F6',
                fillColor: isSlouching ? '#EF4444' : '#10B981',
                radius: 3,
              });

              // ==========================================
              // TIMING PIPELINE: POSTURE STATUS PROGRESSION
              // ==========================================
              // Reset slouch timer when user sits up straight
              if (!isSlouching) {
                slouchStartRef.current = null;
              }

              // Determine postureStatus based on slouch duration
              let postureStatus = 'good';
              if (isSlouching) {
                if (slouchStartRef.current === null) {
                  slouchStartRef.current = performance.now();
                }
                const duration = performance.now() - slouchStartRef.current;
                if (duration < 1000) {
                  postureStatus = 'good';
                } else if (duration < 5000) {
                  postureStatus = 'alert';
                } else {
                  postureStatus = 'stretch';
                }
              }

              // Only fire onUpdate when the status actually changes
              const currentTime = performance.now();
              if (
                postureStatus !== lastStatusRef.current ||
                currentTime - lastUpdateRef.current >= 1000
              ) {
                lastStatusRef.current = postureStatus;
                lastUpdateRef.current = currentTime;
                if (typeof onUpdateRef.current === 'function') {
                  onUpdateRef.current({ postureScore, isSlouching, postureStatus });
                }
              }
            }
          }

          canvasCtx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    }

    initVisionEngine();

    // Cleanup resources on unmount
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
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center vision-engine-container">
      {/* Hidden video element for webcam frame ingestion */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
        className="hidden"
      />
      {/* Canvas element for rendering webcam feed and skeleton landmarks */}
      <canvas
        ref={canvasRef}
        className="w-full h-auto max-w-full rounded-lg shadow-md"
      />
    </div>
  );
}
