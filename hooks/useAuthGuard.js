/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

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
    }, [router, ...deps]);

    return { session, loading, setLoading };
}
