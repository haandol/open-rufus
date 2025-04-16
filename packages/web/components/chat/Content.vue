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
      <div v-else-if="message.role === 'tool' && message.content && message.content.json && message.content.json.products && message.content.json.products.length > 0"
        class="flex items-start">
        <div class="flex-shrink-0">
          <div class="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
            <img src="/img/chat-profile.png" alt="Chat profile" class="w-4 h-4" />
          </div>
        </div>
        <div class="ml-3 bg-gray-100 px-4 py-2 rounded-lg max-w-[80%]">
          <h3 class="text-sm font-bold text-gray-700 mb-2">추천 상품:</h3>
          <div class="space-y-2">
            <ChatProductCard v-for="product in message.content.json.products" :key="product.id" :product="product" />
          </div>
        </div>
      </div>
      
      <!-- Tool message with text -->
      <div v-else-if="message.role === 'tool' && message.content && message.content.text"
        class="flex items-start">
        <div class="flex-shrink-0">
          <div class="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
            <img src="/img/chat-profile.png" alt="Chat profile" class="w-4 h-4" />
          </div>
        </div>
        <div class="ml-3 bg-gray-100 px-4 py-2 rounded-lg max-w-[80%]">
          <div v-html="md.render(message.content.text)"></div>
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
  { text: '여름 캐주얼 의류 추천해주세요', highlighted: false },
  { text: '직장인 정장 코디 추천해주세요', highlighted: true },
  { text: '가을 아우터 트렌드는 어떤가요?', highlighted: true },
  { text: '20대 여성 데일리룩 추천해주세요', highlighted: true }
]);

const recommendationSuggestions = ref<Suggestion[]>([
  { text: '여름 휴가에 어울리는 액세서리 추천', highlighted: true },
  { text: '데이트 코디에 어울리는 가방 추천해주세요', highlighted: true }
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