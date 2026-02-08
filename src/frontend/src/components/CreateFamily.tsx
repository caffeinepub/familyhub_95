import React, { useState } from "react";
import { useCreateFamily } from "../hooks/useQueries";
import { AVATARS, COLORS } from "../constants";
import { FormButton } from "./shared/FormButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Home } from "lucide-react";

interface CreateFamilyProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const CreateFamily: React.FC<CreateFamilyProps> = ({
  onBack,
  onSuccess,
}) => {
  const createFamily = useCreateFamily();
  const [familyName, setFamilyName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!familyName.trim() || !adminName.trim()) {
      setError("Please fill in all fields");
      return;
    }

    try {
      await createFamily.mutateAsync({
        familyName: familyName.trim(),
        adminName: adminName.trim(),
        adminColor: selectedColor,
        adminAvatarEmoji: selectedAvatar,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create family");
    }
  };

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
          <Home className="w-12 h-12 text-brand-primary-500 mx-auto mb-3" />
          <h1 className="text-2xl font-light text-brand-gray-800 mb-2">
            Create Your Family
          </h1>
          <p className="text-brand-gray-500 text-sm font-light">
            Set up your family and your admin profile
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-4 text-sm font-light border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Family Name */}
          <div>
            <Label className="text-brand-gray-600 font-light mb-2">
              Family Name
            </Label>
            <Input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="e.g., The Smiths"
              className="bg-brand-gray-100 border-brand-gray-300 text-brand-gray-800 placeholder:text-brand-gray-400 font-light"
              required
            />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-brand-surface text-brand-gray-400 font-light">
                Your Profile
              </span>
            </div>
          </div>

          {/* Admin Name */}
          <div>
            <Label className="text-brand-gray-600 font-light mb-2">
              Your Name
            </Label>
            <Input
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="e.g., Dad, Mom, John"
              className="bg-brand-gray-100 border-brand-gray-300 text-brand-gray-800 placeholder:text-brand-gray-400 font-light"
              required
            />
          </div>

          {/* Avatar Selection */}
          <div>
            <Label className="text-brand-gray-600 font-light mb-2">
              Choose Your Avatar
            </Label>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 transition-all ${
                    selectedAvatar === avatar
                      ? "border-brand-primary-500 bg-brand-primary-500/10 scale-110"
                      : "border-brand-gray-300 hover:border-brand-gray-400"
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <Label className="text-brand-gray-600 font-light mb-2">
              Choose Your Color
            </Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? "border-brand-gray-800 scale-110"
                      : "border-transparent hover:border-brand-gray-400"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-brand-gray-100/30 rounded-lg p-4 border border-brand-gray-200">
            <div className="text-sm text-brand-gray-500 font-light mb-2">
              Preview
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md border border-brand-gray-200"
                style={{ backgroundColor: selectedColor }}
              >
                {selectedAvatar}
              </div>
              <div>
                <div className="font-light text-brand-gray-800">
                  {adminName || "Your Name"}
                </div>
                <div className="text-sm text-brand-primary-500 font-light">
                  Family Admin
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <FormButton
            type="submit"
            variant="primary"
            loading={createFamily.isPending}
            disabled={createFamily.isPending}
            className="w-full"
          >
            {createFamily.isPending ? "Creating..." : "Create Family"}
          </FormButton>
        </form>
      </div>
    </div>
  );
};
