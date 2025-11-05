"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

interface MarkdownProps {
  content: string
  className?: string
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none font-sans text-muted-foreground dark:prose-invert prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary",
        "[&_p]:my-0 [&_ul]:my-0 [&_ol]:my-0 [&_li]:mt-1 [&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ node, ...props }) => <p {...props} />,
          strong: ({ node, ...props }) => <strong {...props} />,
          em: ({ node, ...props }) => <em {...props} />,
          ul: ({ node, ...props }) => (
            <ul className="ml-4 list-disc space-y-1" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="ml-4 list-decimal space-y-1" {...props} />
          ),
          li: ({ node, ...props }) => <li {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
