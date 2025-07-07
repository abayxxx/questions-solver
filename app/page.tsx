"use client";

import type React from "react";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Upload,
  RotateCcw,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Webcam from "react-webcam";

interface AnalysisResult {
  isQuestion: boolean;
  confidence: number;
  explanation: string;
  detectedText?: string;
  answer?: string;
}

export default function PhotoQuestionChecker() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const webcamRef = useRef<Webcam>(null);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "environment", // Default to back camera
  };

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
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API call failed:", error);
      throw new Error("Failed to analyze image");
    }
  }, []);

  const capturePhoto = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      setError("Failed to capture photo. Please try again.");
      return;
    }

    setCapturedImage(imageSrc);
    setShowCamera(false);

    // Analyze the image
    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const analysisResult = await analyzeImage(imageSrc);
      setResult(analysisResult);
    } catch (err) {
      setError("Failed to analyze image. Please try again.");
      console.error("Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeImage]);

  const startCamera = useCallback(() => {
    setError(null);
    setShowCamera(true);
  }, []);

  const stopCamera = useCallback(() => {
    setShowCamera(false);
  }, []);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("Image too large. Please select an image under 10MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        setCapturedImage(imageDataUrl);

        // Analyze the image
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

  const resetCapture = useCallback(() => {
    setCapturedImage(null);
    setResult(null);
    setError(null);
    setShowCamera(false);
  }, []);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    console.error("Webcam error:", error);
    setError(
      "Camera access failed. Please check permissions and try again, or use the upload option."
    );
    setShowCamera(false);
  }, []);

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
              {!capturedImage && !showCamera && (
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
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photo
                      </label>
                    </Button>
                  </div>
                </div>
              )}

              {showCamera && !capturedImage && (
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  onUserMediaError={handleUserMediaError}
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
              {showCamera && !capturedImage && (
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
                    <AlertCircle className="h-5 w-5" />
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
      </div>
    </div>
  );
}
