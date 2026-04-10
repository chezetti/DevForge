export interface TimestampResult {
  unix: number
  unixMs: number
  iso: string
  utc: string
  local: string
  relative: string
}

export function parseTimestamp(input: string): TimestampResult
export function parseTimestamp(
  input: string,
  inputType: "unix" | "iso" | "auto"
): number | null
export function parseTimestamp(
  input: string,
  inputType?: "unix" | "iso" | "auto"
): TimestampResult | number | null {
  let date: Date
  const normalizedType = inputType ?? "auto"
  const trimmed = input.trim()

  const parseAsUnix = () => {
    const num = parseInt(trimmed, 10)
    if (Number.isNaN(num)) return null
    if (num < 100000000000) return new Date(num * 1000)
    return new Date(num)
  }

  if (normalizedType === "unix") {
    date = parseAsUnix() ?? new Date(NaN)
  } else if (normalizedType === "iso") {
    date = new Date(trimmed)
  } else {
    // auto
    const unixDate = parseAsUnix()
    if (unixDate && !isNaN(unixDate.getTime())) {
      date = unixDate
    } else {
      date = new Date(trimmed)
    }
  }

  if (isNaN(date.getTime())) {
    if (inputType) return null
    throw new Error("Invalid timestamp or date format")
  }

  if (inputType) return date.getTime()

  return {
    unix: Math.floor(date.getTime() / 1000),
    unixMs: date.getTime(),
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toLocaleString(),
    relative: getRelativeTime(date),
  }
}

export function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(Math.abs(diffMs) / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  const past = diffMs > 0

  if (diffSecs < 60) return past ? 'just now' : 'in a moment'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ${past ? 'ago' : 'from now'}`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ${past ? 'ago' : 'from now'}`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ${past ? 'ago' : 'from now'}`
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ${past ? 'ago' : 'from now'}`
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ${past ? 'ago' : 'from now'}`
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ${past ? 'ago' : 'from now'}`
}

export function getCurrentTimestamp(): TimestampResult {
  return parseTimestamp(Date.now().toString())
}

export interface DateDiffResult {
  years: number
  months: number
  days: number
  hours: number
  minutes: number
  seconds: number
  totalDays: number
  totalHours: number
  totalMinutes: number
  totalSeconds: number
  totalMilliseconds: number
}

export function dateDiff(date1: Date, date2: Date): DateDiffResult {
  const diffMs = Math.abs(date2.getTime() - date1.getTime())
  const totalSeconds = Math.floor(diffMs / 1000)
  const totalMinutes = Math.floor(totalSeconds / 60)
  const totalHours = Math.floor(totalMinutes / 60)
  const totalDays = Math.floor(totalHours / 24)

  const years = Math.floor(totalDays / 365)
  const remainingDaysAfterYears = totalDays % 365
  const months = Math.floor(remainingDaysAfterYears / 30)
  const days = remainingDaysAfterYears % 30
  const hours = totalHours % 24
  const minutes = totalMinutes % 60
  const seconds = totalSeconds % 60

  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    totalDays,
    totalHours,
    totalMinutes,
    totalSeconds,
    totalMilliseconds: diffMs,
  }
}

export function convertTimezone(
  date: Date,
  fromTimezone: string,
  toTimezone: string
): { original: string; converted: string; offset: string } {
  const originalFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: fromTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const convertedFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: toTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  })

  return {
    original: originalFormatter.format(date),
    converted: convertedFormatter.format(date),
    offset: toTimezone,
  }
}

export function parseCron(expression: string): string {
  const parts = expression.trim().split(/\s+/)
  if (parts.length < 5 || parts.length > 6) {
    throw new Error('Invalid cron expression: expected 5 or 6 parts')
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts

  const descriptions: string[] = []

  // Minute
  if (minute === '*') {
    descriptions.push('every minute')
  } else if (minute.includes('/')) {
    const [, interval] = minute.split('/')
    descriptions.push(`every ${interval} minutes`)
  } else if (minute.includes(',')) {
    descriptions.push(`at minutes ${minute}`)
  } else {
    descriptions.push(`at minute ${minute}`)
  }

  // Hour
  if (hour === '*') {
    descriptions.push('of every hour')
  } else if (hour.includes('/')) {
    const [, interval] = hour.split('/')
    descriptions.push(`every ${interval} hours`)
  } else if (hour.includes(',')) {
    descriptions.push(`at hours ${hour}`)
  } else {
    descriptions.push(`at ${hour}:00`)
  }

  // Day of month
  if (dayOfMonth !== '*') {
    descriptions.push(`on day ${dayOfMonth} of the month`)
  }

  // Month
  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  if (month !== '*') {
    if (month.includes(',')) {
      const months = month.split(',').map(m => monthNames[parseInt(m)] || m).join(', ')
      descriptions.push(`in ${months}`)
    } else {
      descriptions.push(`in ${monthNames[parseInt(month)] || month}`)
    }
  }

  // Day of week
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  if (dayOfWeek !== '*') {
    if (dayOfWeek.includes(',')) {
      const days = dayOfWeek.split(',').map(d => dayNames[parseInt(d)] || d).join(', ')
      descriptions.push(`on ${days}`)
    } else {
      descriptions.push(`on ${dayNames[parseInt(dayOfWeek)] || dayOfWeek}`)
    }
  }

  return descriptions.join(' ')
}

export const commonTimezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
  'Pacific/Auckland',
]

