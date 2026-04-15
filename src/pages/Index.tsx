import { useState, useRef, useEffect, useCallback } from "react";
import ChatMessage, { type Message } from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import TypingIndicator from "@/components/TypingIndicator";
import { sendMessage } from "@/lib/chat";
import { Bot } from "lucide-react";

/**
 * Index - Main chat page.
 * Manages conversation state, streaming responses, and auto-scroll.
 */
const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! 👋 I'm your AI assistant. Ask me anything and I'll do my best to help!",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle sending a new message
  const handleSend = useCallback(
    async (text: string) => {
      // Create user message
      const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsLoading(true);

      let assistantContent = "";

      // Stream AI response
      await sendMessage(
        updatedMessages,
        (delta) => {
          assistantContent += delta;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id === "streaming") {
              return prev.map((m) => (m.id === "streaming" ? { ...m, content: assistantContent } : m));
            }
            return [...prev, { id: "streaming", role: "assistant", content: assistantContent }];
          });
        },
        () => {
          // Finalize: give the message a permanent ID
          setMessages((prev) =>
            prev.map((m) => (m.id === "streaming" ? { ...m, id: Date.now().toString() } : m))
          );
          setIsLoading(false);
        }
      );
    },
    [messages]
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border bg-card px-6 py-4 shadow-sm">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-foreground">ChatBot AI</h1>
          <p className="text-xs text-muted-foreground">Always here to help</p>
        </div>
      </header>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && <TypingIndicator />}
        </div>
      </div>

      {/* Input area */}
      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
};

export default Index;
