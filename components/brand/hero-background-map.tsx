'use client'

export function HeroBackgroundMap() {
  // 1600 x 480 ViewBox: Clean outer sourcing nodes + central HQ gateway
  const nodes = [
    { id: 'cn', title: 'China 🇨🇳', x: 140, y: 110, align: 'start' as const, color: '#3B82F6' },
    { id: 'tr', title: 'Turkey 🇹🇷', x: 120, y: 310, align: 'start' as const, color: '#EF4444' },
    { id: 'ae', title: 'Dubai 🇦🇪', x: 1460, y: 110, align: 'end' as const, color: '#F59E0B' },
    { id: 'in', title: 'India 🇮🇳', x: 1480, y: 310, align: 'end' as const, color: '#10B981' },
    {
      id: 'tz',
      title: 'Dar es Salaam 🇹🇿',
      x: 800,
      y: 430,
      align: 'middle' as const,
      color: '#FF7A00',
      isHQ: true,
    },
  ]

  const routes = [
    { id: 'r-cn-tz', fromX: 140, fromY: 110, toX: 800, toY: 430, color: '#3B82F6', dur: '5s' },
    { id: 'r-tr-tz', fromX: 120, fromY: 310, toX: 800, toY: 430, color: '#EF4444', dur: '5.5s' },
    { id: 'r-ae-tz', fromX: 1460, fromY: 110, toX: 800, toY: 430, color: '#F59E0B', dur: '4.5s' },
    { id: 'r-in-tz', fromX: 1480, fromY: 310, toX: 800, toY: 430, color: '#10B981', dur: '5.2s' },
  ]

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-40 dark:opacity-50"
    >
      {/* Ambient Central Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] bg-brand-500/10 blur-[130px] rounded-full" />

      {/* SVG Blueprint Grid Canvas */}
      <svg
        viewBox="0 0 1600 480"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="hero-grid-pattern" width="48" height="48" patternUnits="userSpaceOnUse">
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="0.75"
              strokeOpacity="0.15"
            />
          </pattern>

          <filter id="hero-glow-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Blueprint Grid Lines */}
        <rect width="100%" height="100%" fill="url(#hero-grid-pattern)" />

        {/* Animated Curved Trade Lines */}
        {routes.map((r) => {
          const midX = (r.fromX + r.toX) / 2
          const midY = Math.min(r.fromY, r.toY) + Math.abs(r.fromY - r.toY) * 0.3
          const pathD = `M ${r.fromX} ${r.fromY} Q ${midX} ${midY} ${r.toX} ${r.toY}`

          return (
            <g key={r.id}>
              <path
                d={pathD}
                fill="none"
                stroke={r.color}
                strokeWidth="1.25"
                strokeOpacity="0.25"
                strokeDasharray="4 4"
              />
              <path
                d={pathD}
                fill="none"
                stroke={r.color}
                strokeWidth="2"
                strokeLinecap="round"
                filter="url(#hero-glow-soft)"
                strokeOpacity="0.5"
              >
                <animate
                  attributeName="stroke-dasharray"
                  values="0 350; 60 290; 0 350"
                  dur={r.dur}
                  repeatCount="indefinite"
                />
              </path>
            </g>
          )
        })}

        {/* Node Points & Minimal Labels */}
        {nodes.map((node) => {
          const isLeft = node.align === 'start'
          const isRight = node.align === 'end'

          return (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              {node.isHQ && (
                <circle r="18" fill={node.color} opacity="0.2" className="animate-ping" />
              )}
              <circle
                r={node.isHQ ? 6.5 : 4.5}
                fill="#0F172A"
                stroke={node.color}
                strokeWidth="2"
              />
              <circle r={node.isHQ ? 3 : 2} fill={node.color} />
              <text
                x={isLeft ? 10 : isRight ? -10 : 0}
                y={node.isHQ ? 20 : -10}
                textAnchor={node.align}
                className="text-[10px] sm:text-[11px] font-bold fill-slate-300 dark:fill-slate-400 tracking-wide"
              >
                {node.title}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
