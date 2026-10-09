import React from 'react';

export const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'dark' | 'danger'
  size = 'md',        // 'sm' | 'md' | 'lg'
  icon: Icon,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  fullWidth = false,
  style = {},
  ...rest
}) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={disabled}
      onClick={onClick}
      style={fullWidth ? { width: '100%', ...style } : style}
      {...rest}
    >
      {Icon && <Icon width={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} height={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      {children}
    </button>
  );
};
