<template>
  <div class="p-3 bg-white border-t">
    <div class="relative">
      <input v-model="inputText" type="text" placeholder="질문을 입력하세요..."
        class="w-full px-3 py-2.5 pr-10 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-sm"
        @keyup.enter="handleSubmit" :disabled="isLoading" ref="inputRef" />
      <button class="absolute right-3 top-1/2 transform -translate-y-1/2"
        :class="isLoading ? 'text-gray-300' : 'text-gray-400 hover:text-gray-600'" @click="handleSubmit"
        :disabled="isLoading">
        <i class="pi pi-send text-sm"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const chatStore = useChatStore();
const { isLoading } = storeToRefs(chatStore);

const inputText = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

const emit = defineEmits<{
  (e: 'submit', text: string): void
}>();

const handleSubmit = async () => {
  if (inputText.value.trim() && !isLoading.value) {
    const message = inputText.value;
    emit('submit', message);
    inputText.value = '';
    await chatStore.sendMessage(message);
    await nextTick();
    inputRef.value?.focus();
  }
};

onMounted(() => {
  nextTick(() => {
    inputRef.value?.focus();
  });
});
</script>