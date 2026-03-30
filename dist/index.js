"use client";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.js
var src_exports = {};
__export(src_exports, {
  Block: () => Block,
  Blocks: () => Blocks,
  CMSProvider: () => CMSProvider,
  useAuth: () => useAuth,
  useCMSContent: () => useCMSContent,
  useCMSFirebase: () => useCMSFirebase
});
module.exports = __toCommonJS(src_exports);
var import_react10 = require("react");
var import_firestore2 = require("firebase/firestore");

// src/firebase/init.js
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
var import_auth = require("firebase/auth");
var import_storage = require("firebase/storage");
var _app;
var _db;
var _auth;
var _storage;
function initFirebase(config) {
  _app = (0, import_app.getApps)().length === 0 ? (0, import_app.initializeApp)(config) : (0, import_app.getApp)();
  _db = (0, import_firestore.getFirestore)(_app);
  _auth = (0, import_auth.getAuth)(_app);
  _storage = (0, import_storage.getStorage)(_app);
  return { app: _app, db: _db, auth: _auth, storage: _storage };
}

// src/firebase/auth.js
var import_auth2 = require("firebase/auth");
async function signIn(auth, email, password) {
  const result = await (0, import_auth2.signInWithEmailAndPassword)(auth, email, password);
  return result.user;
}
async function signOut(auth) {
  return (0, import_auth2.signOut)(auth);
}
function subscribeToAuthState(auth, callback) {
  return (0, import_auth2.onAuthStateChanged)(auth, callback);
}

// src/blocks/index.js
var import_react9 = require("react");

// src/blocks/Title.js
var import_react = require("react");
var VALID_LEVELS = ["h2", "h3", "h4", "h5", "h6"];
var normalizeLevel = (l) => l === "h1" ? "h2" : VALID_LEVELS.includes(l) ? l : "h3";
function Title({ data, className }) {
  const tag = normalizeLevel(data == null ? void 0 : data.level);
  return (0, import_react.createElement)(tag, { className }, data == null ? void 0 : data.text);
}

// src/blocks/Paragraph.js
var import_react2 = require("react");
function Paragraph({ data, className }) {
  return (0, import_react2.createElement)("p", { className }, data == null ? void 0 : data.text);
}

// src/blocks/RichText.js
var import_react3 = require("react");
var DOMPurifyModule = __toESM(require("dompurify"));
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
  const [clean, setClean] = (0, import_react3.useState)(() => stripDangerous(raw));
  (0, import_react3.useEffect)(() => {
    if (typeof (DOMPurify == null ? void 0 : DOMPurify.sanitize) === "function") {
      setClean(DOMPurify.sanitize(raw, DOMPURIFY_CONFIG));
    }
  }, [raw]);
  return (0, import_react3.createElement)("div", { className, dangerouslySetInnerHTML: { __html: clean } });
}

// src/blocks/Image.js
var import_react4 = require("react");
function Image({ data, className }) {
  if (!(data == null ? void 0 : data.src)) return null;
  const imgProps = {
    src: data.src,
    alt: (data == null ? void 0 : data.alt) ?? "",
    // empty string = decorative; never undefined/missing
    width: data == null ? void 0 : data.width,
    height: data == null ? void 0 : data.height
  };
  if (data == null ? void 0 : data.caption) {
    return (0, import_react4.createElement)(
      "figure",
      { className },
      (0, import_react4.createElement)("img", imgProps),
      (0, import_react4.createElement)("figcaption", null, data.caption)
    );
  }
  return (0, import_react4.createElement)("img", { ...imgProps, className });
}

