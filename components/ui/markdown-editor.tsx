"use client"

import { useId, useState, type ComponentType } from "react"
import * as MDEditor from "@uiw/react-md-editor"
import type { MDEditorProps } from "@uiw/react-md-editor"

import { cn } from "@/lib/utils"

type MarkdownEditorProps = Omit<
  MDEditorProps,
  "onChange" | "textareaProps" | "value"
> & {
  className?: string
  defaultValue?: string
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
  helperText,
  label,
  name,
  onValueChange,
  placeholder,
  required,
  value,
  ...props
}: MarkdownEditorProps) {
  const id = useId()
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue)

  const resolvedValue = isControlled ? value : internalValue
  const MarkdownEditorComponent =
    MDEditor.default as unknown as ComponentType<MDEditorProps>

  return (
    <div className={cn("grid gap-2", className)}>
      <label className="text-sm text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      <MarkdownEditorComponent
        {...props}
        className="md-editor-shell"
        data-color-mode="dark"
        height={props.height ?? 300}
        onChange={(nextValue: string | undefined) => {
          const next = nextValue ?? ""

          if (!isControlled) {
            setInternalValue(next)
          }

          onValueChange?.(next)
        }}
        preview="live"
        visibleDragbar={false}
        previewOptions={{
          disallowedElements: ["script", "iframe"],
        }}
        textareaProps={{
          id,
          name,
          placeholder,
          required,
        }}
        value={resolvedValue}
      />
      {helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  )
}
