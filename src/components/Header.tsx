import React from "react";
import Image from "next/image";

const Header = () => {
  return (
    <header className="p-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo on the left */}
          <div className="flex items-center">
            <Image src="/logo2.png" alt="Logo" width={100} height={100} />
          </div>

          {/* Company link on the right */}
          <div className="relative">
            {/* Decorative gradient orbs */}
            <div className="absolute -top-2 -left-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-2 -right-4 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>

            {/* Company link content */}
            <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg ring-1 ring-black/5 px-6 py-3">
              <a
                href="https://juvosolutions.co"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105"
              >
                Juvo Solutions
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
