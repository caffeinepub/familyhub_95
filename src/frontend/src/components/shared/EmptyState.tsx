import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="bg-brand-surface rounded-xl p-8 border border-brand-gray-200 text-center shadow-sm">
      <div className="text-brand-primary-500 mb-4 flex justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-light text-brand-gray-800 mb-2">{title}</h3>
      <p className="text-brand-gray-500 font-extralight mb-4">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-brand-primary-500 hover:bg-brand-primary-600 text-white font-light"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
