import ReactMarkdown from "react-markdown"
import rehypeSanitize from "rehype-sanitize"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

interface MarkdownContentProps {
  children: string | null | undefined
  className?: string
  fallback?: string
}

export function MarkdownContent({
  children,
  className,
  fallback = "Course details will be added soon.",
}: MarkdownContentProps) {
  const content = children?.trim().length ? children : fallback

  return (
    <div className={cn("markdown-renderer", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
