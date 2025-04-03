<template>
  <div class="flex-1 overflow-y-auto px-4 py-2 bg-white">
    <div class="flex items-start mb-4">
      <div class="flex-shrink-0">
        <div class="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
          <i class="pi pi-comments text-white text-xs"></i>
        </div>
      </div>
      <div class="ml-3">
        <p class="text-gray-800 font-medium mb-2 text-sm">What do you need help with today?</p>

        <!-- Shopping Suggestions -->
        <div class="space-y-2">
          <ChatSuggestion :suggestions="shoppingSuggestions" @select="handleSuggestionSelect" />
        </div>

        <!-- Recommendation Suggestions -->
        <div class="mt-5">
          <p class="text-gray-800 font-medium mb-2 text-sm">Get recommendations</p>
          <ChatSuggestion :suggestions="recommendationSuggestions" @select="handleSuggestionSelect" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Suggestion {
  text: string;
  highlighted?: boolean;
}

const shoppingSuggestions = ref<Suggestion[]>([
  { text: 'Keep shopping for Single board computers', highlighted: false },
  { text: 'What accessories are recommended for single board computers?', highlighted: true },
  { text: 'Which single board computers are best for media playback?', highlighted: true },
  { text: 'What single board computers are compatible with machine learning?', highlighted: true }
]);

const recommendationSuggestions = ref<Suggestion[]>([
  { text: 'Best countertop ice makers', highlighted: true },
  { text: 'Best cordless vacuum for pet hair', highlighted: true }
]);

const emit = defineEmits<{
  (e: 'suggestionSelect', suggestion: Suggestion): void
}>();

const handleSuggestionSelect = (suggestion: Suggestion) => {
  emit('suggestionSelect', suggestion);
};
</script>