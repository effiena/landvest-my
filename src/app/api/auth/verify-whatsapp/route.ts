import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hashOtp } from "@/lib/whatsapp-otp";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { email, code } = body;

    // =========================
    // VALIDATION
    // =========================

    if (!email || !code) {
      return NextResponse.json(
        {
          error:
            "Email and verification code are required.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const normalizedCode =
      code.trim();

    if (!/^\d{6}$/.test(normalizedCode)) {
      return NextResponse.json(
        {
          error:
            "Verification code must be 6 digits.",
        },
        { status: 400 }
      );
    }

    // =========================
    // FIND ACCOUNT
    // =========================

    const agent =
      await prisma.agent.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (!agent) {
      return NextResponse.json(
        {
          error: "Account not found.",
        },
        { status: 404 }
      );
    }

    // =========================
    // ALREADY VERIFIED
    // =========================

    if (agent.emailVerified) {
      return NextResponse.json({
        success: true,
        message:
          "Account is already verified.",
      });
    }

    // =========================
    // CHECK OTP EXISTS
    // =========================

    if (
      !agent.verificationCodeHash ||
      !agent.verificationExpiresAt
    ) {
      return NextResponse.json(
        {
          error:
            "No verification code is available. Please request a new code.",
        },
        { status: 400 }
      );
    }

    // =========================
    // CHECK ATTEMPTS
    // =========================

    if (
      agent.verificationAttempts >= 5
    ) {
      return NextResponse.json(
        {
          error:
            "Too many incorrect attempts. Please request a new code.",
        },
        { status: 429 }
      );
    }

    // =========================
    // CHECK EXPIRY
    // =========================

    if (
      new Date() >
      agent.verificationExpiresAt
    ) {
      return NextResponse.json(
        {
          error:
            "Verification code has expired. Please request a new code.",
        },
        { status: 400 }
      );
    }

    // =========================
    // VERIFY OTP
    // =========================

    const submittedHash =
      await hashOtp(normalizedCode);

    if (
      submittedHash !==
      agent.verificationCodeHash
    ) {
      await prisma.agent.update({
        where: {
          id: agent.id,
        },
        data: {
          verificationAttempts: {
            increment: 1,
          },
        },
      });

      return NextResponse.json(
        {
          error:
            "Invalid verification code.",
        },
        { status: 400 }
      );
    }

    // =========================
    // VERIFIED
    // =========================

    await prisma.agent.update({
      where: {
        id: agent.id,
      },
      data: {
        emailVerified: true,

        verificationCodeHash: null,

        verificationExpiresAt: null,

        verificationAttempts: 0,

        verifyToken: null,
      },
    });

    return NextResponse.json({
      success: true,

      message:
        "WhatsApp verified successfully.",
    });

  } catch (error) {
    console.error(
      "WhatsApp verification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Verification failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
