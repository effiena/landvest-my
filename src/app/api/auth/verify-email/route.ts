import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const token = searchParams.get("token");

    if (!token) {
      return new NextResponse(
        "Invalid verification link.",
        { status: 400 }
      );
    }

    const agent = await prisma.agent.findUnique({
      where: {
        verifyToken: token,
      },
    });

    if (!agent) {
      return new NextResponse(
        "Invalid or expired verification link.",
        { status: 400 }
      );
    }

    await prisma.agent.update({
      where: {
        id: agent.id,
      },
      data: {
        emailVerified: true,
        verifyToken: null,
      },
    });

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Email Verified</title>
        </head>

        <body style="
          font-family: Arial;
          text-align: center;
          padding: 60px;
        ">

          <h1>✅ Email Verified!</h1>

          <p>
            Your LandVest Malaysia account has been successfully verified.
          </p>

          <p>
            You can now login to your account.
          </p>

          <a
            href="/login"
            style="
              display:inline-block;
              margin-top:20px;
              padding:12px 24px;
              background:#16a34a;
              color:white;
              text-decoration:none;
              border-radius:6px;
            "
          >
            Go to Login
          </a>

        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );

  } catch (error) {
    console.error(
      "Email verification error:",
      error
    );

    return new NextResponse(
      "Email verification failed.",
      { status: 500 }
    );
  }
}
