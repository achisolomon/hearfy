import { BRAND_NAME, appointment } from "./mock-data";

/**
 * "Add to calendar" on the Confirmed screen (booking.tsx) was wired to
 * `back`, so tapping it silently rewound the booking to the payment screen
 * (owner, 2026-09-01). This is the honest fix: a real .ics file, generated
 * client-side from the same `appointment` fixture the Confirmed screen
 * already displays, downloaded via a Blob URL. No server, no dependency —
 * works inside `next.config.mjs`'s static export.
 *
 * `appointment.fullDate` ("May 21, 2025") and `.time` ("9:00 – 10:00 AM")
 * are fixed demo fixtures, not real user input, so a small hand-rolled parse
 * is enough — this never has to handle a format it wasn't given.
 */

/** Parses "9:00 – 10:00 AM" into 24h {startHour,startMin,endHour,endMin}. */
function parseTimeRange(time: string): { startHour: number; startMin: number; endHour: number; endMin: number } {
  const [startRaw, endRaw] = time.split("–").map(s => s.trim());
  const period = /AM|PM/i.exec(endRaw)?.[0]?.toUpperCase() ?? "AM";
  const parseOne = (raw: string): { hour: number; min: number } => {
    const explicit = /AM|PM/i.exec(raw)?.[0]?.toUpperCase();
    const [h, m] = raw.replace(/\s*(AM|PM)/i, "").split(":").map(Number);
    let hour = h % 12;
    if ((explicit ?? period) === "PM") hour += 12;
    return { hour, min: m ?? 0 };
  };
  const start = parseOne(startRaw);
  const end = parseOne(endRaw);
  return { startHour: start.hour, startMin: start.min, endHour: end.hour, endMin: end.min };
}

/** "May 21, 2025" -> {year, month (1-indexed), day}. */
function parseFullDate(fullDate: string): { year: number; month: number; day: number } {
  const d = new Date(fullDate);
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Local-time .ics stamp: YYYYMMDDTHHMMSS (no trailing Z — no timezone data in the fixture). */
function icsStamp(year: number, month: number, day: number, hour: number, min: number): string {
  return `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(min)}00`;
}

/**
 * Builds a minimal, valid RFC 5545 .ics file for the booked visit, reading
 * the same fixture the Confirmed screen renders — so the file can never
 * disagree with what is on screen.
 */
export function buildIcs(appt: typeof appointment = appointment): string {
  const { year, month, day } = parseFullDate(appt.fullDate);
  const { startHour, startMin, endHour, endMin } = parseTimeRange(appt.time);
  const dtStart = icsStamp(year, month, day, startHour, startMin);
  const dtEnd = icsStamp(year, month, day, endHour, endMin);
  const dtStamp = icsStamp(year, month, day, startHour, startMin);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${BRAND_NAME}//Demo//EN`,
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:hearfy-visit-${year}${pad(month)}${pad(day)}@hearfy.demo`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${BRAND_NAME} at-home diagnostic visit`,
    "DESCRIPTION:Your certified medical assistant will visit for your at-home hearing diagnostic.",
    "LOCATION:1420 Brickell Ave\\, Miami\\, FL",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // .ics requires CRLF line endings.
  return lines.join("\r\n");
}

/** Triggers a browser download of the visit's .ics file via a Blob URL. */
export function downloadIcs(appt: typeof appointment = appointment): void {
  const blob = new Blob([buildIcs(appt)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hearfy-visit.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
