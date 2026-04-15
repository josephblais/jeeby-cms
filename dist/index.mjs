"use client";
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/index.js
import { createContext, useContext, useMemo, useState as useState2, useEffect as useEffect3 } from "react";
import { doc, onSnapshot } from "firebase/firestore";

// src/firebase/init.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
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

// src/firebase/auth.js
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from "firebase/auth";
async function signIn(auth, email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}
async function signOut(auth) {
  return firebaseSignOut(auth);
}
function subscribeToAuthState(auth, callback) {
  return onAuthStateChanged(auth, callback);
}

// src/blocks/index.js
import { createElement as createElement9 } from "react";

// src/blocks/Title.js
import { createElement } from "react";

// src/utils/resolveLocale.js
function resolveLocale(value, locale = "en") {
  if (value === null || value === void 0) return "";
  if (typeof value !== "object") return value;
  return value[locale] || value["en"] || "";
}

// src/blocks/Title.js
var VALID_LEVELS = ["h2", "h3", "h4", "h5", "h6"];
var normalizeLevel = (l) => l === "h1" ? "h2" : VALID_LEVELS.includes(l) ? l : "h3";
function Title({ data, className, locale = "en" }) {
  const tag = normalizeLevel(data == null ? void 0 : data.level);
  return createElement(tag, { className }, resolveLocale(data == null ? void 0 : data.text, locale));
}

// src/blocks/Paragraph.js
import { createElement as createElement2 } from "react";
function Paragraph({ data, className, locale = "en" }) {
  return createElement2("p", { className }, resolveLocale(data == null ? void 0 : data.text, locale));
}

// src/blocks/RichText.js
import { createElement as createElement3, useState, useEffect } from "react";
import * as DOMPurifyModule from "dompurify";
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
function RichText({ data, className, locale = "en" }) {
  const raw = resolveLocale(data == null ? void 0 : data.html, locale) ?? "";
  const [clean, setClean] = useState(() => stripDangerous(raw));
  useEffect(() => {
    if (typeof (DOMPurify == null ? void 0 : DOMPurify.sanitize) === "function") {
      setClean(DOMPurify.sanitize(raw, DOMPURIFY_CONFIG));
    }
  }, [raw]);
  return createElement3("div", { className, dangerouslySetInnerHTML: { __html: clean } });
}

// src/blocks/Image.js
import { createElement as createElement4 } from "react";
function Image({ data, className, locale = "en" }) {
  if (!(data == null ? void 0 : data.src)) return null;
  const alt = resolveLocale(data == null ? void 0 : data.alt, locale);
  const caption = resolveLocale(data == null ? void 0 : data.caption, locale);
  const imgProps = {
    src: data.src,
    alt,
    // empty string = decorative; never undefined/missing
    width: data == null ? void 0 : data.width,
    height: data == null ? void 0 : data.height
  };
  if (caption) {
    return createElement4(
      "figure",
      { className },
      createElement4("img", imgProps),
      createElement4("figcaption", null, caption)
    );
  }
  return createElement4("img", { ...imgProps, className });
}

