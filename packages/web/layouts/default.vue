<template>
  <BannerTop />
  <Header />
  <main class="h-auto min-h-[80vh]">
    <slot />
  </main>
  <Footer />
</template>

<style lang="postcss" scoped>
main {
  @apply h-auto min-h-[80vh];
}
</style>
