import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";

const eslintConfig = defineConfig([
    ...nextVitals,
    globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
    {
        plugins: {
            "unused-imports": unusedImports,
            "simple-import-sort": simpleImportSort,
        },
        rules: {
            "no-unused-vars": "off",
            "unused-imports/no-unused-imports": "error",
            "unused-imports/no-unused-vars": [
                "warn",
                {
                    vars: "all",
                    varsIgnorePattern: "^_",
                    args: "after-used",
                    argsIgnorePattern: "^_",
                },
            ],
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",

            // Semua <img> di app ini cuma ikon kecil (12-96px) dari host pihak ketiga
            // (assetsdelivery.eldorado.gg, blob storage) plus games.icon_url yang hostnya
            // dinamis dari DB. next/image bakal throw kalau hostnya belum kedaftar di
            // images.remotePatterns, jadi <img> biasa lebih aman & gak nambah beban optimizer.
            "@next/next/no-img-element": "off",
        },
    },
]);

export default eslintConfig;
