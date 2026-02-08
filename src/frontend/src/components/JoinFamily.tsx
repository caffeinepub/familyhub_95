import React, { useState, useEffect } from "react";
import { useInviteDetails, useJoinFamily } from "../hooks/useQueries";
import { FormButton } from "./shared/FormButton";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Link, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface JoinFamilyProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const JoinFamily: React.FC<JoinFamilyProps> = ({
  onBack,
  onSuccess,
}) => {
  const [inviteCode, setInviteCode] = useState("");
  const [debouncedCode, setDebouncedCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const {
    data: inviteDetails,
    isLoading: isLoadingDetails,
    error: detailsError,
  } = useInviteDetails(debouncedCode);

  const joinFamily = useJoinFamily();

  // Debounce the invite code input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inviteCode.length >= 9) {
        // XXXX-XXXX format
        setDebouncedCode(inviteCode.toUpperCase());
      } else {
        setDebouncedCode("");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inviteCode]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");

    // Auto-add dash after 4 characters
    if (value.length === 4 && !value.includes("-")) {
      value = value + "-";
    }

    // Limit to 9 characters (XXXX-XXXX)
    if (value.length <= 9) {
      setInviteCode(value);
      setError(null);
    }
  };

  const handleJoin = async () => {
    if (!inviteDetails) {
      setError("Please enter a valid invite code");
      return;
    }

    try {
      await joinFamily.mutateAsync(debouncedCode);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join family");
    }
  };

  const isValidCode = inviteCode.length === 9 && inviteCode.includes("-");
  const showPreview = isValidCode && inviteDetails && !detailsError;
  const showError = isValidCode && detailsError && !isLoadingDetails;

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="bg-brand-surface rounded-2xl border border-brand-gray-200 p-8 max-w-md w-full">
        <button
          onClick={onBack}
          className="text-brand-gray-500 hover:text-brand-gray-800 mb-4 flex items-center gap-2 font-light"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-center mb-6">
          <Link className="w-12 h-12 text-brand-primary-500 mx-auto mb-3" />
          <h1 className="text-2xl font-light text-brand-gray-800 mb-2">
            Join a Family
          </h1>
          <p className="text-brand-gray-500 text-sm font-light">
            Enter the invite code your family admin shared with you
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-4 text-sm font-light border border-red-500/20">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Invite Code Input */}
          <div>
            <Label className="text-brand-gray-600 font-light mb-2">
              Invite Code
            </Label>
            <input
              type="text"
              value={inviteCode}
              onChange={handleCodeChange}
              placeholder="XXXX-XXXX"
              className="w-full px-4 py-4 text-center text-2xl font-mono tracking-widest bg-brand-gray-100 border border-brand-gray-300 text-brand-gray-800 placeholder:text-brand-gray-400 rounded-lg focus:ring-2 focus:ring-brand-primary-500 focus:border-transparent uppercase"
              autoComplete="off"
            />
            <p className="text-sm text-brand-gray-400 font-light mt-2 text-center">
              The code looks like: ABCD-1234
            </p>
          </div>

          {/* Loading State */}
          {isValidCode && isLoadingDetails && (
            <div className="bg-brand-gray-100/30 rounded-lg p-4 text-center border border-brand-gray-200">
              <Loader2 className="w-6 h-6 text-brand-primary-500 animate-spin mx-auto mb-2" />
              <p className="text-brand-gray-500 text-sm font-light">
                Checking invite code...
              </p>
            </div>
          )}

          {/* Invalid Code Error */}
          {showError && (
            <div className="bg-red-500/10 rounded-lg p-4 text-center border border-red-500/20">
              <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-red-400 font-light">Invalid Invite Code</p>
              <p className="text-red-400/70 text-sm font-extralight mt-1">
                Please check the code and try again
              </p>
            </div>
          )}

          {/* Valid Code Preview */}
          {showPreview && (
            <div className="bg-green-500/10 rounded-lg p-4 border-2 border-green-500/20">
              <div className="text-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-green-400 font-light">Valid Invite Code!</p>
              </div>

              <div className="bg-brand-gray-100/50 rounded-lg p-4 mb-4 border border-brand-gray-200">
                <div className="text-sm text-brand-gray-500 font-light mb-3">
                  You're joining:
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-md border border-brand-gray-200"
                    style={{ backgroundColor: inviteDetails.memberColor }}
                  >
                    {inviteDetails.memberAvatarEmoji}
                  </div>
                  <div>
                    <div className="font-light text-brand-gray-800">
                      {inviteDetails.memberName}
                    </div>
                    <div className="text-sm text-brand-gray-500 font-extralight">
                      in {inviteDetails.familyName}
                    </div>
                  </div>
                </div>
              </div>

              <FormButton
                onClick={handleJoin}
                variant="primary"
                loading={joinFamily.isPending}
                disabled={joinFamily.isPending}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                {joinFamily.isPending ? "Joining..." : "Join Family"}
              </FormButton>
            </div>
          )}

          {/* Initial state - no code entered */}
          {!isValidCode && (
            <div className="text-center text-brand-gray-500 text-sm font-light">
              <p>Ask your family admin for an invite code.</p>
              <p className="mt-1">
                They can find it in the Family section of their app.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
