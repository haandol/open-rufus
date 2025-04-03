<template>
  <div class="flex items-center justify-between p-3 bg-white rounded-t-xl">
    <div class="flex items-center">
      <img src="/img/rufus-logo.png" alt="Rufus" class="w-6 h-6 mr-2" />
      <span v-if="!isMinimized" class="font-semibold text-gray-800 text-sm">Open Rufus</span>
    </div>
    <div class="flex items-center gap-2">
      <button @click="emit('minimize')" class="text-gray-400 hover:text-gray-600">
        <i :class="['pi text-sm', isMinimized ? 'pi-window-maximize' : 'pi-window-minimize']"></i>
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
  (e: 'minimize'): void
}>();

const chatStore = useChatStore();
const { isMinimized } = storeToRefs(chatStore);
</script>