export type TimeFormatPreference = "12h" | "24h"

const pad = (value: number): string => String(value).padStart(2, "0")

export const formatTimeForDisplay = (
  time: string | null | undefined,
  format: TimeFormatPreference = "24h"
): string => {
  if (!time || typeof time !== "string") {
    return "--:--"
  }

  const segments = time.split(":")
  if (segments.length < 2) {
    return time
  }

  const rawHour = Number.parseInt(segments[0], 10)
  const rawMinute = Number.parseInt(segments[1], 10)
  const minute = Number.isFinite(rawMinute) ? pad(Math.max(0, Math.min(59, rawMinute))) : "00"

  if (!Number.isFinite(rawHour)) {
    return `${segments[0]}:${minute}`
  }

  const boundedHour = ((rawHour % 24) + 24) % 24

  if (format === "24h") {
    return `${pad(boundedHour)}:${minute}`
  }

  const period = boundedHour >= 12 ? "PM" : "AM"
  const hour12 = boundedHour % 12 === 0 ? 12 : boundedHour % 12
  return `${hour12}:${minute} ${period}`
}

export const formatTimeRangeForDisplay = (
  startTime: string,
  endTime: string,
  format: TimeFormatPreference = "24h"
): string => {
  const start = formatTimeForDisplay(startTime, format)
  const end = formatTimeForDisplay(endTime, format)
  return `${start} – ${end}`
}
