#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE missing TEXT;
BEGIN
  SELECT string_agg(required.name, ', ')
    INTO missing
    FROM (VALUES
      ('manufacturing_events_immutable'),
      ('manufacturing_versions_immutable'),
      ('manufacturing_telemetry_immutable'),
      ('manufacturing_work_orders_retained'),
      ('manufacturing_work_orders_governed'),
      ('material_lots_governed'),
      ('decided_inspection_immutable')
    ) AS required(name)
    LEFT JOIN pg_trigger trigger ON trigger.tgname=required.name AND NOT trigger.tgisinternal
    WHERE trigger.oid IS NULL;
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'missing governance triggers: %', missing; END IF;
  IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE name='001_governed_manufacturing.sql') THEN
    RAISE EXCEPTION 'governed manufacturing migration is not recorded';
  END IF;
END $$;
SQL

echo "governed schema controls verified"
