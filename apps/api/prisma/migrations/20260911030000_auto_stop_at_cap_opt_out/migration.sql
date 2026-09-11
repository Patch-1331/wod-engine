-- Opt-out for the time-cap auto-stop.
--
-- `ScheduleRule.autoStopAtCapEnabled` is the athlete's preference and
-- `WorkoutSession.autoStopAtCap` the copy each session runs under, taken at
-- start the way `capSeconds` is -- so toggling the setting never changes the
-- rules under a workout already in progress.
--
-- Both default true: stopping at the cap is how the timer is meant to run, so
-- existing rows (including sessions in progress right now) keep that behaviour
-- and only an explicit opt-out turns it off.

ALTER TABLE "ScheduleRule" ADD COLUMN     "autoStopAtCapEnabled" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "WorkoutSession" ADD COLUMN     "autoStopAtCap" BOOLEAN NOT NULL DEFAULT true;
