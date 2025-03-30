"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, CameraIcon, RotateCw, Check } from "lucide-react"

interface CameraProps {
  onCapture: (imageUrl: string) => void
  onClose: () => void
}

export default function Camera({ onCapture, onClose }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null

    const startCamera = async () => {
      try {
        if (videoRef.current) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
            audio: false,
          })

          videoRef.current.srcObject = stream
          setIsCameraReady(true)
          setError(null)
        }
      } catch (err) {
        console.error("Error accessing camera:", err)
        setError("Could not access camera. Please check permissions.")
      }
    }

    startCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [facingMode])

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert canvas to data URL
        const imageUrl = canvas.toDataURL("image/png")
        setCapturedImage(imageUrl)
      }
    }
  }

  const switchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
  }

  const confirmCapture = () => {
    if (capturedImage) {
      onCapture(capturedImage)
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden relative">
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/70"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="aspect-[4/3] bg-black relative overflow-hidden">
          {!capturedImage ? (
            <>
              {error ? (
                <div className="absolute inset-0 flex items-center justify-center text-center p-4 text-white bg-black">
                  <p>{error}</p>
                </div>
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              )}
            </>
          ) : (
            <img src={capturedImage || "/placeholder.svg"} alt="Captured" className="w-full h-full object-contain" />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-4 flex justify-between items-center bg-muted/30">
          {!capturedImage ? (
            <>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={switchCamera}
                disabled={!isCameraReady}
              >
                <RotateCw className="h-5 w-5" />
              </Button>
              <Button
                variant="default"
                size="lg"
                className="rounded-full h-14 w-14 p-0"
                onClick={captureImage}
                disabled={!isCameraReady}
              >
                <CameraIcon className="h-6 w-6" />
              </Button>
              <div className="w-10" /> {/* Spacer for alignment */}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={retakePhoto}>
                Retake
              </Button>

              <Button variant="default" onClick={confirmCapture} className="gap-1">
                <Check className="h-4 w-4" />
                Use Photo
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

