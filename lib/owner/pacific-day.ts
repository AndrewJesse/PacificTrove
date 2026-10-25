/** Midnight at the start of the Pacific calendar day that contains `now`. */
export function startOfPacificDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: "America/Los_Angeles",
    year: "numeric",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const hour = value("hour") === 24 ? 0 : value("hour");
  const wall = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    hour,
    value("minute"),
    value("second")
  );
  const offset = wall - now.getTime();
  return new Date(
    Date.UTC(value("year"), value("month") - 1, value("day")) - offset
  );
}
