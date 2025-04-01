<template>
  <div class="relative bg-gray-50">
    <div class="max-w-[1500px] mx-auto relative">
      <!-- Main Banner Content -->
      <div class="relative h-[280px] md:h-[320px]">
        <div class="w-full h-full">
          <img src="/img/main-banner.jpg" alt="Free Shipping Zone Products"
            class="w-full h-full object-cover object-top" />
        </div>
      </div>
    </div>

    <!-- Navigation Arrows -->
    <button class="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-md hover:bg-gray-100">
      <i class="pi pi-chevron-left text-xl"></i>
    </button>
    <button class="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-md hover:bg-gray-100">
      <i class="pi pi-chevron-right text-xl"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
// Banner navigation logic can be added here if needed
</script>