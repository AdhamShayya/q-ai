import { type } from "arktype";
import React, { useState } from "react";
import { useNavigate } from "react-router";

import { userApi } from "../../trpc";
import Button from "../../components/Button";
import { useToast } from "../../hooks/useToast";
import AuthCard from "../../components/AuthCard";
import FormField from "../../components/FormField";

export const SignUpSchema = type({
  name: "string >= 2",
  email: "string.email",
  password: "string >= 8",
  confirmPassword: "string >= 8",
});

export type SignUpData = typeof SignUpSchema.infer;
type FieldErrors = Partial<Record<keyof SignUpData, string>>;

function SignUpPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [fields, setFields] = useState<SignUpData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof SignUpData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = SignUpSchema(fields);
    if (result instanceof type.errors) {
      const errs: FieldErrors = {};
      for (const err of result) {
        const key = err.path[0] as keyof SignUpData;
        if (key && !errs[key]) errs[key] = err.message;
      }
      setErrors(errs);
      return;
    }

    if (fields.password !== fields.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
      return;
    }

    setLoading(true);
    try {
      await userApi.signUp.mutate({
        name: fields.name,
        email: fields.email,
        password: fields.password,
      });
      toast.success("Account created successfully!");
      navigate("/onboarding");
    } catch (err: any) {
      toast.error(err?.message ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start your intelligent learning journey with Q-Ai"
      footerText="Already have an account?"
      footerLinkLabel="Sign in"
      footerLinkHref="/sign-in"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField
          label="Full name"
          name="name"
          placeholder="Jane Smith"
          value={fields.name}
          error={errors.name}
          onChange={handleChange}
          autoComplete="name"
        />

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
          autoComplete="new-password"
        />

        <FormField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={fields.confirmPassword}
          error={errors.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
        />

        <Button
          type="submit"
          variant="solid"
          size="md"
          fullWidth
          className="mt-1"
          disabled={loading}
        >
          {loading ? "Creating account…" : "Create Account"}
        </Button>
      </form>
    </AuthCard>
  );
}

export default SignUpPage;