// src/blocks/Video.js
var import_react5 = require("react");
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
  const containerRef = (0, import_react5.useRef)(null);
  const playerRef = (0, import_react5.useRef)(null);
  (0, import_react5.useEffect)(() => {
    if (!playerRef.current && containerRef.current) {
      let videojs;
      try {
        videojs = require("video.js").default;
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
  (0, import_react5.useEffect)(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);
  return (0, import_react5.createElement)(
    "div",
    { "data-vjs-player": true },
    (0, import_react5.createElement)("div", { ref: containerRef })
  );
}
function Video({ data, className }) {
  const src = (data == null ? void 0 : data.url) ?? (data == null ? void 0 : data.src);
  const titleText = (data == null ? void 0 : data.title) || "Embedded video";
  if (!src) return null;
  if (isStorageUrl(src)) {
    let videojsAvailable = false;
    try {
      require("video.js");
      videojsAvailable = true;
    } catch {
      if (typeof window !== "undefined") {
        console.warn(
          "[jeeby-cms] <Video> with Firebase Storage URLs works best with video.js installed. Run: npm install video.js"
        );
      }
    }
    if (videojsAvailable && typeof window !== "undefined") {
      return (0, import_react5.createElement)(VideoJSPlayer, { url: src, title: titleText });
    }
    return (0, import_react5.createElement)("video", {
      src,
      controls: true,
      className,
      style: { width: "100%" },
      "aria-label": titleText
    });
  }
  const embedUrl = toEmbedUrl(src);
  return (0, import_react5.createElement)("iframe", {
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
var import_react6 = require("react");
function Gallery({ data, className }) {
  const items = (data == null ? void 0 : data.items) ?? [];
  return (0, import_react6.createElement)(
    "ul",
    {
      className: ["jeeby-cms-gallery", className].filter(Boolean).join(" "),
      "aria-label": "Gallery",
      style: { listStyle: "none", padding: 0, margin: 0 }
    },
    ...items.map(
      (item, i) => (0, import_react6.createElement)(
        "li",
        { key: item.id ?? i },
        item.caption ? (0, import_react6.createElement)(
          "figure",
          null,
          (0, import_react6.createElement)("img", { src: item.src, alt: item.alt ?? "", loading: "lazy" }),
          (0, import_react6.createElement)("figcaption", null, item.caption)
        ) : (0, import_react6.createElement)("img", { src: item.src, alt: item.alt ?? "", loading: "lazy" })
      )
    )
  );
}

// src/blocks/List.js
var import_react7 = require("react");
function List({ data, className }) {
  const items = (data == null ? void 0 : data.items) ?? [];
  if (!items.length) return null;
  const tag = (data == null ? void 0 : data.ordered) ? "ol" : "ul";
  return (0, import_react7.createElement)(
    tag,
    { className },
    ...items.map((item, i) => (0, import_react7.createElement)("li", { key: i }, item))
  );
}

// src/blocks/PullQuote.js
var import_react8 = require("react");
function PullQuote({ data, className }) {
  const quote = (data == null ? void 0 : data.quote) ?? "";
  const attribution = (data == null ? void 0 : data.attribution) ?? "";
  if (!quote) return null;
  return (0, import_react8.createElement)(
    "figure",
    { className },
    (0, import_react8.createElement)("blockquote", null, (0, import_react8.createElement)("p", null, quote)),
    attribution ? (0, import_react8.createElement)("figcaption", null, attribution) : null
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
  return (0, import_react9.createElement)(
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
  return (0, import_react9.createElement)(
    "div",
    { className },
    ...data.blocks.map((block, i) => {
      const Component = registry[block.type];
      if (!Component) return null;
      return (0, import_react9.createElement)(
        Block,
        { key: block.id ?? i, id: block.id, className: blockClassName },
        (0, import_react9.createElement)(Component, { data: block.data })
      );
    })
  );
}

// src/index.js
var import_jsx_runtime = require("react/jsx-runtime");
var CMSContext = (0, import_react10.createContext)(null);
function CMSProvider({ firebaseConfig, templates = [], children }) {
  const firebase = (0, import_react10.useMemo)(() => initFirebase(firebaseConfig), [firebaseConfig]);
  const value = (0, import_react10.useMemo)(() => ({ ...firebase, templates }), [firebase, templates]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CMSContext.Provider, { value, children });
}
function useCMSFirebase() {
  const ctx = (0, import_react10.useContext)(CMSContext);
  if (!ctx) throw new Error("useCMSFirebase must be used inside <CMSProvider>");
  return ctx;
}
function useAuth() {
  const { auth } = useCMSFirebase();
  const [user, setUser] = (0, import_react10.useState)(void 0);
  const [loading, setLoading] = (0, import_react10.useState)(true);
  (0, import_react10.useEffect)(() => {
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
  const [data, setData] = (0, import_react10.useState)(null);
  const [loading, setLoading] = (0, import_react10.useState)(true);
  const [error, setError] = (0, import_react10.useState)(null);
  (0, import_react10.useEffect)(() => {
    if (!slug || !db) return;
    setLoading(true);
    const ref = (0, import_firestore2.doc)(db, "pages", slug);
    const unsubscribe = (0, import_firestore2.onSnapshot)(
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Block,
  Blocks,
  CMSProvider,
  useAuth,
  useCMSContent,
  useCMSFirebase
});
