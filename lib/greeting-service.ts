type TimeOfDay = "morning" | "afternoon" | "evening" | "night"

function getTimeOfDay(date = new Date()): TimeOfDay {
  const hour = date.getHours()

  if (hour >= 5 && hour < 12) {
    return "morning"
  }
  if (hour >= 12 && hour < 17) {
    return "afternoon"
  }
  if (hour >= 17 && hour < 21) {
    return "evening"
  }
  return "night"
}

export function generateSimpleGreeting(userName: string): string {
  const normalizedName = userName.trim() || "there"
  const timeOfDay = getTimeOfDay()

  const greetingMap: Record<TimeOfDay, string> = {
    morning: `Good morning, *${normalizedName}*!`,
    afternoon: `Good afternoon, *${normalizedName}*!`,
    evening: `Good evening, *${normalizedName}*!`,
    night: `Good evening, *${normalizedName}*!`,
  }

  return greetingMap[timeOfDay]
}