export const COMMON_TIMEZONES = commonTimezones.map((value) => ({
  value,
  label: value,
}))

export type DateUnit = "days" | "weeks" | "months" | "years"

export function addToDate(date: Date, amount: number, unit: DateUnit): Date {
  const result = new Date(date)
  if (unit === "days") result.setDate(result.getDate() + amount)
  if (unit === "weeks") result.setDate(result.getDate() + amount * 7)
  if (unit === "months") result.setMonth(result.getMonth() + amount)
  if (unit === "years") result.setFullYear(result.getFullYear() + amount)
  return result
}

export function calculateDateDiff(start: Date, end: Date) {
  const base = dateDiff(start, end)
  const totalWeeks = Math.floor(base.totalDays / 7)
  const totalMonths = +(base.totalDays / 30.4375).toFixed(2)
  const totalYears = +(base.totalDays / 365.25).toFixed(2)

  let weekdays = 0
  let weekendDays = 0
  const cursor = new Date(start)
  const target = new Date(end)
  const step = cursor <= target ? 1 : -1
  while ((step > 0 && cursor < target) || (step < 0 && cursor > target)) {
    const day = cursor.getDay()
    if (day === 0 || day === 6) weekendDays++
    else weekdays++
    cursor.setDate(cursor.getDate() + step)
  }

  return {
    ...base,
    totalWeeks,
    totalMonths,
    totalYears,
    weekdays,
    weekendDays,
  }
}

export function formatTimestamp(
  timestamp: number,
  timezone: string,
  mode: "full" | "date" | "time" | "relative"
): string {
  const date = new Date(timestamp)
  if (mode === "relative") return getRelativeTime(date)

  const options: Intl.DateTimeFormatOptions =
    mode === "date"
      ? { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }
      : mode === "time"
        ? { timeZone: timezone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }
        : {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }

  return new Intl.DateTimeFormat("en-US", options).format(date)
}

export interface CronPreset {
  label: string
  expression: string
}

export function parseCronExpression(expression: string): {
  isValid: boolean
  humanReadable: string
  error?: string
} {
  try {
    const humanReadable = parseCron(expression)
    return { isValid: true, humanReadable }
  } catch (error) {
    return {
      isValid: false,
      humanReadable: "",
      error: error instanceof Error ? error.message : "Invalid cron expression",
    }
  }
}

export function getNextCronRuns(expression: string, count: number): Date[] {
  const parts = expression.trim().split(/\s+/)
  if (parts.length !== 5) return []

  const [minuteExpr, hourExpr, dayExpr, monthExpr, weekExpr] = parts
  const matches = (value: number, expr: string) => {
    if (expr === "*") return true
    if (expr.includes(",")) return expr.split(",").some((p) => matches(value, p))
    if (expr.includes("/")) {
      const [base, stepRaw] = expr.split("/")
      const step = Number(stepRaw)
      if (!step) return false
      if (base === "*") return value % step === 0
      const baseNum = Number(base)
      return value >= baseNum && (value - baseNum) % step === 0
    }
    if (expr.includes("-")) {
      const [start, end] = expr.split("-").map(Number)
      return value >= start && value <= end
    }
    return value === Number(expr)
  }

  const results: Date[] = []
  const cursor = new Date()
  cursor.setSeconds(0, 0)
  let guard = 0

  while (results.length < count && guard < 200000) {
    cursor.setMinutes(cursor.getMinutes() + 1)
    guard++
    const minute = cursor.getMinutes()
    const hour = cursor.getHours()
    const day = cursor.getDate()
    const month = cursor.getMonth() + 1
    const week = cursor.getDay()

    if (
      matches(minute, minuteExpr) &&
      matches(hour, hourExpr) &&
      matches(day, dayExpr) &&
      matches(month, monthExpr) &&
      matches(week, weekExpr)
    ) {
      results.push(new Date(cursor))
    }
  }

  return results
}
