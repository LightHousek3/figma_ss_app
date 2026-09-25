export type WaterMetricKey =
  | "temperature"
  | "ph"
  | "dissolvedOxygen"
  | "salinity"
  | "nh3"
  | "no2"
  | "alkalinity"
  | "h2s"

export type WaterMetricState = "default" | "danger"

/**
 * One operational threshold set shared by the KTV and Farm Owner views.
 *
 * Salinity is deliberately not judged here: the acceptable value depends on
 * the stocked species, acclimation plan and site. The remaining values mirror
 * the alert limits shown in the field workflow, so one reading can never be
 * labelled safe for the technician and unsafe for the owner.
 */
export const waterThresholds: Record<
  Exclude<WaterMetricKey, "salinity">,
  { min?: number; max?: number; label: string }
> = {
  temperature: { min: 25, max: 32, label: "25–32 °C" },
  ph: { min: 7.5, max: 8.5, label: "7,5–8,5" },
  dissolvedOxygen: { min: 4, label: "từ 4 mg/L" },
  nh3: { max: 0.3, label: "không quá 0,3 mg/L" },
  no2: { max: 1, label: "không quá 1 mg/L" },
  alkalinity: { min: 80, max: 180, label: "80–180 mg/L" },
  h2s: { max: 0.01, label: "không quá 0,01 mg/L" },
}

export function waterMetricState(
  metric: WaterMetricKey,
  value: number | undefined,
): WaterMetricState {
  if (value == null || metric === "salinity") return "default"

  const threshold = waterThresholds[metric]
  if (threshold.min != null && value < threshold.min) return "danger"
  if (threshold.max != null && value > threshold.max) return "danger"
  return "default"
}

export function waterMetricIsOutside(
  metric: WaterMetricKey,
  value: number | undefined,
) {
  return waterMetricState(metric, value) === "danger"
}
