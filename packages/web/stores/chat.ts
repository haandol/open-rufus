interface Message {
  role: "user" | "assistant";
  content: string;
  products?: Product[];
}

interface Product {
  id: number;
  gender: string;
  masterCategory: string;
  subCategory: string;
  articleType: string;
  baseColour: string;
  season: string;
  year: number;
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
      const assistantIndex = messages.value.length - 1;

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
              if (data.role === "assistant" && data.content) {
                console.info("received assistant data: ", JSON.stringify(data));
                assistantMessage += data.content;
                // Update the last message content
                messages.value[assistantIndex].content = assistantMessage;
              } else if (data.role === "tool" && data.content) {
                console.info("received tool data: ", JSON.stringify(data));

                // 상품 데이터 처리
                try {
                  // 데이터가 JSON 배열 형태의 상품 목록인지 확인
                  const parsedContent =
                    typeof data.content === "string"
                      ? JSON.parse(data.content)
                      : data.content;

                  if (
                    Array.isArray(parsedContent) &&
                    parsedContent.length > 0 &&
                    "articleType" in parsedContent[0]
                  ) {
                    // 상품 데이터 감지
                    messages.value[assistantIndex].products = parsedContent;
                    console.info("상품 데이터 감지됨:", parsedContent);
                  }
                } catch (parseError) {
                  console.error("상품 데이터 파싱 오류:", parseError);
                }
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
