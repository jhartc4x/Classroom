import { useEffect } from 'react'

export function Card({ children, className = '', tilt = false }) {
  return (
    <div
      className={`sticker rounded-3xl bg-white p-5 ${tilt ? 'hover:-rotate-1 transition-transform' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ emoji, children, right }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-display text-xl font-bold flex items-center gap-2">
        <span className="animate-float inline-block">{emoji}</span> {children}
      </h2>
      {right}
    </div>
  )
}

export function Chip({ children, onClick, active = false, className = '', title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-bold transition-all active:scale-90 hover:scale-105 cursor-pointer ${
        active ? 'bg-ink text-white shadow-md' : 'bg-white ring-1 ring-ink/10 hover:ring-ink/30'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function BigButton({ children, onClick, className = '', disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-2xl px-4 py-2 font-display font-bold transition-all active:scale-95 hover:scale-[1.03] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  )
}

export function EmptyState({ emoji, title, hint, action }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-ink/15 p-10 text-center">
      <div className="text-5xl animate-float">{emoji}</div>
      <div className="font-display text-lg font-bold">{title}</div>
      {hint && <div className="max-w-sm text-sm text-ink/60">{hint}</div>}
      {action}
    </div>
  )
}

export function Modal({ open, onClose, title, emoji, children, wide = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className={`sticker animate-pop max-h-[85vh] w-full ${wide ? 'max-w-2xl' : 'max-w-md'} overflow-y-auto rounded-3xl bg-cream p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold">
            {emoji} {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full bg-ink/5 px-3 py-1 font-bold hover:bg-ink/10 cursor-pointer"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
