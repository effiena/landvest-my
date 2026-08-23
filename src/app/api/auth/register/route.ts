import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, email, password } = body;

    // =========================
    // VALIDATION
    // =========================

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          error: "Name, email and password are required.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    // =========================
    // CHECK EXISTING USER
    // =========================

    const existing =
      await prisma.agent.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (existing) {
      return NextResponse.json(
        {
          error: "Email already registered",
        },
        { status: 400 }
      );
    }

    // =========================
    // HASH PASSWORD
    // =========================

    const hashedPassword =
      await bcrypt.hash(password, 10);

    // =========================
    // CREATE VERIFICATION TOKEN
    // =========================

    const verifyToken =
      crypto.randomBytes(32).toString("hex");

    // =========================
    // CREATE AGENT
    // =========================

    const agent = await prisma.agent.create({
      data: {
        name: name.trim(),

        email: normalizedEmail,

        password: hashedPassword,

        emailVerified: false,

        verifyToken,
      },
    });

    // =========================
    // SEND VERIFICATION EMAIL
    // =========================

    try {
      await sendVerificationEmail(
        agent.email,
        agent.name,
        verifyToken
      );
    } catch (emailError) {
      console.error(
        "Verification email failed:",
        emailError
      );

      // Remove account if email cannot be sent
      await prisma.agent.delete({
        where: {
          id: agent.id,
        },
      });

      return NextResponse.json(
        {
          error:
            "Account could not be created because the verification email could not be sent.",
        },
        { status: 500 }
      );
    }

    // =========================
    // SUCCESS
    // =========================

    return NextResponse.json({
      success: true,

      message:
        "Registration successful. Please check your email to verify your account.",

      email: agent.email,
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
