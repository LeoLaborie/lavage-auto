-- =====================================================================
-- Issue #24 — Auto-complete bookings cron
-- =====================================================================
-- Ce script provisionne un job pg_cron horaire qui appelle l'endpoint
-- POST /api/cron/auto-complete avec le secret CRON_SECRET dans le header.
-- À exécuter dans le SQL editor Supabase (ou via supabase CLI db query).
--
-- Pré-requis :
--   1. Avoir CRON_SECRET défini dans Supabase Vault sous la clé 'cron_secret'
--      (Dashboard Supabase → Project Settings → Vault → Add new secret)
--   2. Connaître l'URL de prod : https://<APP_URL>/api/cron/auto-complete
--
-- Idempotent : ré-exécution safe (on unschedule avant de reschedule).
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Unschedule any previous run (idempotent)
do $$
begin
    perform cron.unschedule('auto-complete-bookings');
exception when others then null;  -- ignore if not scheduled yet
end $$;

-- Schedule hourly call to the Next.js endpoint
select cron.schedule(
    'auto-complete-bookings',
    '0 * * * *',
    $cron$
    select net.http_post(
        url := 'https://REPLACE_WITH_PROD_APP_URL/api/cron/auto-complete',
        headers := jsonb_build_object(
            'content-type', 'application/json',
            'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
        ),
        timeout_milliseconds := 30000
    );
    $cron$
);

-- Sanity check : list scheduled jobs
select jobname, schedule, active from cron.job where jobname = 'auto-complete-bookings';
