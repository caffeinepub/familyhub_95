import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface PageCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export function PageCard({
  title,
  subtitle,
  children,
  className = "",
  headerAction,
}: PageCardProps) {
  return (
    <Card
      className={`bg-brand-surface border-brand-gray-200 shadow-sm ${className}`}
    >
      {title && (
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-brand-gray-800 font-light text-lg">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-sm text-brand-gray-500 font-extralight mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction}
        </CardHeader>
      )}
      <CardContent className={title ? "" : "pt-6"}>{children}</CardContent>
    </Card>
  );
}
