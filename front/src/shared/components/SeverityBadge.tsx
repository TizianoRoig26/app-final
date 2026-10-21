import React from 'react'

interface SeverityBadgeProps {
  severity: number
  showLabel?: boolean
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, showLabel = true }) => {
  let label = 'Baja'
  // Paleta provista:
  // Crítica: Dark Walnut (#673520)
  // Alta: Golden Apricot (#df912c)
  // Media: Bright Amber (#fbcd22 / tono ámbar accesible)
  // Baja: Bright Fern (#71b743 / tono accesible)
  let badgeStyles = 'border-[#71b743]/50 bg-[#71b743]/10 text-[#3b6e1e]'

  if (severity >= 9.0) {
    label = 'Crítica'
    badgeStyles = 'border-[#673520]/40 bg-[#673520]/10 text-[#673520]'
  } else if (severity >= 7.0) {
    label = 'Alta'
    badgeStyles = 'border-[#df912c]/40 bg-[#df912c]/10 text-[#9a570b]'
  } else if (severity >= 4.0) {
    label = 'Media'
    badgeStyles = 'border-[#fbcd22]/70 bg-[#fbcd22]/15 text-[#855e00]'
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono tracking-tight border ${badgeStyles}`}
    >
      <span className="font-semibold">{severity.toFixed(1)}</span>
      {showLabel && <span className="font-sans font-normal opacity-90">({label})</span>}
    </span>
  )
}
