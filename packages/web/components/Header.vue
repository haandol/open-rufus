<template>
  <div class="bg-gray-900 text-white p-2">
    <div class="flex justify-between items-center">
      <!-- Left side: Logo and Location -->
      <div class="flex items-center">
        <div class="mr-4">
          <NuxtLink to="/">
            <NuxtImg src="/img/amazon-logo.png" alt="Amazon Logo" class="h-8 w-auto object-contain" />
          </NuxtLink>
        </div>
        <div class="text-sm">
          <div class="flex items-center">
            <i class="pi pi-map-marker mr-1"></i>
            <div>
              <div class="text-xs text-gray-300">Deliver to DongKyun</div>
              <div class="font-bold">Seoul 088</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Middle: Search Bar -->
      <div class="flex flex-1 mx-4">
        <div class="bg-white rounded-lg flex w-full">
          <div class="bg-gray-200 text-black px-3 py-2 rounded-l-lg">
            <span class="text-sm">All</span>
            <i class="pi pi-chevron-down ml-1"></i>
          </div>
          <input type="text" placeholder="Search Amazon" class="px-4 py-2 flex-1 text-black" />
          <button class="bg-yellow-400 px-4 py-2 rounded-r-lg">
            <i class="pi pi-search text-black"></i>
          </button>
        </div>
      </div>

      <!-- Right side: Account & Cart -->
      <div class="flex items-center">
        <div class="flex items-center mr-4">
          <div class="mr-1">
            <div class="h-5 w-6 bg-gray-600 text-xs text-white flex items-center justify-center">EN</div>
          </div>
          <span>EN</span>
          <i class="pi pi-chevron-down ml-1"></i>
        </div>
        <div class="mr-4">
          <div class="text-xs">Hello, Dong-Kyun</div>
          <div class="font-bold flex items-center">
            Account & Lists
            <i class="pi pi-chevron-down ml-1"></i>
          </div>
        </div>
        <div class="mr-4">
          <div class="text-xs">Returns</div>
          <div class="font-bold">& Orders</div>
        </div>
        <div class="flex items-center">
          <i class="pi pi-shopping-cart text-2xl"></i>
          <span class="ml-1">Cart</span>
        </div>
      </div>
    </div>

    <!-- Secondary Nav -->
    <div class="flex items-center mt-2">
      <button class="mr-4 flex items-center">
        <i class="pi pi-bars mr-1"></i>
        <span>All</span>
      </button>
      <div class="px-2 py-1 bg-white text-black font-semibold rounded-md flex items-center mr-4">
        <i class="pi pi-bookmark mr-1"></i>
        <span>Rufus</span>
      </div>
      <div class="flex items-center space-x-4">
        <span>Free Shipping Zone</span>
        <span>Today's Deals</span>
        <span>Customer Service</span>
        <span>Buy Again</span>
        <span>Dong-...</span>
        <span>'s Amazon.com</span>
        <span>Browsing History</span>
        <span>Sell</span>
        <span>Gift Cards</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Header component with main navigation
</script>