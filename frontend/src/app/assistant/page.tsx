'use client';
import { useDatasetStore } from "@/store/useDatasetStore";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Trash2, 
  Sparkles, 
  Lock, 
  Unlock, 
  Bot, 
  Copy, 
  Check, 
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";
import { BACKEND_URL } from "@/lib/config";
import { ChatMessageContent } from "@/components/chat/ChatMessageContent";

const SUGGESTIONS = [
  "What are the most correlated features?",
  "Summarize missing values and recommended fixes.",
  "Recommend optimal ML algorithms for this dataset.",
  "Write Python scikit-learn code for baseline training."
];

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      title="Copy answer to clipboard"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-emerald-500 font-medium">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>Copy response</span>
        </>
      )}
    </button>
  );
}

export default function Assistant() {
  const { summary, chatHistory, addChatMessage, clearChatHistory } = useDatasetStore();
  const router = useRouter();
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [lockError, setLockError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('assistant_password');
      if (saved) {
        setIsUnlocked(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!summary) {
      router.push('/');
    }
  }, [summary, router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, streamingMessage, isTyping]);

  const handleSend = async (messageToSend?: string) => {
    const text = (messageToSend || input).trim();
    if (!text || isTyping || !summary) return;
    
    setInput('');
    addChatMessage({ role: 'user', content: text });
    setIsTyping(true);
    setStreamingMessage('');

    try {
      const savedPassword = localStorage.getItem('assistant_password') || '';
      const res = await fetch(`${BACKEND_URL}/dataset/${summary?.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          history: chatHistory,
          password: savedPassword
        })
      });

      if (res.status === 401) {
        setIsUnlocked(false);
        localStorage.removeItem('assistant_password');
        throw new Error('Unauthorized');
      }

      if (!res.ok) {
        throw new Error('Failed to fetch response');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) throw new Error('No reader available');

      let currentStream = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        currentStream += chunk;
        setStreamingMessage(currentStream);
      }
      
      addChatMessage({ role: 'assistant', content: currentStream });
      
    } catch (err: any) {
      console.error(err);
      addChatMessage({ 
        role: 'assistant', 
        content: err.message === 'Unauthorized' 
          ? 'Access token expired. Please enter the password again to unlock the AI Copilot.'
          : 'Encountered an issue communicating with the AI Engine. Please check your connection and try again.' 
      });
    } finally {
      setIsTyping(false);
      setStreamingMessage('');
    }
  };

  if (!summary) return null;

  // 1. Password Locked View
  if (!isUnlocked) {
    return (
      <div className="flex flex-col flex-1 h-full w-full items-center justify-center bg-background p-4 sm:p-6">
        <div className="w-full max-w-md bg-card border border-border shadow-2xl rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-foreground tracking-tight">AI Copilot Protected</h2>
          <p className="text-muted-foreground mb-6 text-sm max-w-sm">
            Please enter your assistant access password to unlock the data science copilot.
          </p>
          
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              setLockError('');
              setIsVerifying(true);
              try {
                const res = await fetch(`${BACKEND_URL}/verify-assistant`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ password: passwordInput })
                });
                const data = await res.json();
                if (data.success) {
                  localStorage.setItem('assistant_password', passwordInput);
                  setIsUnlocked(true);
                } else {
                  setLockError('Invalid password. Please check your configuration.');
                }
              } catch (err) {
                setLockError('Error connecting to authentication endpoint.');
              } finally {
                setIsVerifying(false);
              }
            }}
            className="w-full flex flex-col gap-3.5"
          >
            <input 
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password..."
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground shadow-sm"
              autoFocus
            />
            {lockError && (
              <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 p-2.5 rounded-lg text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lockError}</span>
              </div>
            )}
            <button 
              type="submit"
              disabled={!passwordInput || isVerifying}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              <Unlock className="w-4 h-4" />
              {isVerifying ? 'Verifying...' : 'Unlock Copilot'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Main Full-Featured Chat Interface
  return (
    <div className="flex flex-col flex-1 h-full w-full min-h-0 bg-background relative overflow-hidden">
      
      {/* Top Header Bar */}
      <header className="sticky top-0 z-20 w-full bg-background/85 backdrop-blur-md border-b border-border/50 px-4 sm:px-6 py-3 shrink-0 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2 truncate">
              AI Copilot
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                gpt-oss-120b
              </span>
            </h1>
            <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
              <FileSpreadsheet className="w-3 h-3 text-primary inline shrink-0" />
              <span className="truncate">{summary.filename} ({summary.rows.toLocaleString()} rows)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {chatHistory.length > 0 && (
            <button 
              onClick={clearChatHistory}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              title="Clear conversation history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          )}
        </div>
      </header>

      {/* Scrollable Message List */}
      <div className="flex-1 overflow-y-auto w-full px-3 sm:px-6 md:px-8 py-6 space-y-6 max-w-4xl mx-auto min-w-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-thumb]:rounded-full">
        {chatHistory.length === 0 && !isTyping && (
          <div className="h-full flex flex-col items-center justify-center text-center py-8 sm:py-12">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-primary/20 flex items-center justify-center mb-5 shadow-lg shadow-primary/10">
              <Bot className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight text-foreground">
              Hello, Data Scientist
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md">
              Ask questions about <span className="font-semibold text-foreground">{summary.filename}</span>, analyze statistical relationships, or generate model code.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl w-full">
               {SUGGESTIONS.map((suggestion) => (
                  <button 
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="p-3.5 text-left border border-border rounded-xl bg-card hover:bg-muted/50 hover:border-primary/50 transition-all text-xs sm:text-sm font-medium text-foreground flex items-center justify-between gap-2 shadow-sm group"
                  >
                    <span>{suggestion}</span>
                    <Sparkles className="w-3.5 h-3.5 text-primary opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
               ))}
            </div>
          </div>
        )}
        
        {/* Render Conversation Messages */}
        {chatHistory.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'user' ? (
              <div className="max-w-[85%] sm:max-w-[75%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm sm:text-[15px] leading-relaxed shadow-sm break-words">
                {msg.content}
              </div>
            ) : (
              <div className="flex gap-3 sm:gap-4 max-w-full w-full min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <ChatMessageContent content={msg.content} />
                  <div className="pt-1 flex items-center gap-2">
                    <CopyButton text={msg.content} />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Streaming / Typing Indicator */}
        {isTyping && (
          <div className="flex gap-3 sm:gap-4 max-w-full w-full min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm animate-pulse">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              {streamingMessage ? (
                <ChatMessageContent content={streamingMessage} isStreaming={true} />
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm h-8 font-medium">
                  <span className="flex gap-1 items-center">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                  </span>
                  <span>Synthesizing answer...</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Fixed Sticky Bottom Dock Input (ChatGPT / Gemini style) */}
      <div className="sticky bottom-0 z-20 w-full bg-gradient-to-t from-background via-background/95 to-transparent pt-3 pb-4 px-3 sm:px-6 md:px-8 border-t border-border/30">
        <div className="max-w-4xl mx-auto w-full">
          {/* Quick Prompt Chips (horizontally scrollable on mobile) */}
          {chatHistory.length > 0 && !isTyping && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-1 scrollbar-none">
              {SUGGESTIONS.slice(0, 3).map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  className="whitespace-nowrap px-2.5 py-1 text-xs rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 transition-colors shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="relative flex items-center bg-card border border-border/80 focus-within:border-primary/80 focus-within:ring-2 focus-within:ring-primary/20 rounded-2xl shadow-lg transition-all"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your dataset..."
              className="w-full bg-transparent pl-4 sm:pl-5 pr-12 py-3 sm:py-3.5 text-sm sm:text-[15px] focus:outline-none placeholder:text-muted-foreground"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-20 disabled:hover:bg-primary shrink-0 shadow-sm"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center mt-2">
            <span className="text-[11px] text-muted-foreground select-none">
              AI Copilot can make mistakes. Check important data distributions.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
