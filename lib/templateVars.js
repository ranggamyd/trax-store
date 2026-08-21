import { supabase } from "@/lib/supabase";

export const TEMPLATE_PLACEHOLDERS = [
    { key: "private_server_link", token: "{{private_server_link}}", label: "Link private server" },
    { key: "game_name", token: "{{game_name}}", label: "Nama game" },
    { key: "account_username", token: "{{account_username}}", label: "Username akun" },
];

const placeholderPattern = () => /\{\{\s*([a-z_]+)\s*\}\}/g;

export function resolveTemplateText(text, vars = {}) {
    if (!text) return "";
    return text.replace(placeholderPattern(), (match, key) => {
        const value = vars[key];
        return value === undefined || value === null || value === "" ? match : String(value);
    });
}

export function unresolvedPlaceholders(text, vars = {}) {
    return [...(text || "").matchAll(placeholderPattern())]
        .map((m) => m[1])
        .filter((key) => {
            const value = vars[key];
            return value === undefined || value === null || value === "";
        });
}

/**
 * Select string-nya dipisah biar sisi klien dan sisi server nembak kolom yang
 * PERSIS SAMA. Kalau dua tempat nulis select-nya sendiri, cepat atau lambat
 * salah satunya ketinggalan pas ada kolom baru.
 */
export const GAMES_WITH_ACCOUNTS_SELECT = "id, name, eldorado_game_id, account_games(account_id, private_server_link, accounts(username))";

/**
 * Mapper murni: baris mentah -> bentuk yang dipakai UI.
 *
 * Dipisah dari fetch-nya supaya bisa dipakai dua konteks yang beda client:
 * halaman /templates ngambilnya di SERVER (createSupabaseServerClient), dan
 * OrderDetail masih ngambil di BROWSER karena dia komponen interaktif.
 * Logika bentuk datanya cuma ada satu di sini.
 */
export function mapGamesWithAccounts(rows) {
    return (rows || []).map((game) => ({
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

/** Versi browser. Dipakai OrderDetail yang memang harus client-side. */
export async function fetchGamesWithAccounts() {
    const { data } = await supabase.from("games").select(GAMES_WITH_ACCOUNTS_SELECT);
    return mapGamesWithAccounts(data);
}

export const eldoradoIconUrl = (eldoradoGameId) => `https://assetsdelivery.eldorado.gg/v7/_assets_/icons/v28/${eldoradoGameId}.png`;

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

export function selectableGames(games) {
    return games.filter((game) => game.is_eldorado_linked && game.accounts.length > 0).sort((a, b) => a.name.localeCompare(b.name));
}

export function buildTemplateVars(game, account) {
    return {
        private_server_link: account?.private_server_link || "",
        game_name: game?.name || "",
        account_username: account?.username || "",
    };
}
