"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";
import { useAuth } from "../../context/AuthContext";
import { useChallan } from "../../context/ChallanContext";
import { challanService } from "../../services/challanService";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import Input from "../../components/Input";

export default function ScanChallanPage() {
  const { isAuthenticated } = useAuth();
  const { selectChallan } = useChallan();

  // Mode: "camera" | "upload" | "manual"
  const [activeTab, setActiveTab] = useState("camera");

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const scannerRef = useRef(null);
  const readerId = "qr-reader-container";

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Manual entry state
  const [manualCode, setManualCode] = useState("");

  // Scan lifecycle state
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [securityWarning, setSecurityWarning] = useState("");

  // Initialize camera list on mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera on mobile devices
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment")
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch((err) => {
        console.warn("Could not list video input devices:", err);
      });

    return () => {
      stopCameraScanner();
    };
  }, []);

  // Stop camera helper
  const stopCameraScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setIsCameraActive(false);
  };

  // Start live camera scanner
  const startCameraScanner = async () => {
    setCameraError("");
    setScanError("");
    setSecurityWarning("");
    setScanResult(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerId);
      }

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      const cameraId = selectedCameraId || { facingMode: "environment" };

      await scannerRef.current.start(
        cameraId,
        config,
        (decodedText) => {
          // On QR code decoded successfully
          handleQrPayload(decodedText);
          stopCameraScanner();
        },
        (errorMessage) => {
          // Frame parse error (ignore frame misses while scanning)
        }
      );

      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera start failure:", err);
      setIsCameraActive(false);
      if (err.name === "NotAllowedError" || err.message?.includes("Permission")) {
        setCameraError("Camera permission denied. Please allow camera access in your browser settings or upload an image file.");
      } else if (err.name === "NotFoundError" || err.message?.includes("device")) {
        setCameraError("No camera device was detected. You can upload a photo of your ticket or enter the reference manually.");
      } else {
        setCameraError(err.message || "Could not start camera video feed. Try uploading an image instead.");
      }
    }
  };

  // QR Content Validation & Security Sanitizer
  const sanitizeAndValidateQr = (rawText) => {
    const text = (rawText || "").trim();

    // 1. Check for malicious external URLs (Prevent open redirects & phishing)
    if (/^https?:\/\//i.test(text)) {
      try {
        const parsedUrl = new URL(text);
        // Extract legit challan query parameter if present
        const challanParam =
          parsedUrl.searchParams.get("challan") ||
          parsedUrl.searchParams.get("id") ||
          parsedUrl.searchParams.get("ref");

        if (challanParam && /^PK-\d{4}-\d{6}$/i.test(challanParam)) {
          return { isValid: true, sanitizedCode: challanParam.toUpperCase() };
        }

        // If it's an arbitrary unknown URL, reject it
        return {
          isValid: false,
          securityAlert: `Security Alert: The scanned QR code contains an external web link (${parsedUrl.hostname}). To protect against phishing and malicious redirects, external URLs are not opened automatically. Please enter the citation number printed on your paper ticket manually.`,
        };
      } catch (e) {
        return { isValid: false, error: "Invalid URL structure in QR code payload" };
      }
    }

    // 2. Structured JSON payload handling (e.g. {"challan_no": "PK-2024-883921"})
    if (text.startsWith("{") && text.endsWith("}")) {
      try {
        const json = JSON.parse(text);
        const code = json.challan_no || json.id || json.reference || json.token;
        if (code) {
          return { isValid: true, sanitizedCode: String(code).trim().toUpperCase() };
        }
      } catch (e) {
        // Not valid JSON, continue to regex check
      }
    }

    // 3. Match Standard Pakistani Citation Reference (e.g. PK-2024-883921)
    const challanMatch = text.match(/PK-\d{4}-\d{6}/i);
    if (challanMatch) {
      return { isValid: true, sanitizedCode: challanMatch[0].toUpperCase() };
    }

    // 4. Match Pakistani Vehicle Registration (e.g. ICT-LE-1234 or LHR-2023-9912)
    const plateMatch = text.match(/^[A-Z]{2,4}-?[A-Z0-9]{1,4}-?\d{1,4}$/i);
    if (plateMatch) {
      return { isValid: true, sanitizedCode: plateMatch[0].toUpperCase() };
    }

    // 5. Match QRC Cryptographic QR Token
    if (/^QRC-[A-Za-z0-9_-]{8,64}$/i.test(text)) {
      return { isValid: true, sanitizedCode: text.toUpperCase(), isQrToken: true };
    }

    // 6. Alphanumeric ticket reference
    if (/^[A-Za-z0-9_-]{4,64}$/.test(text)) {
      return { isValid: true, sanitizedCode: text.toUpperCase(), isQrToken: text.toUpperCase().startsWith("QRC-") };
    }

    return {
      isValid: false,
      error: "The scanned QR code does not contain a recognized traffic citation format or valid electronic ticket token.",
    };
  };

  // Process decoded QR payload
  const handleQrPayload = async (rawText) => {
    setProcessing(true);
    setScanError("");
    setSecurityWarning("");
    setScanResult(null);

    const validation = sanitizeAndValidateQr(rawText);

    if (!validation.isValid) {
      setProcessing(false);
      if (validation.securityAlert) {
        setSecurityWarning(validation.securityAlert);
      } else {
        setScanError(validation.error || "Unsupported QR code format");
      }
      return;
    }

    const citationCode = validation.sanitizedCode;

    try {
      let data;
      if (validation.isQrToken || citationCode.startsWith("QRC-")) {
        // Validate signed cryptographic QR reference
        const valRes = await challanService.validateQr(citationCode);
        data = valRes.challan || valRes;
      } else {
        // Standard reference or plate decode
        data = await challanService.decodeQr(citationCode);
      }

      if (data && data.challan_no) {
        const parsed = {
          challan_no: data.challan_no,
          vehicle_no: data.vehicle_no,
          violation_name: data.violation?.title || "Traffic Violation",
          amount: data.amount,
          date: data.issued_at ? new Date(data.issued_at).toLocaleDateString() : "Recent",
          due_date: data.due_date ? new Date(data.due_date).toLocaleDateString() : "14 Days",
          status: data.status,
          authority: "Traffic Police Command & Control Authority",
          officer_id: data.officer_badge_no || "ITP-W-4091",
        };
        setScanResult(parsed);
        selectChallan(parsed);
      } else {
        setScanError("Challan record not found in verified registry.");
      }
    } catch (err) {
      setScanError(err.message || "Could not connect to central citation database. Please check connection.");
    } finally {
      setProcessing(false);
    }
  };

  // Handle uploaded image file
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setScanResult(null);
    setScanError("");
    setSecurityWarning("");
    setProcessing(true);

    try {
      const html5QrCode = new Html5Qrcode("qr-hidden-file-reader");
      const decodedText = await html5QrCode.scanFile(file, true);
      await html5QrCode.clear();
      handleQrPayload(decodedText);
    } catch (err) {
      console.warn("Client-side image QR scan failed, trying backend OCR fallback:", err);
      // Fallback: If direct image QR decode failed, ask backend OCR service
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await challanService.scanDocument(formData);
        if (res && res.challan_no) {
          handleQrPayload(res.challan_no);
        } else {
          setScanError("Could not locate a clear QR code in this image. Ensure ticket is well-lit and not blurry, or enter the reference manually.");
        }
      } catch (fallbackErr) {
        setScanError("Could not detect a valid citation QR code in this image. Please ensure the QR barcode is in focus, or enter the reference manually.");
      }
    } finally {
      setProcessing(false);
    }
  };

  // Handle manual code submission
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleQrPayload(manualCode.trim());
  };

  return (
    <div className="bg-[#F7F9FC] text-[#10233F] min-h-screen">
      
      {/* Hidden container for file decoding */}
      <div id="qr-hidden-file-reader" style={{ display: "none" }}></div>

      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#061D38] via-[#09254A] to-[#0A2B55] text-white py-14 sm:py-16 border-b border-[#0D3868] relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center space-x-2 text-xs text-sky-200/80 mb-3">
              <Link href="/" className="hover:text-white transition">Home</Link>
              <span>/</span>
              <span className="text-white font-semibold">Scan Challan</span>
            </div>

            <Badge variant="navy" className="mb-3 border border-sky-400/30 text-sky-300 bg-[#0E2F54]">
              Encrypted Token Scanner
            </Badge>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-3">
              Scan Traffic Challan <br />
              <span className="bg-gradient-to-r from-[#00F0FF] via-[#38BDF8] to-[#1685F5] bg-clip-text text-transparent">
                QR Code & Token
              </span>
            </h1>

            <div className="flex items-center space-x-2 text-sky-200 font-bold text-sm sm:text-base mb-4">
              <span>Ask. Understand. Follow.</span>
              <span className="w-8 h-0.5 bg-sky-400 inline-block"></span>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
              Point your camera at the QR code printed on your paper ticket or electronic citation notice to instantly extract verified statutory details.
            </p>
          </div>
        </div>
      </section>

      {/* Main Scanner Container */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Card className="p-6 sm:p-8 shadow-xl border-slate-200">
          
          {/* Scanning Mode Navigation Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl mb-6 text-xs font-bold">
            <button
              onClick={() => {
                setActiveTab("camera");
                setScanError("");
                setSecurityWarning("");
              }}
              className={`flex-1 py-2.5 rounded-lg transition flex items-center justify-center space-x-1.5 ${
                activeTab === "camera"
                  ? "bg-white text-royalBlue shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-deepNavy"
              }`}
            >
              <span>📷</span>
              <span>Live Camera</span>
            </button>

            <button
              onClick={() => {
                stopCameraScanner();
                setActiveTab("upload");
                setScanError("");
                setSecurityWarning("");
              }}
              className={`flex-1 py-2.5 rounded-lg transition flex items-center justify-center space-x-1.5 ${
                activeTab === "upload"
                  ? "bg-white text-royalBlue shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-deepNavy"
              }`}
            >
              <span>📁</span>
              <span>Upload Ticket Photo</span>
            </button>

            <button
              onClick={() => {
                stopCameraScanner();
                setActiveTab("manual");
                setScanError("");
                setSecurityWarning("");
              }}
              className={`flex-1 py-2.5 rounded-lg transition flex items-center justify-center space-x-1.5 ${
                activeTab === "manual"
                  ? "bg-white text-royalBlue shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-deepNavy"
              }`}
            >
              <span>⌨️</span>
              <span>Enter Manually</span>
            </button>
          </div>

          {/* TAB 1: LIVE CAMERA SCANNER */}
          {activeTab === "camera" && (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-[#061D38] border-2 border-slate-700 min-h-[300px] flex flex-col items-center justify-center">
                
                {/* Viewfinder element */}
                <div id={readerId} className="w-full max-w-sm overflow-hidden"></div>

                {!isCameraActive && !cameraError && (
                  <div className="p-8 text-center text-white space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-royalBlue/20 border border-sky-400/30 flex items-center justify-center text-3xl">
                      📷
                    </div>
                    <h3 className="font-bold text-base text-white">
                      Camera Viewfinder Ready
                    </h3>
                    <p className="text-xs text-slate-300 max-w-xs mx-auto">
                      Click below to request camera permission and activate live barcode scanning.
                    </p>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={startCameraScanner}
                      className="mt-2"
                    >
                      Enable Camera & Start Scan →
                    </Button>
                  </div>
                )}

                {/* Live Scanning Guide Overlay */}
                {isCameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
                    <div className="bg-black/60 backdrop-blur-sm text-cyan-300 text-[11px] font-mono px-3 py-1 rounded-full border border-cyan-400/40 animate-pulse">
                      Live Scanner Active • Align Ticket QR
                    </div>

                    {/* Target Reticle */}
                    <div className="w-56 h-56 border-2 border-dashed border-cyan-400 rounded-2xl relative">
                      <div className="absolute inset-x-0 h-0.5 bg-[#00F0FF] shadow-[0_0_12px_#00F0FF] animate-bounce opacity-80"></div>
                    </div>

                    <div className="text-[11px] text-white/80 bg-black/50 px-3 py-1 rounded-full">
                      Position QR code squarely inside brackets
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="p-6 text-center text-rose-300 bg-rose-950/60 rounded-xl m-4 border border-rose-800 text-xs space-y-2">
                    <div className="text-2xl">⚠️</div>
                    <p className="font-semibold">{cameraError}</p>
                    <button
                      onClick={() => setActiveTab("upload")}
                      className="text-white underline font-bold text-xs"
                    >
                      Switch to Upload Image Option →
                    </button>
                  </div>
                )}
              </div>

              {/* Controls: Stop & Switch Camera */}
              {isCameraActive && (
                <div className="flex items-center justify-between pt-2">
                  {cameras.length > 1 && (
                    <select
                      value={selectedCameraId}
                      onChange={(e) => {
                        setSelectedCameraId(e.target.value);
                        stopCameraScanner().then(() => startCameraScanner());
                      }}
                      className="text-xs bg-slate-100 border border-slate-300 rounded-lg p-2 font-medium"
                    >
                      {cameras.map((cam) => (
                        <option key={cam.id} value={cam.id}>
                          {cam.label || `Camera ${cam.id.slice(0, 5)}`}
                        </option>
                      ))}
                    </select>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stopCameraScanner}
                    className="ml-auto"
                  >
                    Stop Camera
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD IMAGE / PDF */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-royalBlue rounded-2xl p-8 text-center transition cursor-pointer relative bg-slate-50 hover:bg-blue-50/20 overflow-hidden">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                />

                {previewUrl ? (
                  <div className="space-y-3 relative z-10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Citation Preview"
                      className="max-h-48 mx-auto rounded-xl shadow-md border border-slate-200"
                    />
                    <p className="text-xs text-royalBlue font-bold">
                      Click to choose another photo or citation screenshot
                    </p>
                  </div>
                ) : (
                  <div className="relative z-10 space-y-2">
                    <span className="text-4xl block mb-1">📸</span>
                    <h4 className="text-sm font-bold text-deepNavy">
                      Drop challan photo or QR code screenshot here
                    </h4>
                    <p className="text-xs text-mutedGrey">
                      Supports PNG, JPG, or JPEG images taken with phone camera
                    </p>
                    <span className="inline-block bg-white border border-slate-300 px-4 py-1.5 rounded-full text-xs font-bold text-royalBlue shadow-sm mt-2">
                      Browse Files
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ENTER REFERENCE MANUALLY */}
          {activeTab === "manual" && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <Input
                label="Challan Reference Number or Vehicle Plate"
                placeholder="e.g. PK-2024-883921 or ICT-LE-1234"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                helperText="Printed directly beneath the QR code on your official paper citation"
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={processing}
                className="w-full"
              >
                Look Up Citation Details →
              </Button>
            </form>
          )}

          {/* Processing Spinner */}
          {processing && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl text-center flex items-center justify-center space-x-2 text-royalBlue text-xs font-bold">
              <div className="w-4 h-4 border-2 border-royalBlue border-t-transparent rounded-full animate-spin"></div>
              <span>Decoding citation token and cross-checking registry...</span>
            </div>
          )}

          {/* Security Alert (Blocked Arbitrary External URLs) */}
          {securityWarning && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-2">
              <div className="flex items-center space-x-1.5 font-bold text-amber-800">
                <span>🛡️</span>
                <span>Security Validation Alert</span>
              </div>
              <p className="leading-relaxed text-[11px] text-amber-800">
                {securityWarning}
              </p>
            </div>
          )}

          {/* Scan Error Alert */}
          {scanError && (
            <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 text-center font-medium">
              {scanError}
            </div>
          )}

          {/* Verified Citation Result Card (Safe Display) */}
          {scanResult && (
            <div className="mt-8 pt-6 border-t border-slate-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <Badge variant="success" dot size="sm">
                  Verified Official Record
                </Badge>
                <span className="text-[11px] font-mono text-mutedGrey">
                  Issuing Authority: {scanResult.authority}
                </span>
              </div>

              {/* Masked / Safe Card Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-mutedGrey block text-[10px] uppercase font-bold">
                      Citation Reference
                    </span>
                    <span className="font-mono font-bold text-sm text-deepNavy">
                      {scanResult.challan_no}
                    </span>
                  </div>

                  <div>
                    <span className="text-mutedGrey block text-[10px] uppercase font-bold">
                      Vehicle Registration
                    </span>
                    <span className="font-mono font-bold text-sm text-royalBlue">
                      {scanResult.vehicle_no}
                    </span>
                  </div>

                  <div>
                    <span className="text-mutedGrey block text-[10px] uppercase font-bold">
                      Offense / Violation Section
                    </span>
                    <span className="font-bold text-deepNavy">
                      {scanResult.violation_name}
                    </span>
                  </div>

                  <div>
                    <span className="text-mutedGrey block text-[10px] uppercase font-bold">
                      Citation Date & Grace Period
                    </span>
                    <span className="font-medium text-slate-700">
                      {scanResult.date} (Due: {scanResult.due_date})
                    </span>
                  </div>
                </div>

                {/* Protected Financial Information Tier */}
                <div className="pt-3 border-t border-slate-200">
                  {isAuthenticated ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-mutedGrey text-[10px] uppercase font-bold block">
                          Statutory Penalty Amount
                        </span>
                        <span className="text-lg font-black text-rose-600">
                          Rs. {scanResult.amount?.toLocaleString()}
                        </span>
                      </div>
                      <Badge variant={scanResult.status === "PENDING" ? "error" : "success"}>
                        Status: {scanResult.status}
                      </Badge>
                    </div>
                  ) : (
                    <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-center space-y-2">
                      <div className="flex items-center justify-center space-x-1.5 text-royalBlue font-bold text-xs">
                        <span>🔒</span>
                        <span>Fine Amount & Payment Protected</span>
                      </div>
                      <p className="text-[11px] text-slate-600 max-w-sm mx-auto">
                        To protect citizen privacy, full citation financials and online settlement are locked. Verify your mobile via SMS OTP to access.
                      </p>
                      <Link href={`/login?redirect=${encodeURIComponent(`/citizen/challans`)}`}>
                        <Button variant="primary" size="sm" className="mt-1">
                          Authorize with Mobile OTP →
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href={`/assistant?challan=${scanResult.challan_no}`}
                  className="flex-1"
                >
                  <Button variant="primary" size="md" className="w-full">
                    🎙️ Ask Voice Assistant About Violation →
                  </Button>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setScanResult(null);
                    setPreviewUrl(null);
                    setSelectedFile(null);
                    setManualCode("");
                  }}
                  className="sm:w-auto px-4 py-2.5 rounded-full border border-slate-300 hover:bg-slate-100 text-xs font-bold text-deepNavy transition"
                >
                  Scan Another Ticket
                </button>
              </div>
            </div>
          )}

          {/* Quick Demo Test Presets */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <span className="text-xs text-mutedGrey block mb-2.5 font-bold">
              Or test with sample Pakistani citation codes:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQrPayload("PK-2024-883921")}
                className="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 hover:border-royalBlue text-left transition group"
              >
                <div className="font-mono font-bold text-royalBlue group-hover:text-brightBlue">
                  PK-2024-883921
                </div>
                <div className="text-[11px] text-mutedGrey mt-0.5">
                  Over-Speeding (Sec 113) • Rs. 5,000
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQrPayload("PK-2024-774102")}
                className="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 hover:border-royalBlue text-left transition group"
              >
                <div className="font-mono font-bold text-royalBlue group-hover:text-brightBlue">
                  PK-2024-774102
                </div>
                <div className="text-[11px] text-mutedGrey mt-0.5">
                  Riding without Helmet (Sec 89-A) • Rs. 2,000
                </div>
              </button>
            </div>
          </div>

        </Card>
      </div>

    </div>
  );
}
