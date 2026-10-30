import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

const markdownSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span ?? []), "style"],
  },
}

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
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
