import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FormButtonProps {
  type?: "submit" | "button";
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function FormButton({
  type = "button",
  variant = "primary",
  loading = false,
  disabled = false,
  children,
  onClick,
  className = "",
}: FormButtonProps) {
  const variantClasses = {
    primary: "bg-brand-primary-500 hover:bg-brand-primary-600 text-white",
    secondary:
      "bg-brand-gray-100 hover:bg-brand-gray-200 text-brand-gray-700 border border-brand-gray-300",
    danger: "bg-red-500 hover:bg-red-600 text-white",
  };

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${variantClasses[variant]} font-light ${className}`}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
