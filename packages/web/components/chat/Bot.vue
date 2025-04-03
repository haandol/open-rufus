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
defineProps<{
  isVisible: boolean
}>();

const emit = defineEmits<{
  (e: 'close'): void
}>();

const chatStore = useChatStore();

interface Suggestion {
  text: string;
  highlighted?: boolean;
}

const close = () => {
  emit('close');
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
</style>