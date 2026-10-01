"use client"

import { useId, useState } from "react"
import Color from "@tiptap/extension-color"
import { Placeholder } from "@tiptap/extension-placeholder"
import { TextStyle } from "@tiptap/extension-text-style"
import { Markdown } from "@tiptap/markdown"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Palette,
  Quote,
  RemoveFormatting,
  Redo2,
  CodeXml,
  Strikethrough,
  Undo2,
} from "lucide-react"

import { cn } from "@/lib/utils"

type MarkdownEditorProps = {
  className?: string
  defaultValue?: string
  height?: number
  helperText?: string
  label: string
  name: string
  onValueChange?: (value: string) => void
  placeholder?: string
  required?: boolean
  value?: string
}

type ToolbarButtonProps = {
  active?: boolean
  children: React.ReactNode
  label: string
  onClick: () => void
}

function ToolbarButton({
  active,
  children,
  label,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        active && "bg-primary/15 text-primary"
      )}
      onClick={onClick}
      onMouseDown={(event) => event.preventDefault()}
      type="button"
    >
      {children}
    </button>
  )
}

export function MarkdownEditor({
  className,
  defaultValue = "",
  height = 300,
  helperText,
  label,
  name,
  onValueChange,
  placeholder,
  required,
  value,
}: MarkdownEditorProps) {
  const id = useId()
  const initialMarkdown = value ?? defaultValue
  const [serializedValue, setSerializedValue] = useState(initialMarkdown)
  const editor = useEditor({
    content: initialMarkdown,
    contentType: initialMarkdown.trimStart().startsWith("<")
      ? "html"
      : "markdown",
    extensions: [
      StarterKit,
      Markdown,
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      Placeholder.configure({
        placeholder: placeholder ?? "Write something great...",
      }),
    ],
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      const nextContent = currentEditor.getHTML()
      setSerializedValue(nextContent)
      onValueChange?.(nextContent)
    },
  })

  return (
    <div className={cn("grid gap-2", className)}>
      <label className="text-sm text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      <input
        name={name}
        required={required}
        type="hidden"
        value={serializedValue}
      />
      <div
        className="overflow-hidden rounded-2xl border border-input bg-background shadow-sm transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30"
        style={{ minHeight: height + 58 }}
      >
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/20 p-2">
          <ToolbarButton
            active={editor?.isActive("bold")}
            label="Bold"
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("italic")}
            label="Italic"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("strike")}
            label="Strikethrough"
            onClick={() => editor?.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("code")}
            label="Inline code"
            onClick={() => editor?.chain().focus().toggleCode().run()}
          >
            <CodeXml className="size-4" />
          </ToolbarButton>
          <div
            aria-label="Text color"
            className="flex items-center gap-0.5 rounded-lg border border-border px-1"
            role="group"
          >
            <Palette className="mx-1 size-3.5 text-muted-foreground" />
            {["#d6a448", "#e2136e", "#38bdf8", "#4ade80", "#f87171"].map(
              (color) => (
                <button
                  aria-label={`Use ${color} text color`}
                  className="size-5 rounded-full border border-white/30 transition-transform hover:scale-110"
                  key={color}
                  onClick={() => editor?.chain().focus().setColor(color).run()}
                  onMouseDown={(event) => event.preventDefault()}
                  style={{ backgroundColor: color }}
                  type="button"
                />
              )
            )}
          </div>
          <ToolbarButton
            active={editor?.isActive("heading", { level: 2 })}
            label="Heading 2"
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("heading", { level: 1 })}
            label="Heading 1"
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("heading", { level: 3 })}
            label="Heading 3"
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("heading", { level: 4 })}
            label="Heading 4"
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 4 }).run()
            }
          >
            <Heading4 className="size-4" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolbarButton
            active={editor?.isActive("bulletList")}
            label="Bullet list"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("orderedList")}
            label="Numbered list"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("blockquote")}
            label="Quote"
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("codeBlock")}
            label="Code block"
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          >
            <Code2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("link")}
            label="Add link"
            onClick={() => {
              const currentHref = editor?.getAttributes("link").href as
                | string
                | undefined
              const href = window.prompt("Enter URL", currentHref ?? "https://")
              if (href === null) return
              if (href.trim() === "") {
                editor?.chain().focus().unsetLink().run()
                return
              }
              editor?.chain().focus().setLink({ href: href.trim() }).run()
            }}
          >
            <Link2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Horizontal divider"
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          >
            <Minus className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Clear formatting"
            onClick={() =>
              editor?.chain().focus().unsetAllMarks().clearNodes().run()
            }
          >
            <RemoveFormatting className="size-4" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolbarButton
            label="Undo"
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <Undo2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Redo"
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <Redo2 className="size-4" />
          </ToolbarButton>
        </div>
        <EditorContent
          editor={editor}
          id={id}
          className="tiptap-editor min-h-0 px-4 py-3"
          style={{ minHeight: height }}
        />
      </div>
      <p className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          {helperText ?? "Use the toolbar to format your course description."}
        </span>
        <span className="shrink-0 font-mono">Tiptap · Rich text</span>
      </p>
    </div>
  )
}
