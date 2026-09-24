import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { generateOtp, hashOtp } from "@/lib/whatsapp-otp";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      email,
      password,
      whatsappNumber,
    } = body;

    // =========================
    // VALIDATION
    // =========================

    if (
      !name ||
      !email ||
      !password ||
      !whatsappNumber
    ) {
      return NextResponse.json(
        {
          error:
            "Name, email, password and WhatsApp number are required.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    // =========================
    // NORMALIZE WHATSAPP
    // =========================

    let normalizedWhatsApp: string;

    try {
      normalizedWhatsApp =
        normalizeWhatsAppNumber(
          whatsappNumber
        );
    } catch {
      return NextResponse.json(
        {
          error:
            "Please enter a valid Malaysian WhatsApp number.",
        },
        { status: 400 }
      );
    }

    // =========================
    // CHECK EXISTING EMAIL
    // =========================

    const existingEmail =
      await prisma.agent.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (existingEmail) {
      return NextResponse.json(
        {
          error: "Email already registered.",
        },
        { status: 400 }
      );
    }

    // =========================
    // CHECK EXISTING WHATSAPP
    // =========================
    const existingWhatsApp =
      await prisma.agent.findFirst({
        where: {
          whatsappNumber: normalizedWhatsApp,
          legacySharedWhatsApp: false,
        },
      });

    if (existingWhatsApp) {
      return NextResponse.json(
        { error: "This WhatsApp number is already registered." },
        { status: 400 }
      );
    }

    // =========================
    // HASH PASSWORD
    // =========================

    const hashedPassword =
      await bcrypt.hash(password, 10);

    // =========================
    // GENERATE 6-DIGIT OTP
    // =========================

    const otp = generateOtp();

    const otpHash =
      await hashOtp(otp);

    // OTP valid for 10 minutes
    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    // =========================
    // CREATE AGENT
    // =========================

    const agent =
      await prisma.agent.create({
        data: {
          name: name.trim(),

          email: normalizedEmail,

          whatsappNumber:
            normalizedWhatsApp,

          legacySharedWhatsApp: false,

          password: hashedPassword,

          emailVerified: false,

          verifyToken: null,

          verificationCodeHash:
            otpHash,

          verificationExpiresAt:
            expiresAt,

          verificationAttempts: 0,
        },
      });

    // =========================
    // TEMPORARY OTP
    // =========================
    //
    // We will replace this with
    // Meta WhatsApp Cloud API.
    //

    console.log(
      `WhatsApp OTP for ${normalizedWhatsApp}: ${otp}`
    );

    return NextResponse.json({
      success: true,

      message:
        "Registration successful. Please verify your WhatsApp number.",

      email: agent.email,

      // TEMPORARY DEVELOPMENT ONLY
      developmentOtp:
        process.env.NODE_ENV !==
        "production"
          ? otp
          : undefined,
    });

  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Registration failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
