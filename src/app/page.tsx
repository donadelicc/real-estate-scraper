"use client";

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/hello");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setMessage(""); // Clear any previous messages
    } else {
      setSelectedFile(null);
      setMessage("Please select a valid PDF file");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a PDF file first");
      return;
    }
    setIsLoading(true);
    // TODO: Implement actual file upload logic here
    setMessage("File upload functionality coming soon!");
    setIsLoading(false);
  };

  return (
    <div className="relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="relative">
          {/* Decorative elements */}
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-deep-sea/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-kimchi/5 rounded-full blur-3xl"></div>
          
          {/* Main content */}
          <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl shadow-md ring-1 ring-black/5 p-8 sm:p-12">
            <div className="text-center space-y-8 max-w-3xl mx-auto">
              {/* Header section */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-poppins font-bold bg-gradient-to-r from-dark-royalty to-deep-sea bg-clip-text text-transparent pb-1">
                  Juvo PDF-Processing
                </h1>
                <p className="text-lg sm:text-xl text-deep-sea/80 font-poppins max-w-2xl mx-auto">
                  Transform your documents with our advanced PDF processing solution
                </p>
              </div>
              
              {/* File upload section */}
              <div className="space-y-6">
                <div className="relative group">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="block w-full p-8 border-2 border-dashed border-dark-royalty/40 rounded-xl cursor-pointer group-hover:border-dark-royalty/80 transition-colors duration-300"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-center">
                        <svg className="w-12 h-12 text-dark-royalty/40 group-hover:text-dark-royalty/80 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div className="text-deep-sea font-poppins">
                        <p className="text-lg font-medium">
                          {selectedFile ? selectedFile.name : "Drop your PDF here, or click to browse"}
                        </p>
                        <p className="text-sm text-deep-sea/60">PDF files only</p>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || isLoading}
                    className="group relative bg-gradient-to-r from-dark-royalty/100 to-dark-royalty/75 text-white px-8 py-4 rounded-xl font-poppins text-lg font-medium tracking-wide shadow-lg shadow-deep-sea/20 hover:shadow-md hover:shadow-deep-sea/25 transition-all duration-300 ease-out hover:-translate-y-[1px] disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    <span className="relative z-10">
                      {isLoading ? 'Processing...' : 'Process PDF'}
                    </span>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-dark-royalty/80 to-dark-royalty opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out"></div>
                  </button>
                </div>

                {/* Message display */}
                {message && (
                  <div className="transform transition-all duration-300 ease-out">
                    <div className="bg-gradient-to-r from-deep-sea/5 to-dark-royalty/10 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                      <p className="text-deep-sea font-poppins text-lg">{message}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
