// https://nuxt.com/docs/api/configuration/nuxt-config
import * as path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  ssr: false,

  compatibilityDate: "2024-11-01",

  vite: {
    plugins: [tailwindcss()],
  },
  css: ["@/assets/css/app.css", "primeicons/primeicons.css"],

  nitro: {
    output: {
      publicDir: path.join(__dirname, "dist"),
    },
  },

  runtimeConfig: {
    public: {
      apiUrl: process.env.API_URL,
    },
  },

  modules: [
    "@vueuse/nuxt",
    [
      "@pinia/nuxt",
      {
        autoImports: ["defineStore", "definePiniaStore", "acceptHMRUpdate"],
      },
    ],
  ],
});
