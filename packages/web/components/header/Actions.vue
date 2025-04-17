<template>
  <div class="flex items-center space-x-2 sm:space-x-4">
    <div class="hidden sm:flex items-center">
      <div class="mr-1">
        <div class="h-5 w-6 bg-gray-600 text-xs text-white flex items-center justify-center">EN</div>
      </div>
      <span>EN</span>
      <i class="pi pi-chevron-down ml-1"></i>
    </div>
    <div>
      <div class="text-xs hidden sm:block">Hello, Dong-Kyun</div>
      <div class="font-bold flex items-center">
        <span class="hidden sm:inline">Account & Lists</span>
        <i class="pi pi-user sm:hidden text-xl"></i>
        <i class="pi pi-chevron-down ml-1 hidden sm:inline"></i>
      </div>
    </div>
    <div>
      <div class="text-xs hidden sm:block">Returns</div>
      <div class="font-bold hidden sm:block">& Orders</div>
      <i class="pi pi-box sm:hidden text-xl"></i>
    </div>
    <div class="flex items-center">
      <i class="pi pi-shopping-cart text-xl sm:text-2xl"></i>
      <span class="ml-1 hidden sm:inline">Cart</span>
    </div>
  </div>
</template>