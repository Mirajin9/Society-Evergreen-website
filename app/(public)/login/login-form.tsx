"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { PubLogo, Icon } from "@/app/components/ui";
import { requestOtp, verifyOtp } from "@/app/lib/local-store";

type Step = "phone" | "otp";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get("next") || "/member/dashboard";

  const [step, setStep] = useState<Step>("phone");
  const [mobile, setMobile] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const digitRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setError("");
    const cleaned = mobile.replace(/\D/g, "");
    if (cleaned.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    try {
      await requestOtp(cleaned);
      setStep("otp");
      setCountdown(30);
      setTimeout(() => digitRefs.current[0]?.focus(), 80);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === "NOT_REGISTERED") {
        setError("This mobile number is not registered with the society. Please contact the office/admin.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError("");
    const otp = digits.join("");
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const session = await verifyOtp(mobile.replace(/\D/g, ""), otp);
      router.push(session.activeRole === "admin" ? "/admin/database" : nextUrl);
      router.refresh();
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === "INVALID_OTP") {
        setError("Invalid OTP. Please try again.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    setError("");
    setDigits(["", "", "", "", "", ""]);
    setLoading(true);
    try {
      await requestOtp(mobile.replace(/\D/g, ""));
      setCountdown(30);
      digitRefs.current[0]?.focus();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleDigitChange(idx: number, val: string) {
    const char = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = char;
    setDigits(next);
    if (char && idx < 5) {
      digitRefs.current[idx + 1]?.focus();
    }
    // Auto-submit when all 6 digits entered
    if (char && idx === 5 && next.every((d) => d !== "")) {
      // Small delay to show the last digit
      setTimeout(() => {
        const form = digitRefs.current[0]?.closest("form");
        form?.requestSubmit();
      }, 80);
    }
  }

  function handleDigitKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      digitRefs.current[idx - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      e.preventDefault();
      const next = [...digits];
      pasted.split("").forEach((c, i) => { if (i < 6) next[i] = c; });
      setDigits(next);
      const focusIdx = Math.min(pasted.length, 5);
      digitRefs.current[focusIdx]?.focus();
    }
  }

  return (
    <div className="otp-shell">
      {/* Left art panel */}
      <div className="otp-art">
        <Link href="/" style={{ position: "absolute", top: 40, left: 40 }}>
          <PubLogo />
        </Link>
        <h2>Member<br /><em>Portal</em></h2>
        <p>
          Log in with your registered mobile number to access society documents,
          notices, your account summary, and more.
        </p>
      </div>

      {/* Right form */}
      <div className="otp-form-wrap">
        {step === "phone" ? (
          <form className="otp-form" onSubmit={handleSendOtp}>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--saffron)", fontWeight: 600, marginBottom: 12 }}>
              Evergreen Apartments
            </div>
            <h1>Member Login</h1>
            <p className="otp-sub">
              Enter your registered 10-digit mobile number. We'll send a one-time password to verify your identity.
            </p>

            {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

            <div style={{ marginBottom: 20 }}>
              <label className="fl">Registered mobile number</label>
              <div className="otp-input-row">
                <input
                  className="field field-lg"
                  type="tel"
                  maxLength={10}
                  placeholder="e.g. 9999999999"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  required
                  autoComplete="tel"
                  inputMode="numeric"
                  style={{ letterSpacing: "0.06em", fontFamily: "var(--font-mono)" }}
                />
              </div>
            </div>

            <button
              className="otp-verify-btn"
              type="submit"
              disabled={loading || mobile.replace(/\D/g, "").length !== 10}
            >
              {loading ? "Checking..." : "Send OTP"}
            </button>

            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 16, lineHeight: 1.6 }}>
              Only mobile numbers registered with the society can log in.
              If your number is not registered, contact the society office.
            </p>

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)", fontSize: 13 }}>
              <Link href="/" style={{ color: "var(--navy)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="arr_l" size={13} color="var(--navy)" /> Back to public site
              </Link>
            </div>
          </form>
        ) : (
          <form className="otp-form" onSubmit={handleVerify}>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--saffron)", fontWeight: 600, marginBottom: 12 }}>
              Evergreen Apartments
            </div>
            <h1>Enter OTP</h1>
            <p className="otp-sub">
              A 6-digit OTP has been sent to <strong style={{ color: "var(--navy)" }}>+91 {mobile}</strong>.
              {" "}Enter it below to sign in.
            </p>

            {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

            <label className="fl">6-digit OTP</label>
            <div className="otp-digits" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { digitRefs.current[i] = el; }}
                  className="otp-digit"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            <div className="otp-resend">
              {countdown > 0 ? (
                <span>Resend OTP in {countdown}s</span>
              ) : (
                <span>
                  Didn't receive it?{" "}
                  <button type="button" onClick={handleResend} disabled={loading}>
                    Resend OTP
                  </button>
                </span>
              )}
            </div>

            <button
              className="otp-verify-btn"
              type="submit"
              disabled={loading || digits.some((d) => d === "")}
            >
              {loading ? "Verifying..." : "Verify & Sign In"}
            </button>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)", fontSize: 13 }}>
              <button
                type="button"
                onClick={() => { setStep("phone"); setError(""); setDigits(["", "", "", "", "", ""]); }}
                style={{ background: "none", border: "none", color: "var(--navy)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, padding: 0 }}
              >
                <Icon name="arr_l" size={13} color="var(--navy)" /> Change mobile number
              </button>
            </div>

            <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.6, background: "var(--saffron-light)", padding: "8px 12px", borderRadius: 6 }}>
              Dev mode: OTP is always <strong>123456</strong>. Check browser console for the log.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
