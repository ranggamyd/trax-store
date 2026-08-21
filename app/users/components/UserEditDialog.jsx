"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { UserFormDialog } from "@/app/users/components/UserFormDialog";

/** Nyetir dialog edit dari ?edit=<id>. Pola yang sama kayak /accounts. */
export function UserEditDialog({ user }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const close = () => {
        const params = new URLSearchParams(searchParams);
        params.delete("edit");

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    return <UserFormDialog user={user} open={Boolean(user)} onOpenChange={(next) => !next && close()} />;
}
