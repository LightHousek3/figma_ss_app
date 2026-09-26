import { useEffect, useRef, useState } from "react"
import { useNav } from "../app/store"
import {
  actionGradient,
  Field,
  Icons,
  inputClass,
  PrimaryButton,
} from "../app/ui"
import logo from "../imports/logo.png"
import type { AppAccountRole } from "../app/data"

type Step = "login" | "activate" | "verify" | "complete" | "forgot" | "forgot-verify" | "forgot-newpw"

// Demo OTP & credentials — verified server-side in production against
// email_verification_challenges (10-min expiry, failed_attempts ≤ 5).
const DEMO_OTP = "123456"
const RESEND_SECONDS = 60 // rate-limit: resend_available_at = NOW + 60s
const MAX_ATTEMPTS = 5 // challenge invalidated at failed_attempts = 5
const MIN_PW_LENGTH = 6 // BR-AUTH: minimum password length

export default function Auth() {
  const [step, setStep] = useState<Step>("login")
  const [email, setEmail] = useState("technician@smartshrimp.vn")
  // Shared resend gate persists across activate→verify and forgot→forgot-verify
  const [resendLeft, setResendLeft] = useState(0)

  useEffect(() => {
    if (resendLeft <= 0) return
    const t = window.setInterval(
      () => setResendLeft((n) => (n <= 1 ? 0 : n - 1)),
      1000,
    )
    return () => window.clearInterval(t)
  }, [resendLeft])

  const startChallenge = () => setResendLeft(RESEND_SECONDS)

  return (
    <div className="scroll-clean flex h-full flex-col overflow-y-auto px-6 py-8">
      <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col">
        {step === "login" && (
          <LoginStep
            email={email}
            setEmail={setEmail}
            onActivate={() => setStep("activate")}
            onForgot={() => setStep("forgot")}
          />
        )}
        {step === "activate" && (
          <ActivateStep
            email={email}
            setEmail={setEmail}
            resendLeft={resendLeft}
            onSend={() => {
              startChallenge()
              setStep("verify")
            }}
            onBack={() => setStep("login")}
          />
        )}
        {step === "verify" && (
          <VerifyStep
            email={email}
            resendLeft={resendLeft}
            onResend={startChallenge}
            onVerified={() => setStep("complete")}
            onBack={() => setStep("activate")}
          />
        )}
        {step === "complete" && (
          <CompleteStep email={email} onDone={() => setStep("login")} />
        )}

        {/* ── Forgot Password flow ─────────────────────────────────────── */}
        {step === "forgot" && (
          <ForgotStep
            email={email}
            setEmail={setEmail}
            resendLeft={resendLeft}
            onSend={() => {
              startChallenge()
              setStep("forgot-verify")
            }}
            onBack={() => setStep("login")}
          />
        )}
        {step === "forgot-verify" && (
          <ForgotVerifyStep
            email={email}
            resendLeft={resendLeft}
            onResend={startChallenge}
            onVerified={() => setStep("forgot-newpw")}
            onBack={() => setStep("forgot")}
          />
        )}
        {step === "forgot-newpw" && (
          <ForgotNewPwStep
            onDone={() => setStep("login")}
            onBack={() => setStep("forgot-verify")}
          />
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ shell */
function Brand({ tagline }: { tagline: string }) {
  return (
    <div className="mb-6 flex flex-col items-center text-center">
      <img
        src={logo}
        alt="SmartShrimp"
        className="h-48 w-auto object-contain"
      />
      <p className="mt-1 max-w-[260px] text-[12.5px] font-medium text-ink-soft">
        {tagline}
      </p>
    </div>
  )
}

function StepHeader({
  title,
  desc,
  onBack,
}: {
  title: string
  desc: string
  onBack: () => void
}) {
  return (
    <div className="mb-5">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/70 py-1.5 pl-2 pr-3 text-[12px] font-semibold text-ink-soft transition active:scale-95"
      >
        <Icons.back size={16} /> Quay lại
      </button>
      <h1 className="font-display text-[22px] font-extrabold tracking-tight text-ink">
        {title}
      </h1>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{desc}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ login */
function LoginStep({
  email,
  setEmail,
  onActivate,
  onForgot,
}: {
  email: string
  setEmail: (v: string) => void
  onActivate: () => void
  onForgot: () => void
}) {
  const nav = useNav()
  const [showPw, setShowPw] = useState(false)
  const [password, setPassword] = useState("password")
  const [error, setError] = useState("")
  const accounts: { role: AppAccountRole; label: string; email: string }[] = [
    { role: "farm_owner", label: "Chủ trại", email: "owner@smartshrimp.vn" },
    { role: "technician", label: "KTV", email: "technician@smartshrimp.vn" },
  ]
  const normalizedEmail = email.trim().toLowerCase()
  const selectedAccount = accounts.find((account) => account.email === normalizedEmail)
  const submit = () => {
    if (!selectedAccount) {
      setError("Vui lòng dùng tài khoản Chủ trại hoặc KTV được cung cấp.")
      return
    }
    if (!password) {
      setError("Vui lòng nhập mật khẩu.")
      return
    }
    setError("")
    nav.login(selectedAccount.role)
  }
  return (
    <div className="flex flex-1 flex-col justify-center">
      <Brand tagline="Nền tảng vận hành & tư vấn kỹ thuật nuôi tôm thông minh" />
      <div className="card space-y-4 p-5">
        <div className="font-display text-[16px] font-bold text-ink">
          Đăng nhập
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          {accounts.map((account) => {
            const active = account.email === normalizedEmail
            return (
              <button
                key={account.role}
                type="button"
                onClick={() => {
                  setEmail(account.email)
                  setError("")
                }}
                className={`min-w-0 rounded-xl px-2 py-2.5 text-[12px] font-bold transition ${
                  active
                    ? "bg-white text-ocean-700 shadow-sm"
                    : "text-ink-muted active:bg-white/60"
                }`}
              >
                {account.label}
              </button>
            )
          })}
        </div>
        <Field label="Email" error={error && !selectedAccount ? error : undefined}>
          <input
            className={`${inputClass} font-sans`}
            placeholder="ban@trangtrai.vn"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError("") }}
          />
        </Field>
        <Field label="Mật khẩu" error={error && !password ? error : undefined}>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              className={`${inputClass} font-sans pr-10`}
              placeholder="••••••••"
              value={password}
              onChange={(event) => { setPassword(event.target.value); setError("") }}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted transition active:scale-90"
              tabIndex={-1}
              aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPw ? <Icons.eyeOff size={17} /> : <Icons.eye size={17} />}
            </button>
          </div>
        </Field>
        <PrimaryButton full icon={Icons.check} onClick={submit}>
          Đăng nhập
        </PrimaryButton>
        <div className="flex items-center justify-between pt-0.5">
          <button
            onClick={onActivate}
            className="text-[12.5px] font-bold text-ocean-600"
          >
            Kích hoạt tài khoản
          </button>
          <button
            onClick={onForgot}
            className="text-[12.5px] font-semibold text-ink-soft"
          >
            Quên mật khẩu?
          </button>
        </div>
      </div>
      <p className="mt-6 text-center text-[11px] leading-relaxed text-ink-muted">
        Dành cho Kỹ thuật viên & Chủ trang trại.
      </p>
    </div>
  )
}

/* --------------------------------------------------------------- activate */
function ActivateStep({
  email,
  setEmail,
  resendLeft,
  onSend,
  onBack,
}: {
  email: string
  setEmail: (v: string) => void
  resendLeft: number
  onSend: () => void
  onBack: () => void
}) {
  const nav = useNav()
  const valid = /\S+@\S+\.\S+/.test(email)
  const blocked = resendLeft > 0

  const submit = () => {
    if (!valid) return nav.toast("Vui lòng nhập email hợp lệ.")
    if (blocked)
      return nav.toast(`Vui lòng chờ ${resendLeft}s trước khi gửi lại mã.`)
    nav.toast("Đã gửi mã kích hoạt 6 số tới email của bạn.")
    onSend()
  }

  return (
    <div className="py-2">
      <StepHeader
        title="Kích hoạt tài khoản"
        desc="Nhập email đã được quản trị viên cấp. Chúng tôi sẽ gửi mã xác thực gồm 6 chữ số tới hộp thư của bạn."
        onBack={onBack}
      />
      <div className="card space-y-4 p-5">
        <Field label="Email tài khoản">
          <input
            className={`${inputClass} font-sans`}
            placeholder="ban@trangtrai.vn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </Field>
        <PrimaryButton full icon={Icons.send} onClick={submit}>
          {blocked ? `Gửi lại sau ${resendLeft}s` : "Gửi mã kích hoạt"}
        </PrimaryButton>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- verify */
function VerifyStep({
  email,
  resendLeft,
  onResend,
  onVerified,
  onBack,
}: {
  email: string
  resendLeft: number
  onResend: () => void
  onVerified: () => void
  onBack: () => void
}) {
  const nav = useNav()
  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length: 6 }, () => String(Math.floor(Math.random() * 10))),
  )
  const [attempts, setAttempts] = useState(0)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const invalidated = attempts >= MAX_ATTEMPTS
  const code = digits.join("")

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1)
    setDigits((arr) => {
      const next = [...arr]
      next[i] = d
      return next
    })
    if (d && i < 5) refs.current[i + 1]?.focus()
  }
  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0)
      refs.current[i - 1]?.focus()
  }
  const verify = () => {
    if (invalidated)
      return nav.toast("Mã đã bị vô hiệu hóa. Vui lòng gửi lại mã mới.")
    if (code.length < 6) return nav.toast("Vui lòng nhập đủ 6 chữ số.")
    nav.toast("Xác thực email thành công.")
    onVerified()
  }
  const resend = () => {
    if (resendLeft > 0) return
    setAttempts(0)
    setDigits(["", "", "", "", "", ""])
    onResend()
    refs.current[0]?.focus()
    nav.toast("Đã gửi mã xác thực mới tới email của bạn.")
  }

  return (
    <div className="py-2">
      <StepHeader
        title="Xác thực email"
        desc={`Nhập mã 6 chữ số vừa được gửi tới ${email || "email của bạn"}.`}
        onBack={onBack}
      />
      <OtpCard
        digits={digits}
        refs={refs}
        invalidated={invalidated}
        attempts={attempts}
        setDigit={setDigit}
        onKey={onKey}
        verify={verify}
        resendLeft={resendLeft}
        resend={resend}
        ctaLabel="Xác nhận mã"
      />
    </div>
  )
}

