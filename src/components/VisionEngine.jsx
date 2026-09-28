import React, { useState, useEffect, useRef } from 'react';
import { FilesetResolver, PoseLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { Loader2, CameraOff } from 'lucide-react';

/**
 * VisionEngine Component
 * 
 * Handles live webcam video feed and MediaPipe PoseLandmarker detection.
 * Computes posture score based on vertical nose-to-shoulder distance.
 * Also estimates screen distance and room lighting.
 */
export default function VisionEngine({ onUpdate }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Throttle timestamp ref to ensure onUpdate fires only once every 1000ms
  const lastUpdateRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);

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

    // 1. Initialize camera stream immediately so video is not delayed
    async function startCamera() {
      try {
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
        console.error('Webcam access error:', err);
        if (isComponentMounted) {
          setIsLoading(false);
          setErrorMessage(
            err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
              ? 'Camera permission denied. Please allow camera access in your browser settings.'
              : 'Could not access webcam. Please ensure your camera is connected and not used by another app.'
          );
        }
        return null;
      }
    }

    // 2. Initialize MediaPipe PoseLandmarker in parallel
    async function loadPoseLandmarker() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (!isComponentMounted) return;

        // Try GPU first, fallback to CPU if GPU delegate encounters issues
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
        } catch (gpuErr) {
          console.warn('GPU delegate failed for PoseLandmarker, falling back to CPU:', gpuErr);
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
        console.error('Failed to load MediaPipe PoseLandmarker:', err);
      }
    }

    // 3. Main continuous detection & drawing loop
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

        // ALWAYS draw webcam video frame first (mirrored horizontally for natural selfie view)
        canvasCtx.save();
        canvasCtx.translate(canvas.width, 0);
        canvasCtx.scale(-1, 1);
        canvasCtx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Run inference safely if landmarker is ready and frame has advanced
        if (landmarker && video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          let result = null;

          try {
            result = landmarker.detectForVideo(video, performance.now());
          } catch (inferErr) {
            console.warn('Inference frame skipped:', inferErr);
          }

          if (result && result.landmarks && result.landmarks.length > 0) {
            const landmarks = result.landmarks[0];
            const drawingUtils = new DrawingUtils(canvasCtx);

            const nose = landmarks[0];
            const leftShoulder = landmarks[11];
            const rightShoulder = landmarks[12];

            if (nose && leftShoulder && rightShoulder) {
              const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
              const verticalDistance = shoulderMidY - nose.y;

              const MIN_DISTANCE = 0.08;
              const MAX_DISTANCE = 0.22;
              const normalizedDist = (verticalDistance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE);
              const clampedScore = Math.max(0, Math.min(1, normalizedDist));
              const postureScore = Math.round(clampedScore * 100);

              const isSlouching = postureScore < 50;

              // Draw skeleton connectors & keypoints on top of mirrored video
              drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
                color: isSlouching ? '#EF4444' : '#10B981',
                lineWidth: 3,
              });

              drawingUtils.drawLandmarks(landmarks, {
                color: '#3B82F6',
                fillColor: isSlouching ? '#EF4444' : '#10B981',
                radius: 3,
              });

              // Slouch duration pipeline
              if (!isSlouching) {
                slouchStartRef.current = null;
              }

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

              // Distance estimation from shoulder span
              const shoulderSpan = Math.abs(rightShoulder.x - leftShoulder.x);
              let distanceStatus = 'Optimal';
              if (shoulderSpan > 0.45) {
                distanceStatus = 'Too close';
              } else if (shoulderSpan < 0.17) {
                distanceStatus = 'Too far';
              }

              // Lighting estimation from canvas pixel luminance
              let lightingStatus = 'Good';
              try {
                const midX = Math.floor(canvas.width / 2);
                const midY = Math.floor(canvas.height / 2);
                const sample = canvasCtx.getImageData(Math.max(0, midX - 30), Math.max(0, midY - 30), 60, 60);
                let totalLum = 0;
                for (let i = 0; i < sample.data.length; i += 4) {
                  totalLum += sample.data[i] * 0.299 + sample.data[i + 1] * 0.587 + sample.data[i + 2] * 0.114;
                }
                const avgLum = totalLum / (sample.data.length / 4);
                if (avgLum < 45) {
                  lightingStatus = 'Too Dim';
                } else if (avgLum > 215) {
                  lightingStatus = 'Too Bright';
                }
              } catch {
                // Ignore canvas security errors if any
              }

              // Throttled parent update
              const currentTime = performance.now();
              if (
                postureStatus !== lastStatusRef.current ||
                currentTime - lastUpdateRef.current >= 1000
              ) {
                lastStatusRef.current = postureStatus;
                lastUpdateRef.current = currentTime;
                if (typeof onUpdateRef.current === 'function') {
                  onUpdateRef.current({
                    postureScore,
                    isSlouching,
                    postureStatus,
                    distanceStatus,
                    lightingStatus,
                  });
                }
              }
            }
          }
        }

        canvasCtx.restore();
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    }

    // Launch both camera and model concurrently
    startCamera().then((activeStream) => {
      if (activeStream && isComponentMounted) {
        renderLoop();
      }
    });

    loadPoseLandmarker();

    // Cleanup on unmount
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
    <div className="relative w-full h-full flex items-center justify-center bg-black/90 overflow-hidden rounded-2xl">
      {/* Hidden video element for webcam frame ingestion */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
        className="hidden"
      />

      {/* Canvas element for rendering live webcam feed and skeleton landmarks */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain"
      />

      {/* Loading State Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--card)]/90 backdrop-blur-sm p-6 text-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)] mb-3" />
          <p className="text-sm font-semibold text-[var(--foreground)]">Connecting to camera...</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">Please allow camera permissions if prompted</p>
        </div>
      )}

      {/* Error State Overlay */}
      {errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--card)] p-6 text-center z-10">
          <CameraOff className="h-10 w-10 text-rose-500 mb-3" />
          <p className="text-sm font-bold text-rose-500">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
