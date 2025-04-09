// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  ssr: false,
  vite: {
    plugins: [tailwindcss()],
  },
  css: ["@/assets/css/app.css", "primeicons/primeicons.css"],

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
    "@nuxt/image",
  ],
});