/* --------------------------------------------------------------- complete */
function CompleteStep({ email, onDone }: { email: string; onDone: () => void }) {
  const nav = useNav()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")

  const submit = () => {
    if (!name.trim()) return nav.toast("Vui lòng nhập họ tên.")
    if (pw.length < MIN_PW_LENGTH)
      return nav.toast(`Mật khẩu cần tối thiểu ${MIN_PW_LENGTH} ký tự.`)
    if (pw !== pw2) return nav.toast("Mật khẩu nhập lại không khớp.")
    nav.toast("Kích hoạt thành công! Vui lòng đăng nhập.")
    onDone()
  }

  return (
    <div className="py-2">
      <div className="mb-5">
        <div className="mb-3 inline-flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-500">
          <Icons.check size={22} />
        </div>
        <h1 className="font-display text-[22px] font-extrabold tracking-tight text-ink">
          Hoàn tất hồ sơ
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
          Email{" "}
          <span className="font-semibold text-ink">{email || "của bạn"}</span>{" "}
          đã xác thực. Bổ sung thông tin và đặt mật khẩu để hoàn tất.
        </p>
      </div>
      <div className="card space-y-4 p-5">
        <Field label="Họ và tên">
          <input
            className={`${inputClass} font-sans`}
            placeholder="VD: Trần Quốc Bảo"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Số điện thoại">
          <input
            className={`${inputClass} font-sans`}
            inputMode="tel"
            placeholder="09xx xxx xxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        <Field label="Mật khẩu" hint={`Tối thiểu ${MIN_PW_LENGTH} ký tự.`}>
          <input
            type="password"
            className={`${inputClass} font-sans`}
            placeholder="••••••••"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
        </Field>
        <Field label="Nhập lại mật khẩu">
          <input
            type="password"
            className={`${inputClass} font-sans`}
            placeholder="••••••••"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
          />
        </Field>
        <PrimaryButton full icon={Icons.check} onClick={submit}>
          Hoàn tất & kích hoạt
        </PrimaryButton>
      </div>
    </div>
  )
}

