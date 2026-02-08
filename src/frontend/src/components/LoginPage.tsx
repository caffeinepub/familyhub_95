import React from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="bg-brand-surface p-8 rounded-2xl border border-brand-gray-200 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-card bg-brand-primary-500 flex items-center justify-center shadow-soft mx-auto mb-4">
            <Home className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-extralight text-brand-gray-800 mb-2">
            FamilyHub
          </h1>
          <p className="text-brand-gray-500 font-light">
            Keep your family organized, connected, and aligned
          </p>
        </div>
        <Button
          onClick={() => login()}
          className="w-full bg-brand-primary-500 hover:bg-brand-primary-600 text-white py-3 px-6 font-light"
        >
          Sign in with Internet Identity
        </Button>
        <p className="text-xs text-brand-gray-400 font-extralight text-center mt-4">
          Powered by the Internet Computer
        </p>
      </div>
    </div>
  );
};
