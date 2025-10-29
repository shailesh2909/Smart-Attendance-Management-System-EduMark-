"use client";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-gray-700";

  const variantClasses = {
    text: "h-4 rounded",
    rectangular: "rounded-lg",
    circular: "rounded-full"
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

// Pre-built skeleton components for common use cases
export function CardSkeleton() {
  return (
    <div className="card p-6">
      <div className="space-y-4">
        <Skeleton variant="text" className="h-6 w-3/4" />
        <Skeleton variant="text" className="h-4 w-1/2" />
        <div className="space-y-2">
          <Skeleton variant="rectangular" className="h-4 w-full" />
          <Skeleton variant="rectangular" className="h-4 w-5/6" />
          <Skeleton variant="rectangular" className="h-4 w-4/6" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="card p-6">
      <div className="space-y-4">
        {/* Table header */}
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} variant="text" className="h-5" />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-4 gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} variant="text" className="h-4" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="circular" className="w-12 h-12" />
        <div className="text-right">
          <Skeleton variant="text" className="h-8 w-16 mb-2" />
          <Skeleton variant="text" className="h-4 w-20" />
        </div>
      </div>
      <Skeleton variant="text" className="h-4 w-24" />
    </div>
  );
}