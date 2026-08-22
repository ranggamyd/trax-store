-- ============================================================================
--  TRAXSTORE — ROW LEVEL SECURITY
-- ============================================================================
--
--  KENAPA FILE INI PENTING
--
--  `NEXT_PUBLIC_SUPABASE_ANON_KEY` itu PUBLIK by design — dia di-inline ke
--  bundle JavaScript browser. Siapa pun bisa buka DevTools dan ngambil.
--
--  Semua query aplikasi lewat key itu:
--      lib/supabase.js        -> anon key (browser)
--      lib/supabaseServer.js  -> anon key + session user (server)
--      lib/supabaseAdmin.js   -> service role (bypass RLS, dipagerin server-only)
--
--  Artinya semua `requireAdmin()` di Server Action itu ngejaga PINTU APLIKASI.
--  Kalau RLS bolong, pintunya bisa dilewati — orang tinggal nembak REST API
--  Supabase langsung pakai key dari bundle browser.
--
--  RLS itu bukan lapisan tambahan. Dia lapisan yang sebenernya.
--
-- ----------------------------------------------------------------------------
--  HASIL PROBE (sudah dijalanin, bukan dugaan)
--
--   tabel            baca anon    baca service   INSERT anon    status
--  ------------------+------------+--------------+--------------+-----------
--   accounts          0 baris      13 baris       diblokir       aman
--   games             0 baris       4 baris       diblokir       aman
--   account_games     0 baris       5 baris       diblokir       aman
--   admin_profiles    0 baris       4 baris       diblokir       aman
--   shifts            0 baris       9 baris       diblokir       aman
--   chat_templates   15 baris      15 baris       diblokir    <-- BOCOR BACA
--
--  Jadi RLS-nya UDAH NYALA dan kerja di 5 tabel. Yang bermasalah cuma satu:
--  `chat_templates` bisa dibaca TANPA LOGIN. Berarti ada policy SELECT permisif
--  yang nyangkut di tabel itu.
--
--  `items` dan `account_items` GAK ADA di database (PostgREST: PGRST205).
--  Jadi dua tabel itu gak masuk skrip ini. Lihat catatan di paling bawah.
--
-- ----------------------------------------------------------------------------
--  CARA PAKAI
--
--  1. Jalanin BAGIAN 1 (diagnosa). Lihat policy apa aja yang ada sekarang.
--  2. Jalanin BAGIAN 2 (kebijakan). Aman diulang.
--  3. Jalanin BAGIAN 3 (verifikasi).
--  4. Tes app: buka /accounts, /templates, /shifts, /profile.
--
--  Jalanin di Supabase Dashboard -> SQL Editor.
-- ============================================================================


-- ============================================================================
--  BAGIAN 1 — DIAGNOSA
-- ============================================================================

