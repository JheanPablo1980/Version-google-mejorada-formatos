import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'pdf';
  icon?: LucideIcon;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  icon: Icon, 
  className = '', 
  type = 'button', 
  disabled = false,
  ...props 
}) => {
  const baseStyle = "flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base";
  
  const variants = {
    primary: "bg-[#1F3864] text-white hover:bg-[#152a4d]",
    secondary: "bg-[#D9E1F2] text-[#1F3864] hover:bg-blue-200",
    danger: "bg-red-100 text-red-700 hover:bg-red-200",
    success: "bg-green-600 text-white hover:bg-green-700",
    pdf: "bg-red-600 text-white hover:bg-red-700"
  };

  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled} 
      className={cn(baseStyle, variants[variant], className)}
      {...props}
    >
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
};
