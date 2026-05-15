import React from 'react';

interface BrandLogoProps {
  className?: string;
  variant?: 'full' | 'icon';
  color?: 'normal' | 'white';
}

const getDriveImageUrl = (id: string) => `https://lh3.googleusercontent.com/d/${id}`;

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = "h-12 w-auto", 
  variant = 'full',
  color = 'normal'
}) => {
  const logoSrc = getDriveImageUrl("1uDq_nsv88sHmTz1nNVyb5uBQS6h83izK");

  return (
    <img 
      src={logoSrc} 
      alt="Athlex Academy Logo" 
      className={className}
      referrerPolicy="no-referrer"
    />
  );
};
