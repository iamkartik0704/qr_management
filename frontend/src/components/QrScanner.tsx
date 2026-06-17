"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

/**
 * Wraps html5-qrcode. Calls onScan with the decoded text. After a successful
 * scan it stops the camera; the parent re-mounts (via `key`) to scan again.
 */
export default function QrScanner({
  onScan,
  onError,
}: {
  onScan: (text: string) => void;
  onError?: (message: string) => void;
}) {
  const containerId = "qr-reader";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;
    let active = true;
    let startPromise: Promise<unknown> | null = null;

    // Defer start() to a macrotask. Under React StrictMode the effect mounts,
    // unmounts, then remounts synchronously; clearing this timer in the first
    // (throwaway) cleanup means the camera only ever starts on the surviving
    // mount. Otherwise the first mount's video.play() is interrupted when the
    // element is torn down -> "play() request was interrupted" AbortError.
    const startTimer = setTimeout(() => {
      startPromise = scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (handledRef.current) return;
            handledRef.current = true;
            onScan(decodedText);
          },
          () => {
            /* per-frame decode failures are normal; ignore */
          }
        )
        .catch((err) => {
          if (active) onError?.(err?.message || "Unable to start camera.");
        });
    }, 0);

    return () => {
      active = false;
      clearTimeout(startTimer);
      // If start() never fired (transient StrictMode mount), there is nothing
      // to stop. Otherwise wait for it to settle, then stop only if scanning.
      if (!startPromise) return;
      startPromise
        .then(() => {
          if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
            return scanner.stop();
          }
        })
        .then(() => scanner.clear())
        .catch(() => {
          /* already stopped or never started */
        });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      id={containerId}
      className="mx-auto w-full max-w-sm overflow-hidden rounded-lg border border-neutral-800"
    />
  );
}
