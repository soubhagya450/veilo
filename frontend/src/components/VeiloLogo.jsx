import React from "react";

export function VeiloIcon({ className = "w-9 h-9" }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Top-Left Cyan to Blue Gradient */}
        <linearGradient id="bubbleBlue" x1="20" y1="10" x2="110" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#00F5FF" />
          <stop offset="45%" stop-color="#0094FF" />
          <stop offset="100%" stop-color="#0047FF" />
        </linearGradient>

        {/* Bottom-Right Magenta to Violet Gradient */}
        <linearGradient id="bubblePurple" x1="85" y1="45" x2="165" y2="135" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#6A00F5" />
          <stop offset="50%" stop-color="#AF00E8" />
          <stop offset="100%" stop-color="#F91B98" />
        </linearGradient>

        {/* Glass Ribbon Translucent Gradient */}
        <linearGradient id="glassRibbon" x1="80" y1="30" x2="120" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.8" />
          <stop offset="45%" stop-color="#7BE7FF" stop-opacity="0.5" />
          <stop offset="85%" stop-color="#D772FF" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.1" />
        </linearGradient>

        {/* Subtle drop glow */}
        <filter id="iconGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#0066FF" flood-opacity="0.25" />
        </filter>
      </defs>

      {/* Purple Speech Bubble (Behind) */}
      <path
        d="M95 72 C95 48 115 32 140 32 C165 32 185 50 185 75 C185 100 165 118 140 118 C132 118 124 116 117 112 L98 122 C96 123 94 121 95 118 L99 104 C96 95 95 84 95 72 Z"
        fill="url(#bubblePurple)"
      />

      {/* Blue Speech Bubble (Front) */}
      <g filter="url(#iconGlow)">
        <path
          d="M18 58 C18 26 42 6 78 6 C114 6 138 28 138 60 C138 90 115 112 80 112 C72 112 65 110 58 107 L33 118 C30 119 26 116 28 112 L33 97 C24 86 18 73 18 58 Z"
          fill="url(#bubbleBlue)"
        />
      </g>

      {/* Translucent Glass Ribbon Overlap Effect */}
      <path
        d="M102 18 C122 32 135 52 133 75 C130 96 112 110 93 115 C82 108 77 98 80 82 C85 58 98 38 102 18 Z"
        fill="url(#glassRibbon)"
        style={{ mixBlendMode: "screen", opacity: 0.9 }}
      />
      <path
        d="M92 34 C108 52 118 74 112 94 C106 108 94 115 84 114 C92 98 98 76 92 56 C88 44 83 38 92 34 Z"
        fill="#FFFFFF"
        opacity="0.3"
      />

      {/* Three Horizontal Dots inside Blue Bubble */}
      <circle cx="52" cy="58" r="6" fill="#FFFFFF" />
      <circle cx="74" cy="58" r="6" fill="#FFFFFF" />
      <circle cx="96" cy="58" r="6" fill="#FFFFFF" />
    </svg>
  );
}

export default function VeiloLogo({
  size = "md",
  showTagline = false,
  iconOnly = false,
  className = "",
  useImage = false,
}) {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-20 h-20",
    xl: "w-32 h-32",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-5xl",
    xl: "text-6xl",
  };

  const taglineSizes = {
    sm: "text-[9px]",
    md: "text-xs",
    lg: "text-base",
    xl: "text-lg",
  };

  if (useImage) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <img
          src="/logo.png"
          alt="Veilo — Connect without revealing"
          className={`${iconSizes[size]} object-contain drop-shadow-xl`}
        />
      </div>
    );
  }

  if (iconOnly) {
    return <VeiloIcon className={`${iconSizes[size]} ${className}`} />;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <VeiloIcon className={iconSizes[size]} />

      <div className="flex flex-col leading-none">
        {/* Wordmark with stylized 'V' matching the image */}
        <div className={`font-extrabold tracking-tight flex items-baseline ${textSizes[size]}`}>
          {/* Custom Styled 'V': Cyan/Blue left diagonal, crisp white right diagonal */}
          <span className="relative inline-block font-sans">
            <span className="bg-gradient-to-b from-[#00F5FF] via-[#00A2FF] to-[#0051FF] bg-clip-text text-transparent">
              V
            </span>
          </span>
          <span className="text-white font-sans">eilo</span>
        </div>

        {showTagline && (
          <span
            className={`font-medium tracking-[0.2em] text-[#A5B4FC]/85 mt-1 font-sans hidden sm:block ${taglineSizes[size]}`}
          >
            Connect without revealing.
          </span>
        )}
      </div>
    </div>
  );
}
