-- Template tipe "Specific" nyimpen relasi ke game + akun default, bukan link mentah.
-- Link private server-nya diresolve dari account_games tiap kali template dipake,
-- jadi kalo link di /games diganti, template ikut kebaru sendiri.
--
-- Jalanin di Supabase SQL Editor.

alter table public.chat_templates
    add column if not exists game_id uuid references public.games (id) on delete set null,
    add column if not exists account_id uuid references public.accounts (id) on delete set null;

create index if not exists chat_templates_game_id_idx on public.chat_templates (game_id);
