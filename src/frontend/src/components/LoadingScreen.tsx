import React from "react";

export const LoadingScreen = () => {
  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex items-center justify-center">
            <div className="flex space-x-2">
              <div className="h-3 w-3 animate-bounce rounded-full bg-brand-primary-500 [animation-delay:-0.3s]"></div>
              <div className="h-3 w-3 animate-bounce rounded-full bg-brand-primary-500 [animation-delay:-0.15s]"></div>
              <div className="h-3 w-3 animate-bounce rounded-full bg-brand-primary-500"></div>
            </div>
          </div>
        </div>
        <p className="mt-2 text-sm font-light text-brand-gray-500">
          Please wait a moment
        </p>
      </div>
    </div>
  );
};
