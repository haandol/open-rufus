<template>
  <div class="flex-1 overflow-y-auto px-4 py-2 bg-white" ref="chatContainer">
    <!-- Initial welcome message -->
    <div v-if="messages.length === 0" class="flex items-start mb-4">
      <div class="flex-shrink-0">
        <div class="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
          <img src="/img/chat-profile.png" alt="Chat profile" class="w-4 h-4" />
        </div>
      </div>
      <div class="ml-3">
        <p class="text-gray-800 font-medium mb-2 text-sm">무엇을 도와드릴까요?</p>

        <!-- Shopping Suggestions -->
        <div class="space-y-2">
          <ChatSuggestion :suggestions="shoppingSuggestions" @select="handleSuggestionSelect" />
        </div>

        <!-- Recommendation Suggestions -->
        <div class="mt-5">
          <p class="text-gray-800 font-medium mb-2 text-sm">추천 받기</p>
          <ChatSuggestion :suggestions="recommendationSuggestions" @select="handleSuggestionSelect" />
        </div>
      </div>
    </div>

    <!-- Chat messages -->
    <div v-for="(message, index) in messages" :key="index" class="mb-4">
      <!-- User message -->
      <div v-if="message.role === 'user'" class="flex justify-end">
        <div class="bg-blue-500 text-white px-4 py-2 rounded-lg max-w-[80%]">
          {{ message.content }}
        </div>
      </div>

      <!-- Assistant message -->
      <div v-else-if="message.role === 'assistant'" class="flex items-start">
        <div class="flex-shrink-0">
          <div class="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
            <img src="/img/chat-profile.png" alt="Chat profile" class="w-4 h-4" />
          </div>
        </div>
        <div class="ml-3 bg-gray-100 px-4 py-2 rounded-lg max-w-[80%]">
          <div v-html="md.render(message.content)"></div>
        </div>
      </div>

      <!-- Tool message with products -->
      <div v-else-if="message.role === 'tool' && message.content && message.content.length > 0"
        class="flex items-start">
        <div class="flex-shrink-0">
          <div class="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
            <img src="/img/chat-profile.png" alt="Chat profile" class="w-4 h-4" />
          </div>
        </div>
        <div class="ml-3 bg-gray-100 px-4 py-2 rounded-lg max-w-[80%]">
          <h3 class="text-sm font-bold text-gray-700 mb-2">추천 상품:</h3>
          <div class="space-y-2">
            <ChatProductCard v-for="product in message.content" :key="product.id" :product="product" />
          </div>
        </div>
      </div>
    </div>

    <!-- Loading indicator -->
    <div v-if="isLoading" class="flex items-center justify-center my-2">
      <div class="animate-pulse flex space-x-1">
        <div class="h-2 w-2 bg-gray-400 rounded-full"></div>
        <div class="h-2 w-2 bg-gray-400 rounded-full"></div>
        <div class="h-2 w-2 bg-gray-400 rounded-full"></div>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="text-red-500 text-center text-sm my-2">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import markdownit from 'markdown-it'

const md = markdownit()

const chatStore = useChatStore();

const { messages, isLoading, error } = storeToRefs(chatStore);

const chatContainer = ref<HTMLElement | null>(null);

// Auto scroll to bottom when messages change
watch(() => messages.value, () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
}, { deep: true });

interface Suggestion {
  text: string;
  highlighted?: boolean;
}

const shoppingSuggestions = ref<Suggestion[]>([
  { text: '단일 보드 컴퓨터 쇼핑 계속하기', highlighted: false },
  { text: '단일 보드 컴퓨터에는 어떤 액세서리가 추천되나요?', highlighted: true },
  { text: '미디어 재생에 가장 좋은 단일 보드 컴퓨터는 무엇인가요?', highlighted: true },
  { text: '머신러닝과 호환되는 단일 보드 컴퓨터는 무엇인가요?', highlighted: true }
]);

const recommendationSuggestions = ref<Suggestion[]>([
  { text: '최고의 카운터탑 제빙기', highlighted: true },
  { text: '반려동물 털에 좋은 최고의 무선청소기', highlighted: true }
]);

const emit = defineEmits<{
  (e: 'suggestionSelect', suggestion: Suggestion): void
}>();

const handleSuggestionSelect = (suggestion: Suggestion) => {
  chatStore.sendMessage(suggestion.text);
  emit('suggestionSelect', suggestion);
};
</script>

<style>
.animate-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.ml-3 ul {
  list-style: disc;
  margin-left: 0.5rem;
  padding-left: 0.5rem;
}

.ml-3 li {
  display: list-item;
}
</style>