"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, signUp, type AuthState } from "@/lib/actions/auth";

const initialState: AuthState = { error: null, notice: null };

export function AuthForm() {
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(
    params.get("mode") === "signup" ? "signup" : "login"
  );
  const [showPw, setShowPw] = useState(false);
  const [loginState, loginAction, loginPending] = useActionState(signIn, initialState);
  const [signupState, signupAction, signupPending] = useActionState(signUp, initialState);

  const isSignup = mode === "signup";
  const state = isSignup ? signupState : loginState;
  const pending = isSignup ? signupPending : loginPending;

  return (
    <div className="login-card">
      <span className="login-brand">
        <i className="bi bi-asterisk" />
        Dementa
      </span>
      <h1 className="login-title">{isSignup ? "Create your account" : "Welcome back"}</h1>
      <p className="login-subtitle">
        {isSignup
          ? "Sign up to start the 8-day sprint. Everyone joins the single class S.4 General."
          : "Log in to pick up your revision where you left off."}
      </p>

      <form action={isSignup ? signupAction : loginAction}>
        {isSignup && (
          <div className="login-form-group">
            <label className="login-form-label" htmlFor="fullName">
              Full name
            </label>
            <div className="login-input-group">
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                className="login-input"
                placeholder="Ada Lovelace"
              />
              <i className="bi bi-person input-icon" />
            </div>
          </div>
        )}

        {isSignup && (
          <div className="login-form-group">
            <label className="login-form-label" htmlFor="classCode">
              Class code <span style={{ opacity: 0.6, fontWeight: 500 }}>(optional)</span>
            </label>
            <div className="login-input-group">
              <input
                id="classCode"
                name="classCode"
                type="text"
                className="login-input"
                placeholder="S.4 General"
              />
              <i className="bi bi-people input-icon" />
            </div>
          </div>
        )}

        <div className="login-form-group">
          <label className="login-form-label" htmlFor="email">
            Email
          </label>
          <div className="login-input-group">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="login-input"
              placeholder="you@example.com"
            />
            <i className="bi bi-envelope input-icon" />
          </div>
        </div>

        <div className="login-form-group">
          <label className="login-form-label" htmlFor="password">
            Password
          </label>
          <div className="login-input-group">
            <input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              className="login-input login-input-password"
              placeholder="••••••••"
            />
            <i className="bi bi-lock input-icon" />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              <i className={`bi ${showPw ? "bi-eye-slash" : "bi-eye"}`} />
            </button>
          </div>
        </div>

        {!isSignup && (
          <div className="login-options">
            <label className="custom-control-label">
              <input type="checkbox" className="custom-checkbox-input" name="remember" defaultChecked />
              Remember me
            </label>
          </div>
        )}

        {state.error && (
          <div className="alert-custom alert-custom-danger d-block mb-3">{state.error}</div>
        )}
        {state.notice && (
          <div className="alert-custom alert-custom-success d-block mb-3">{state.notice}</div>
        )}

        <button type="submit" className="btn-login" disabled={pending}>
          {pending ? "Please wait…" : isSignup ? "Create account" : "Log in"}
          <i className="bi bi-arrow-right" />
        </button>
      </form>

      <div className="login-divider">or</div>

      <div className="social-login-grid">
        <button type="button" className="btn-social" disabled aria-disabled="true">
          <i className="bi bi-google" /> Google
        </button>
        <button type="button" className="btn-social" disabled aria-disabled="true">
          <i className="bi bi-microsoft" /> Microsoft
        </button>
      </div>

      <p className="login-footer-text">
        {isSignup ? "Already have an account? " : "New here? "}
        <a
          href={isSignup ? "?mode=login" : "?mode=signup"}
          onClick={(e) => {
            e.preventDefault();
            setMode(isSignup ? "login" : "signup");
          }}
        >
          {isSignup ? "Log in" : "Create an account"}
        </a>
      </p>
    </div>
  );
}
