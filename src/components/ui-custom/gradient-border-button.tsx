'use client';

import { CustomButton } from "./custom-button";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface GradientBorderButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  containerClassName?: string;
}

export const GradientBorderButton = ({
  children,
  className,
  containerClassName,
  ...props
}: GradientBorderButtonProps) => {
  return (
    <div 
      className={cn(
        "p-[1px] rounded-lg bg-gradient-to-r from-[#FF540E] via-[#A0A0A0] to-[#000] dark:from-[#FF540E] dark:via-[#A0A0A0] dark:to-white",
        containerClassName
      )}
    >
      <CustomButton 
        className={cn(
          "relative bg-background hover:bg-background/80 text-text-primary rounded-lg w-full",
          className
        )}
        {...props}
      >
        {children}
      </CustomButton>
    </div>
  );
}; 