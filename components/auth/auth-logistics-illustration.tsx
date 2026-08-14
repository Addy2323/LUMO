import * as React from 'react'

export interface AuthLogisticsIllustrationProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

export function AuthLogisticsIllustration({ className, ...props }: AuthLogisticsIllustrationProps) {
  return (
    <svg
      viewBox="0 0 1200 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      {...props}
    >
      {/* 1. Flowing Background Landscape Curves */}
      <path
        d="M -50 170 C 200 130, 400 210, 600 160 C 800 110, 1000 190, 1250 145"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M -50 205 C 250 185, 450 235, 700 195 C 950 155, 1100 215, 1250 195"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.6"
        strokeLinecap="round"
      />

      {/* 2. Dotted Delivery Route Line */}
      <path
        d="M 95 145 C 150 185, 200 175, 250 145 C 300 115, 360 105, 440 135 C 520 165, 620 185, 740 155 C 860 125, 940 115, 1020 135"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="5 5"
        strokeLinecap="round"
      />

      {/* 3. Location Pin (Left Side ~80px) */}
      <g transform="translate(65, 70)">
        <path
          d="M 20 5 C 10 5 2 15 2 26 C 2 42 20 62 20 62 C 20 62 38 42 38 26 C 38 15 30 5 20 5 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="24" r="6" stroke="currentColor" strokeWidth="1.5" />
      </g>

      {/* 4. Isometric Parcel Box (Center-Left ~260px) */}
      <g transform="translate(250, 75)">
        {/* Top Face */}
        <path d="M 30 18 L 60 4 L 90 18 L 60 32 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Left Face */}
        <path d="M 30 18 L 30 68 L 60 82 L 60 32 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Right Face */}
        <path d="M 90 18 L 90 68 L 60 82 L 60 32 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Tape Seal Line */}
        <path d="M 60 4 L 60 82" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
        <path d="M 45 11 L 45 25" stroke="currentColor" strokeWidth="1.2" />
        <path d="M 75 11 L 75 25" stroke="currentColor" strokeWidth="1.2" />
      </g>

      {/* 5. Small Flight / Arrow Indicator along Route (~380px) */}
      <path
        d="M 380 122 L 398 116 L 390 134 L 387 127 Z"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="currentColor"
        fillOpacity="0.15"
        strokeLinejoin="round"
      />

      {/* 6. Delivery Truck (Center-Right ~570px) */}
      <g transform="translate(560, 130)">
        {/* Cargo Container */}
        <rect x="0" y="0" width="75" height="48" rx="4" stroke="currentColor" strokeWidth="1.5" />
        <line x1="38" y1="0" x2="38" y2="48" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />

        {/* Cab */}
        <path d="M 75 48 H 105 V 18 H 85 L 75 28 V 48 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Window */}
        <path d="M 85 22 H 98 V 32 H 79 L 85 22 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />

        {/* Wheels */}
        <g transform="translate(20, 48)">
          <circle cx="0" cy="0" r="10" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="4" stroke="currentColor" strokeWidth="1" />
        </g>
        <g transform="translate(90, 48)">
          <circle cx="0" cy="0" r="10" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="4" stroke="currentColor" strokeWidth="1" />
        </g>
      </g>

      {/* 7. Partial Globe (Far Right ~1060px, extending past edge) */}
      <g transform="translate(1060, 120)">
        {/* Sphere Outline */}
        <circle cx="0" cy="0" r="105" stroke="currentColor" strokeWidth="1.5" />
        {/* Horizontal Ellipses */}
        <ellipse cx="0" cy="0" rx="105" ry="40" stroke="currentColor" strokeWidth="1.2" strokeDasharray="5 4" />
        <ellipse cx="0" cy="0" rx="105" ry="75" stroke="currentColor" strokeWidth="1.2" />
        {/* Vertical Ellipses */}
        <ellipse cx="0" cy="0" rx="40" ry="105" stroke="currentColor" strokeWidth="1.2" />
        <ellipse cx="0" cy="0" rx="75" ry="105" stroke="currentColor" strokeWidth="1.2" />
        {/* Continent Outlines */}
        <path
          d="M -70 -40 C -55 -20 -70 10 -50 30 C -30 50 -40 80 -15 95 M -35 -60 C -10 -70 5 -50 25 -65 C 45 -80 65 -70 80 -90"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}
