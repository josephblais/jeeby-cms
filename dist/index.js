"use client";
'use strict';

var react = require('react');
var firestore = require('firebase/firestore');
var app = require('firebase/app');
var auth = require('firebase/auth');
var storage = require('firebase/storage');
var DOMPurifyModule = require('dompurify');
var jsxRuntime = require('react/jsx-runtime');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var DOMPurifyModule__namespace = /*#__PURE__*/_interopNamespace(DOMPurifyModule);

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
  _app = app.getApps().length === 0 ? app.initializeApp(config) : app.getApp();
  _db = firestore.getFirestore(_app);
  _auth = auth.getAuth(_app);
  _storage = storage.getStorage(_app);
  return { app: _app, db: _db, auth: _auth, storage: _storage };
}
async function signIn(auth$1, email, password) {
  const result = await auth.signInWithEmailAndPassword(auth$1, email, password);
  return result.user;
}
async function signOut(auth$1) {
  return auth.signOut(auth$1);
}
function subscribeToAuthState(auth$1, callback) {
  return auth.onAuthStateChanged(auth$1, callback);
}
var VALID_LEVELS = ["h2", "h3", "h4", "h5", "h6"];
var normalizeLevel = (l) => l === "h1" ? "h2" : VALID_LEVELS.includes(l) ? l : "h3";
function Title({ data, className }) {
  const tag = normalizeLevel(data == null ? void 0 : data.level);
  return react.createElement(tag, { className }, data == null ? void 0 : data.text);
}
function Paragraph({ data, className }) {
  return react.createElement("p", { className }, data == null ? void 0 : data.text);
}
var DOMPurify = DOMPurifyModule__namespace.default ?? DOMPurifyModule__namespace;
var DOMPURIFY_CONFIG = {
  // Preserve ARIA attributes so admin-authored HTML stays accessible.
  // Without ADD_ATTR, DOMPurify strips aria-* and role attributes by default.
  ADD_ATTR: ["aria-label", "aria-describedby", "aria-labelledby", "role", "tabindex"]
};
function RichText({ data, className }) {
  const raw = (data == null ? void 0 : data.html) ?? "";
  const clean = typeof (DOMPurify == null ? void 0 : DOMPurify.sanitize) === "function" ? DOMPurify.sanitize(raw, DOMPURIFY_CONFIG) : raw;
  return react.createElement("div", { className, dangerouslySetInnerHTML: { __html: clean } });
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
    return react.createElement(
      "figure",
      { className },
      react.createElement("img", imgProps),
      react.createElement("figcaption", null, data.caption)
    );
  }
  return react.createElement("img", { ...imgProps, className });
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
  const containerRef = react.useRef(null);
  const playerRef = react.useRef(null);
  react.useEffect(() => {
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
  react.useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);
  return react.createElement(
    "div",
    { "data-vjs-player": true },
    react.createElement("div", { ref: containerRef })
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
      return react.createElement(VideoJSPlayer, { url: src, title: titleText });
    }
    return react.createElement("video", {
      src,
      controls: true,
      className,
      style: { width: "100%" },
      "aria-label": titleText
    });
  }
  const embedUrl = toEmbedUrl(src);
  return react.createElement("iframe", {
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
  return react.createElement(
    "ul",
    {
      className: ["jeeby-cms-gallery", className].filter(Boolean).join(" "),
      "aria-label": "Gallery",
      style: { listStyle: "none", padding: 0, margin: 0 }
    },
    ...items.map(
      (item, i) => react.createElement(
        "li",
        { key: item.id ?? i },
        item.caption ? react.createElement(
          "figure",
          null,
          react.createElement("img", { src: item.src, alt: item.alt ?? "", loading: "lazy" }),
          react.createElement("figcaption", null, item.caption)
        ) : react.createElement("img", { src: item.src, alt: item.alt ?? "", loading: "lazy" })
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
  return react.createElement(
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
  return react.createElement(
    "div",
    { className },
    ...data.blocks.map((block, i) => {
      const Component = registry[block.type];
      if (!Component) return null;
      return react.createElement(
        Block,
        { key: block.id ?? i, id: block.id, className: blockClassName },
        react.createElement(Component, { data: block.data })
      );
    })
  );
}
var CMSContext = react.createContext(null);
function CMSProvider({ firebaseConfig, children }) {
  const firebase = react.useMemo(() => initFirebase(firebaseConfig), [firebaseConfig]);
  return /* @__PURE__ */ jsxRuntime.jsx(CMSContext.Provider, { value: firebase, children });
}
function useCMSFirebase() {
  const ctx = react.useContext(CMSContext);
  if (!ctx) throw new Error("useCMSFirebase must be used inside <CMSProvider>");
  return ctx;
}
function useAuth() {
  const { auth } = useCMSFirebase();
  const [user, setUser] = react.useState(void 0);
  const [loading, setLoading] = react.useState(true);
  react.useEffect(() => {
    const unsubscribe = subscribeToAuthState(auth, (u) => {
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
  const [data, setData] = react.useState(null);
  const [loading, setLoading] = react.useState(true);
  const [error, setError] = react.useState(null);
  react.useEffect(() => {
    if (!slug || !db) return;
    setLoading(true);
    const ref = firestore.doc(db, "cms", "pages", slug);
    const unsubscribe = firestore.onSnapshot(
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

exports.Block = Block;
exports.Blocks = Blocks;
exports.CMSProvider = CMSProvider;
exports.useAuth = useAuth;
exports.useCMSContent = useCMSContent;
exports.useCMSFirebase = useCMSFirebase;
