"use client";
import { createContext, createElement, useMemo, useContext, useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, getFirestore } from 'firebase/firestore';
import { getApps, initializeApp, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut as signOut$1, signInWithEmailAndPassword } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import * as DOMPurifyModule from 'dompurify';
import { jsx } from 'react/jsx-runtime';

var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var _app;
var _db;
var _auth;
var _storage;
function initFirebase(config) {
  _app = getApps().length === 0 ? initializeApp(config) : getApp();
  _db = getFirestore(_app);
  _auth = getAuth(_app);
  _storage = getStorage(_app);
  return { app: _app, db: _db, auth: _auth, storage: _storage };
}
async function signIn(auth, email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}
async function signOut(auth) {
  return signOut$1(auth);
}
function subscribeToAuthState(auth, callback) {
  return onAuthStateChanged(auth, callback);
}
var VALID_LEVELS = ["h2", "h3", "h4", "h5", "h6"];
var normalizeLevel = (l) => l === "h1" ? "h2" : VALID_LEVELS.includes(l) ? l : "h3";
function Title({ data, className }) {
  const tag = normalizeLevel(data == null ? void 0 : data.level);
  return createElement(tag, { className }, data == null ? void 0 : data.text);
}
function Paragraph({ data, className }) {
  return createElement("p", { className }, data == null ? void 0 : data.text);
}
var DOMPurify = DOMPurifyModule.default ?? DOMPurifyModule;
var DOMPURIFY_CONFIG = {
  // Preserve ARIA attributes so admin-authored HTML stays accessible.
  // Without ADD_ATTR, DOMPurify strips aria-* and role attributes by default.
  ADD_ATTR: ["aria-label", "aria-describedby", "aria-labelledby", "role", "tabindex"]
};
function stripDangerous(html) {
  if (!html) return "";
  return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "").replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, 'href=""');
}
function RichText({ data, className }) {
  const raw = (data == null ? void 0 : data.html) ?? "";
  const [clean, setClean] = useState(() => stripDangerous(raw));
  useEffect(() => {
    if (typeof (DOMPurify == null ? void 0 : DOMPurify.sanitize) === "function") {
      setClean(DOMPurify.sanitize(raw, DOMPURIFY_CONFIG));
    }
  }, [raw]);
  return createElement("div", { className, dangerouslySetInnerHTML: { __html: clean } });
}
function Image({ data, className }) {
  const imgProps = {
    src: data == null ? void 0 : data.src,
    alt: (data == null ? void 0 : data.alt) ?? "",
    // empty string = decorative; never undefined/missing
    width: data == null ? void 0 : data.width,
    height: data == null ? void 0 : data.height
  };
  if (data == null ? void 0 : data.caption) {
    return createElement(
      "figure",
      { className },
      createElement("img", imgProps),
      createElement("figcaption", null, data.caption)
    );
  }
  return createElement("img", { ...imgProps, className });
}
function toEmbedUrl(url) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;
  return url;
}
function isStorageUrl(url) {
  return (url == null ? void 0 : url.includes("firebasestorage.googleapis.com")) || (url == null ? void 0 : url.includes("storage.googleapis.com"));
}
function VideoJSPlayer({ url, title }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  useEffect(() => {
    if (!playerRef.current && containerRef.current) {
      let videojs;
      try {
        videojs = __require("video.js").default;
      } catch {
        return;
      }
      const el = document.createElement("video-js");
      containerRef.current.appendChild(el);
      playerRef.current = videojs(el, {
        sources: [{ src: url, type: "video/mp4" }],
        controls: true,
        // WCAG 2.1.1: keyboard controls required
        responsive: true,
        fluid: true
      });
    }
  }, [url]);
  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);
  return createElement(
    "div",
    { "data-vjs-player": true },
    createElement("div", { ref: containerRef })
  );
}
function Video({ data, className }) {
  const src = (data == null ? void 0 : data.url) ?? (data == null ? void 0 : data.src);
  const titleText = (data == null ? void 0 : data.title) || "Embedded video";
  if (!src) return null;
  if (isStorageUrl(src)) {
    let videojsAvailable = false;
    try {
      __require("video.js");
      videojsAvailable = true;
    } catch {
      if (typeof window !== "undefined") {
        console.warn(
          "[jeeby-cms] <Video> with Firebase Storage URLs works best with video.js installed. Run: npm install video.js"
        );
      }
    }
    if (videojsAvailable && typeof window !== "undefined") {
      return createElement(VideoJSPlayer, { url: src, title: titleText });
    }
    return createElement("video", {
      src,
      controls: true,
      className,
      style: { width: "100%" },
      "aria-label": titleText
    });
  }
  const embedUrl = toEmbedUrl(src);
  return createElement("iframe", {
    src: embedUrl,
    // WCAG 4.1.2: title attribute is MANDATORY on every iframe.
    // Use block.data.title if provided, otherwise fall back to a descriptive default.
    title: titleText,
    allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
    allowFullScreen: true,
    className,
    style: { border: 0, width: "100%", aspectRatio: "16/9" }
  });
}
function Gallery({ data, className }) {
  const items = (data == null ? void 0 : data.items) ?? [];
  return createElement(
    "ul",
    {
      className: ["jeeby-cms-gallery", className].filter(Boolean).join(" "),
      "aria-label": "Gallery",
      style: { listStyle: "none", padding: 0, margin: 0 }
    },
    ...items.map(
      (item, i) => createElement(
        "li",
        { key: item.id ?? i },
        item.caption ? createElement(
          "figure",
          null,
          createElement("img", { src: item.src, alt: item.alt ?? "", loading: "lazy" }),
          createElement("figcaption", null, item.caption)
        ) : createElement("img", { src: item.src, alt: item.alt ?? "", loading: "lazy" })
      )
    )
  );
}

