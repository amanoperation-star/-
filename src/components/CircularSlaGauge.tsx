import React, { useEffect, useState } from 'react';

interface CircularSlaGaugeProps {
  percentage: number; // 0 to 100
  size?: number; // width and height in px
  strokeWidth?: number;
  label?: string;
  isBreached?: boolean;
  pulse?: boolean;
  showText?: boolean;
}

export const CircularSlaGauge: React.FC<CircularSlaGaugeProps> = ({
  percentage,
  size = 120,
  strokeWidth = 10,
  label,
  isBreached = false,
  pulse = true,
  showText = true,
}) => {
  const [progress, setProgress] = useState(0);

  // Smooth animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(Math.max(0, Math.min(100, percentage)));
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Determine dynamic color and neon glow based on progress and breach status
  let colorClass = 'text-emerald-500 dark:text-emerald-400';
  let glowColor = 'rgba(16, 185, 129, 0.4)';
  let bgStroke = 'stroke-slate-200 dark:stroke-slate-800';

  if (isBreached) {
    colorClass = 'text-rose-500 dark:text-rose-400';
    glowColor = 'rgba(244, 63, 94, 0.6)';
    bgStroke = 'stroke-rose-100 dark:stroke-rose-950/35';
  } else if (progress < 30) {
    colorClass = 'text-amber-500 dark:text-amber-400';
    glowColor = 'rgba(245, 158, 11, 0.5)';
    bgStroke = 'stroke-amber-100 dark:stroke-amber-950/35';
  } else if (progress < 60) {
    colorClass = 'text-indigo-500 dark:text-indigo-400';
    glowColor = 'rgba(99, 102, 241, 0.5)';
    bgStroke = 'stroke-indigo-100 dark:stroke-indigo-950/35';
  }

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div 
        className="relative flex items-center justify-center transition-all duration-300"
        style={{ width: size, height: size }}
      >
        <svg
          className="transform -rotate-90 w-full h-full"
          style={{ overflow: 'visible' }}
        >
          {/* Glow Filter */}
          <defs>
            <filter id={`glow-filter-${size}`}>
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background Track */}
          <circle
            className={`transition-all duration-300 ${bgStroke}`}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Glowing Animated Progress Circle */}
          <circle
            className={`transition-all duration-1000 ease-out ${colorClass}`}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              filter: `drop-shadow(0 0 6px ${glowColor})`,
            }}
          />
        </svg>

        {/* Center Text Panel */}
        {showText && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
            <span className={`text-xl font-black font-mono leading-none tracking-tight ${colorClass} ${pulse && isBreached ? 'animate-pulse' : ''}`}>
              {Math.round(progress)}%
            </span>
            {label && (
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 mt-0.5 max-w-[80%] truncate">
                {label}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
