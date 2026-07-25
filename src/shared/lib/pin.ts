import { PIN_PREFIX_LENGTH } from "../../constants/index";

/** KB-PIN 하이픈 제거 후 앞 PIN_PREFIX_LENGTH자리. 미만이면 null. */
export function pinPrefix(pin: string | null | undefined): string | null {
  if (!pin) {
    return null;
  }
  const digits = String(pin).replace(/-/g, "").trim();
  return digits.length >= PIN_PREFIX_LENGTH
    ? digits.slice(0, PIN_PREFIX_LENGTH)
    : null;
}
