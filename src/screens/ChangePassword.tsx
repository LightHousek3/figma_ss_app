import { useState } from "react";
import { useNav } from "../app/store";
import { Field, Icons, inputClass, PrimaryButton } from "../app/ui";
import { ScreenHeader } from "./common";

const DEMO_CURRENT_PW = "password";
const MIN_PW_LENGTH = 6;

type FieldErrors = { current?: string; next?: string; confirm?: string };

/* --------------------------------------------------------- PwInput (module-level to avoid re-mount) */
function PwInput({
  label,
  hint,
  value,
  onChange,
  show,
  onToggle,
  error,
  placeholder = "••••••••",
  autoFocus,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  error?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          className={`${inputClass} font-mono pr-10 ${error ? "border-rose-400 focus:border-rose-400 focus:ring-rose-50" : ""}`}
          placeholder={placeholder}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted transition active:scale-90"
          tabIndex={-1}
          aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          {show ? <Icons.eyeOff size={17} /> : <Icons.eye size={17} />}
        </button>
      </div>
    </Field>
  );
}

/* --------------------------------------------------------- strength bar */
function StrengthBar({ pw }: { pw: string }) {
  if (!pw.length) return null;
  const strength =
    pw.length < MIN_PW_LENGTH ? 1
    : pw.length < 10 ? 2
    : /[A-Z]/.test(pw) && /[0-9]/.test(pw) ? 4
    : 3;
  const label =
    strength <= 1 ? "Quá ngắn"
    : strength === 2 ? "Trung bình"
    : strength === 3 ? "Khá mạnh"
    : "Rất mạnh";
  const color =
    strength <= 1 ? "text-rose-500"
    : strength === 2 ? "text-amber-500"
    : strength === 3 ? "text-teal-600"
    : "text-emerald-600";
  const barColor = (level: number) =>
    level <= strength
      ? strength <= 1 ? "bg-rose-400" : strength === 2 ? "bg-amber-400" : strength === 3 ? "bg-teal-400" : "bg-emerald-500"
      : "bg-slate-100";

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((l) => (
          <div key={l} className={`h-1.5 flex-1 rounded-full transition-colors ${barColor(l)}`} />
        ))}
      </div>
      <p className={`text-[11px] font-semibold ${color}`}>{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ main */
export function ChangePassword() {
  const nav = useNav();

  const [current, setCurrent]     = useState("");
  const [next, setNext]           = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showCur, setShowCur]     = useState(false);
  const [showNext, setShowNext]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [errors, setErrors]       = useState<FieldErrors>({});
  const [saving, setSaving]       = useState(false);

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (!current) e.current = "Vui lòng nhập mật khẩu hiện tại.";
    else if (current !== DEMO_CURRENT_PW) e.current = "Mật khẩu hiện tại không đúng.";
    if (next.length < MIN_PW_LENGTH) e.next = `Mật khẩu mới cần ít nhất ${MIN_PW_LENGTH} ký tự.`;
    else if (next === current) e.next = "Mật khẩu mới phải khác mật khẩu hiện tại.";
    if (!confirm) e.confirm = "Vui lòng xác nhận mật khẩu mới.";
    else if (next !== confirm) e.confirm = "Mật khẩu nhập lại không khớp.";
    return e;
  };

  const submit = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      nav.toast("Đổi mật khẩu thành công.");
      nav.back();
    }, 800);
  };

  return (
    <div className="flex flex-col">
      <ScreenHeader title="Đổi mật khẩu" />

      <div className="px-4 pt-4 pb-10 space-y-5">

        <div className="space-y-4">
          <PwInput
            label="Mật khẩu hiện tại"
            value={current}
            onChange={(v) => { setCurrent(v); setErrors((p) => ({ ...p, current: undefined })); }}
            show={showCur}
            onToggle={() => setShowCur((s) => !s)}
            error={errors.current}
            autoFocus
          />
          <PwInput
            label="Mật khẩu mới"
            hint={`Tối thiểu ${MIN_PW_LENGTH} ký tự.`}
            value={next}
            onChange={(v) => { setNext(v); setErrors((p) => ({ ...p, next: undefined })); }}
            show={showNext}
            onToggle={() => setShowNext((s) => !s)}
            error={errors.next}
          />
          <StrengthBar pw={next} />
          <PwInput
            label="Xác nhận mật khẩu mới"
            value={confirm}
            onChange={(v) => { setConfirm(v); setErrors((p) => ({ ...p, confirm: undefined })); }}
            show={showConf}
            onToggle={() => setShowConf((s) => !s)}
            error={errors.confirm}
          />
        </div>

        <div className="pt-2">
          <PrimaryButton full icon={saving ? undefined : Icons.shield} onClick={submit}>
            {saving ? "Đang cập nhật…" : "Xác nhận đổi mật khẩu"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
