import React from "react"
import { useNav } from "../app/store"
import { Icons } from "../app/ui"

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: string
  right?: React.ReactNode
}) {
  const nav = useNav()
  return (
    <div className="sticky top-0 z-20 flex items-center gap-3 px-4 pb-3 pt-[52px]">
      <button
        onClick={nav.back}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-50 text-ink-soft transition active:scale-95"
        aria-label="Quay lại"
      >
        <Icons.back size={20} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-[16px] font-bold leading-tight text-ink">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-[12px] text-ink-muted">{subtitle}</p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

export function TopBar({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: string
  right?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between px-4 pb-2 pt-[52px]">
      <div>
        <h1 className="font-display text-[22px] font-extrabold leading-tight tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-[13px] text-ink-soft">{subtitle}</p>
        )}
      </div>
      {right}
    </div>
  )
}
