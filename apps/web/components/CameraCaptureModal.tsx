"use client";

import { useEffect, useRef, useState } from "react";
import { X, SwitchCamera } from "lucide-react";

interface CameraCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  /** Keep the modal open after a capture so the user can take more than one photo. */
  continuous?: boolean;
}

export default function CameraCaptureModal({ open, onClose, onCapture, continuous = false }: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [flash, setFlash] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  function stopStream() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    stopStream();
    setError(null);
    setBlocked(false);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode }, audio: false })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err: DOMException) => {
        if (cancelled) return;
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setBlocked(true);
          setError("Camera access is blocked for this site — the browser won't ask again on its own. Click the camera icon in your address bar, allow access, then hit Try Again below.");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setError("No camera was found on this device. Please upload a file instead.");
        } else {
          setError("Camera is unavailable right now. Please upload a file instead.");
        }
      });

    navigator.mediaDevices
      .enumerateDevices()
      .then(devices => setHasMultipleCameras(devices.filter(d => d.kind === "videoinput").length > 1))
      .catch(() => {});

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, facingMode, retryKey]);

  function handleClose() {
    stopStream();
    onClose();
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (!blob) return;
      onCapture(new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" }));
      if (continuous) {
        setFlash(true);
        setTimeout(() => setFlash(false), 200);
      } else {
        handleClose();
      }
    }, "image/jpeg", 0.9);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 shrink-0">
        <button
          type="button"
          onClick={handleClose}
          className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        {hasMultipleCameras && (
          <button
            type="button"
            onClick={() => setFacingMode(m => (m === "environment" ? "user" : "environment"))}
            className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <SwitchCamera className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center gap-4 px-8 text-center">
            <p className="text-white text-sm font-medium">{error}</p>
            {blocked && (
              <button
                type="button"
                onClick={() => setRetryKey(k => k + 1)}
                className="h-10 px-5 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="max-h-full max-w-full object-contain" />
        )}
        {flash && <div className="absolute inset-0 bg-white/70" />}
      </div>

      <div className="p-6 flex items-center justify-center shrink-0">
        <button
          type="button"
          onClick={capture}
          disabled={!!error}
          aria-label="Take photo"
          className="h-16 w-16 rounded-full bg-white border-4 border-white/30 hover:scale-105 active:scale-95 transition-transform disabled:opacity-40"
        />
      </div>
    </div>
  );
}