-- 1a. RLS nyala di tabel mana aja?
SELECT
    c.relname        AS tabel,
    c.relrowsecurity AS rls_enabled,
    (SELECT count(*) FROM pg_policies p
      WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS jumlah_policy
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relrowsecurity ASC, c.relname;

-- 1b. Policy yang ada sekarang. PERHATIIN kolom `untuk_role`:
--     kalau ada {public} atau {anon}, itu bisa diakses TANPA login.
--     Di sini lu bakal nemu policy yang bikin chat_templates bocor.
SELECT
    tablename  AS tabel,
    policyname AS nama_policy,
    cmd        AS operasi,
    roles      AS untuk_role,
    qual       AS kondisi_baca,
    with_check AS kondisi_tulis
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;


-- ============================================================================
--  BAGIAN 2 — KEBIJAKAN
-- ============================================================================
--
--  MODELNYA
--
--  Semua yang login di app ini adalah admin (peran non-admin belum ada — itu
--  masih TODO). Jadi: `authenticated` boleh penuh ke tabel operasional, `anon`
--  gak boleh apa-apa.
--
--  `TO authenticated` itu inti pertahanannya. Tanpa itu, policy-nya berlaku
--  juga buat `anon` — dan anon key itu publik.
--
--  CATATAN PENTING SOAL DROP:
--  Skrip ini ngebuang SEMUA policy yang ada di tabel target, apa pun namanya.
--  Bukan cuma yang namanya cocok sama yang dia bikin. Alasannya: policy di
--  Postgres itu OR — satu policy permisif yang ketinggalan bikin semua policy
--  ketat di sebelahnya gak ada artinya. Dan itu persis yang kejadian di
--  `chat_templates`.
-- ============================================================================

BEGIN;

-- ── Tabel operasional: admin yang login boleh penuh ────────────────────────
DO $policies$
DECLARE
    t text;
    existing text;
    -- 'items' dan 'account_items' TIDAK dimasukin: dua tabel itu gak ada di
    -- database ini. Loop-nya bakal ngelewatin mereka otomatis, tapi lebih baik
    -- gak ditulis daripada bikin orang berikutnya nyangka mereka ada.
    operational_tables text[] := ARRAY[
        'accounts',
        'games',
        'account_games',
        'chat_templates'
    ];
BEGIN
    FOREACH t IN ARRAY operational_tables LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t
        ) THEN
            RAISE NOTICE 'Tabel public.% gak ada -- dilewatin', t;
            CONTINUE;
        END IF;

        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

        FOR existing IN
            SELECT policyname FROM pg_policies
            WHERE schemaname = 'public' AND tablename = t
        LOOP
            EXECUTE format('DROP POLICY %I ON public.%I', existing, t);
            RAISE NOTICE 'public.% : policy lama "%" dibuang', t, existing;
        END LOOP;

        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)',
            t || '_authenticated_select', t);

        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (true)',
            t || '_authenticated_insert', t);

        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)',
            t || '_authenticated_update', t);

        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (true)',
            t || '_authenticated_delete', t);

        RAISE NOTICE 'public.% : RLS nyala, 4 policy authenticated dipasang', t;
    END LOOP;
END
$policies$;


-- ── admin_profiles: lewat anon key cuma boleh baca BARIS SENDIRI ───────────
--
-- App cuma baca tabel ini pakai anon key di satu tempat: app/profile/queries.js,
-- dan itu `.eq("id", admin.id)` — baris sendiri.
--
-- Akses lain (daftar admin di /users, mapping username di /shifts,
-- resolveLoginIdentifier waktu login) lewat SERVICE ROLE yang bypass RLS.
--
-- Jadi gak ada alasan ngizinin authenticated baca profil orang lain lewat anon
-- key. Tanpa batasan ini, admin mana pun bisa nge-dump semua email admin
-- langsung dari REST API.
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

DO $profiles$
DECLARE existing text;
BEGIN
    FOR existing IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'admin_profiles'
    LOOP
        EXECUTE format('DROP POLICY %I ON public.admin_profiles', existing);
        RAISE NOTICE 'admin_profiles : policy lama "%" dibuang', existing;
    END LOOP;
END
$profiles$;

CREATE POLICY admin_profiles_select_own
    ON public.admin_profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Sengaja TIDAK ADA policy insert/update/delete di sini.
-- Semua tulis lewat service role (app/actions/users.js, app/profile/actions.js).


-- ── shifts: service role SAJA ─────────────────────────────────────────────
--
-- Setelah dashboard & /shifts jadi Server Component, gak ada kode yang nyentuh
-- tabel ini pakai anon key. Jadi: RLS nyala, NOL policy.
--
-- CATATAN BUAT NANTI: kalau suatu hari ada komponen klien yang mau baca shifts
-- langsung, dia bakal dapet array KOSONG — bukan error. Jangan bingung;
-- tambahin policy select di sini.
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

DO $shifts$
DECLARE existing text;
BEGIN
    FOR existing IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'shifts'
    LOOP
        EXECUTE format('DROP POLICY %I ON public.shifts', existing);
        RAISE NOTICE 'shifts : policy lama "%" dibuang', existing;
    END LOOP;
END
$shifts$;

COMMIT;


-- ============================================================================
--  BAGIAN 3 — VERIFIKASI
-- ============================================================================

