"use client";

import React, { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Prism from "prismjs";

// Importar lenguajes básicos para Prism
import "prismjs/components/prism-bash";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-python";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  useEffect(() => {
    Prism.highlightAll();
  }, [content]);

  return (
    <div className="prose prose-invert max-w-none text-slate-300 font-mono text-xs leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold font-rajdhani text-white border-b border-panel-border/40 pb-2 mb-3 mt-4">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold font-rajdhani text-hud-cyan pb-1 mb-2 mt-4">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold font-rajdhani text-slate-200 mb-2 mt-3">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-3 text-slate-300">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 mb-3 text-slate-300">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-3 text-slate-300">{children}</ol>
          ),
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match;

            if (isInline) {
              return (
                <code
                  className="bg-[#05080e] text-hud-cyan px-1.5 py-0.5 border border-hud-cyan/20 text-[11px]"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className="relative my-3 border border-panel-border/40 bg-[#05080e]">
                <div className="px-3 py-1 bg-[#0b101c] border-b border-panel-border/30 text-[10px] text-slate-400 uppercase tracking-widest flex items-center justify-between">
                  <span>{match[1]}</span>
                  <span className="text-hud-cyan">CODE_BLOCK</span>
                </div>
                <pre className="p-3 overflow-x-auto text-xs text-slate-200 font-mono">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
