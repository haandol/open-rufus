<template>
  <div class="w-full bg-gray-50">
    <div class="max-w-[1500px] mx-auto relative px-4">
      <!-- Main Banner Content -->
      <div class="relative h-[600px] rounded-lg overflow-hidden bg-gray-100">
        <div class="w-full h-full flex items-center justify-center">
          <NuxtImg src="/img/main-banner.jpg" alt="Free Shipping Zone Products" class="w-full h-full object-cover"
            loading="lazy" />
        </div>
      </div>

      <!-- Navigation Arrows -->
      <button class="absolute left-0 top-1/3 -translate-y-1/2 bg-white rounded-full p-3 shadow-md hover:bg-gray-100">
        <i class="pi pi-chevron-left text-xl"></i>
      </button>
      <button class="absolute right-0 top-1/3 -translate-y-1/2 bg-white rounded-full p-3 shadow-md hover:bg-gray-100">
        <i class="pi pi-chevron-right text-xl"></i>
      </button>
    </div>
  </div>
</template>