/* ============================================================= FORGOT PW */

/* Step 1 — enter email + rate limiting */
function ForgotStep({
  email,
  setEmail,
  resendLeft,
  onSend,
  onBack,
}: {
  email: string
  setEmail: (v: string) => void
  resendLeft: number
  onSend: () => void
  onBack: () => void
}) {
  const nav = useNav()
  const valid = /\S+@\S+\.\S+/.test(email)
  const blocked = resendLeft > 0

  const submit = () => {
    if (!valid) return nav.toast("Vui lòng nhập địa chỉ email hợp lệ.")
    if (blocked)
      return nav.toast(`Vui lòng chờ ${resendLeft}s trước khi gửi lại.`)
    nav.toast("Đã gửi mã xác thực 6 số tới email của bạn.")
    onSend()
  }

  return (
    <div className="py-2">
      <StepHeader
        title="Quên mật khẩu"
        desc="Nhập địa chỉ email đã đăng ký. Hệ thống sẽ gửi mã xác thực 6 chữ số để bạn đặt lại mật khẩu."
        onBack={onBack}
      />

      {/* Rate-limit notice */}
      {blocked && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3">
          <Icons.clock size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-[12px] font-semibold text-amber-700">
            Để tránh lạm dụng, bạn chỉ được gửi lại sau{" "}
            <strong>{resendLeft}s</strong>.
          </p>
        </div>
      )}

      <div className="card space-y-4 p-5">
        <Field label="Địa chỉ email">
          <input
            className={`${inputClass} font-sans`}
            placeholder="ban@trangtrai.vn"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </Field>
        <PrimaryButton full icon={Icons.send} onClick={submit}>
          {blocked ? `Gửi lại sau ${resendLeft}s` : "Gửi mã xác thực"}
        </PrimaryButton>
      </div>
    </div>
  )
}

