import { Bot } from "lucide-react";

/**
 * TypingIndicator - Animated dots showing the bot is thinking.
 */
const TypingIndicator = () => (
  <div className="flex gap-3">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <Bot className="h-4 w-4" />
    </div>
    <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-chat-bot px-4 py-3 shadow-sm">
      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
    </div>
  </div>
);

export default TypingIndicator;
