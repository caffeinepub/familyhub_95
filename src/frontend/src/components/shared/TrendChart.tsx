import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

interface TrendChartProps {
  data: Array<Record<string, any>>;
  type: "line" | "bar" | "area";
  dataKey: string;
  xKey: string;
  color?: string;
  label?: string;
  className?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  type,
  dataKey,
  xKey,
  color = "#22c55e", // brand-primary-500
  label,
  className,
}) => {
  const chartColors = {
    stroke: color,
    fill: color,
    fillOpacity: 0.2,
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-brand-surface border border-brand-gray-200 rounded-lg p-2 shadow-lg">
          <p className="text-sm font-light text-brand-gray-800">{label}</p>
          <p className="text-sm font-light" style={{ color }}>
            {`${dataKey}: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 5, left: 0, bottom: 5 },
    };

    const commonAxisProps = {
      stroke: "#B0A89D",
      style: { fontSize: "12px", fontWeight: "300" },
    };

    switch (type) {
      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-brand-gray-200"
              opacity={0.3}
            />
            <XAxis dataKey={xKey} {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fill="url(#colorGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-brand-gray-200"
              opacity={0.3}
            />
            <XAxis dataKey={xKey} {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case "line":
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-brand-gray-200"
              opacity={0.3}
            />
            <XAxis dataKey={xKey} {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        );
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <h4 className="text-sm font-light text-brand-gray-500 mb-2">{label}</h4>
      )}
      <ResponsiveContainer width="100%" height={200}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};
