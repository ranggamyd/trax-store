import { Compass, House } from "lucide-react";
import Link from "next/link";

import { SignalLost } from "@/components/illustrations/SignalLost";
import { StatusScreen } from "@/components/templates/StatusScreen";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "Halaman gak ketemu",
};

/**
 * 404.
 *
 * Server Component — nol JS. Halaman 404 gak butuh interaktivitas apa pun
 * selain dua link, dan link itu HTML biasa.
 *
 * Copy-nya sengaja NUDUH URL-nya, bukan user-nya. "Halaman gak ada" itu
 * netral; "kamu salah alamat" itu nyalahin orang yang kemungkinan besar cuma
 * ngeklik bookmark lama.
 */
export default function NotFound() {
    return (
        <StatusScreen
            illustration={<SignalLost className="h-40 w-40" />}
            code="404"
            title="Halaman ini gak ada di sini"
            hint="Mungkin udah dipindah, udah dihapus, atau URL-nya kurang satu huruf. Dari dashboard biasanya lebih cepet ketemu."
            actions={
                <>
                    <Link href="/">
                        <Button size="lg" className="font-semibold">
                            <House className="mr-2 h-4 w-4" />
                            Balik ke dashboard
                        </Button>
                    </Link>
                    <Link href="/guide">
                        <Button size="lg" variant="outline">
                            <Compass className="mr-2 h-4 w-4" />
                            Buka panduan
                        </Button>
                    </Link>
                </>
            }
        />
    );
}
