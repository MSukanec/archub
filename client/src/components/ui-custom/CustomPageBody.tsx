import React from 'react';

interface CustomPageBodyProps {
  children: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-2",
  md: "p-4",
  lg: "p-6"
};

export function CustomPageBody({ 
  children, 
  padding = "none" 
}: CustomPageBodyProps) {
  return (
    <div className={`mt-4 border-2 border-blue-500 ${paddingClasses[padding]}`}>
      {children}
    </div>
  );
}