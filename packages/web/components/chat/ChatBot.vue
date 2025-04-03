<template>
  <Transition name="slide-fade">
    <div v-if="isVisible"
      class="fixed bottom-4 left-4 w-[400px] h-[600px] bg-white rounded-xl shadow-xl flex flex-col z-50">
      <ChatHeader @close="close" />
      <ChatContent @suggestion-select="handleSuggestionSelect" />
      <ChatInput @submit="handleSubmit" />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import ChatHeader from './ChatHeader.vue';
import ChatContent from './ChatContent.vue';
import ChatInput from './ChatInput.vue';

const props = defineProps<{
  isVisible: boolean
}>();

const emit = defineEmits<{
  (e: 'close'): void
}>();

interface Suggestion {
  text: string;
  highlighted?: boolean;
}

const close = () => {
  emit('close');
};

const handleSuggestionSelect = (suggestion: Suggestion) => {
  console.log('Selected suggestion:', suggestion);
  // 여기에 선택된 제안에 대한 처리 로직을 추가하세요
};

const handleSubmit = (text: string) => {
  console.log('Submitted text:', text);
  // 여기에 제출된 텍스트에 대한 처리 로직을 추가하세요
};
</script>

<style>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>