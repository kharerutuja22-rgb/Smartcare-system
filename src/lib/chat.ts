import type { Message } from "@/components/ChatMessage";

/**
 * Predefined smart replies used as fallback when the AI API is unavailable.
 * Maps keywords to contextual responses.
 */
const MOCK_RESPONSES: Record<string, string> = {
  hello: "Hello! 👋 How can I help you today?",
  hi: "Hi there! What can I do for you?",
  help: "Sure! I can answer questions, have a conversation, or help you brainstorm ideas. Just ask!",
  thanks: "You're welcome! Let me know if there's anything else I can help with. 😊",
  bye: "Goodbye! Have a great day! 👋",
  name: "I'm **ChatBot AI**, your friendly assistant built with React and Lovable Cloud!",
  weather: "I don't have real-time weather data, but I'd suggest checking your local weather app! ☀️🌧️",
  joke: "Why do programmers prefer dark mode? Because light attracts bugs! 🐛😄",
  time: `The current time is **${new Date().toLocaleTimeString()}**. Though I can't track real-time, so it may have changed!`,
};

/**
 * getMockResponse - Returns a smart fallback response based on keywords.
 */
function getMockResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, response] of Object.entries(MOCK_RESPONSES)) {
    if (lower.includes(key)) return response;
  }
  return "That's an interesting question! I'm a simple chatbot, so I might not have all the answers — but I'm here to try my best. Could you rephrase or ask something else?";
}

/**
 * sendMessage - Sends messages to the AI edge function with streaming.
 * Falls back to mock responses if the API call fails.
 */
export async function sendMessage(
  messages: Message[],
  onDelta: (text: string) => void,
  onDone: () => void
) {
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
  const lastUserMsg = messages[messages.length - 1]?.content || "";

  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!resp.ok || !resp.body) {
      throw new Error(`API error: ${resp.status}`);
    }

    // Stream SSE response token by token
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") break;
        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          // partial JSON, wait for more
        }
      }
    }

    onDone();
  } catch (err) {
    console.warn("AI API unavailable, using mock response:", err);
    // Fallback: simulate typing with mock response
    const mockText = getMockResponse(lastUserMsg);
    const words = mockText.split(" ");
    for (let i = 0; i < words.length; i++) {
      await new Promise((r) => setTimeout(r, 40));
      onDelta((i === 0 ? "" : " ") + words[i]);
    }
    onDone();
  }
}
