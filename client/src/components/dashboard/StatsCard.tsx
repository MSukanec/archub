import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    isPositive: boolean;
  };
  icon: ReactNode;
  iconBackground: string;
  iconColor?: string;
}

export function StatsCard({
  title,
  value,
  change,
  icon,
  iconBackground,
  iconColor = "text-white",
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`${iconBackground} rounded-md p-2 ${iconColor}`}>
          {icon}
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center">
          <span
            className={`flex items-center text-sm font-medium ${
              change.isPositive ? "text-green-500" : "text-red-500"
            }`}
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d={
                  change.isPositive
                    ? "M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                    : "M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                }
                clipRule="evenodd"
              />
            </svg>
            {change.value}
          </span>
          <span className="text-gray-500 text-sm ml-2">vs mes anterior</span>
        </div>
      )}
    </div>
  );
}
