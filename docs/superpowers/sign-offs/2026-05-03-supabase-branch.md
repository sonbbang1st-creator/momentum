# Supabase Branch Decision

Date: 2026-05-03
Decision: Option A — apply migrations directly to main (production) database.

Reason: Project is on Supabase free tier, which does not support database branching. The schema is currently empty (no data, no tables, no users), so applying the migrations to main carries no risk of data loss or production disruption. All migrations are additive (CREATE only), include RLS policies, and have been peer-reviewed against the spec.

Project ref: daxfnjfnrfsclpnlonis
Project URL: https://daxfnjfnrfsclpnlonis.supabase.co

When this project graduates to Pro tier, future schema changes should branch first.
