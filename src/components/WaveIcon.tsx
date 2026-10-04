import React from 'react';

interface WaveIconProps {
  className?: string;
  size?: number | string;
}

export const WaveIcon: React.FC<WaveIconProps> = ({ className = 'w-6 h-6', size }) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* Wave Official Cyan/Sky Blue Circle */}
      <circle cx="50" cy="50" r="50" fill="#1CA0F2" />

      {/* Penguin Group */}
      <g id="wave-penguin">
        {/* Main Body (Head and Torso) */}
        <path
          d="M 50 8
             C 41 8, 38 15, 38 27
             C 38 31, 35 32, 32 30
             C 27 25, 25 24, 26 27
             C 27 30, 31 38, 35 44
             C 35 48, 34 56, 36 61
             C 38 66, 43 68, 50 68
             C 57 68, 62 66, 64 61
             C 66 56, 65 48, 65 44
             C 69 38, 73 30, 74 27
             C 75 24, 73 25, 68 30
             C 65 32, 62 31, 62 27
             C 62 15, 59 8, 50 8 Z"
          fill="#1A1C20"
        />

        {/* Waving Arm / Flipper (Viewer's Left, reaching up & waving) */}
        <path
          d="M 38 32
             C 32 26, 26 23, 26 27
             C 27 31, 32 39, 36 43 Z"
          fill="#1A1C20"
        />

        {/* Resting Arm / Flipper (Viewer's Right) */}
        <path
          d="M 62 32
             C 65 38, 67 44, 65 52
             C 63 52, 62 48, 62 42 Z"
          fill="#1A1C20"
        />

        {/* White Belly */}
        <ellipse cx="50.5" cy="46" rx="9" ry="14.5" fill="#FFFFFF" />

        {/* Eyes (White circles with black pupils) */}
        <ellipse cx="46.5" cy="20" rx="2.5" ry="3" fill="#FFFFFF" />
        <circle cx="47" cy="20" r="1.3" fill="#1A1C20" />

        <ellipse cx="54.5" cy="20" rx="2.5" ry="3" fill="#FFFFFF" />
        <circle cx="54" cy="20" r="1.3" fill="#1A1C20" />

        {/* Orange Beak */}
        <path
          d="M 44 24
             Q 50.5 28 57 24
             Q 50.5 22 44 24 Z"
          fill="#FF7A00"
        />

        {/* Orange Feet */}
        <ellipse cx="42.5" cy="65.5" rx="7" ry="4" fill="#FF7A00" />
        <ellipse cx="58.5" cy="65.5" rx="7" ry="4" fill="#FF7A00" />
      </g>

      {/* "wave" text in bold white lowercase */}
      <text
        x="50"
        y="85"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="17.5"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        letterSpacing="-0.5px"
      >
        wave
      </text>
    </svg>
  );
};
