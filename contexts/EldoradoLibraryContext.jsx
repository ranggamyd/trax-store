"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { getEldoradoLibrary } from "@/app/actions";

const EldoradoLibraryContext = createContext({
    library: [],
    getGameName: () => null,
});

export function EldoradoLibraryProvider({ children }) {
    const [library, setLibrary] = useState([]);

    useEffect(() => {
        async function fetchLibrary() {
            try {
                const res = await getEldoradoLibrary();
                if (res.success && Array.isArray(res.data)) {
                    setLibrary(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch Eldorado library:", err);
            }
        }
        fetchLibrary();
    }, []);

    const getGameName = (gameId) => {
        if (!gameId) return null;
        const game = library.find((g) => g.gameId === String(gameId) || g.legacyUrlId === String(gameId));
        return game ? game.menuGameTitle || game.gameName : null;
    };

    return <EldoradoLibraryContext.Provider value={{ library, getGameName }}>{children}</EldoradoLibraryContext.Provider>;
}

export function useEldoradoLibrary() {
    return useContext(EldoradoLibraryContext);
}
