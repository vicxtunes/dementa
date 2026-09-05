"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "@/lib/quick-solution/actions/auth";

const initialState: AuthState = { error: null, notice: null };

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction, loginPending] = useActionState(signIn, initialState);
  const [signupState, signupAction, signupPending] = useActionState(signUp, initialState);

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex gap-6 border-b border-ink/15">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
              mode === m
                ? "border-flame text-ink"
                : "border-transparent text-ink/50 hover:text-ink/80"
            }`}
          >
            {m === "login" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>

      {mode === "login" ? (
        <form action={loginAction} className="flex flex-col gap-4">
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <Field label="Password" name="password" type="password" autoComplete="current-password" required />
          {loginState.error && <p className="text-sm text-rust">{loginState.error}</p>}
          <SubmitButton pending={loginPending} label="Log in" />
        </form>
      ) : (
        <form action={signupAction} className="flex flex-col gap-4">
          <Field label="Full name" name="fullName" type="text" autoComplete="name" required />
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <Field label="Password" name="password" type="password" autoComplete="new-password" required />

          {signupState.error && <p className="text-sm text-rust">{signupState.error}</p>}
          {signupState.notice && <p className="text-sm text-flame">{signupState.notice}</p>}
          <SubmitButton pending={signupPending} label="Create account" />
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  required,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink/70">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="rounded-none border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink/35 focus:border-flame"
      />
    </label>
  );
}

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 border border-ink bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-flame hover:border-flame disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Please wait…" : label}
    </button>
  );
}
