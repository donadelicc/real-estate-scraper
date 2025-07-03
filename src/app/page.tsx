"use client";

import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import GradientButton from "@/components/ui/GradientButton";

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
          <Card variant="glass" padding="lg">
            <div className="text-center space-y-6 max-w-6xl mx-auto">
              {/* Header section */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent pb-1">
                  Real Estate Scraper
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
                  Welcome to the Real Estate Scraper. Click below to get started
                  with the agent.
                </p>
              </div>

              {/* Redirect button */}
              <div className="space-y-4">
                <GradientButton
                  onClick={handleRedirect}
                  size="lg"
                  className="w-full max-w-md mx-auto"
                >
                  Go to Agent
                </GradientButton>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