// src/blocks/index.js
var BLOCK_REGISTRY = {
  title: Title,
  paragraph: Paragraph,
  richtext: RichText,
  image: Image,
  video: Video,
  gallery: Gallery
};
function Block({ id, className, children }) {
  return createElement(
    "div",
    {
      id,
      className: ["jeeby-cms-block", className].filter(Boolean).join(" ")
    },
    children
  );
}
function Blocks({ data, components, className, blockClassName }) {
  var _a;
  if (!((_a = data == null ? void 0 : data.blocks) == null ? void 0 : _a.length)) return null;
  const registry = components ? { ...BLOCK_REGISTRY, ...components } : BLOCK_REGISTRY;
  return createElement(
    "div",
    { className },
    ...data.blocks.map((block, i) => {
      const Component = registry[block.type];
      if (!Component) return null;
      return createElement(
        Block,
        { key: block.id ?? i, id: block.id, className: blockClassName },
        createElement(Component, { data: block.data })
      );
    })
  );
}
var CMSContext = createContext(null);
function CMSProvider({ firebaseConfig, templates = [], children }) {
  const firebase = useMemo(() => initFirebase(firebaseConfig), [firebaseConfig]);
  const value = useMemo(() => ({ ...firebase, templates }), [firebase, templates]);
  return /* @__PURE__ */ jsx(CMSContext.Provider, { value, children });
}
function useCMSFirebase() {
  const ctx = useContext(CMSContext);
  if (!ctx) throw new Error("useCMSFirebase must be used inside <CMSProvider>");
  return ctx;
}
function useAuth() {
  const { auth } = useCMSFirebase();
  const [user, setUser] = useState(void 0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(auth, async (u) => {
      if (u) {
        const token = await u.getIdToken();
        const secure = typeof document !== "undefined" && document.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `__session=${token}; path=/; SameSite=Strict${secure}`;
      } else {
        document.cookie = "__session=; path=/; SameSite=Strict; max-age=0";
      }
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);
  return {
    user,
    loading,
    signIn: (email, password) => signIn(auth, email, password),
    signOut: () => signOut(auth)
  };
}
function useCMSContent(slug) {
  const { db } = useCMSFirebase();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!slug || !db) return;
    setLoading(true);
    const ref = doc(db, "pages", slug);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        var _a;
        setLoading(false);
        setData(snap.exists() ? ((_a = snap.data()) == null ? void 0 : _a.published) ?? null : null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [db, slug]);
  return { data, loading, error };
}

export { Block, Blocks, CMSProvider, useAuth, useCMSContent, useCMSFirebase };
