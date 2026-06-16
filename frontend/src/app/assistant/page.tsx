'use client';
import { useDatasetStore } from "@/store/useDatasetStore";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Loader2, Sparkles, MessageSquare, Lock, Unlock } from "lucide-react";
import { BACKEND_URL } from "@/lib/config";
import ReactMarkdown from 'react-markdown';

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
  }, [chatHistory, streamingMessage]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMessage = input.trim();
    setInput('');
    addChatMessage({ role: 'user', content: userMessage });
    setIsTyping(true);
    setStreamingMessage('');

    try {
      const savedPassword = localStorage.getItem('assistant_password') || '';
      const res = await fetch(`${BACKEND_URL}/dataset/${summary.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
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
      
    } catch (err) {
      console.error(err);
      addChatMessage({ role: 'assistant', content: 'Sorry, I encountered an error communicating with the LLM Gateway.' });
    } finally {
      setIsTyping(false);
      setStreamingMessage('');
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
  };

  if (!summary) return null;

  if (!isUnlocked) {
    return (
      <div className="flex flex-col h-[calc(100vh-40px)] w-full items-center justify-center bg-background p-6">
        <div className="w-full max-w-md bg-card border border-border shadow-2xl rounded-3xl p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-foreground">Premium Feature Locked</h2>
          <p className="text-muted-foreground mb-8 text-sm">Please enter the access password to unlock the AI Data Science Copilot.</p>
          
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              setLockError('');
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
                  setLockError('Invalid password. Please try again.');
                }
              } catch (err) {
                setLockError('Error verifying password.');
              }
            }}
            className="w-full flex flex-col gap-4"
          >
            <input 
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password..."
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground shadow-sm"
            />
            {lockError && <p className="text-destructive text-sm font-medium">{lockError}</p>}
            <button 
              type="submit"
              disabled={!passwordInput}
              className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              <Unlock className="w-4 h-4" /> Unlock Copilot
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-40px)] w-full relative bg-background">
      
      {/* Header */}
      <div className="absolute top-0 w-full z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between py-4 px-6 max-w-4xl mx-auto w-full">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">AI Copilot</span>
          </h1>
        {chatHistory.length > 0 && (
          <button 
            onClick={clearChatHistory}
            className="flex items-center px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Clear
          </button>
        )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 w-full overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="pt-20 pb-4 px-4 md:px-8 space-y-8 max-w-4xl mx-auto w-full h-full">
        {chatHistory.length === 0 && !isTyping && (
          <div className="h-full flex flex-col items-center justify-center text-center mt-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-4xl font-semibold mb-2 bg-gradient-to-r from-foreground to-muted-foreground text-transparent bg-clip-text">
              Hello, Data Scientist
            </h2>
            <p className="text-lg text-muted-foreground mb-12">
              How can I help you analyze the <span className="font-medium text-foreground">{summary.filename}</span> dataset today?
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
               {[
                 "What are the most correlated features?",
                 "Summarize the missing values.",
                 "Suggest some preprocessing steps.",
                 "What is the distribution of the target?"
               ].map(suggestion => (
                  <button 
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="p-4 text-left border border-border rounded-xl bg-card hover:bg-muted/50 hover:border-primary/50 transition-all text-sm font-medium text-foreground flex items-start gap-3"
                  >
                    <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {suggestion}
                  </button>
               ))}
            </div>
          </div>
        )}
        
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'user' ? (
               <div className="max-w-[80%] bg-muted/80 text-foreground px-5 py-3 rounded-3xl rounded-tr-sm text-[15px] leading-relaxed shadow-sm">
                 {msg.content}
               </div>
            ) : (
               <div className="flex gap-4 max-w-[90%]">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                   <Sparkles className="w-4 h-4 text-white" />
                 </div>
                 <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl">
                   <ReactMarkdown>{msg.content}</ReactMarkdown>
                 </div>
               </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-4 max-w-[90%]">
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0 mt-1 shadow-sm animate-pulse">
                 <Sparkles className="w-4 h-4 text-white" />
               </div>
               <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                 {streamingMessage ? (
                   <ReactMarkdown>{streamingMessage}</ReactMarkdown>
                 ) : (
                   <div className="flex items-center space-x-2 text-muted-foreground h-8">
                     <Loader2 className="w-4 h-4 animate-spin" />
                     <span className="text-sm font-medium">Analyzing data...</span>
                   </div>
                 )}
               </div>
            </div>
          </div>
        )}
        
        {/* Invisible spacer to push the last message up above the absolute input box */}
        <div className="h-40 shrink-0" />
        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-background via-background to-transparent pt-10 pb-6 px-4 md:px-8">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative max-w-3xl mx-auto flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your dataset..."
            className="w-full bg-card border border-border shadow-sm rounded-full pl-6 pr-14 py-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-30 disabled:hover:bg-primary"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
        <div className="text-center mt-3">
          <span className="text-xs text-muted-foreground">AI Copilot can make mistakes. Check important stats.</span>
        </div>
      </div>
    </div>
  );
}
