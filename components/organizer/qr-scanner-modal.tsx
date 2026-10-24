"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Icon } from "@/components/ui/icon";
import { type AttendeeRecord } from "@/lib/nongol/protocol-store";
import { shortAddress } from "@/lib/nongol/view-models";

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (rawPayload: string) => void;
  attendees?: AttendeeRecord[];
  eventName?: string;
}

export function QrScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  attendees = [],
  eventName,
}: QrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [cameraState, setCameraState] = useState<
    "idle" | "requesting" | "active" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileScanning, setFileScanning] = useState(false);

  // Stop camera media tracks
  function stopCamera() {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  // Continuous frame scanner loop
  function scanFrame() {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        // Successful QR scan!
        stopCamera();
        onScanSuccess(code.data);
        onClose();
        return;
      }
    }

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }

  // Start camera stream
  async function startCamera() {
    stopCamera();
    setCameraState("requesting");
    setErrorMessage(null);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraState("error");
      setErrorMessage(
        "Browser ini tidak mendukung akses kamera langsung. Silakan gunakan fitur Upload Gambar Tiket atau Simulasi Scan."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
      }

      setCameraState("active");
      animFrameRef.current = requestAnimationFrame(scanFrame);
    } catch (err) {
      console.warn("Camera access failed:", err);
      setCameraState("error");
      setErrorMessage(
        "Kamera tidak dapat diakses atau izin ditolak. Anda dapat menggunakan upload gambar QR tiket atau tombol simulasi scan di bawah."
      );
    }
  }

  // Handle image upload scanning
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileScanning(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setFileScanning(false);
          setErrorMessage("Gagal memproses gambar QR.");
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);

        setFileScanning(false);
        if (code && code.data) {
          stopCamera();
          onScanSuccess(code.data);
          onClose();
        } else {
          setErrorMessage("QR Code tidak terdeteksi pada gambar. Pastikan gambar QR tiket terlihat jelas.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  // Handle instant simulation for quick testing / presentations
  function handleSimulateAttendee(attendee: AttendeeRecord) {
    stopCamera();
    // Encode as valid ticket JSON payload
    const simulatedPayload = JSON.stringify({
      version: 1,
      attendee: attendee.address,
      contract: "0x1234567890123456789012345678901234567890",
    });
    onScanSuccess(simulatedPayload);
    onClose();
  }

  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
      startCamera();
    } else {
      if (dialog.open) dialog.close();
      stopCamera();
      setCameraState("idle");
      setErrorMessage(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="wallet-dialog scanner-dialog"
      style={{ maxWidth: "540px", width: "95%", maxHeight: "90vh", overflowY: "auto" }}
      aria-labelledby="scanner-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="dialog-top">
        <span className="eyebrow">NONGOL Protocol · Attendance Verification</span>
        <button
          type="button"
          className="icon-button"
          aria-label="Tutup pemindai QR"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>

      <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          className="scanner-entry-icon"
        >
          <Icon name="camera" size={20} />
        </div>
        <div>
          <h2 id="scanner-dialog-title" style={{ margin: 0 }}>
            Scan Tiket QR Peserta
          </h2>
          <small className="muted">{eventName || "Verifikasi Kehadiran & Refund 100%"}</small>
        </div>
      </div>

      {/* Viewfinder Area */}
      <div className="scanner-viewfinder-container">
          <video
            ref={videoRef}
            className="scanner-video-preview"
            playsInline
            muted
            style={{ display: cameraState === "active" ? "block" : "none" }}
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* Viewfinder UI frame */}
          <div className="scanner-overlay-frame">
            <div className="scanner-laser" />
            <div className="scanner-corner top-left" />
            <div className="scanner-corner top-right" />
            <div className="scanner-corner bottom-left" />
            <div className="scanner-corner bottom-right" />
          </div>

          {cameraState === "requesting" && (
            <div className="scanner-state-message">
              <Icon name="loader" className="spinner" size={28} />
              <p>Membuka kamera perangkat…</p>
            </div>
          )}

          {cameraState === "error" && (
            <div className="scanner-state-message" style={{ padding: "20px" }}>
              <Icon name="camera" size={32} style={{ opacity: 0.6 }} />
              <p style={{ marginTop: "8px", maxWidth: "340px" }}>
                {errorMessage}
              </p>
              <button
                type="button"
                className="button secondary small-button"
                onClick={startCamera}
                style={{ marginTop: "12px" }}
              >
                Coba Buka Kamera Lagi
              </button>
            </div>
          )}
        </div>

        <p className="scanner-instruction-text">
          Arahkan kamera ke QR tiket peserta di layar ponsel atau tiket fisik.
        </p>

        {/* Alternative Scan Methods: Image upload & Presentation Simulation */}
        <div className="scanner-actions-section">
          <div style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <label className="button secondary small-button" style={{ cursor: "pointer", margin: 0 }}>
              <Icon name="qr" size={16} />
              <span>{fileScanning ? "Membaca QR…" : "Pilih File Gambar QR"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="visually-hidden-file"
              />
            </label>

            <span className="small muted">Atau simulasi cepat untuk demo:</span>
          </div>

          {/* Instant Simulation Pills for Demo / Presentations */}
          {attendees.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <span className="field-label" style={{ marginBottom: "6px" }}>
                Simulasi Scan Tiket Terdaftar:
              </span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", maxHeight: "110px", overflowY: "auto" }}>
                {attendees.map((att) => (
                  <button
                    key={att.address}
                    type="button"
                    className="button secondary small-button"

                    onClick={() => handleSimulateAttendee(att)}
                    aria-label={`Simulasi scan tiket ${att.name || shortAddress(att.address)}`}
                    title={`Simulasi scan tiket ${att.name || att.address}`}
                  >
                    <Icon name="qr" size={12} />
                    <span>{att.name || shortAddress(att.address)}</span>
                    <span
                      className={`badge ${att.status === "refunded" ? "success" : "purple"}`}
                      style={{ padding: "1px 5px", marginLeft: "4px" }}
                    >
                      {att.status === "refunded" ? "Hadir" : "Belum"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
    </dialog>
  );
}
