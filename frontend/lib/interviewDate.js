const TIME_ZONE = "Asia/Singapore";

function partsFor(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map(({ type, value: part }) => [type, part]),
  );
}

// datetime-local has no timezone; interviews in this Singapore demo use SGT.
export function toStoredInterviewDate(localValue) {
  if (!localValue) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localValue)) {
    throw new Error("Choose a valid interview date and time.");
  }
  const date = new Date(`${localValue}+08:00`);
  if (
    Number.isNaN(date.getTime()) ||
    toInterviewInputValue(date.toISOString()) !== localValue
  ) {
    throw new Error("Choose a valid interview date and time.");
  }
  return date.toISOString();
}

export function toInterviewInputValue(storedValue) {
  if (!storedValue) return "";
  const parts = partsFor(storedValue);
  return parts
    ? `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
    : "";
}

export function formatInterviewDay(storedValue) {
  const date = new Date(storedValue);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-US", {
        timeZone: TIME_ZONE,
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
}

export function formatInterviewTime(storedValue) {
  const date = new Date(storedValue);
  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : new Intl.DateTimeFormat("en-US", {
        timeZone: TIME_ZONE,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
}
