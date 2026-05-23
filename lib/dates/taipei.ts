const TAIPEI_TIME_ZONE = 'Asia/Taipei';

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TAIPEI_TIME_ZONE,
});

const monthDayFormatter = new Intl.DateTimeFormat('zh-TW', {
  timeZone: TAIPEI_TIME_ZONE,
  month: 'numeric',
  day: 'numeric',
});

export function getTaipeiDateKey(iso: string | Date): string {
  return dateKeyFormatter.format(typeof iso === 'string' ? new Date(iso) : iso);
}

export function getTodayTaipeiDateKey(): string {
  return dateKeyFormatter.format(new Date());
}

export function formatTaipeiMonthDay(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00+08:00`);
  return monthDayFormatter.format(date);
}
