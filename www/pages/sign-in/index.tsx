import React, { useState } from "react";
import { Link } from "react-router";
import { type } from "arktype";
import AuthCard from "../../components/AuthCard";
import FormField from "../../components/FormField";
import Button from "../../components/Button";

// ── Types ─────────────────────────────────────────────────────────────────────

type FieldErrors = Partial<Record<keyof SignInData, string>>;

export const SignInSchema = type({
  email: "string.email",
  password: "string >= 8",
});
export type SignInData = typeof SignInSchema.infer;

// ── Component ─────────────────────────────────────────────────────────────────

function SignInPage() {
  const [fields, setFields] = useState<SignInData>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof SignInData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = SignInSchema(fields);
    if (result instanceof type.errors) {
      const errs: FieldErrors = {};
      for (const err of result) {
        const key = err.path[0] as keyof SignInData;
        if (key && !errs[key]) errs[key] = err.message;
      }
      setErrors(errs);
      return;
    }

    // TODO: implement sign-in action
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue your learning journey"
      footerText="Don't have an account?"
      footerLinkLabel="Create one"
      footerLinkHref="/sign-up"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField
          label="Email address"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={fields.email}
          error={errors.email}
          onChange={handleChange}
          autoComplete="email"
        />

        <FormField
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={fields.password}
          error={errors.password}
          onChange={handleChange}
          autoComplete="current-password"
          labelRight={
            <Link
              to="/forgot-password"
              className="text-xs text-accent hover:text-accent-dark transition-colors"
              style={{ textDecoration: "none" }}
            >
              Forgot password?
            </Link>
          }
        />

        <Button
          type="submit"
          variant="solid"
          size="md"
          fullWidth
          className="mt-1"
        >
          Sign In
        </Button>
      </form>
    </AuthCard>
  );
}

export default SignInPage;
