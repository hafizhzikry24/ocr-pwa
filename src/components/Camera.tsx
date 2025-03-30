"use client";

import { useEffect, useRef, useState } from "react";

interface CameraProps {
  onCapture: (imageUrl: string) => void;
  onClose: () => void;
}

export default function Camera({ onCapture, onClose }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const cameras = devs.filter(device => device.kind === "videoinput");
        setDevices(cameras);

        let deviceId = "";
        const backCamera = cameras.find(camera => 
          camera.label.toLowerCase().includes("back") || 
          camera.label.toLowerCase().includes("belakang")
        );
        
        if (backCamera) {
          deviceId = backCamera.deviceId;
          setCurrentDeviceId(deviceId);
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            facingMode: deviceId ? undefined : "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsActive(true);
          setHasPermission(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setErrorMsg("Failed to access camera. Make sure you give permission and the device has a camera.");
        setHasPermission(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const switchCamera = async () => {
    if (!videoRef.current) return;
    
    const currentStream = videoRef.current.srcObject as MediaStream;
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    const currentIndex = devices.findIndex(d => d.deviceId === currentDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDeviceId = devices[nextIndex]?.deviceId || "";
    
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: nextDeviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        setCurrentDeviceId(nextDeviceId);
      }
    } catch (err) {
      console.error("Error switching camera:", err);
      setErrorMsg("Error switching camera.");
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageUrl = canvas.toDataURL("image/jpeg");
      onCapture(imageUrl);
    }
  };

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
        <div className="bg-white p-6 rounded-lg max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Access Camera Rejected</h2>
          <p className="mb-4 text-red-600">{errorMsg}</p>
          <button 
            onClick={onClose}
            className="w-full rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm h-12 px-5"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90 z-50">
      <div className="relative w-full max-w-md">
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 z-10 bg-black bg-opacity-50">
          <h2 className="text-white font-bold">Camera</h2>
          <button 
            onClick={onClose}
            className="text-white bg-red-600 rounded-full w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="relative overflow-hidden rounded-lg aspect-[3/4] bg-black">
          {isActive ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              muted 
              className="absolute top-0 left-0 w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4">
          {devices.length > 1 && (
            <button 
              onClick={switchCamera}
              className="bg-white bg-opacity-20 text-white rounded-full w-12 h-12 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 1l4 4-4 4"></path>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <path d="M7 23l-4-4 4-4"></path>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
              </svg>
            </button>
          )}
          
          <button 
            onClick={takePhoto}
            className="bg-white rounded-full w-16 h-16 flex items-center justify-center border-4 border-gray-400"
          />
        </div>
      </div>
    </div>
  );
} 