import React from "react";
import { AlertTriangle } from "lucide-react";

export const Error = ({
  message,
  onRetry,
}: {
  message?: string | React.ReactNode;
  onRetry?: () => void;
}) => {
  return (
    <div className="flex flex-1 items-center justify-center py-16 px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        {message ? (
          typeof message === "string" ? (
            <p className="text-gray-600 mb-8">{message}</p>
          ) : (
            message
          )
        ) : (
          <>
            <h1 className="mb-3 text-3xl font-bold text-gray-900">
              Something went wrong
            </h1>

            <p className="mb-8 text-gray-600">
              An error occurred while loading this page.
            </p>
          </>
        )}

        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-white font-medium transition-colors hover:bg-orange-600"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};
