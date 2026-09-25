import { useState } from "react"
import { useNav } from "../app/store"
import { currentUser } from "../app/data"
import { Field, Icons, inputClass, PrimaryButton } from "../app/ui"
import { ScreenHeader } from "./common"

export function ProfileEdit() {
  const nav = useNav()

  // Editable fields — BR: email & role are immutable (set by admin / system)
  const [name, setName] = useState(currentUser.name)
  const [phone, setPhone] = useState(currentUser.phone ?? "")
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})

  const validate = () => {
    const e: typeof errors = {}
    if (!name.trim()) e.name = "Họ tên không được để trống."
    else if (name.trim().length < 2) e.name = "Họ tên cần ít nhất 2 ký tự."
    if (phone && !/^(0|\+84)[0-9]{8,10}$/.test(phone.replace(/\s/g, "")))
      e.phone = "Số điện thoại không hợp lệ."
    return e
  }

  const submit = () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return

    setSaving(true)
    // Simulate network latency — in production this calls PATCH /users/:id
    window.setTimeout(() => {
      // Mutate mock data in place so the Account screen reflects the change
      currentUser.name = name.trim()
      currentUser.phone = phone.trim() || currentUser.phone
      setSaving(false)
      nav.toast("Cập nhật thông tin thành công.")
      nav.back()
    }, 800)
  }

  return (
    <div className="flex flex-col">
      <ScreenHeader title="Cập nhật thông tin" />

      <div className="px-4 pt-4 pb-10 space-y-5">
        {/* Editable fields */}
        <div className="space-y-4">
          <Field label="Họ và tên" error={errors.name}>
            <input
              className={`${inputClass} font-sans ${
                errors.name
                  ? "border-rose-400 focus:border-rose-400 focus:ring-rose-50"
                  : ""
              }`}
              placeholder="VD: Trần Quốc Bảo"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setErrors((p) => ({ ...p, name: undefined }))
              }}
              autoFocus
            />
          </Field>

          <Field label="Số điện thoại" error={errors.phone}>
            <input
              className={`${inputClass} font-sans ${
                errors.phone
                  ? "border-rose-400 focus:border-rose-400 focus:ring-rose-50"
                  : ""
              }`}
              inputMode="tel"
              placeholder="09xx xxx xxx"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                setErrors((p) => ({ ...p, phone: undefined }))
              }}
            />
          </Field>
        </div>

        <div className="pt-2">
          <PrimaryButton
            full
            icon={saving ? undefined : Icons.check}
            onClick={submit}
          >
            {saving ? "Đang lưu…" : "Lưu thay đổi"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
