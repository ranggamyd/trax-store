import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

/**
 * Checks if a Supabase error is a duplicate/unique constraint violation.
 * Used in 10+ places across the codebase.
 */
export function isDuplicateError(error) {
    return error?.code === "23505" || error?.message?.includes("duplicate");
}

/**
 * Show appropriate toast for duplicate errors with custom messages.
 */
export function handleDuplicateError(error, { duplicateMessage, duplicateDescription, genericMessage }) {
    if (isDuplicateError(error)) {
        toast.error(duplicateMessage || "Data duplikat!", {
            description: duplicateDescription || "Data ini udah ada bro.",
        });
    } else {
        toast.error(genericMessage || "Terjadi kesalahan", { description: error.message });
    }
}

/**
 * Upsert an account_games record. Returns { data, error }.
 * Handles both existing and new account-game links.
 */
export async function upsertAccountGame({ accountId, gameId, privateServerLink }) {
    const { data: existing } = await supabase.from("account_games").select("id").eq("account_id", accountId).eq("game_id", gameId).maybeSingle();

    if (existing) {
        if (privateServerLink) {
            const { error } = await supabase.from("account_games").update({ private_server_link: privateServerLink }).eq("id", existing.id);
            if (error) return { error };
        }
        return { data: existing };
    }

    const { data, error } = await supabase
        .from("account_games")
        .insert([
            {
                account_id: accountId,
                game_id: gameId,
                private_server_link: privateServerLink || null,
            },
        ])
        .select()
        .single();

    return { data, error };
}

/**
 * Find an existing item by name in a game, or create a new one.
 * Returns the item ID or null on failure.
 */
export async function findOrCreateItem(gameId, itemName) {
    const { data: existItem } = await supabase.from("items").select("id").eq("game_id", gameId).ilike("item_name", itemName).maybeSingle();

    if (existItem) return existItem.id;

    const { data: insertedItem, error } = await supabase
        .from("items")
        .insert([{ game_id: gameId, item_name: itemName }])
        .select()
        .single();

    if (error) return null;
    return insertedItem.id;
}

/**
 * Create a new account directly from a combobox search.
 * Returns { data, error }.
 */
export async function createAccountFromCombo(username) {
    const { data, error } = await supabase.from("accounts").insert([{ username }]).select().single();

    if (error) {
        toast.error("Gagal bikin akun", { description: error.message });
        return { error };
    }

    toast.success("Akun baru berhasil didaftarin!");
    return { data };
}

/**
 * Create a new game directly from a combobox search.
 * Returns { data, error }.
 */
export async function createGameFromCombo(name, selectQuery = "*, items(id, item_name)") {
    const { data, error } = await supabase.from("games").insert([{ name }]).select(selectQuery).single();

    if (error) {
        toast.error("Gagal bikin game baru", { description: error.message });
        return { error };
    }

    toast.success("Game baru berhasil dibuat!");
    return { data };
}

/**
 * Validate uniqueness in a list of items (for repeater fields).
 * Returns true if valid, false and shows toast if duplicates found.
 */
export function validateUniqueItems(items, { idKey = "item_id", nameKey = "new_name" } = {}) {
    const uniqueIds = new Set();
    const uniqueNames = new Set();

    for (const item of items) {
        if (item[idKey]) {
            if (uniqueIds.has(item[idKey])) {
                toast.error("Ada item ganda bos!", {
                    description: "Gak bisa nambah item yang sama 2 kali.",
                });
                return false;
            }
            uniqueIds.add(item[idKey]);
        }
        if (item[nameKey]) {
            if (uniqueNames.has(item[nameKey].toLowerCase())) {
                toast.error("Ada item baru ganda bos!", {
                    description: "Nama item barunya ada yang sama nih.",
                });
                return false;
            }
            uniqueNames.add(item[nameKey].toLowerCase());
        }
    }

    return true;
}

/**
 * Process a list of item links: find or create items, then link them to an account.
 * Returns the count of successfully processed items.
 */
export async function processItemLinks(validItems, { gameId, accountId }) {
    let processedCount = 0;

    for (const lnk of validItems) {
        let finalItemId = lnk.item_id;
        if (lnk.new_name) {
            finalItemId = await findOrCreateItem(gameId, lnk.new_name);
        }
        if (finalItemId) {
            await supabase.from("account_items").insert([
                {
                    item_id: finalItemId,
                    account_id: accountId,
                    is_available: true,
                },
            ]);
            processedCount++;
        }
    }

    return processedCount;
}

/**
 * Save missing private server links for accounts in a game.
 * Used when toggling requires_private_server on.
 */
export async function saveMissingLinks(missingLinks, gameId) {
    const { error } = await supabase.from("account_games").upsert(
        missingLinks.map((ml) => ({
            id: ml.id,
            account_id: ml.account_id,
            game_id: gameId,
            private_server_link: ml.private_server_link,
        }))
    );

    if (error) {
        if (isDuplicateError(error)) {
            toast.error("Gagal nyimpen link akun", {
                description: "Ada Link Private Server yang udah dipakai di tempat lain! Pastiin semua link unik bos.",
            });
        } else {
            toast.error("Gagal nyimpen link akun", { description: error.message });
        }
        return { error };
    }

    return { success: true };
}
