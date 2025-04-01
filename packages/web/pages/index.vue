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
      <ProductCard image-path="/img/pickup.png" title="Pick up where you left off">
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
      <ProductCard image-path="/img/delivery.png" title="Free international delivery">
        <div class="bg-yellow-200 p-4 rounded flex items-center justify-center h-64">
          <div class="text-xl">Delivery Plane</div>
        </div>
        <template #footer>
          <a href="#" class="text-blue-600">Click here to check eligibility.</a>
        </template>
      </ProductCard>

      <!-- Free Shipping Zone -->
      <ProductCard image-path="/img/shipping.png" title="Free Shipping Zone">
        <div class="bg-gray-200 h-64 flex items-center justify-center">
          Shipping Items
        </div>
        <template #footer>
          <a href="#" class="text-blue-600">Shop now</a>
        </template>
      </ProductCard>

      <!-- Shop for Home Essentials -->
      <div class="space-y-4">
        <h2 class="text-2xl font-bold">Shop for your home essentials</h2>
        <div class="grid grid-cols-2 gap-4">
          <ProductCard image-path="/img/cleaning-tools.png" title="Cleaning Tools"
            description="Find everything you need for a spotless home" link="/category/cleaning" />
          <ProductCard image-path="/img/home-storage.png" title="Home Storage"
            description="Organize your space with our storage solutions" link="/category/storage" />
          <ProductCard image-path="/img/home-decor.png" title="Home Decor"
            description="Beautiful pieces to enhance your living space" link="/category/decor" />
          <ProductCard image-path="/img/bedding.png" title="Bedding"
            description="Luxury bedding for a perfect night's sleep" link="/category/bedding" />
        </div>
        <div class="text-center">
          <a href="/category/home" class="text-blue-600 hover:text-blue-800 font-medium">
            Discover more in Home
          </a>
        </div>
      </div>
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
