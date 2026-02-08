import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Activity {
  type: string;
  memberName: string;
  action: string;
  time: string;
  icon: LucideIcon;
  color?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  className?: string;
  maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  className,
  maxItems = 10,
}) => {
  const displayActivities = activities.slice(0, maxItems);

  if (displayActivities.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-sm text-brand-gray-400">No recent activity</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {displayActivities.map((activity, index) => {
        const Icon = activity.icon;
        const iconColor = activity.color || "#22c55e"; // Default to brand primary

        return (
          <div
            key={index}
            className="flex items-start gap-3 group hover:bg-brand-gray-50 p-2 rounded-lg transition-colors"
          >
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
              style={{ backgroundColor: `${iconColor}20` }}
            >
              <Icon className="h-4 w-4" style={{ color: iconColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-brand-gray-800">
                <span className="font-medium">{activity.memberName}</span>{" "}
                <span className="text-brand-gray-600">{activity.action}</span>
              </p>
              <p className="text-xs text-brand-gray-400 mt-0.5">
                {activity.time}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
