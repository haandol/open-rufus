<template>
  <div class="flex items-center mt-2">
    <button class="mr-4 flex items-center">
      <i class="pi pi-bars mr-1"></i>
      <span>All</span>
    </button>
    <div
      class="px-2 py-1 bg-white text-black font-semibold rounded-md flex items-center mr-4 hover:bg-orange-50 hover:text-orange-500 transition-colors duration-200">
      <NuxtLink to="/" @click="onClickChat" class="flex items-center"><i
          class="pi pi-comments mr-1 text-orange-500"></i>Coco</NuxtLink>
    </div>
    <div class="hidden md:flex items-center space-x-4">
      <span>Free Shipping Zone</span>
      <span>Today's Deals</span>
      <span>Customer Service</span>
      <span>Buy Again</span>
      <span>Browsing History</span>
      <span>Sell</span>
      <span>Gift Cards</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'clickChat'): void
}>();

const onClickChat = () => {
  emit('clickChat');
};
</script>