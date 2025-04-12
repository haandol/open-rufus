interface Message {
  role: "user" | "assistant";
  content: string;
}

export const useChatStore = defineStore("chat", () => {
  const config = useRuntimeConfig();

  const messages = ref<Message[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const isMinimized = ref(false);

  async function sendMessage(content: string) {
    if (!content.trim()) return;

    // Add user message
    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${config.public.apiUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recent_history: messages.value,
          user_message_content: content,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      // Create a temporary assistant message
      messages.value.push({ role: "user", content });
      messages.value.push({ role: "assistant", content: "" });
      const assistantIndex = messages.value.length - 1;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content && data.content[0].text) {
                assistantMessage += data.content[0].text;
                // Update the last message content
                messages.value[assistantIndex].content = assistantMessage;
              }
            } catch (e) {
              console.error("JSON 파싱 오류:", e);
              error.value = "응답 처리 중 오류가 발생했습니다.";
            }
          }
        }
      }
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
      console.error("Error:", e);
    } finally {
      isLoading.value = false;
    }
  }

  function clearMessages() {
    messages.value = [];
  }

  function toggleMinimize() {
    isMinimized.value = !isMinimized.value;
  }

  return {
    messages,
    isLoading,
    error,
    isMinimized,
    sendMessage,
    clearMessages,
    toggleMinimize,
  };
});
