"use client";

import { useState, useRef } from "react";
import { createWorker } from "tesseract.js";
import Camera from "@/components/Camera";

export default function Home() {

  const [text, setText] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setText("");
      processImage(url);
    }
  };

  const handleCameraCapture = () => {
    try {
      if (navigator.mediaDevices) {
        setShowCamera(true);
      } else {
        alert("camera not available");
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Error accessing camera. Please select an image as a replacement.");
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const handleCapturedImage = (capturedImageUrl: string) => {
    setShowCamera(false);
    setImageUrl(capturedImageUrl);
    setText("");
    processImage(capturedImageUrl);
  };

  const processImage = async (url: string) => {
    setIsProcessing(true);
    setProgress(0);
  
    try {
      const worker = await createWorker({
        logger: (message) => {
          if (message.status === "recognizing text") {
            setProgress(message.progress * 100);
          }
        },
      });

      await worker.loadLanguage("eng");
      await worker.initialize("eng");
      const { data } = await worker.recognize(url);
      setText(data.text);
      await worker.terminate();
    } catch (error) {
      console.error("Error during OCR processing:", error);
      setText("Error processing image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };
  

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="w-full text-center">
        <h1 className="text-2xl font-bold mb-2">OCReadEasy App</h1>
        <p className="text-sm text-gray-600">Scan and extract text from images</p>
      </header>
      
      <main className="flex flex-col gap-8 items-center w-full max-w-md -mt-16">
        <div className="w-full">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleImageUpload} 
            ref={fileInputRef}
          />
          
          <div className="flex gap-6 justify-center mb-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm h-12 px-5 w-full"
            >
              Choose Image
            </button>
            <button
              onClick={handleCameraCapture}
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm h-12 px-5 w-full"
            >
              Take Photo
            </button>
          </div>
          
          {imageUrl && (
            <div className="relative w-full aspect-video mb-6">
              <img 
                src={imageUrl} 
                alt="Uploaded image" 
                className="w-full h-full object-contain border border-gray-200 rounded-lg"
              />
            </div>
          )}
          
          {isProcessing && (
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-center mt-2 text-sm">Processing... {Math.round(progress)}%</p>
            </div>
          )}
          
          {text && (
            <div className="border border-gray-200 rounded-lg px-4 w-full h-64 overflow-y-auto">
              <h2 className="text-lg font-semibold mb-2">Extracted Text:</h2>
              <p className="whitespace-pre-wrap font-mono text-sm">{text}</p>
            </div>
          )}
        </div>
      </main>
      
      <footer className="flex gap-4 flex-wrap items-center justify-center text-sm text-gray-600 -mt-32">
        <a href="https://www.npmjs.com/package/tesseract.js/v/2.1.1">Made with Tesseract.js</a>
        <a href="https://zikkdev.vercel.app/">PWA App by zikkdev</a>
      </footer>
      
      {showCamera && (
        <Camera 
          onCapture={handleCapturedImage} 
          onClose={() => setShowCamera(false)} 
        />
      )}
    </div>
  );
}
