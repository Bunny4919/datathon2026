import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  suffix,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-sm font-semibold text-ksp-text ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-ksp-navy transition-colors">
            {icon}
          </div>
        )}
        <input
          className={`
            ${icon ? 'pl-10' : 'pl-4'}
            ${suffix ? 'pr-12' : 'pr-4'}
            py-3 bg-white border-2 rounded-lg text-sm font-medium outline-none transition-all duration-200 text-ksp-text
            ${error
              ? 'border-red-500 focus:border-red-600'
              : 'border-slate-200 focus:border-ksp-navy focus:ring-4 focus:ring-ksp-navy/10'}
            ${className}
          `}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-ksp-navy transition-colors">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600 font-medium ml-1 animate-fadeIn">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
