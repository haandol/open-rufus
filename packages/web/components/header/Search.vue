<template>
  <div class="hidden md:flex flex-1 mx-4">
    <div class="bg-white rounded-lg flex w-full">
      <div class="bg-gray-200 text-black px-3 py-2 rounded-l-lg">
        <span class="text-sm">All</span>
        <i class="pi pi-chevron-down ml-1"></i>
      </div>
      <input type="text" placeholder="Search PACE" class="px-4 py-2 flex-1 text-black" />
      <button class="bg-yellow-400 px-4 py-2 rounded-r-lg">
        <i class="pi pi-search text-black"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'search', query: string): void
}>();
</script>