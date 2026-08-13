import React from "react";

interface SenaiLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
  subtitleTheme?: "light" | "dark";
}

export const SenaiLogo: React.FC<SenaiLogoProps> = ({
  className = "",
  size = "md",
  showSubtitle = false,
  subtitleTheme = "dark",
}) => {
  const heights = {
    sm: "h-7",
    md: "h-9",
    lg: "h-12",
    xl: "h-16",
  };

  return (
    <div className={`inline-flex flex-col items-center justify-center text-center w-full ${className}`}>
      {/* Official Red SENAI Badge with White Italic Text & Side Stripes */}
      <div className={`relative inline-flex items-center justify-center ${heights[size]}`}>
        <svg
          viewBox="0 0 280 80"
          className="h-full w-auto drop-shadow-sm select-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Solid Red Background */}
          <rect width="280" height="80" fill="#E30613" />

          {/* Left Side Horizontal White Stripes */}
          <line x1="0" y1="18" x2="24" y2="18" stroke="#FFFFFF" strokeWidth="3.5" />
          <line x1="0" y1="29" x2="24" y2="29" stroke="#FFFFFF" strokeWidth="3.5" />
          <line x1="0" y1="40" x2="24" y2="40" stroke="#FFFFFF" strokeWidth="3.5" />
          <line x1="0" y1="51" x2="24" y2="51" stroke="#FFFFFF" strokeWidth="3.5" />
          <line x1="0" y1="62" x2="24" y2="62" stroke="#FFFFFF" strokeWidth="3.5" />

          {/* Right Side Horizontal White Stripes */}
          <line x1="256" y1="18" x2="280" y2="18" stroke="#FFFFFF" strokeWidth="3.5" />
          <line x1="256" y1="29" x2="280" y2="29" stroke="#FFFFFF" strokeWidth="3.5" />
          <line x1="256" y1="40" x2="280" y2="40" stroke="#FFFFFF" strokeWidth="3.5" />
          <line x1="256" y1="51" x2="280" y2="51" stroke="#FFFFFF" strokeWidth="3.5" />
          <line x1="256" y1="62" x2="280" y2="62" stroke="#FFFFFF" strokeWidth="3.5" />

          {/* White Bold Slanted SENAI Text */}
          <g transform="skewX(-15) translate(14, 0)">
            <text
              x="130"
              y="58"
              fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
              fontWeight="900"
              fontSize="56"
              fill="#FFFFFF"
              letterSpacing="3"
              textAnchor="middle"
            >
              SENAI
            </text>
          </g>
        </svg>
      </div>

      {showSubtitle && (
        <div className="mt-2 text-center leading-tight">
          <span className={`block text-[10px] font-black uppercase tracking-wider ${
            subtitleTheme === "light" ? "text-red-400" : "text-red-600 dark:text-red-500"
          }`}>
            Serviço Nacional de Aprendizagem Industrial
          </span>
          <span className={`block text-[9px] font-bold ${
            subtitleTheme === "light" ? "text-slate-300" : "text-slate-500 dark:text-slate-400"
          }`}>
            Departamento Regional de São Paulo
          </span>
        </div>
      )}
    </div>
  );
};


