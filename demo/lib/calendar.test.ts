import { describe, expect, it } from "vitest";
import { buildIcs } from "./calendar";
import { appointment } from "./mock-data";

describe("buildIcs", () => {
  it("builds a valid VCALENDAR/VEVENT wrapper", () => {
    const ics = buildIcs();
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  // The whole point of generating this client-side rather than hardcoding it:
  // the file must describe the exact visit the Confirmed screen shows, so it
  // can never disagree with what the patient just read on screen.
  it("encodes the fixture's date and time, matching what Confirmed displays", () => {
    const ics = buildIcs(appointment);
    expect(ics).toContain("DTSTART:20250521T090000");
    expect(ics).toContain("DTEND:20250521T100000");
  });

  it("parses a PM time range correctly", () => {
    const ics = buildIcs({ ...appointment, fullDate: "May 21, 2025", time: "1:00 – 2:00 PM" });
    expect(ics).toContain("DTSTART:20250521T130000");
    expect(ics).toContain("DTEND:20250521T140000");
  });

  // "11:00 AM–12:00 PM"-shaped ranges (noon boundary, one bare hour without
  // its own AM/PM marker) are exactly the kind of range BookTime's own list
  // of slots offers, even though Confirmed itself only ever shows the fixed
  // fixture — worth pinning so a future wiring of the real chosen slot
  // through to this builder does not silently mis-render noon.
  it("carries an explicit AM/PM marker on the start of a range crossing noon", () => {
    const ics = buildIcs({ ...appointment, fullDate: "May 21, 2025", time: "11:00 AM – 12:00 PM" });
    expect(ics).toContain("DTSTART:20250521T110000");
    expect(ics).toContain("DTEND:20250521T120000");
  });

  it("uses CRLF line endings, as .ics requires", () => {
    expect(buildIcs()).toContain("\r\n");
  });

  it("gives the event a non-empty summary describing the visit", () => {
    const ics = buildIcs();
    expect(ics).toMatch(/SUMMARY:.+/);
  });
});
