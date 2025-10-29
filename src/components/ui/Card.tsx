import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  padding?: "sm" | "md" | "lg";
  shadow?: "sm" | "md" | "lg";
}

export default function Card({ 
  children, 
  title, 
  subtitle, 
  className = "", 
  padding = "md",
  shadow = "md" 
}: CardProps) {
  const paddingClasses = {
    sm: "p-4",
    md: "p-6", 
    lg: "p-8",
  };

  const shadowClasses = {
    sm: "shadow-lg",
    md: "shadow-xl",
    lg: "shadow-2xl",
  };

  return (
    <div className={`glass rounded-2xl border border-white/10 ${shadowClasses[shadow]} card-hover backdrop-blur-md ${className}`}>
      {(title || subtitle) && (
        <div className={`border-b border-white/10 ${paddingClasses[padding]} pb-4`}>
          {title && <h3 className="text-lg font-medium text-white text-shadow">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-gray-300">{subtitle}</p>}
        </div>
      )}
      <div className={`${title || subtitle ? `${paddingClasses[padding]} pt-4` : paddingClasses[padding]}`}>
        {children}
      </div>
    </div>
  );
}