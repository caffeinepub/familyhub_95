import React from "react";
import { Plus, Link, Home, LogOut } from "lucide-react";

interface OnboardingChoiceProps {
  onCreateFamily: () => void;
  onJoinFamily: () => void;
  onLogout: () => void;
}

export const OnboardingChoice: React.FC<OnboardingChoiceProps> = ({
  onCreateFamily,
  onJoinFamily,
  onLogout,
}) => {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="bg-brand-surface rounded-2xl border border-brand-gray-200 p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-card bg-brand-primary-500 flex items-center justify-center shadow-soft mx-auto mb-4">
            <Home className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-light text-brand-gray-800 mb-2">
            Welcome to FamilyHub
          </h1>
          <p className="text-brand-gray-500 font-light">
            Get started by creating a new family or joining an existing one.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={onCreateFamily}
            className="w-full p-4 bg-brand-primary-500 text-white rounded-xl hover:bg-brand-primary-600 transition-colors flex items-center justify-center gap-3 font-light"
          >
            <Plus className="w-6 h-6" />
            <div className="text-left">
              <div className="font-light">Create a New Family</div>
              <div className="text-sm opacity-90 font-extralight">
                Start fresh as the family admin
              </div>
            </div>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-brand-surface text-brand-gray-400 font-light">
                or
              </span>
            </div>
          </div>

          <button
            onClick={onJoinFamily}
            className="w-full p-4 bg-brand-surface border-2 border-brand-gray-300 text-brand-gray-800 rounded-xl hover:border-brand-primary-500 hover:bg-brand-gray-50 transition-colors flex items-center justify-center gap-3 font-light"
          >
            <Link className="w-6 h-6" />
            <div className="text-left">
              <div className="font-light">Join Existing Family</div>
              <div className="text-sm text-brand-gray-500 font-extralight">
                Use an invite code from your family
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onLogout}
          className="w-full mt-6 p-2 text-brand-gray-500 hover:text-brand-gray-700 transition-colors flex items-center justify-center gap-2 font-light text-sm"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </div>
  );
};
