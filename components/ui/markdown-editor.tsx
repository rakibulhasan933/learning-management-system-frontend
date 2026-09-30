"use client"

import { useId, useState } from "react"
import { MarkdownPlugin } from "@platejs/markdown"
import type { Value } from "platejs"
import { Plate, usePlateEditor } from "platejs/react"

import { Editor, EditorContainer } from "@/components/ui/editor"
import { EditorKit } from "@/components/editor/editor-kit"
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
  const editor = usePlateEditor({
    plugins: EditorKit,
    value: (plateEditor) =>
      plateEditor.getApi(MarkdownPlugin).markdown.deserialize(initialMarkdown),
  })

  function updateValue(nextValue: Value) {
    const nextMarkdown = editor.getApi(MarkdownPlugin).markdown.serialize({
      value: nextValue,
    })
    setSerializedValue(nextMarkdown)
    onValueChange?.(nextMarkdown)
  }

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
        <Plate
          editor={editor}
          onChange={({ value: nextValue }) => updateValue(nextValue)}
        >
          <EditorContainer className="min-h-0" variant="default">
            <Editor
              id={id}
              placeholder={placeholder ?? "Write something great..."}
              variant="fullWidth"
            />
          </EditorContainer>
        </Plate>
      </div>
      <p className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{helperText ?? "Use the toolbar, slash commands, or AI to format your content."}</span>
        <span className="shrink-0 font-mono">Plate UI · Markdown</span>
      </p>
    </div>
  )
}
