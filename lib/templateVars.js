import { supabase } from "@/lib/supabase";

/**
 * Placeholder buat template chat tipe "Specific".
 * Nilainya diresolve pas template dipake (di chat order), bukan pas disimpen —
 * jadi ganti link private server di /games langsung kepake di semua template.
 */
export const TEMPLATE_PLACEHOLDERS = [
    { key: "private_server_link", token: "{{private_server_link}}", label: "Link private server" },
    { key: "game_name", token: "{{game_name}}", label: "Nama game" },
    { key: "account_username", token: "{{account_username}}", label: "Username akun" },
];

const placeholderPattern = () => /\{\{\s*([a-z_]+)\s*\}\}/g;

/** Ganti {{placeholder}} pake nilai di `vars`. Yang nilainya kosong dibiarin apa adanya. */
export function resolveTemplateText(text, vars = {}) {
    if (!text) return "";
    return text.replace(placeholderPattern(), (match, key) => {
        const value = vars[key];
        return value === undefined || value === null || value === "" ? match : String(value);
    });
}

/** Placeholder yang masih nyangkut (nilainya kosong) — dipake buat nahan tombol kirim. */
export function unresolvedPlaceholders(text, vars = {}) {
    return [...(text || "").matchAll(placeholderPattern())]
        .map((m) => m[1])
        .filter((key) => {
            const value = vars[key];
            return value === undefined || value === null || value === "";
        });
}

/**
 * Baris `games` di supabase udah bukan sumber daftar game (itu dari Eldorado library),
 * cuma baris penghubung: nautin gameId Eldorado ke akun + link private server-nya.
 */
export async function fetchGamesWithAccounts() {
    const { data } = await supabase.from("games").select("id, name, eldorado_game_id, account_games(account_id, private_server_link, accounts(username))");
    return (data || []).map((game) => ({
        id: game.id,
        name: game.name,
        eldorado_game_id: game.eldorado_game_id,
        accounts: (game.account_games || [])
            .map((ag) => ({
                account_id: ag.account_id,
                username: ag.accounts?.username?.trim() || "(akun kehapus)",
                private_server_link: ag.private_server_link?.trim() || "",
            }))
            .sort((a, b) => a.username.localeCompare(b.username)),
    }));
}

export const eldoradoIconUrl = (eldoradoGameId) => `https://assetsdelivery.eldorado.gg/v7/_assets_/icons/v28/${eldoradoGameId}.png`;

/**
 * Nama + icon game diambil dari Eldorado library (bukan kolom `games.name` yang manual).
 * Baris yang eldorado_game_id-nya kosong = data manual lama, gak dianggep game Eldorado.
 */
export function attachLibraryInfo(games, library = []) {
    return games.map((game) => {
        const entry = game.eldorado_game_id ? library.find((g) => g.gameId === game.eldorado_game_id || g.legacyUrlId === game.eldorado_game_id) : null;
        return {
            ...game,
            name: entry?.menuGameTitle || entry?.gameName || game.name,
            icon_url: game.eldorado_game_id ? eldoradoIconUrl(game.eldorado_game_id) : null,
            is_eldorado_linked: Boolean(game.eldorado_game_id),
        };
    });
}

/** Game yang bisa dipake template Specific: ketaut ke Eldorado DAN ada akunnya. */
export function selectableGames(games) {
    return games.filter((game) => game.is_eldorado_linked && game.accounts.length > 0).sort((a, b) => a.name.localeCompare(b.name));
}

/** Bikin vars buat resolveTemplateText dari satu game + satu akun di hasil fetchGamesWithAccounts. */
export function buildTemplateVars(game, account) {
    return {
        private_server_link: account?.private_server_link || "",
        game_name: game?.name || "",
        account_username: account?.username || "",
    };
}
