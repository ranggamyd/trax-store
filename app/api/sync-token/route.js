import { NextResponse } from "next/server";
import { setEldoradoToken } from "@/app/actions";

export async function POST(request) {
    try {
        const { token } = await request.json();
        if (!token) return NextResponse.json({ success: false, error: "No token provided" }, { status: 400 });

        await setEldoradoToken(token);

        return new NextResponse(JSON.stringify({ success: true, message: "Token synced successfully" }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    } catch (error) {
        return new NextResponse(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }
}

// Enable CORS for Eldorado.gg
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
