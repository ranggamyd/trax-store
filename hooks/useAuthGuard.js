"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

/**
 * Hook for session-based auth guard.
 * Redirects to /login if no session, then calls onAuthenticated callback.
 * Returns { session, loading }.
 */
export function useAuthGuard(onAuthenticated, deps = []) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (!session) {
                router.push("/login");
            } else {
                if (onAuthenticated) onAuthenticated(session);
                setLoading(false);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router, ...deps]);

    return { session, loading, setLoading };
}
