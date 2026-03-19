"use client"

export function PublishToast() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="jeeby-cms-publish-toast"
      style={{
        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: '12px',
        zIndex: 200,
        background: '#1f2937', color: '#f9fafb',
      }}
    >
      <span>Page published successfully.</span>
    </div>
  )
}
