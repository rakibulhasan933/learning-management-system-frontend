import type { ReactNode } from "react"

import { ProgressThread } from "@/components/ui/progress-thread"

export function SectionHeader({
    index,
    eyebrow,
    title,
    action,
}: {
    index: string
    eyebrow: string
    title: string
    action?: ReactNode
}) {
    return (
        <div
            className={`reveal grid w-full items-end gap-6 text-left ${action ? "sm:grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-1"
                }`}
        >
            <div className="col-start-1 mr-auto ml-0 justify-self-start">
                <p className="eyebrow">
                    <span className="text-primary tabular-nums">{index}</span>
                    <span>{eyebrow}</span>
                </p>
                <h2 className="mt-4 max-w-xl font-heading text-3xl font-light tracking-[-0.02em] md:text-5xl">
                    {title}
                </h2>
                <ProgressThread className="mt-6 w-16" />
            </div>
            {action ? (
                <div className="justify-self-start sm:col-start-2 sm:justify-self-end">
                    {action}
                </div>
            ) : null}
        </div>
    )
}