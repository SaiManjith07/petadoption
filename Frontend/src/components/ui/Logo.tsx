import { Link } from 'react-router-dom';
import { useState } from 'react';
import logoSrc from '@/assets/images/Gemini_Generated_Image_7z56957z56957z56-removebg-preview.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
  linkTo?: string;
  variant?: 'default' | 'white';
  iconOnly?: boolean;
}

export function Logo({ 
  size = 'md', 
  showText = true, 
  showTagline = false,
  className = '',
  linkTo,
  variant = 'default',
  iconOnly = false
}: LogoProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: { 
      icon: 'h-24 w-24', 
      text: 'text-2xl', 
      tagline: 'text-sm',
      image: 'h-24'
    },
    md: { 
      icon: 'h-24 w-24', 
      text: 'text-3xl', 
      tagline: 'text-base',
      image: 'h-24'
    },
    lg: { 
      icon: 'h-36 w-36', 
      text: 'text-4xl', 
      tagline: 'text-lg',
      image: 'h-36'
    },
    xl: { 
      icon: 'h-40 w-40', 
      text: 'text-6xl', 
      tagline: 'text-xl',
      image: 'h-40'
    }
  };

  const currentSize = sizeClasses[size];
  const textColor = variant === 'white' ? 'text-white' : 'text-[#2BB6AF]';
  const taglineColor = variant === 'white' ? 'text-white/80' : 'text-gray-500';

  const useImageLogo = logoSrc && !imageError;

  const LogoContent = (
    <div className={`relative flex items-center ${className}`}>
      {/* Logo Image/Icon */}
      <div className={`relative ${currentSize.icon} flex-shrink-0 flex items-center justify-center`}>
        {useImageLogo ? (
          <img 
            src={logoSrc}
            alt="PetReunite Logo"
            className={`${currentSize.image} w-auto h-full object-contain ${
              variant === 'white' ? 'brightness-0 invert' : ''
            }`}
            onError={() => setImageError(true)}
          />
        ) : (
          /* SVG Fallback - Matches the design with teal heart, cat, dog, and location pin */
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Heart Shape - Outlined and Filled with Teal or White */}
            <path
              d="M100 30C85 15 60 15 45 30C30 45 20 65 25 85C30 105 50 125 75 150C100 125 120 105 125 85C130 65 120 45 105 30C90 15 75 15 100 30Z"
              fill={variant === 'white' ? 'white' : '#2BB6AF'}
              stroke={variant === 'white' ? 'white' : '#2BB6AF'}
              strokeWidth="2"
            />
            
            {/* Cat Silhouette (Left) - Teal or White colored, facing right */}
            <g transform="translate(40, 50)">
              {/* Cat Head */}
              <ellipse cx="20" cy="20" rx="15" ry="15" fill={variant === 'white' ? 'white' : '#2BB6AF'} />
              {/* Cat Ears */}
              <path d="M10 10 L20 5 L30 10" fill={variant === 'white' ? 'white' : '#2BB6AF'} />
              <path d="M10 10 L20 5 L30 10" stroke={variant === 'white' ? 'white' : '#2BB6AF'} strokeWidth="2" />
              {/* Cat Body */}
              <ellipse cx="20" cy="45" rx="12" ry="18" fill={variant === 'white' ? 'white' : '#2BB6AF'} />
              {/* Cat Tail */}
              <path d="M8 45 Q0 40 0 35 Q0 30 5 28" stroke={variant === 'white' ? 'white' : '#2BB6AF'} strokeWidth="3" fill="none" />
            </g>
            
            {/* Dog Silhouette (Right) - Teal or White colored, facing left */}
            <g transform="translate(110, 50)">
              {/* Dog Head */}
              <ellipse cx="20" cy="20" rx="15" ry="15" fill={variant === 'white' ? 'white' : '#2BB6AF'} />
              {/* Dog Ears (floppy) */}
              <ellipse cx="10" cy="25" rx="5" ry="10" fill={variant === 'white' ? 'white' : '#2BB6AF'} />
              <ellipse cx="30" cy="25" rx="5" ry="10" fill={variant === 'white' ? 'white' : '#2BB6AF'} />
              {/* Dog Body */}
              <ellipse cx="20" cy="45" rx="12" ry="18" fill={variant === 'white' ? 'white' : '#2BB6AF'} />
              {/* Dog Tail */}
              <path d="M32 45 Q40 40 40 35 Q40 30 35 28" stroke={variant === 'white' ? 'white' : '#2BB6AF'} strokeWidth="3" fill="none" />
            </g>
            
            {/* Location Pin at bottom center - Teal or White colored */}
            <g transform="translate(85, 140)">
              <circle cx="15" cy="12" r="8" fill={variant === 'white' ? 'white' : '#2BB6AF'} />
              <path d="M15 20 L15 35 L10 42 L20 42 L15 35 Z" fill={variant === 'white' ? 'white' : '#2BB6AF'} />
            </g>
          </svg>
        )}
      </div>

      {/* Text - Overlapping the logo image */}
      {!iconOnly && showText && (
        <div className={`absolute left-0 top-[45%] -translate-y-1/2 flex flex-col z-20 ${
          size === 'sm' ? 'ml-[3.5rem]' : 
          size === 'md' ? 'ml-[4.5rem]' : 
          size === 'lg' ? 'ml-[6.5rem]' : 
          'ml-[7.5rem]'
        }`}>
          <span className={`${currentSize.text} font-bold ${textColor} leading-tight`}>
            PetReunite
          </span>
          {showTagline && (
            <span className={`${currentSize.tagline} ${taglineColor} font-medium whitespace-nowrap`}>
              Helping pets find their way home
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="group">
        {LogoContent}
      </Link>
    );
  }

  return LogoContent;
}
