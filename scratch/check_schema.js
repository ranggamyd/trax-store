const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
    const parts = line.split("=");
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts
            .slice(1)
            .join("=")
            .trim()
            .replace(/(^"|"$)/g, "");
    }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase.from("chat_templates").select("id, type, title, triggers");
    console.log("ALL TEMPLATES:", JSON.stringify(data, null, 2));
}
run();
