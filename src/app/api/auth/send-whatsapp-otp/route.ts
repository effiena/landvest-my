import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hashOtp } from "@/lib/whatsapp-otp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.findUnique({
      where: { email },
    });

    if (!agent) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    if (agent.emailVerified) {
      return NextResponse.json({
        success: true,
        message: "WhatsApp number is already verified.",
      });
    }

    if (!agent.whatsappNumber) {
      return NextResponse.json(
        { error: "No WhatsApp number is registered for this account." },
        { status: 400 }
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const verificationCodeHash = await hashOtp(code);

    const verificationExpiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        verificationCodeHash,
        verificationExpiresAt,
        verificationAttempts: 0,
      },
    });

    // Development fallback.
    // Replace this with your WhatsApp provider later.
    console.log("=================================");
    console.log("WHATSAPP OTP");
    console.log("Email:", agent.email);
    console.log("WhatsApp:", agent.whatsappNumber);
    console.log("OTP:", code);
    console.log("=================================");

    return NextResponse.json({
      success: true,
      message: "Verification code generated.",
      ...(process.env.NODE_ENV !== "production"
        ? { developmentCode: code }
        : {}),
    });
  } catch (error) {
    console.error("WhatsApp OTP error:", error);

    return NextResponse.json(
      { error: "Unable to send verification code." },
      { status: 500 }
    );
  }
}
