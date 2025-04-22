interface Message {
  role: "user" | "assistant" | "tool";
  content: string | any;
  tool_call_id?: string;
  name?: string;
  tool_calls?: any[];
}

export const useChatStore = defineStore("chat", () => {
  const config = useRuntimeConfig();

  const messages = ref<Message[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const isMinimized = ref(false);
  const showErrorModal = ref(false);

  // 컨텐츠가 비어있지 않은 메시지만 필터링하는 계산된 속성
  const visibleMessages = computed(() =>
    messages.value.filter((msg) => {
      // user와 tool 메시지는 항상 표시
      if (msg.role === "user" || msg.role === "tool") return true;

      // assistant 메시지는 content가 비어있지 않은 경우만 표시
      return msg.role === "assistant" && msg.content !== "";
    })
  );

  async function sendMessage(content: string) {
    if (!content.trim()) return;

    // Add user message
    isLoading.value = true;
    error.value = null;
    showErrorModal.value = false;

    try {
      // AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃

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
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      // Create a temporary assistant message
      messages.value.push({ role: "user", content });
      messages.value.push({ role: "assistant", content: "" });
      let assistantIndex = messages.value.length - 1;

      // check timeout until first token is received
      let firstTokenReceived = false;
      // assistant message content
      let assistantMessage = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Clear timeout after receiving first chunk
        if (!firstTokenReceived) {
          clearTimeout(timeoutId);
          firstTokenReceived = true;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                error.value = data.error;
                showErrorModal.value = true;
                return;
              }

              if (data.role === "assistant") {
                if (data.content) {
                  // Update content of the latest assistant message
                  assistantMessage += data.content;
                  messages.value[assistantIndex].content = assistantMessage;
                } else if (data.tool_calls) {
                  // receive tool_calls params for maintain ToolMessage
                  messages.value[assistantIndex].tool_calls = data.tool_calls;
                } else {
                  console.error("Unknown assistant message:", data);
                }
              } else if (data.role === "tool") {
                let stringContent: string;
                if (typeof data.content === "string") {
                  stringContent = data.content;
                } else {
                  try {
                    stringContent = JSON.stringify(data.content);
                  } catch (e) {
                    console.error("Failed to stringify tool content:", e);
                    stringContent = "[Error formatting tool content]";
                  }
                }

                // maintain ToolMessage
                messages.value.push({
                  role: "tool",
                  // Store stringified content
                  content: stringContent,
                  tool_call_id: data.tool_call_id,
                  name: data.name,
                });

                // Create a new assistant message to prepare for the next chunk
                messages.value.push({ role: "assistant", content: "" });
                assistantIndex = messages.value.length - 1;
                assistantMessage = ""; // Reset the assistant message content
              } else {
                console.error("Unknown message:", data);
              }
            } catch (e) {
              console.error("JSON 파싱 오류:", e);
              error.value = "응답 처리 중 오류가 발생했습니다.";
              showErrorModal.value = true;
            }
          }
        }
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        error.value = "요청 시간이 초과되었습니다. 다시 시도해주세요.";
      } else {
        error.value =
          e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
      }
      showErrorModal.value = true;
      console.error("Error:", e);
    } finally {
      isLoading.value = false;
    }

    // 마지막 메시지가 비어있는 assistant 메시지이면 제거
    if (
      messages.value.length > 0 &&
      messages.value[messages.value.length - 1].role === "assistant" &&
      messages.value[messages.value.length - 1].content === ""
    ) {
      messages.value.pop();
    }
  }

  function clearMessages() {
    messages.value = [];
  }

  function toggleMinimize() {
    isMinimized.value = !isMinimized.value;
  }

  function closeErrorModal() {
    showErrorModal.value = false;
  }

  return {
    messages,
    visibleMessages,
    isLoading,
    error,
    isMinimized,
    showErrorModal,
    sendMessage,
    clearMessages,
    toggleMinimize,
    closeErrorModal,
  };
});
