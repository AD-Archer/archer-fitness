"use client"

interface WarmupCooldownSectionProps {
  title: string
  items: string[]
  colorClass: string
}

export function WarmupCooldownSection({ title, items, colorClass }: WarmupCooldownSectionProps) {
  return (
    <div>
      <h3 className={`font-semibold mb-3 ${colorClass}`}>{title}</h3>
      <ul className="space-y-1 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={index}>• {item}</li>
        ))}
      </ul>
    </div>
  )
}