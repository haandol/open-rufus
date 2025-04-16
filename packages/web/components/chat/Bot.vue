<template>
  <Transition name="slide-fade">
    <div v-if="isVisible" :class="[
      'fixed bottom-4 left-4 bg-white rounded-xl shadow-xl flex flex-col z-50',
      isMinimized ? 'w-[240px] h-[48px]' : 'w-[440px] h-[600px]'
    ]">
      <ChatHeader @close="close" @minimize="handleMinimize" />
      <template v-if="!isMinimized">
        <ChatContent @suggestion-select="handleSuggestionSelect" />
        <ChatInput @submit="handleSubmit" />
      </template>
    </div>
  </Transition>

  <!-- Error Modal -->
  <ChatErrorModal :show="showErrorModal" :error-message="error" @close="closeErrorModal" />
</template>

<script setup lang="ts">
defineProps<{
  isVisible: boolean
}>();

const emit = defineEmits<{
  (e: 'close'): void
}>();

const chatStore = useChatStore();
const { isMinimized, error, showErrorModal } = storeToRefs(chatStore);

interface Suggestion {
  text: string;
  highlighted?: boolean;
}

const close = () => {
  emit('close');
};

const handleMinimize = () => {
  chatStore.toggleMinimize();
};

const closeErrorModal = () => {
  chatStore.closeErrorModal();
};

const handleSuggestionSelect = (suggestion: Suggestion) => {
  // Suggestion is already handled in ChatContent component
  console.log('Selected suggestion:', suggestion.text);
};

const handleSubmit = (text: string) => {
  console.log('Submitted text:', text);
  // The actual message sending is handled in the ChatInput component
};

// Clear messages when the component is unmounted
onUnmounted(() => {
  chatStore.clearMessages();
});
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

/* 최소화/최대화 트랜지션을 부드럽게 만들기 위한 스타일 추가 */
div {
  transition: width 0.3s ease-out, height 0.3s ease-out;
}
</style>