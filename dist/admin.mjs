"use client";
import { useAuth } from 'jeeby-cms';
import { useState } from 'react';
import { jsxs, jsx } from 'react/jsx-runtime';

function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }
  return /* @__PURE__ */ jsx("main", { className: "jeeby-cms-login-page", role: "main", children: /* @__PURE__ */ jsxs("div", { className: "jeeby-cms-login-card", style: {
    maxWidth: "400px",
    minWidth: "320px",
    margin: "0 auto",
    padding: "32px"
  }, children: [
    /* @__PURE__ */ jsx("h1", { className: "jeeby-cms-login-heading", style: { marginBottom: "24px" }, children: "jeeby CMS" }),
    /* @__PURE__ */ jsxs("form", { className: "jeeby-cms-login-form", onSubmit: handleSubmit, noValidate: true, children: [
      /* @__PURE__ */ jsxs("div", { className: "jeeby-cms-field", style: { marginBottom: "16px" }, children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "cms-email", style: { display: "block", marginBottom: "4px" }, children: "Email address" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "cms-email",
            type: "email",
            autoComplete: "email",
            required: true,
            value: email,
            onChange: (e) => setEmail(e.target.value),
            style: { display: "block", width: "100%", padding: "8px 16px", boxSizing: "border-box" }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "jeeby-cms-field", style: { marginBottom: "16px" }, children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "cms-password", style: { display: "block", marginBottom: "4px" }, children: "Password" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "cms-password",
            type: "password",
            autoComplete: "current-password",
            required: true,
            value: password,
            onChange: (e) => setPassword(e.target.value),
            style: { display: "block", width: "100%", padding: "8px 16px", boxSizing: "border-box" }
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: "jeeby-cms-btn-primary",
          disabled: submitting,
          "aria-busy": submitting ? "true" : void 0,
          style: {
            display: "block",
            width: "100%",
            minHeight: "44px",
            padding: "8px 16px",
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.6 : 1
          },
          children: submitting ? "Signing in\u2026" : "Sign in"
        }
      ),
      error && /* @__PURE__ */ jsx("p", { className: "jeeby-cms-auth-error", role: "alert", "aria-live": "assertive", style: { marginTop: "12px" }, children: error })
    ] })
  ] }) });
}
function AdminNav({ onSignOut }) {
  return /* @__PURE__ */ jsxs("header", { className: "jeeby-cms-nav", role: "banner", style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "56px",
    padding: "0 24px",
    borderBottom: "1px solid #E5E7EB"
  }, children: [
    /* @__PURE__ */ jsx("span", { className: "jeeby-cms-nav-brand", style: { fontWeight: 600 }, children: "jeeby CMS" }),
    /* @__PURE__ */ jsx("nav", { "aria-label": "Admin navigation", children: /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        className: "jeeby-cms-btn-ghost",
        onClick: onSignOut,
        style: {
          background: "none",
          border: "none",
          padding: "8px 16px",
          cursor: "pointer",
          minHeight: "44px",
          borderRadius: "4px"
        },
        children: "Sign out"
      }
    ) })
  ] });
}
function AdminPanel({ children }) {
  const { user, loading, signOut } = useAuth();
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "jeeby-cms-admin", style: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }, children: [
      /* @__PURE__ */ jsx("div", { className: "jeeby-cms-loading", role: "status", "aria-label": "Loading admin panel", children: /* @__PURE__ */ jsx("div", { className: "jeeby-cms-spinner", "aria-hidden": "true", style: {
        display: "inline-block",
        width: "32px",
        height: "32px",
        border: "3px solid #2563EB",
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "jeeby-spin 0.75s linear infinite"
      } }) }),
      /* @__PURE__ */ jsx("style", { children: `@keyframes jeeby-spin { to { transform: rotate(360deg) } }` })
    ] });
  }
  if (!user) {
    return /* @__PURE__ */ jsx("div", { className: "jeeby-cms-admin", style: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }, children: /* @__PURE__ */ jsx(LoginPage, {}) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "jeeby-cms-admin", style: { minHeight: "100vh" }, children: [
    /* @__PURE__ */ jsx("a", { href: "#main-content", className: "jeeby-cms-skip-link", style: {
      position: "absolute",
      left: "-9999px",
      top: "0",
      padding: "8px 16px",
      background: "#2563EB",
      color: "#fff",
      zIndex: 1e3,
      fontSize: "14px"
    }, children: "Skip to main content" }),
    /* @__PURE__ */ jsx(AdminNav, { onSignOut: signOut }),
    /* @__PURE__ */ jsx("main", { className: "jeeby-cms-shell-content", id: "main-content", role: "main", tabIndex: -1, children })
  ] });
}

export { AdminPanel };
