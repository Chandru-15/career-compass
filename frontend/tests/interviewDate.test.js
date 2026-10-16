import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatInterviewDay,
  formatInterviewTime,
  toInterviewInputValue,
  toStoredInterviewDate,
} from "../lib/interviewDate.js";

test("Singapore interview time survives the form -> database -> form round trip", () => {
  const govTech = toStoredInterviewDate("2026-10-01T10:30");
  assert.equal(govTech, "2026-10-01T02:30:00.000Z");
  assert.equal(toInterviewInputValue(govTech), "2026-10-01T10:30");
  assert.equal(formatInterviewDay(govTech), "Oct 1, 2026");
  assert.equal(formatInterviewTime(govTech), "10:30 AM");

  const razer = toStoredInterviewDate("2026-10-02T16:47");
  assert.equal(razer, "2026-10-02T08:47:00.000Z");
  assert.equal(toInterviewInputValue(razer), "2026-10-02T16:47");
  assert.equal(formatInterviewDay(razer), "Oct 2, 2026");
  assert.equal(formatInterviewTime(razer), "4:47 PM");
});

test("midnight boundary, empty date and invalid calendar values are handled explicitly", () => {
  const midnight = toStoredInterviewDate("2026-10-03T00:47");
  assert.equal(midnight, "2026-10-02T16:47:00.000Z");
  assert.equal(toInterviewInputValue(midnight), "2026-10-03T00:47");
  assert.equal(toStoredInterviewDate(""), null);
  assert.equal(toInterviewInputValue(null), "");
  assert.throws(
    () => toStoredInterviewDate("2026-02-30T10:30"),
    /valid interview/,
  );
});
