-- List game sekarang dateng dari Eldorado library, sementara link private server
-- masih nempel di account_games (game_id -> games.id). Kolom ini nautin baris
-- `games` lokal ke gameId Eldorado, jadi account_games & items gak perlu diubah.
--
-- Jalanin di Supabase SQL Editor.

alter table public.games
    add column if not exists eldorado_game_id text;

-- Satu game Eldorado = maksimal satu baris `games` lokal.
-- Partial index biar baris lama (eldorado_game_id null) tetep boleh banyak.
create unique index if not exists games_eldorado_game_id_key
    on public.games (eldorado_game_id)
    where eldorado_game_id is not null;

-- Opsional: mapping 3 game manual yang udah ada ke gameId Eldorado-nya.
-- Cek dulu gameId-nya di halaman /games (ID: xxx ketulis di bawah nama game).
-- update public.games set eldorado_game_id = '142' where name = 'Mini War';
