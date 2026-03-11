// src/blocks/Video.js
// ACCESSIBILITY: WCAG 4.1.2 (Name, Role, Value), 2.1.1 (Keyboard), 1.2.2 (Captions)
// Rules:
//   1. EVERY <iframe> MUST have a non-empty title attribute — screen readers use this
//      to identify the iframe's purpose. This is a hard WCAG 4.1.2 requirement.
//   2. YouTube/Vimeo/Loom iframes are keyboard-accessible by default.
//   3. Native <video> fallback MUST include `controls` attribute for keyboard access.
//   4. Video.js has built-in keyboard controls and caption support.
//
// NOTE: Written with React.createElement (not JSX) so this file can be imported directly by
// the Node.js test runner without a JSX transform. TSUP compiles it with JSX enabled anyway.

import { createElement, useRef, useEffect } from 'react'

// --- URL Parsing Utilities ---

// Exported so tests can import toEmbedUrl directly without rendering the component.
export function toEmbedUrl(url) {
  if (!url) return null

  // YouTube: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`

  // Vimeo: https://vimeo.com/VIDEO_ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`

  // Loom: https://www.loom.com/share/SHARE_ID
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`

  // Not a known embed platform — return as-is (may be a Firebase Storage URL or direct embed URL).
  return url
}

function isStorageUrl(url) {
  return (
    url?.includes('firebasestorage.googleapis.com') ||
    url?.includes('storage.googleapis.com')
  )
}

// --- Video.js Player (internal, not exported) ---
// Uses the official Video.js React pattern: two refs + two effects for correct disposal.
// Source: https://legacy.videojs.org/guides/react/
// videojs is an optional peer dependency — imported lazily to avoid crashing when not installed.

function VideoJSPlayer({ url, title }) {
  const containerRef = useRef(null)
  const playerRef = useRef(null)

  useEffect(() => {
    if (!playerRef.current && containerRef.current) {
      let videojs
      try {
        // Dynamic require — video.js is an optional peer dep.
        // If not installed, the native <video> fallback renders instead (see Video component below).
        videojs = require('video.js').default
      } catch {
        return
      }
      const el = document.createElement('video-js')
      containerRef.current.appendChild(el)
      playerRef.current = videojs(el, {
        sources: [{ src: url, type: 'video/mp4' }],
        controls: true,       // WCAG 2.1.1: keyboard controls required
        responsive: true,
        fluid: true,
      })
    }
  }, [url])

  // Cleanup effect — dispose the player on unmount to prevent memory leaks.
  // The !player.isDisposed() guard handles React Strict Mode double-invoke.
  useEffect(() => {
    const player = playerRef.current
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose()
        playerRef.current = null
      }
    }
  }, [playerRef])

  // The accessible name comes from the Video component's surrounding context.
  // Video.js itself manages the player accessibility (controls labeling, keyboard nav).
  return createElement('div', { 'data-vjs-player': true },
    createElement('div', { ref: containerRef })
  )
}

// --- Main Video Component ---

export function Video({ data, className }) {
  const src = data?.src
  const titleText = data?.title || 'Embedded video'

  if (!src) return null

  // Firebase Storage URL → use Video.js player (or native video fallback)
  if (isStorageUrl(src)) {
    // Check whether video.js is installed at render time.
    // If not installed, fall back to native <video> with a console warning.
    let videojsAvailable = false
    try {
      require('video.js')
      videojsAvailable = true
    } catch {
      // isomorphic environments (SSR): require may not be available
      if (typeof window !== 'undefined') {
        console.warn(
          '[jeeby-cms] <Video> with Firebase Storage URLs works best with video.js installed. ' +
          'Run: npm install video.js'
        )
      }
    }

    if (videojsAvailable && typeof window !== 'undefined') {
      return createElement(VideoJSPlayer, { url: src, title: titleText })
    }

    // Native <video> fallback: `controls` attribute is REQUIRED for WCAG 2.1.1 keyboard access.
    return createElement('video', {
      src,
      controls: true,
      className,
      style: { width: '100%' },
      'aria-label': titleText,
    })
  }

  // YouTube, Vimeo, Loom — render as <iframe>
  const embedUrl = toEmbedUrl(src)
  return createElement('iframe', {
    src: embedUrl,
    // WCAG 4.1.2: title attribute is MANDATORY on every iframe.
    // Use block.data.title if provided, otherwise fall back to a descriptive default.
    title: titleText,
    allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
    allowFullScreen: true,
    className,
    style: { border: 0, width: '100%', aspectRatio: '16/9' },
  })
}
