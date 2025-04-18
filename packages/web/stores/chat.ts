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
      let assistantMessage = "";

      // Create a temporary assistant message
      messages.value.push({ role: "user", content });
      messages.value.push({ role: "assistant", content: "" });
      let assistantIndex = messages.value.length - 1;

      let firstTokenReceived = false;

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
                  assistantMessage += data.content;
                  // Update the last message content
                  messages.value[assistantIndex].content = assistantMessage;
                } else if (data.tool_calls) {
                  messages.value[assistantIndex].tool_calls = data.tool_calls;
                } else {
                  console.error("Unknown assistant message:", data);
                }
              } else if (data.role === "tool") {
                // AWS Bedrock API 요구사항에 맞는 정확한 형식으로 변경
                let formattedContent;

                if (Array.isArray(data.content)) {
                  // 배열인 경우 객체 배열로 변환
                  formattedContent = {
                    json: {
                      products: data.content,
                    },
                  };
                } else if (typeof data.content === "object") {
                  // 이미 객체인 경우
                  formattedContent = {
                    json: data.content,
                  };
                } else {
                  // 문자열이나 다른 타입인 경우
                  formattedContent = {
                    text: data.content?.toString() || "",
                  };
                }

                messages.value.push({
                  role: "tool",
                  content: formattedContent,
                  tool_call_id: data.tool_call_id,
                  name: data.name,
                });

                messages.value.push({ role: "assistant", content: "" });
                assistantIndex = messages.value.length - 1;
                assistantMessage = "";
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

    // 마지막 메시지가 빈 문자열이면 제거
    if (messages.value[messages.value.length - 1].content === "") {
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
