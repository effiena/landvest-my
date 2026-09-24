import crypto from "crypto";

export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function hashOtp(otp: string): Promise<string> {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
}

export async function verifyOtp(
  otp: string,
  hash: string
): Promise<boolean> {
  const otpHash = await hashOtp(otp);
  return crypto.timingSafeEqual(
    Buffer.from(otpHash),
    Buffer.from(hash)
  );
}
