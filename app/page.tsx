"use client";

import type React from "react";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, RotateCcw, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface AnalysisResult {
  isQuestion: boolean;
  confidence: number;
  explanation: string;
  detectedText?: string;
  answer: string;
}

export default function PhotoQuestionChecker() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported on this device");
      }

      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
        },
      };

      console.log("Requesting camera access...");
      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      console.log("Camera access granted");

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("webkit-playsinline", "true");

        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch((err) => {
              console.error("Error playing video:", err);
              setError("Failed to start video. Try refreshing the page.");
            });
          }
        }, 100);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Camera access error:", err);

      if (err.name === "NotAllowedError") {
        setError(
          "Camera access denied. On Mac: Go to System Preferences > Security & Privacy > Camera, and allow your browser to access the camera."
        );
      } else if (err.name === "NotFoundError") {
        setError(
          "No camera found. Make sure your Mac camera is not being used by another app."
        );
      } else if (err.name === "NotReadableError") {
        setError(
          "Camera is busy. Close other apps using the camera (like FaceTime, Zoom, etc.) and try again."
        );
      } else {
        setError(
          `Camera error: ${err.message}. Try the file upload option below.`
        );
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const analyzeImage = useCallback(async (imageDataUrl: string) => {
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: imageDataUrl }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API call failed:", error);
      throw new Error("Failed to analyze image");
    }
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(imageDataUrl);
    stopCamera();

    // Analyze the image via API
    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const analysisResult = await analyzeImage(imageDataUrl);
      setResult(analysisResult);
    } catch (err) {
      setError("Failed to analyze image. Please try again.");
      console.error("Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [stopCamera, analyzeImage]);

  const resetCapture = useCallback(() => {
    setCapturedImage(null);
    setResult(null);
    setError(null);
    startCamera();
  }, [startCamera]);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        setCapturedImage(imageDataUrl);

        // Analyze the image via API
        setIsAnalyzing(true);
        setResult(null);
        setError(null);

        try {
          const analysisResult = await analyzeImage(imageDataUrl);
          setResult(analysisResult);
        } catch (err) {
          setError("Failed to analyze image. Please try again.");
          console.error("Analysis error:", err);
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    },
    [analyzeImage]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Camera className="h-6 w-6" />
              Question Photo Checker
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Take a photo to check if it contains a question
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Camera/Image Display */}
            <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
              {!capturedImage && !stream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <Button onClick={startCamera} size="lg">
                    <Camera className="h-5 w-5 mr-2" />
                    Start Camera
                  </Button>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Or upload an image
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button asChild variant="outline">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        Upload Photo
                      </label>
                    </Button>
                  </div>
                </div>
              )}

              {stream && !capturedImage && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  webkit-playsinline="true"
                  className="w-full h-full object-cover"
                />
              )}

              {capturedImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={capturedImage || "/placeholder.svg"}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-2 justify-center">
              {stream && !capturedImage && (
                <>
                  <Button onClick={capturePhoto} size="lg">
                    <Camera className="h-5 w-5 mr-2" />
                    Capture
                  </Button>
                  <Button onClick={stopCamera} variant="outline">
                    Cancel
                  </Button>
                </>
              )}

              {capturedImage && (
                <Button onClick={resetCapture} variant="outline">
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Take Another
                </Button>
              )}
            </div>

            {/* Analysis Loading */}
            {isAnalyzing && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Analyzing image...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-700">
                    <XCircle className="h-5 w-5" />
                    <span className="text-sm">{error}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Display */}
            {result && (
              <Card
                className={`border-2 ${
                  result.isQuestion
                    ? "border-green-200 bg-green-50"
                    : "border-orange-200 bg-orange-50"
                }`}
              >
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.isQuestion ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-orange-600" />
                      )}
                      <span className="font-medium">
                        {result.isQuestion
                          ? "Question Detected!"
                          : "No Question Found"}
                      </span>
                    </div>
                    <Badge
                      variant={result.isQuestion ? "default" : "secondary"}
                    >
                      {Math.round(result.confidence * 100)}% confident
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {result.explanation}
                  </p>
                  {result.answer && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Answer:
                      </p>
                      <p className="text-sm">{result.answer}</p>
                    </div>
                  )}

                  {result.detectedText && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Detected Text:
                      </p>
                      <p className="text-sm">{result.detectedText}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