-- 3a. Semua tabel harus rls_enabled = true.
SELECT
    c.relname        AS tabel,
    c.relrowsecurity AS rls_enabled,
    (SELECT count(*) FROM pg_policies p
      WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS jumlah_policy
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relrowsecurity ASC, c.relname;

-- 3b. INI YANG PALING PENTING: harus NOL BARIS.
--     Baris apa pun di sini artinya masih ada policy yang jalan tanpa login.
SELECT
    tablename  AS tabel,
    policyname AS policy_bahaya,
    cmd        AS operasi,
    roles      AS untuk_role
FROM pg_policies
WHERE schemaname = 'public'
  AND (roles::text[] && ARRAY['anon', 'public'])
ORDER BY tablename;

-- 3c. Rekap policy per tabel.
SELECT
    tablename AS tabel,
    cmd       AS operasi,
    array_agg(DISTINCT r) AS role
FROM pg_policies, unnest(roles) AS r
WHERE schemaname = 'public'
GROUP BY tablename, cmd
ORDER BY tablename, cmd;

-- ============================================================================
--  HASIL YANG DIHARAPKAN
--
--   tabel            | policy authenticated        | catatan
--  ------------------+-----------------------------+-------------------------
--   accounts          | SELECT INSERT UPDATE DELETE |
--   games             | SELECT INSERT UPDATE DELETE |
--   account_games     | SELECT INSERT UPDATE DELETE |
--   chat_templates    | SELECT INSERT UPDATE DELETE | kebocoran baca ketutup
--   admin_profiles    | SELECT (baris sendiri)      | tulis via service role
--   shifts            | (nol)                       | semua via service role
--
--  Bagian 3b harus NOL BARIS.
--
--  Habis ini, jalanin ulang probe-nya buat mastiin:
--      node scratchpad/rls-probe2.mjs
--  chat_templates harus berubah dari "15 baris" jadi "0 baris".
-- ============================================================================


-- ============================================================================
--  BELUM DIKERJAIN — BUTUH KEPUTUSAN LU
-- ============================================================================
--
--  1. TABEL `items` DAN `account_items` GAK ADA
--
--     Kode masih nge-query dua tabel ini di beberapa tempat, dan semuanya
--     gagal diam-diam:
--       - tab "Item" di /accounts/[id]   -> selalu kosong
--       - tab "Item" di /games/[id]      -> selalu kosong
--       - combobox game di dialog "Tautin game" -> SELALU KOSONG, karena
--         query-nya `games?select=...,items(...)` dan seluruh query itu gagal
--         (PGRST200: gak ada foreign key games<->items)
--
--     Dua pilihan:
--       (a) BIKIN tabelnya  -> fitur item hidup. Sketsa DDL-nya di bawah.
--       (b) CABUT fiturnya  -> buang tab Item, dialog item, dan nested select
--                              `items(...)` dari query games.
--
--     Sketsa (a):
--
--       CREATE TABLE public.items (
--           id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--           game_id     uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
--           item_name   text NOT NULL,
--           description text,
--           created_at  timestamptz NOT NULL DEFAULT now(),
--           UNIQUE (game_id, item_name)
--       );
--
--       CREATE TABLE public.account_items (
--           id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--           account_id  uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
--           item_id     uuid NOT NULL REFERENCES public.items(id)    ON DELETE CASCADE,
--           is_available boolean NOT NULL DEFAULT true,
--           stock_notes text,
--           created_at  timestamptz NOT NULL DEFAULT now(),
--           UNIQUE (account_id, item_id)
--       );
--
--     Kalau ambil (a), tambahin dua tabel itu ke `operational_tables` di
--     BAGIAN 2 lalu jalanin ulang skripnya.
--
--
--  2. PERAN / RBAC
--
--     Sekarang "authenticated" = "admin penuh". Admin mana pun bisa hapus admin
--     lain, ganti password admin lain, dan hapus data apa pun.
--
--       ALTER TABLE public.admin_profiles
--           ADD COLUMN role text NOT NULL DEFAULT 'admin'
--           CHECK (role IN ('owner', 'admin', 'staff'));
--
--       CREATE OR REPLACE FUNCTION public.current_admin_role()
--       RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $fn$
--           SELECT role FROM public.admin_profiles WHERE id = auth.uid();
--       $fn$;
--
--     Habis itu policy DELETE bisa dipatok:
--         USING (public.current_admin_role() IN ('owner', 'admin'))
--
--     Dan `requireAdmin()` di lib/auth.js dikasih varian `requireRole('owner')`
--     buat aksi kayak deleteUser.
-- ============================================================================
