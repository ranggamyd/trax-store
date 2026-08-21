import "server-only";

import { getEldoradoLibrary } from "@/app/actions";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { attachLibraryInfo, GAMES_WITH_ACCOUNTS_SELECT, mapGamesWithAccounts } from "@/lib/templateVars";

/**
 * Baca data halaman /templates. Bukan endpoint — dipanggil langsung dari RSC.
 *
 * Perubahan penting soal Eldorado library: sebelumnya nama & ikon game dateng
 * dari `EldoradoLibraryContext`, yang nge-fetch DI BROWSER lewat useEffect.
 * Artinya kartu template nampilin "Game kehapus" sekejap tiap halaman dibuka,
 * sampai library-nya nyampe.
 *
 * Sekarang library-nya diambil di server (dan udah di-cache 1 jam di
 * getEldoradoLibrary), jadi nama game-nya udah nempel sebelum HTML dikirim.
 */
export async function getTemplatesPageData({ query = "" } = {}) {
    const supabase = await createSupabaseServerClient();

    const [templatesResult, gamesResult, libraryResult] = await Promise.all([supabase.from("chat_templates").select("*").order("sort_order", { ascending: true }), supabase.from("games").select(GAMES_WITH_ACCOUNTS_SELECT), getEldoradoLibrary()]);

    const games = attachLibraryInfo(mapGamesWithAccounts(gamesResult.data), libraryResult?.success ? libraryResult.data : []);

    const all = templatesResult.data ?? [];
    const needle = query.trim().toLowerCase();

    // Template itu daftar pendek yang dibaca manusia (puluhan, bukan ribuan),
    // dan urutannya penting (sort_order). Jadi dia sengaja gak di-paginasi —
    // filter di memori server udah cukup, dan gak ada data yang bocor ke klien.
    const templates = needle ? all.filter((t) => t.title?.toLowerCase().includes(needle) || t.text?.toLowerCase().includes(needle) || (t.triggers ?? []).some((trigger) => trigger.toLowerCase().includes(needle))) : all;

    return {
        templates,
        totalTemplates: all.length,
        games,
        error: templatesResult.error?.message ?? gamesResult.error?.message ?? null,
    };
}

/** Satu template, buat pre-fill dialog edit dari ?edit=<id>. */
export async function getTemplateById(id) {
    if (!id) return null;

    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from("chat_templates").select("*").eq("id", id).maybeSingle();

    return data ?? null;
}
