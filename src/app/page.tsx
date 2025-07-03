"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleRedirect = () => {
    router.push("/agent");
  };

  return (
    <div className="relative min-h-screen from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="relative">
          {/* Decorative elements */}
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl"></div>

          {/* Main content */}
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg ring-1 ring-black/5 p-8 sm:p-12">
            <div className="text-center space-y-8 max-w-6xl mx-auto">
              {/* Header section */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent pb-1">
                  Real Estate Scraper
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
                  Welcome to the Real Estate Scraper. Click below to get started with the agent.
                </p>
              </div>

              {/* Redirect button */}
              <div className="space-y-6">
                <button
                  onClick={handleRedirect}
                  className="w-full max-w-md mx-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-[1px]"
                >
                  Go to Agent
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
