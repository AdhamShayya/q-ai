import React, { useState } from "react";
import SVGIcon from "../../components/SVGIcon";
import { useInView } from "../../hooks/useInView";

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const formSection = useInView();
  const infoSection = useInView();

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In production this would POST to an API endpoint
    setSubmitted(true);
  }

  const inputBase: React.CSSProperties = {
    width: "100%",
    background: "var(--color-bg)",
    border: "1.5px solid var(--color-border)",
    borderRadius: "0.625rem",
    padding: "0.75rem 1rem",
    fontSize: "0.875rem",
    color: "var(--color-text)",
    outline: "none",
    transition: "border-color 0.15s",
  };

  return (
    <div
      className="container flex flex-col w-full items-center py-6 space-y-5"
      style={{ background: "var(--color-bg)" }}
    >
      {/* Page hero */}
      <div className=" text-center overflow-hidden">
        <p
          className="animate-fade-in delay-75 inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6"
          style={{
            background: "rgba(139,158,108,0.12)",
            color: "var(--color-accent-dark)",
          }}
        >
          ✦ Contact Us
        </p>
        <h1
          className="animate-fade-in-up delay-150 font-serif text-4xl md:text-5xl mb-5"
          style={{ color: "var(--color-primary)" }}
        >
          We'd Love to Hear From You
        </h1>
        <p
          className="animate-fade-in-up delay-300 text-lg leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Have a question, feedback, or just want to say hello? Drop us a
          message and we'll get back to you as soon as possible.
        </p>
      </div>

      <div>
        <div className="h-px" style={{ background: "var(--color-border)" }} />
      </div>

      {/* Contact section */}
      <div className="container grid grid-cols-1 md:grid-cols-5 gap-12 max-w-4xl mx-auto items-start">
        {/* Left info column */}
        <div
          ref={infoSection.ref}
          className={`md:col-span-2 flex flex-col gap-8 ${infoSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
        >
          <h2
            className="font-serif text-2xl mb-3"
            style={{ color: "var(--color-primary)" }}
          >
            Get in Touch
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Whether you need support, want to share feedback, or are interested
            in a partnership — we're here.
          </p>
          {[
            { icon: "✉️", label: "Email", value: "hello@q-ai.app" },
            {
              icon: "⏱️",
              label: "Response Time",
              value: "Within 24 hours",
            },
            { icon: "💬", label: "Support", value: "Available Mon – Fri" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
                style={{ background: "var(--color-bg-muted)" }}
              >
                {item.icon}
              </div>
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {item.label}
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text)" }}
                >
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Right form column */}
        <div
          ref={formSection.ref}
          className={`md:col-span-3 ${formSection.inView ? "animate-fade-in-up delay-150" : "opacity-0"}`}
        >
          {submitted === true ? (
            <div
              className="bg-white rounded-2xl p-10 flex flex-col items-center text-center gap-4"
              style={{
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{ background: "rgba(139,158,108,0.12)" }}
              >
                ✓
              </div>
              <h3
                className="font-serif text-xl"
                style={{ color: "var(--color-primary)" }}
              >
                Message Sent!
              </h3>
              <p
                className="text-sm leading-relaxed max-w-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Thanks for reaching out. We'll get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl p-4 flex flex-col gap-3"
              style={{
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-xs font-semibold"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Your name"
                    value={form.name}
                    onChange={handleChange}
                    style={inputBase}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor =
                        "var(--color-border-focus)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor =
                        "var(--color-border)")
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-xs font-semibold"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    style={inputBase}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor =
                        "var(--color-border-focus)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor =
                        "var(--color-border)")
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-xs font-semibold"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Subject
                </label>
                <select
                  name="subject"
                  required
                  value={form.subject}
                  onChange={handleChange}
                  style={{ ...inputBase, cursor: "pointer" }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor =
                      "var(--color-border-focus)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "var(--color-border)")
                  }
                >
                  <option value="">Select a subject…</option>
                  <option value="general">General Question</option>
                  <option value="support">Technical Support</option>
                  <option value="feedback">Feedback</option>
                  <option value="partnership">Partnership</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-xs font-semibold"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Message
                </label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  placeholder="Tell us what's on your mind…"
                  value={form.message}
                  onChange={handleChange}
                  style={{ ...inputBase, resize: "vertical" }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor =
                      "var(--color-border-focus)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "var(--color-border)")
                  }
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 mt-1"
                style={{
                  background: "var(--color-primary)",
                  cursor: "pointer",
                  border: "none",
                }}
              >
                Send Message
                <SVGIcon name="arrow-right" size={16} strokeWidth={2.5} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
