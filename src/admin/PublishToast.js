"use client"

export function PublishToast() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="jeeby-cms-publish-toast"
    >
      <span>Page published successfully.</span>
    </div>
  )
}
