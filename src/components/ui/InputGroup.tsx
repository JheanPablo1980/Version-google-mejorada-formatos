import React from 'react';

interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  textarea?: boolean;
}

export const InputGroup: React.FC<InputGroupProps> = ({ 
  label, 
  name, 
  value, 
  onChange, 
  type = "text", 
  textarea = false,
  className = "",
  ...props 
}) => {
  const inputClasses = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F3864] focus:outline-none transition-all text-sm";
  
  return (
    <div className={className}>
      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">{label}</label>
      {textarea ? (
        <textarea
          name={name}
          value={value as string}
          onChange={onChange as any}
          className={inputClasses}
          {...(props as any)}
        />
      ) : (
        <input 
          type={type} 
          name={name} 
          value={value} 
          onChange={onChange} 
          className={inputClasses} 
          {...props} 
        />
      )}
    </div>
  );
};
