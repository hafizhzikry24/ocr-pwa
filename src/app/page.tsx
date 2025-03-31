"use client"

import type React from "react"

import { useState, useRef } from "react"
import { createWorker } from "tesseract.js"
import Camera from "@/components/Camera"
import { ThemeSwitcher } from "@/components/ThemeSwitcher"

export default function Home() {
  const [text, setText] = useState<string>("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [showCamera, setShowCamera] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>("upload")
  const [showToast, setShowToast] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<{ title: string; message: string; type: "success" | "error" }>({
    title: "",
    message: "",
    type: "success",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      setText("")
      processImage(url)
    }
  }

  const handleCameraCapture = () => {
    try {
      if (navigator.mediaDevices) {
        setShowCamera(true)
      } else {
        showToastNotification("Camera not available", "Please select an image instead.", "error")
        if (fileInputRef.current) {
          fileInputRef.current.click()
        }
      }
    } catch (error) {
      console.error("Error accessing media devices:", error)
      showToastNotification("Error accessing camera", "Please select an image instead.", "error")
      if (fileInputRef.current) {
        fileInputRef.current.click()
      }
    }
  }

  const handleCapturedImage = (capturedImageUrl: string) => {
    setShowCamera(false)
    setImageUrl(capturedImageUrl)
    setText("")
    processImage(capturedImageUrl)
  }

  const processImage = async (url: string) => {
    setIsProcessing(true)
    setProgress(0)

    try {
      const worker = await createWorker({
        logger: (message) => {
          if (message.status === "recognizing text") {
            setProgress(message.progress * 100)
          }
        },
      })

      await worker.loadLanguage("eng")
      await worker.initialize("eng")
      const { data } = await worker.recognize(url)
      setText(data.text)
      await worker.terminate()

      showToastNotification("Success", "Text extracted successfully", "success")
    } catch (error) {
      console.error("Error during OCR processing:", error)
      setText("Error processing image. Please try again.")
      showToastNotification("Processing error", "Error processing image. Please try again.", "error")
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = () => {
    if (text) {
      navigator.clipboard.writeText(text)
      showToastNotification("Copied", "Text has been copied to your clipboard.", "success")
    }
  }

  const showToastNotification = (title: string, message: string, type: "success" | "error") => {
    setToastMessage({ title, message, type })
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }
  
  const handleTabChange = (tab: string) => {
    // Reset image and text when changing tabs
    if (tab !== activeTab) {
      setActiveTab(tab)
      setImageUrl(null)
      setText("")
      // Reset file input when changing tab
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <ThemeSwitcher />
      
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-slate-500 mb-2">
            OCReadEasy
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Extract text from images with ease</p>
        </header>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mt-24">
          <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Image to Text Converter</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Upload an image or take a photo to extract text</p>
          </div>

          <div className="p-6">
            <div className="w-full mb-6">
              <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
                    activeTab === "upload"
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                  onClick={() => handleTabChange("upload")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-upload"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  Upload Image
                </button>
                <button
                  className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
                    activeTab === "camera"
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                  onClick={() => handleTabChange("camera")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-camera"
                  >
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                    <circle cx="12" cy="13" r="3"></circle>
                  </svg>
                  Take Photo
                </button>
              </div>
            </div>

            {activeTab === "upload" && (
              <div className="flex flex-col items-center">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                />
                <div
                  className={`w-full border-2 border-dashed rounded-lg p-8 transition-all duration-200 ease-in-out
                    flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10
                    ${!imageUrl && activeTab === "upload" ? "h-64" : "h-auto"}
                    ${imageUrl && activeTab === "upload" ? "border-blue-400 bg-blue-50 dark:bg-blue-900/10" : "border-gray-200 dark:border-gray-700"}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {!imageUrl && activeTab === "upload" ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400 dark:text-gray-500 mb-4"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      <p className="text-center text-gray-500 dark:text-gray-400">
                        Click to upload an image or drag and drop
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Supports JPG, PNG, GIF</p>
                    </>
                  ) : imageUrl && activeTab === "upload" ? (
                    <div className="w-full">
                      <img
                        src={imageUrl || "/placeholder.svg"}
                        alt="Uploaded image"
                        className="w-full max-h-[400px] object-contain rounded-md"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {activeTab === "camera" && (
              <div className="flex flex-col items-center">
                <button
                  className="w-full h-16 mb-4 flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={handleCameraCapture}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-camera"
                  >
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                    <circle cx="12" cy="13" r="3"></circle>
                  </svg>
                  Open Camera
                </button>

                {imageUrl && activeTab === "camera" && (
                  <div className="w-full mt-4">
                    <img
                      src={imageUrl || "/placeholder.svg"}
                      alt="Captured image"
                      className="w-full max-h-[400px] object-contain rounded-md border border-gray-200 dark:border-gray-700"
                    />
                  </div>
                )}
              </div>
            )}

            {isProcessing && (
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Processing image...</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{Math.round(progress)}%</p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {text && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Extracted Text
                  </h3>
                  <button
                    className="inline-flex items-center px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    onClick={copyToClipboard}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="h-64 w-full overflow-auto rounded-md">
                    <div className="p-4">
                      <p className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200">{text}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 px-6 py-3 flex flex-wrap justify-between text-xs text-gray-500 dark:text-gray-400">
            <a
              href="https://www.npmjs.com/package/tesseract.js"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Made with Tesseract.js
            </a>
            <a
              href="https://zikkdev.vercel.app/"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              PWA App by zikkdev
            </a>
          </div>
        </div>
      </div>

      {showCamera && <Camera onCapture={handleCapturedImage} onClose={() => setShowCamera(false)} />}

      {/* Toast Notification */}
      {showToast && (
        <div
          className={`fixed bottom-4 right-4 max-w-xs bg-white dark:bg-gray-800 rounded-lg shadow-lg border ${
            toastMessage.type === "success" ? "border-green-500" : "border-red-500"
          } transition-opacity duration-300 z-50`}
        >
          <div className="flex p-4">
            <div className={`flex-shrink-0 ${toastMessage.type === "success" ? "text-green-500" : "text-red-500"}`}>
              {toastMessage.type === "success" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{toastMessage.title}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{toastMessage.message}</p>
            </div>
            <button
              className="ml-auto -mx-1.5 -my-1.5 bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg p-1.5"
              onClick={() => setShowToast(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

