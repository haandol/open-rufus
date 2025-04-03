<template>
  <div class="flex items-center justify-between p-3">
    <div class="flex items-center">
      <img src="/img/rufus-logo.png" alt="Rufus" class="w-6 h-6 mr-2" />
      <span class="font-semibold text-gray-800 text-sm">Open Rufus</span>
    </div>
    <div class="flex items-center gap-2">
      <button class="text-gray-400 hover:text-gray-600">
        <i class="pi pi-ellipsis-h text-sm"></i>
      </button>
      <button @click="emit('close')" class="text-gray-400 hover:text-gray-600">
        <i class="pi pi-times text-sm"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'close'): void
}>();
</script>