// src/blocks/Video.js
import { createElement as createElement5, useRef, useEffect as useEffect2 } from "react";
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
  useEffect2(() => {
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
  useEffect2(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);
  return createElement5(
    "div",
    { "data-vjs-player": true },
    createElement5("div", { ref: containerRef })
  );
}
function Video({ data, className, locale = "en" }) {
  const src = (data == null ? void 0 : data.url) ?? (data == null ? void 0 : data.src);
  const titleText = resolveLocale(data == null ? void 0 : data.title, locale) || "Embedded video";
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
      return createElement5(VideoJSPlayer, { url: src, title: titleText });
    }
    return createElement5("video", {
      src,
      controls: true,
      className,
      style: { width: "100%" },
      "aria-label": titleText
    });
  }
  const embedUrl = toEmbedUrl(src);
  return createElement5("iframe", {
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

// src/blocks/Gallery.js
import { createElement as createElement6 } from "react";
function Gallery({ data, className, locale = "en" }) {
  const items = (data == null ? void 0 : data.items) ?? [];
  return createElement6(
    "ul",
    {
      className: ["jeeby-cms-gallery", className].filter(Boolean).join(" "),
      "aria-label": "Gallery",
      style: { listStyle: "none", padding: 0, margin: 0 }
    },
    ...items.map((item, i) => {
      const alt = resolveLocale(item.alt, locale);
      const caption = resolveLocale(item.caption, locale);
      return createElement6(
        "li",
        { key: item.id ?? i },
        caption ? createElement6(
          "figure",
          null,
          createElement6("img", { src: item.src, alt, loading: "lazy" }),
          createElement6("figcaption", null, caption)
        ) : createElement6("img", { src: item.src, alt, loading: "lazy" })
      );
    })
  );
}

// src/blocks/List.js
import { createElement as createElement7 } from "react";
function List({ data, className }) {
  const items = (data == null ? void 0 : data.items) ?? [];
  if (!items.length) return null;
  const tag = (data == null ? void 0 : data.ordered) ? "ol" : "ul";
  return createElement7(
    tag,
    { className },
    ...items.map((item, i) => createElement7("li", { key: i }, item))
  );
}

// src/blocks/PullQuote.js
import { createElement as createElement8 } from "react";
function PullQuote({ data, className }) {
  const quote = (data == null ? void 0 : data.quote) ?? "";
  const attribution = (data == null ? void 0 : data.attribution) ?? "";
  if (!quote) return null;
  return createElement8(
    "figure",
    { className },
    createElement8("blockquote", null, createElement8("p", null, quote)),
    attribution ? createElement8("figcaption", null, attribution) : null
  );
}

// src/blocks/index.js
var BLOCK_REGISTRY = {
  title: Title,
  paragraph: Paragraph,
  richtext: RichText,
  image: Image,
  video: Video,
  gallery: Gallery,
  list: List,
  pullquote: PullQuote
};
function Block({ id, className, children }) {
  return createElement9(
    "div",
    {
      id,
      className: ["jeeby-cms-block", className].filter(Boolean).join(" ")
    },
    children
  );
}
function Blocks({ data, components, className, blockClassName, locale = "en" }) {
  var _a;
  if (!((_a = data == null ? void 0 : data.blocks) == null ? void 0 : _a.length)) return null;
  const registry = components ? { ...BLOCK_REGISTRY, ...components } : BLOCK_REGISTRY;
  return createElement9(
    "div",
    { className },
    ...data.blocks.map((block, i) => {
      const Component = registry[block.type];
      if (!Component) return null;
      return createElement9(
        Block,
        { key: block.id ?? i, id: block.id, className: blockClassName },
        createElement9(Component, { data: block.data, locale })
      );
    })
  );
}

// src/index.js
import { jsx } from "react/jsx-runtime";
var CMSContext = createContext(null);
function CMSProvider({ firebaseConfig, templates = [], isLocalized = false, children }) {
  const firebase = useMemo(() => initFirebase(firebaseConfig), [firebaseConfig]);
  const [locale, setLocale] = useState2("en");
  const [uiLocale] = useState2(() => {
    var _a;
    if (typeof navigator === "undefined") return "en";
    const lang = (_a = navigator.language) == null ? void 0 : _a.slice(0, 2).toLowerCase();
    return ["en", "fr"].includes(lang) ? lang : "en";
  });
  const value = useMemo(
    () => ({ ...firebase, templates, isLocalized, locale, setLocale, uiLocale }),
    [firebase, templates, isLocalized, locale, uiLocale]
  );
  return /* @__PURE__ */ jsx(CMSContext.Provider, { value, children });
}
function useCMSFirebase() {
  const ctx = useContext(CMSContext);
  if (!ctx) throw new Error("useCMSFirebase must be used inside <CMSProvider>");
  return ctx;
}
function useAuth() {
  const { auth } = useCMSFirebase();
  const [user, setUser] = useState2(void 0);
  const [loading, setLoading] = useState2(true);
  useEffect3(() => {
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
function useCMSContent(slug, { locale = "en" } = {}) {
  void locale;
  const { db } = useCMSFirebase();
  const [data, setData] = useState2(null);
  const [loading, setLoading] = useState2(true);
  const [error, setError] = useState2(null);
  useEffect3(() => {
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
export {
  Block,
  Blocks,
  CMSProvider,
  useAuth,
  useCMSContent,
  useCMSFirebase
};
