<template>
  <Header />
  <main>
    <slot />
  </main>
  <Footer />
</template>

<style lang="postcss" scoped>
main {
  @apply h-auto min-h-[80vh];
}
</style>
