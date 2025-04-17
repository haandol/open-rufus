<template>
  <div class="bg-gray-900 text-white p-2">
    <div class="flex flex-wrap items-center justify-between md:flex-nowrap md:space-x-4">
      <HeaderLogo class="order-1" />
      <HeaderSearch class="order-3 w-full mt-2 md:order-2 md:mt-0 md:flex-1" />
      <HeaderActions class="order-2 md:order-3" />
    </div>
    <HeaderNav class="mt-2" @click-chat="onClickChat" />
  </div>
  <ChatBot :is-visible="isChatBotVisible" @close="onCloseChatBot" />
</template>

<script setup lang="ts">
const chatStore = useChatStore();
const { isMinimized } = storeToRefs(chatStore);

const isChatBotVisible = ref(false);

const onClickChat = () => {
  isChatBotVisible.value = true;
};

const onCloseChatBot = () => {
  isChatBotVisible.value = false;
  isMinimized.value = false;
};
</script>