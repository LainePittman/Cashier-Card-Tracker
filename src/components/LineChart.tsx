// A small hand-drawn SVG line chart: one point per day, value printed on
// each point. No charting library needed for 7 points.

type Props = {
  title: string
  labels: string[] // x-axis, e.g. "Sun"
  subLabels?: string[] // smaller line under each label, e.g. "11/15"
  values: (number | null)[] // null = no data yet (future day)
  color: string // CSS color for the line and points
  goal?: number // optional dashed goal line
}

const W = 340
const H = 200
const PAD = { left: 16, right: 16, top: 24, bottom: 44 }

export function LineChart({ title, labels, subLabels, values, color, goal }: Props) {
  const known = values.filter((v): v is number => v !== null)
  const max = Math.max(1, goal ?? 0, ...known)

  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (plotW * i) / Math.max(1, labels.length - 1)
  const y = (v: number) => PAD.top + plotH - (plotH * v) / max

  // Build the line only through days that have data.
  const points = values
    .map((v, i) => (v === null ? null : { x: x(i), y: y(v), v }))
    .filter((p): p is { x: number; y: number; v: number } => p !== null)
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className="w-full">
      {/* baseline */}
      <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} stroke="#cbd5e1" />

      {goal !== undefined && (
        <g>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(goal)}
            y2={y(goal)}
            stroke="#10b981"
            strokeDasharray="4 4"
          />
          <text x={W - PAD.right} y={y(goal) - 4} textAnchor="end" fontSize="10" fill="#047857">
            goal {goal}
          </text>
        </g>
      )}

      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2.5" />
          <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize="11" fontWeight="600" fill="#0f172a">
            {p.v}
          </text>
        </g>
      ))}

      {labels.map((label, i) => (
        <g key={label + i}>
          <text x={x(i)} y={H - 24} textAnchor="middle" fontSize="11" fill="#475569">
            {label}
          </text>
          {subLabels && (
            <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="9" fill="#94a3b8">
              {subLabels.at(i)}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
