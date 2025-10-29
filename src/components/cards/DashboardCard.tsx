import { ReactNode } from "react";
import Link from "next/link";

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  color?: "primary" | "success" | "warning" | "danger" | "info" | "secondary";
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  href?: string;
  onClick?: () => void;
  loading?: boolean;
}

export default function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  color = "primary",
  trend,
  href,
  onClick,
  loading = false,
}: DashboardCardProps) {
  const colorClasses = {
    primary: "bg-gradient-to-br from-purple-500 to-purple-600 text-white",
    success: "bg-gradient-to-br from-green-500 to-purple-600 text-white",
    warning: "bg-gradient-to-br from-yellow-500 to-purple-600 text-white",
    danger: "bg-gradient-to-br from-red-500 to-purple-600 text-white",
    info: "bg-gradient-to-br from-purple-400 to-purple-600 text-white",
    secondary: "bg-gradient-to-br from-gray-500 to-purple-600 text-white",
  };

  const cardContent = (
    <div className={`rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-200 ${colorClasses[color]} ${href || onClick ? 'cursor-pointer hover:scale-105' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-90">{title}</p>
          
          {loading ? (
            <div className="flex items-center mt-2">
              <div className="animate-pulse">
                <div className="h-8 w-20 bg-white bg-opacity-30 rounded"></div>
              </div>
            </div>
          ) : (
            <p className="text-3xl font-bold mt-2">{value}</p>
          )}
          
          {subtitle && (
            <p className="text-sm opacity-80 mt-1">{subtitle}</p>
          )}

          {trend && !loading && (
            <div className="flex items-center mt-3">
              <div className={`flex items-center text-sm ${trend.isPositive ? 'text-green-200' : 'text-red-200'}`}>
                {trend.isPositive ? (
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7l-4 4h3l1-1 1 1h3l-4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 13l4-4H9l-1 1-1-1H4l4 4z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="font-medium">{Math.abs(trend.value)}%</span>
                <span className="ml-1 opacity-80">{trend.label}</span>
              </div>
            </div>
          )}
        </div>

        {icon && (
          <div className="ml-4 opacity-80">
            <div className="w-12 h-12 flex items-center justify-center">
              {icon}
            </div>
          </div>
        )}
      </div>

      {(href || onClick) && (
        <div className="mt-4 flex items-center text-sm opacity-80">
          <span>View details</span>
          <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }

  if (onClick) {
    return <div onClick={onClick}>{cardContent}</div>;
  }

  return cardContent;
}