import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading,
  fullWidth,
  className = '',
  ...props
}) => {
  const baseStyles = 'px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-ksp-navy text-white hover:bg-ksp-royal shadow-sm active:scale-[0.98]',
    secondary: 'bg-ksp-royal text-white hover:bg-ksp-navy shadow-sm active:scale-[0.98]',
    outline: 'border-2 border-ksp-navy text-ksp-navy hover:bg-ksp-navy hover:text-white active:scale-[0.98]',
    ghost: 'text-ksp-navy hover:bg-ksp-bg active:scale-[0.98]',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
