'use client';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';

interface ChatMessageContentProps {
  content: string;
  isStreaming?: boolean;
}

function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'code';
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  return (
    <div className="relative my-4 rounded-xl border border-border/80 bg-zinc-950 text-zinc-100 shadow-md overflow-hidden group">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/90 text-xs text-zinc-400 font-mono select-none">
        <span className="uppercase tracking-wider font-semibold text-[11px] text-zinc-300">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          title="Copy code to clipboard"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div className="overflow-x-auto p-4 text-xs sm:text-sm font-mono leading-relaxed [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-zinc-900 [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
        <pre className="!bg-transparent !p-0 !m-0">
          <code>{children}</code>
        </pre>
      </div>
    </div>
  );
}

export function ChatMessageContent({ content, isStreaming }: ChatMessageContentProps) {
  return (
    <div className="chat-markdown-body w-full min-w-0 max-w-full break-words text-[14.5px] sm:text-[15px] leading-relaxed text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code & Pre rendering
          code({ node, inline, className, children, ...props }: any) {
            // Check if this is an inline code snippet or code block
            const isCodeBlock = !inline && (className || String(children).includes('\n'));
            if (isCodeBlock) {
              return <CodeBlock className={className}>{children}</CodeBlock>;
            }
            return (
              <code 
                className="bg-muted text-primary px-1.5 py-0.5 rounded-md text-xs sm:text-[13px] font-mono border border-border/50 break-words" 
                {...props}
              >
                {children}
              </code>
            );
          },
          // GFM Tables with horizontal scrolling wrapper
          table({ children }) {
            return (
              <div className="my-4 w-full overflow-x-auto rounded-xl border border-border bg-card shadow-sm [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-thumb]:rounded-full">
                <table className="w-full min-w-[340px] text-left text-xs sm:text-sm border-collapse">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-muted/70 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider border-b border-border">{children}</thead>;
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-border/40">{children}</tbody>;
          },
          tr({ children }) {
            return <tr className="hover:bg-muted/30 transition-colors">{children}</tr>;
          },
          th({ children }) {
            return <th className="px-3.5 py-2.5 font-semibold text-foreground">{children}</th>;
          },
          td({ children }) {
            return <td className="px-3.5 py-2.5 text-foreground/90 whitespace-normal">{children}</td>;
          },
          // Paragraphs & Spacing
          p({ children }) {
            return <p className="mb-3 last:mb-0 leading-relaxed break-words">{children}</p>;
          },
          // Headings
          h1({ children }) {
            return <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-4 mb-2">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground mt-3.5 mb-2">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base sm:text-lg font-semibold text-foreground mt-3 mb-1.5">{children}</h3>;
          },
          // Lists
          ul({ children }) {
            return <ul className="my-2.5 ml-5 list-disc space-y-1.5 marker:text-primary">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-2.5 ml-5 list-decimal space-y-1.5 marker:text-primary font-medium">{children}</ol>;
          },
          li({ children }) {
            return <li className="pl-1 leading-relaxed">{children}</li>;
          },
          // Blockquotes
          blockquote({ children }) {
            return (
              <blockquote className="my-3 border-l-4 border-primary pl-4 py-1.5 italic text-muted-foreground bg-primary/5 rounded-r-lg">
                {children}
              </blockquote>
            );
          },
          // Links
          a({ href, children }) {
            return (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary underline underline-offset-4 font-medium hover:opacity-80 transition-opacity"
              >
                {children}
              </a>
            );
          },
          // Horizontal rule
          hr() {
            return <hr className="my-4 border-border" />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
      
      {/* Streaming cursor simulation */}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse align-middle rounded-sm" />
      )}
    </div>
  );
}
