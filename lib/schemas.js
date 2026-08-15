import * as z from "zod";

export const gameSchema = z.object({
    name: z.string().min(1, { message: "Nama game gak boleh kosong bro!" }),
    image_url: z.string().url({ message: "Masukin URL gambar yang bener dong!" }).optional().or(z.literal("")),
    requires_private_server: z.boolean().default(false),
});

export const accountSchema = z.object({
    username: z.string().min(1, { message: "Username gak boleh kosong!" }),
    notes: z.string().optional(),
});

export const itemSchema = z.object({
    item_name: z.string().min(1, { message: "Nama item gak boleh kosong bro!" }),
    description: z.string().optional(),
});

export const accountGameSchema = z.object({
    account_id: z.string().uuid({ message: "Pilih akun bro!" }),
    private_server_link: z.string().url({ message: "Link server harus valid!" }).optional().or(z.literal("")),
});
