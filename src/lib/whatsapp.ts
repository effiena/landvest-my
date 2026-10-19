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
    throw new Error(
      "Invalid Malaysian WhatsApp number"
    );
  }

  if (!/^601[0-9]{7,9}$/.test(value)) {
    throw new Error(
      "Invalid Malaysian WhatsApp number"
    );
  }

  return value;
}

export function getWhatsAppLink(
  phone: string
): string {
  return `https://wa.me/${normalizeWhatsAppNumber(
    phone
  )}`;
}


/**
 * Return a WhatsApp URL only when the supplied Malaysian mobile number
 * can be normalized. Invalid or missing database values must not crash SSR.
 */
export function getSafeWhatsAppLink(
  phone: string | null | undefined
): string | null {
  if (!phone || typeof phone !== "string") return null;

  try {
    return getWhatsAppLink(phone);
  } catch {
    return null;
  }
}
