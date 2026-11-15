"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  GripHorizontal,
  Maximize2,
  Minimize2,
  MoveDiagonal2,
  RotateCcw,
  XIcon,
} from "lucide-react"

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/25 duration-150 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

const NON_DRAG_SELECTOR =
  'button, a, input, textarea, select, option, [role="button"], [contenteditable="true"], [data-no-drag]'

function DialogContent({
  className,
  children,
  showCloseButton = true,
  showWindowControls = true,
  size = "default",
  style,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  showWindowControls?: boolean
  size?: "default" | "compact" | "full"
}) {
  const popupRef = React.useRef<HTMLDivElement | null>(null)
  const [offset, setOffset] = React.useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })
  const [customSize, setCustomSize] = React.useState<{
    width: number
    height: number
  } | null>(null)
  const [isMaximized, setIsMaximized] = React.useState(false)
  const [isInteracting, setIsInteracting] = React.useState(false)

  const liveOffsetRef = React.useRef(offset)
  liveOffsetRef.current = offset

  const rafRef = React.useRef<number | null>(null)

  const isMovedOrResized =
    offset.x !== 0 || offset.y !== 0 || customSize !== null

  const resetWindow = React.useCallback(() => {
    setIsMaximized(false)
    setCustomSize(null)
    setOffset({ x: 0, y: 0 })
    liveOffsetRef.current = { x: 0, y: 0 }
    if (popupRef.current) {
      popupRef.current.style.width = ""
      popupRef.current.style.height = ""
      popupRef.current.style.maxWidth = ""
      popupRef.current.style.maxHeight = ""
      popupRef.current.style.transform = "translate3d(0px, 0px, 0)"
    }
  }, [])

  const toggleMaximize = React.useCallback(() => {
    setIsMaximized((prev) => {
      const next = !prev
      if (next) {
        setOffset({ x: 0, y: 0 })
        liveOffsetRef.current = { x: 0, y: 0 }
      }
      return next
    })
  }, [])

  const startDrag = React.useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!showWindowControls) return
      if (e.button !== 0) return
      const target = e.target as HTMLElement | null
      if (target?.closest(NON_DRAG_SELECTOR)) return

      const el = popupRef.current
      if (!el) return

      e.preventDefault()

      const startX = e.clientX
      const startY = e.clientY
      const origOffset = isMaximized ? { x: 0, y: 0 } : { ...liveOffsetRef.current }
      let unmaximizedOnDrag = !isMaximized

      setIsInteracting(true)

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY

        if (!unmaximizedOnDrag && Math.hypot(dx, dy) > 8) {
          unmaximizedOnDrag = true
          setIsMaximized(false)
        }

        const vw = window.innerWidth
        const vh = window.innerHeight
        const rect = el.getBoundingClientRect()
        const maxX = Math.max(120, (vw + rect.width) / 2 - 80)
        const maxY = Math.max(80, (vh - 60) / 2)

        const nextX = Math.max(-maxX, Math.min(maxX, origOffset.x + dx))
        const nextY = Math.max(-maxY, Math.min(maxY, origOffset.y + dy))

        liveOffsetRef.current = { x: nextX, y: nextY }

        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => {
          if (popupRef.current) {
            popupRef.current.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`
          }
        })
      }

      const onUp = () => {
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
        window.removeEventListener("pointercancel", onUp)
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        setOffset({ ...liveOffsetRef.current })
        setIsInteracting(false)
      }

      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
      window.addEventListener("pointercancel", onUp)
    },
    [isMaximized, showWindowControls]
  )

  const startResize = React.useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!showWindowControls) return
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()

      const el = popupRef.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const startX = e.clientX
      const startY = e.clientY
      const startW = rect.width
      const startH = rect.height
      const startOffset = isMaximized
        ? { x: 0, y: 0 }
        : { ...liveOffsetRef.current }

      if (isMaximized) {
        setIsMaximized(false)
      }
      setIsInteracting(true)

      let latestSize = { width: Math.round(startW), height: Math.round(startH) }

      const onMove = (ev: PointerEvent) => {
        const vw = window.innerWidth
        const vh = window.innerHeight
        const nextW = Math.round(
          Math.min(vw - 16, Math.max(380, startW + (ev.clientX - startX)))
        )
        const nextH = Math.round(
          Math.min(vh - 16, Math.max(240, startH + (ev.clientY - startY)))
        )
        latestSize = { width: nextW, height: nextH }

        // Keep top-left edge anchored smoothly while resizing from bottom-right corner
        const nextOffX = startOffset.x + (nextW - startW) / 2
        const nextOffY = startOffset.y + (nextH - startH) / 2
        liveOffsetRef.current = { x: nextOffX, y: nextOffY }

        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => {
          if (popupRef.current) {
            popupRef.current.style.width = `${nextW}px`
            popupRef.current.style.maxWidth = "98vw"
            popupRef.current.style.height = `${nextH}px`
            popupRef.current.style.maxHeight = "96dvh"
            popupRef.current.style.transform = `translate3d(${nextOffX}px, ${nextOffY}px, 0)`
          }
        })
      }

      const onUp = () => {
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
        window.removeEventListener("pointercancel", onUp)
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        setCustomSize(latestSize)
        setOffset({ ...liveOffsetRef.current })
        setIsInteracting(false)
      }

      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
      window.addEventListener("pointercancel", onUp)
    },
    [isMaximized, showWindowControls]
  )

  const handleHeaderCapturePointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!showWindowControls) return
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.closest(NON_DRAG_SELECTOR)) return
      if (target.closest('[data-slot="dialog-header"]')) {
        startDrag(e)
      }
    },
    [showWindowControls, startDrag]
  )

  const handleHeaderDoubleClickCapture = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!showWindowControls) return
      const target = e.target as HTMLElement | null
      if (!target || target.closest(NON_DRAG_SELECTOR)) return
      if (target.closest('[data-slot="dialog-header"]')) {
        toggleMaximize()
      }
    },
    [showWindowControls, toggleMaximize]
  )

  const sizeDefaults =
    size === "compact"
      ? "w-[95vw] sm:max-w-[480px] max-h-[90dvh]"
      : size === "full"
      ? "w-[96vw] sm:w-[95vw] sm:max-w-[96vw] max-h-[94dvh]"
      : "w-[95vw] sm:w-[92vw] sm:max-w-[94vw] max-h-[93dvh]"

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        ref={popupRef}
        data-slot="dialog-content"
        onPointerDownCapture={handleHeaderCapturePointerDown}
        onDoubleClickCapture={handleHeaderDoubleClickCapture}
        style={{
          ...(style || {}),
          ...(isMaximized
            ? {
                width: "98vw",
                maxWidth: "98vw",
                height: "96dvh",
                maxHeight: "96dvh",
                transform: "translate3d(0px, 0px, 0)",
              }
            : {
                transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
                ...(customSize
                  ? {
                      width: `${customSize.width}px`,
                      maxWidth: "98vw",
                      height: `${customSize.height}px`,
                      maxHeight: "96dvh",
                    }
                  : {}),
              }),
        }}
        className={cn(
          "fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-popover text-sm text-popover-foreground shadow-2xl ring-1 ring-foreground/15 outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
          !isInteracting && "transition-[width,height] duration-150 ease-out",
          sizeDefaults,
          className,
          "flex flex-col p-0 gap-0 overflow-hidden",
          isMaximized && "rounded-lg!"
        )}
        {...props}
      >
        {showWindowControls ? (
          <div
            data-slot="dialog-window-bar"
            onPointerDown={startDrag}
            onDoubleClick={(e) => {
              if ((e.target as HTMLElement)?.closest(NON_DRAG_SELECTOR)) return
              toggleMaximize()
            }}
            className={cn(
              "h-9 px-3 flex items-center justify-between border-b border-border/70 bg-muted/50 select-none touch-none shrink-0",
              isInteracting ? "cursor-grabbing" : "cursor-grab"
            )}
          >
            <div className="flex items-center gap-2 text-muted-foreground/70 pointer-events-none">
              <GripHorizontal className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-1" data-no-drag>
              {isMovedOrResized && !isMaximized && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={resetWindow}
                  title="Resetuj pozycję i rozmiar"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={toggleMaximize}
                title={isMaximized ? "Przywróć okno" : "Powiększ na cały ekran"}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                {isMaximized ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </Button>

              {showCloseButton && (
                <DialogPrimitive.Close
                  data-slot="dialog-close"
                  render={
                    <Button
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      size="icon-sm"
                    />
                  }
                >
                  <XIcon className="w-4 h-4" />
                  <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
              )}
            </div>
          </div>
        ) : (
          showCloseButton && (
            <DialogPrimitive.Close
              data-slot="dialog-close"
              render={
                <Button
                  variant="ghost"
                  className="absolute top-2 right-2 z-20"
                  size="icon-sm"
                />
              }
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )
        )}

        {/* Scrollable Window Body */}
        <div
          className={cn(
            "flex-1 min-h-0 overflow-y-auto flex flex-col gap-4",
            showWindowControls ? "p-4 sm:p-5" : "p-0"
          )}
        >
          {children}
        </div>

        {/* Desktop Corner Resize Grip */}
        {showWindowControls && (
          <div
            data-no-drag
            onPointerDown={startResize}
            title="Przeciągnij, aby zmienić rozmiar"
            className="hidden sm:flex items-end justify-end absolute bottom-0.5 right-0.5 w-5 h-5 cursor-nwse-resize z-30 text-muted-foreground/60 hover:text-foreground select-none touch-none"
          >
            <MoveDiagonal2 className="w-3.5 h-3.5" />
          </div>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 cursor-grab active:cursor-grabbing", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 sm:-mx-5 -mb-4 sm:-mb-5 mt-auto flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:px-5 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
