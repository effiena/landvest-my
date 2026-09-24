export function normalizeWhatsAppNumber(
  phone: string
): string {
  let value = phone.trim();

  value = value.replace(/[\s\-().]/g, "");

  if (value.startsWith("+")) {
    value = value.substring(1);
  }

  if (value.startsWith("0")) {
    value = "60" + value.substring(1);
  }

  if (!value.startsWith("60")) {
    throw new Error("Invalid Malaysian WhatsApp number");
  }

  if (!/^601[0-9]{7,9}$/.test(value)) {
    throw new Error("Invalid Malaysian WhatsApp number");
  }

  return value;
}
