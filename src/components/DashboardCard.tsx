import { type ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconColorClass?: string;
}

export function DashboardCard({ title, value, icon, iconColorClass = "bg-blue-100 text-blue-600" }: DashboardCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${iconColorClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}