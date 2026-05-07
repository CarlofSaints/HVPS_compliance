"use client";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
}

export default function DashboardCard({
  title,
  value,
  icon,
  color = "bg-primary",
  subtitle,
}: DashboardCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-dark mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={`${color} p-3 rounded-lg text-white flex items-center justify-center`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
