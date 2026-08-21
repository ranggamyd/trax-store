import { MessageSquare } from "lucide-react";

import { TemplateCard } from "@/app/templates/components/TemplateCard";
import { TemplateEditDialog } from "@/app/templates/components/TemplateEditDialog";
import { TemplatesToolbar } from "@/app/templates/components/TemplatesToolbar";
import { getTemplateById, getTemplatesPageData } from "@/app/templates/queries";
import { EmptyRadar } from "@/components/illustrations/EmptyRadar";
import { PageHeader } from "@/components/molecules/PageHeader";
import { PageContainer } from "@/components/templates/PageContainer";

export const metadata = {
    title: "Template Chat",
};

/** SERVER COMPONENT. */
export default async function TemplatesPage({ searchParams }) {
    const params = await searchParams;

    const query = typeof params?.q === "string" ? params.q : "";
    const editId = typeof params?.edit === "string" ? params.edit : null;

    const [{ templates, totalTemplates, games, error }, editingTemplate] = await Promise.all([getTemplatesPageData({ query }), getTemplateById(editId)]);

    const isSearching = query.length > 0;

    const findGame = (gameId) => games.find((g) => g.id === gameId) ?? null;
    const findAccount = (gameId, accountId) => findGame(gameId)?.accounts.find((a) => a.account_id === accountId) ?? null;

    return (
        <PageContainer>
            <PageHeader title="Template Chat" subtitle={totalTemplates > 0 ? `${totalTemplates} balesan siap pakai buat order masuk.` : "Balesan siap pakai buat order masuk."} eyebrow="Balesan Cepat" icon={MessageSquare} rightContent={<TemplatesToolbar games={games} />} />

            {error && (
                <div className="border-danger/25 bg-danger/[0.07] text-danger rounded-2xl border p-4 text-sm" role="alert">
                    Gagal ngambil template: {error}
                </div>
            )}

            {templates.length === 0 ? (
                <div className="glass-subtle flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center">
                    <EmptyRadar className="mb-2 h-32 w-32 opacity-90" />
                    <p className="text-foreground text-base font-semibold">{isSearching ? `Gak ada template yang cocok sama "${query}"` : "Belum ada template"}</p>
                    <p className="text-muted-foreground mt-1 max-w-sm text-sm">{isSearching ? "Coba kata kunci lain, atau cari dari isi pesannya." : 'Klik "Template baru" buat bikin balesan pertama — nanti bisa dikirim sekali klik dari halaman order.'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                        <TemplateCard key={template.id} template={template} game={findGame(template.game_id)} account={findAccount(template.game_id, template.account_id)} />
                    ))}
                </div>
            )}

            <TemplateEditDialog template={editingTemplate} games={games} />
        </PageContainer>
    );
}
