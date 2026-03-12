import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { type } from "arktype";

import { userApi } from "../../trpc";
import Button from "../../components/Button";
import { useToast } from "../../hooks/useToast";
import AuthCard from "../../components/AuthCard";
import FormField from "../../components/FormField";

type FieldErrors = Partial<Record<keyof SignInData, string>>;

export const SignInSchema = type({
  email: "string.email",
  password: "string >= 8",
});
export type SignInData = typeof SignInSchema.infer;

// ── Component ─────────────────────────────────────────────────────────────────
function SignInPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [fields, setFields] = useState<SignInData>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof SignInData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
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

    setLoading(true);
    try {
      await userApi.signIn.mutate(fields);
      toast.success("Signed in successfully!");
      navigate("/");
    } catch (err: any) {
      toast.error(err?.message ?? "Sign in failed");
    } finally {
      setLoading(false);
    }
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
        />

        <Button
          type="submit"
          variant="solid"
          size="md"
          fullWidth
          className="mt-1"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign In"}
        </Button>
      </form>
    </AuthCard>
  );
}

export default SignInPage;
