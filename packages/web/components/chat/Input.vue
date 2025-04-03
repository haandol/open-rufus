<template>
  <div class="p-3 bg-white border-t">
    <div class="relative">
      <input v-model="inputText" type="text" placeholder="Ask Rufus a question"
        class="w-full px-3 py-2.5 pr-10 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-sm"
        @keyup.enter="handleSubmit" />
      <button class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        @click="handleSubmit">
        <i class="pi pi-send text-sm"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const inputText = ref('');

const emit = defineEmits<{
  (e: 'submit', text: string): void
}>();

const handleSubmit = () => {
  if (inputText.value.trim()) {
    emit('submit', inputText.value);
    inputText.value = '';
  }
};
</script>