/* Step 2 — verify OTP (same rate-limit + max_attempts as activation) */
function ForgotVerifyStep({
  email,
  resendLeft,
  onResend,
  onVerified,
  onBack,
}: {
  email: string
  resendLeft: number
  onResend: () => void
  onVerified: () => void
  onBack: () => void
}) {
  const nav = useNav()
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""])
  const [attempts, setAttempts] = useState(0)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const invalidated = attempts >= MAX_ATTEMPTS
  const code = digits.join("")

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1)
    setDigits((arr) => {
      const next = [...arr]
      next[i] = d
      return next
    })
    if (d && i < 5) refs.current[i + 1]?.focus()
  }
  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0)
      refs.current[i - 1]?.focus()
  }

  const verify = () => {
    if (invalidated)
      return nav.toast("Mã đã bị vô hiệu hóa. Vui lòng gửi lại mã mới.")
    if (code.length < 6) return nav.toast("Vui lòng nhập đủ 6 chữ số.")
    // In production: verify against email_verification_challenges
    if (code !== DEMO_OTP) {
      const next = attempts + 1
      setAttempts(next)
      if (next >= MAX_ATTEMPTS) {
        return nav.toast("Đã vượt quá số lần thử. Mã bị vô hiệu hóa.")
      }
      return nav.toast(`Mã không đúng. Còn ${MAX_ATTEMPTS - next} lần thử.`)
    }
    nav.toast("Xác thực thành công.")
    onVerified()
  }

  const resend = () => {
    if (resendLeft > 0) return
    setAttempts(0)
    setDigits(["", "", "", "", "", ""])
    onResend()
    refs.current[0]?.focus()
    nav.toast("Đã gửi mã xác thực mới tới email của bạn.")
  }

  return (
    <div className="py-2">
      <StepHeader
        title="Xác thực email"
        desc={`Nhập mã 6 chữ số đã được gửi tới ${email || "email của bạn"}.`}
        onBack={onBack}
      />
      <OtpCard
        digits={digits}
        refs={refs}
        invalidated={invalidated}
        attempts={attempts}
        setDigit={setDigit}
        onKey={onKey}
        verify={verify}
        resendLeft={resendLeft}
        resend={resend}
        ctaLabel="Xác nhận mã"
      />
    </div>
  )
}

