import React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  error?: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  autoComplete?: string;
  /** Optional element rendered to the right of the label (e.g. "Forgot password?") */
  labelRight?: React.ReactNode;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return [
    "w-full px-3.5 py-2.5 rounded-lg border text-sm text-text bg-bg-card",
    "outline-none transition-colors placeholder:text-text-muted",
    hasError
      ? "border-error focus:border-error"
      : "border-border focus:border-border-focus",
  ].join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

function FormField({
  label,
  name,
  type = "text",
  placeholder,
  value,
  error,
  onChange,
  autoComplete,
  labelRight,
}: FormFieldProps) {
  return (
    <div>
      <div
        className={`flex items-center mb-1.5 ${
          labelRight ? "justify-between" : ""
        }`}
      >
        <label htmlFor={name} className="text-sm font-medium text-text">
          {label}
        </label>
        {labelRight}
      </div>

      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className={inputCls(!!error)}
      />

      {error && <p className="text-error text-xs mt-1">{error}</p>}
    </div>
  );
}

export default FormField;
