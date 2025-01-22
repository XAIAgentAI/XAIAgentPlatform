'use client';

import { CustomButton } from "./custom-button";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface GradientBorderButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  gradientId?: string;
  containerClassName?: string;
}

export const GradientBorderButton = ({
  children,
  className,
  gradientId = "buttonGradient",
  containerClassName,
  ...props
}: GradientBorderButtonProps) => {
  return (
    <div className={cn("relative", containerClassName)}>
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#FF540E' }} />
            <stop offset="40%" style={{ stopColor: '#A0A0A0' }} />
            <stop offset="100%" style={{ stopColor: '#A0A0A0' }} />
          </linearGradient>
        </defs>
        <rect 
          width="100%" 
          height="100%" 
          fill="none" 
          stroke={`url(#${gradientId})`}
          strokeWidth="1" 
          rx="8" 
          ry="8"
        />
      </svg>
      <CustomButton 
        className={cn(
          "relative bg-transparent hover:bg-transparent text-text-primary px-4 py-3.5 rounded-lg w-full",
          className
        )}
        {...props}
      >
        {children}
      </CustomButton>
    </div>
  );
}; 