/* Step 3 — set new password */
function ForgotNewPwStep({
  onDone,
  onBack,
}: {
  onDone: () => void
  onBack: () => void
}) {
  const nav = useNav()
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [errors, setErrors] = useState<{ pw?: string; pw2?: string }>({})
  const [saving, setSaving] = useState(false)

  const validate = () => {
    const e: typeof errors = {}
    if (pw.length < MIN_PW_LENGTH)
      e.pw = `Mật khẩu cần ít nhất ${MIN_PW_LENGTH} ký tự.`
    if (!pw2) e.pw2 = "Vui lòng nhập lại mật khẩu."
    else if (pw !== pw2) e.pw2 = "Mật khẩu nhập lại không khớp."
    return e
  }

  const submit = () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return
    setSaving(true)
    // Simulate PATCH /users/reset-password
    window.setTimeout(() => {
      setSaving(false)
      nav.toast("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.")
      onDone()
    }, 800)
  }

  return (
    <div className="py-2">
      <StepHeader
        title="Đặt mật khẩu mới"
        desc={`Tạo mật khẩu mới tối thiểu ${MIN_PW_LENGTH} ký tự cho tài khoản của bạn.`}
        onBack={onBack}
      />
      <div className="card space-y-4 p-5">
        <Field
          label="Mật khẩu mới"
          hint={`Tối thiểu ${MIN_PW_LENGTH} ký tự.`}
          error={errors.pw}
        >
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              className={`${inputClass} font-mono pr-10 ${
                errors.pw
                  ? "border-rose-400 focus:border-rose-400 focus:ring-rose-50"
                  : ""
              }`}
              placeholder="••••••••"
              value={pw}
              autoFocus
              onChange={(e) => {
                setPw(e.target.value)
                setErrors((p) => ({ ...p, pw: undefined }))
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
              tabIndex={-1}
            >
              {showPw ? <Icons.eyeOff size={17} /> : <Icons.eye size={17} />}
            </button>
          </div>
        </Field>

        <Field label="Xác nhận mật khẩu mới" error={errors.pw2}>
          <div className="relative">
            <input
              type={showPw2 ? "text" : "password"}
              className={`${inputClass} font-mono pr-10 ${
                errors.pw2
                  ? "border-rose-400 focus:border-rose-400 focus:ring-rose-50"
                  : ""
              }`}
              placeholder="••••••••"
              value={pw2}
              onChange={(e) => {
                setPw2(e.target.value)
                setErrors((p) => ({ ...p, pw2: undefined }))
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw2((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
              tabIndex={-1}
            >
              {showPw2 ? <Icons.eyeOff size={17} /> : <Icons.eye size={17} />}
            </button>
          </div>
        </Field>

        {/* Password strength */}
        {pw.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((level) => {
                const strength =
                  pw.length < MIN_PW_LENGTH
                    ? 1
                    : pw.length < 10
                      ? 2
                      : /[A-Z]/.test(pw) && /[0-9]/.test(pw)
                        ? 4
                        : 3
                return (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      level <= strength
                        ? strength <= 1
                          ? "bg-rose-400"
                          : strength <= 2
                            ? "bg-amber-400"
                            : strength <= 3
                              ? "bg-teal-400"
                              : "bg-emerald-500"
                        : "bg-slate-100"
                    }`}
                  />
                )
              })}
            </div>
            <p
              className={`text-[11px] font-semibold ${
                pw.length < MIN_PW_LENGTH
                  ? "text-rose-500"
                  : pw.length < 10
                    ? "text-amber-500"
                    : /[A-Z]/.test(pw) && /[0-9]/.test(pw)
                      ? "text-emerald-600"
                      : "text-teal-600"
              }`}
            >
              {pw.length < MIN_PW_LENGTH
                ? "Quá ngắn"
                : pw.length < 10
                  ? "Trung bình"
                  : /[A-Z]/.test(pw) && /[0-9]/.test(pw)
                    ? "Rất mạnh"
                    : "Khá mạnh"}
            </p>
          </div>
        )}

        <PrimaryButton
          full
          icon={saving ? undefined : Icons.shield}
          onClick={submit}
        >
          {saving ? "Đang cập nhật…" : "Xác nhận mật khẩu mới"}
        </PrimaryButton>
      </div>
    </div>
  )
}

/* ============================================================ shared OTP UI */
function OtpCard({
  digits,
  refs,
  invalidated,
  attempts,
  setDigit,
  onKey,
  verify,
  resendLeft,
  resend,
  ctaLabel,
}: {
  digits: string[]
  refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  invalidated: boolean
  attempts: number
  setDigit: (i: number, v: string) => void
  onKey: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => void
  verify: () => void
  resendLeft: number
  resend: () => void
  ctaLabel: string
}) {
  return (
    <div className="card space-y-4 p-5">
      {/* OTP inputs */}
      <div className="flex justify-center gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)}
            inputMode="numeric"
            maxLength={1}
            disabled={invalidated}
            className={`size-12 rounded-xl border text-center font-mono text-[20px] font-bold text-ink outline-none transition focus:border-ocean-400 focus:ring-4 focus:ring-ocean-50 ${
              invalidated
                ? "border-rose-500/40 bg-rose-50/50"
                : "border-line bg-white"
            }`}
          />
        ))}
      </div>

      {/* Status banners */}
      {invalidated ? (
        <div className="rounded-xl bg-rose-50 px-3 py-2.5 text-[11.5px] font-semibold leading-snug text-rose-500">
          Mã đã bị vô hiệu hóa sau {MAX_ATTEMPTS} lần nhập sai. Vui lòng gửi lại
          mã mới để tiếp tục.
        </div>
      ) : null}

      <PrimaryButton full icon={Icons.check} onClick={verify}>
        {ctaLabel}
      </PrimaryButton>

      <button
        onClick={resend}
        disabled={resendLeft > 0}
        className="w-full text-center text-[12.5px] font-semibold text-ocean-600 disabled:text-ink-muted"
      >
        {resendLeft > 0
          ? `Gửi lại mã sau ${resendLeft}s`
          : "Không nhận được mã? Gửi lại"}
      </button>
    </div>
  )
}
