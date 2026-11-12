import assert from "node:assert/strict";
import test from "node:test";
import { getCurrentActivityStreak, normalizeActivityStreak, recordActivity } from "./activityStreak.js";

const localDate = (year, month, day, hour = 12) => new Date(year, month - 1, day, hour);

test("a completed activity increases a streak once per local calendar day", () => {
  const first = recordActivity(null, localDate(2026, 11, 12));
  const sameDay = recordActivity(first, localDate(2026, 11, 12, 21));

  assert.deepEqual(first, { current: 1, lastActiveDate: "2026-11-12" });
  assert.deepEqual(sameDay, first);
});

test("consecutive active days extend a streak, while a missed day restarts it", () => {
  const first = recordActivity(null, localDate(2026, 11, 30));
  const consecutive = recordActivity(first, localDate(2026, 12, 1));
  const afterMissedDay = recordActivity(consecutive, localDate(2026, 12, 3));

  assert.equal(consecutive.current, 2);
  assert.deepEqual(afterMissedDay, { current: 1, lastActiveDate: "2026-12-03" });
});

test("an existing streak expires after a full inactive calendar day", () => {
  const streak = { current: 4, lastActiveDate: "2026-11-10" };

  assert.equal(getCurrentActivityStreak(streak, localDate(2026, 11, 11)), 4);
  assert.equal(getCurrentActivityStreak(streak, localDate(2026, 11, 12)), 0);
});

test("invalid saved streak data normalizes to an empty streak", () => {
  assert.deepEqual(normalizeActivityStreak({ current: 9, lastActiveDate: "2026-02-30" }), {
    current: 0,
    lastActiveDate: null,
  });
});
