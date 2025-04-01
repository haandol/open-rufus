<template>
  <div class="w-full">
    <MainBanner />

    <NoticeBar>
      Additional customs documents are required for your destination.
      <template #link>
        <a href="#" class="text-blue-600">Please click here to learn more.</a>
      </template>
    </NoticeBar>

    <ProductGrid>
      <!-- Pick Up Section -->
      <ProductCard>
        <template #title>Pick up where you left off</template>
        <div class="grid grid-cols-2 gap-2">
          <div class="bg-gray-200 h-24 flex items-center justify-center">Item 1</div>
          <div class="bg-gray-200 h-24 flex items-center justify-center">Item 2</div>
          <div class="bg-gray-200 h-24 flex items-center justify-center">Item 3</div>
          <div class="bg-gray-200 h-24 flex items-center justify-center">Item 4</div>
        </div>
        <template #footer>
          <a href="#" class="text-blue-600">See more</a>
        </template>
      </ProductCard>

      <!-- Free International Delivery -->
      <ProductCard>
        <template #title>Free international delivery</template>
        <div class="bg-yellow-200 p-4 rounded flex items-center justify-center h-64">
          <div class="text-xl">Delivery Plane</div>
        </div>
        <template #footer>
          <a href="#" class="text-blue-600">Click here to check eligibility.</a>
        </template>
      </ProductCard>

      <!-- Free Shipping Zone -->
      <ProductCard>
        <template #title>Free Shipping Zone</template>
        <div class="bg-gray-200 h-64 flex items-center justify-center">
          Shipping Items
        </div>
        <template #footer>
          <a href="#" class="text-blue-600">Shop now</a>
        </template>
      </ProductCard>

      <!-- Shop for Home Essentials -->
      <ProductCard>
        <template #title>Shop for your home essentials</template>
        <div class="grid grid-cols-2 gap-2">
          <div class="mb-2">
            <div class="bg-gray-200 h-32 flex items-center justify-center">Cleaning</div>
            <p class="text-center mt-1">Cleaning Tools</p>
          </div>
          <div class="mb-2">
            <div class="bg-gray-200 h-32 flex items-center justify-center">Storage</div>
            <p class="text-center mt-1">Home Storage</p>
          </div>
          <div class="mb-2">
            <div class="bg-gray-200 h-32 flex items-center justify-center">Decor</div>
            <p class="text-center mt-1">Home Decor</p>
          </div>
          <div class="mb-2">
            <div class="bg-gray-200 h-32 flex items-center justify-center">Bedding</div>
            <p class="text-center mt-1">Bedding</p>
          </div>
        </div>
        <template #footer>
          <a href="#" class="text-blue-600">Discover more in Home</a>
        </template>
      </ProductCard>
    </ProductGrid>
  </div>
</template>

<script lang="ts" setup>
useHead({
  title: 'Amazon - Online Shopping',
  meta: [
    { name: 'description', content: 'Shop online for electronics, computers, clothing, toys, books, and more on Amazon.' }
  ]
})
</script>

<style>
/* Add custom styles if needed beyond Tailwind classes */
</style>
