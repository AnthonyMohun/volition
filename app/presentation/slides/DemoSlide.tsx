"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { VideoOff, RefreshCw } from "lucide-react";

export function DemoSlide() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    setIsRetrying(true);
    setCameraError(false);
    setHasCamera(false);

    try {
      // First get permission with any camera
      const initialStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });

      // Now enumerate devices (labels are available after permission)
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === "videoinput");

      console.log(
        "Available video devices:",
        videoDevices.map((d) => d.label)
      );

      // Try to find OBS Virtual Camera
      const obsDevice = videoDevices.find(
        (d) =>
          d.label.toLowerCase().includes("obs") ||
          d.label.toLowerCase().includes("virtual")
      );

      let finalStream: MediaStream;

      // If OBS found, switch to it
      if (obsDevice) {
        console.log("Found OBS device:", obsDevice.label);
        initialStream.getTracks().forEach((track) => track.stop());
        finalStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: obsDevice.deviceId },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } else {
        console.log("No OBS device found, using default camera");
        finalStream = initialStream;
      }

      streamRef.current = finalStream;

      if (videoRef.current) {
        videoRef.current.srcObject = finalStream;
        // Wait for the video to actually be ready to play
        videoRef.current.onloadedmetadata = () => {
          videoRef.current
            ?.play()
            .then(() => {
              setHasCamera(true);
            })
            .catch((e) => {
              console.error("Play failed:", e);
              setCameraError(true);
            });
        };
      }
    } catch (err) {
      console.log("Camera not available:", err);
      setCameraError(true);
    } finally {
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  return (
    <div className="flex items-center justify-center h-full w-full">
      {/* iPad frame container - scaled to fill most of the screen */}
      <div className="relative" style={{ width: "1750px", height: "1312px" }}>
        {/* Video feed behind the iPad frame */}
        <div
          className="absolute"
          style={{
            top: "95px",
            left: "95px",
            right: "95px",
            bottom: "95px",
            borderRadius: "10px",
            overflow: "hidden",
            background: "#000",
          }}
        >
          {/* Always render video element so ref is available */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${
              hasCamera ? "block" : "hidden"
            }`}
          />

          {/* Loading/error overlay */}
          {!hasCamera && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
              {cameraError ? (
                <>
                  <VideoOff className="w-20 h-20 text-gray-500 mb-4" />
                  <p className="text-gray-400 font-medium text-xl mb-2">
                    Camera not available
                  </p>
                  <button
                    onClick={startCamera}
                    disabled={isRetrying}
                    className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-xl font-bold transition-colors mt-4 text-lg"
                  >
                    <RefreshCw
                      className={`w-6 h-6 ${isRetrying ? "animate-spin" : ""}`}
                    />
                    Retry
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full mb-4 animate-spin" />
                  <p className="text-gray-400 font-medium text-lg">
                    Connecting to camera...
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* iPad frame overlay */}
        <img
          src="/ipadscreen.png"
          alt="iPad frame"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{ zIndex: 10 }}
        />
      </div>
    </div>
  );
}
