import { useEffect } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({
  message,
  type,
  isOpen,
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const variants = {
    success: {
      bg: "bg-green-50 border-green-200 text-green-800",
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    },
    error: {
      bg: "bg-red-50 border-red-200 text-red-800",
      icon: <XCircle className="w-5 h-5 text-red-600" />,
    },
    info: {
      bg: "bg-blue-50 border-blue-200 text-blue-800",
      icon: <Info className="w-5 h-5 text-blue-600" />,
    },
  };

  const variant = variants[type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
      <div
        className={`${variant.bg} border px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md`}
      >
        {variant.icon}
        <span className="font-light flex-1">{message}</span>
        <button
          onClick={onClose}
          className="hover:bg-black/10 rounded p-1 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
