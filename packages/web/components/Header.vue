<template>
  <div class="bg-gray-900 text-white p-2">
    <div class="flex justify-between items-center">
      <HeaderLogo />
      <HeaderSearch />
      <HeaderActions />
    </div>
    <HeaderNav @click-rufus="onClickRufus" />
  </div>
  <ChatBot :is-visible="isChatBotVisible" @close="onCloseChatBot" />
</template>

<script setup lang="ts">
const chatStore = useChatStore();
const { isMinimized } = storeToRefs(chatStore);

const isChatBotVisible = ref(false);

const onClickRufus = () => {
  isChatBotVisible.value = true;
};

const onCloseChatBot = () => {
  isChatBotVisible.value = false;
  isMinimized.value = false;
};
</script>