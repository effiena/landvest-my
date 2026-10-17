import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type YooriAIAuthResult =
  | { authorized: true; agentId: number }
  | { authorized: false; response: NextResponse };

export async function requireYooriAI(): Promise<YooriAIAuthResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("[AI Lead Auth] JWT_SECRET is missing.");
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      ),
    };
  }

  let decoded: jwt.JwtPayload;

  try {
    const verified = jwt.verify(token, secret);

    if (
      typeof verified === "string" ||
      typeof verified.id !== "number" ||
      !Number.isInteger(verified.id) ||
      verified.id <= 0
    ) {
      throw new Error("Invalid session payload.");
    }

    decoded = verified;
  } catch {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Invalid session. Please log in again." },
        { status: 401 }
      ),
    };
  }

  const agent = await prisma.agent.findUnique({
    where: { id: decoded.id },
    select: { id: true, name: true },
  });

  if (!agent) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Agent account not found." },
        { status: 401 }
      ),
    };
  }

  if (agent.name.trim().toLowerCase() !== "yoori") {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "This AI feature is restricted to Yoori." },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, agentId: agent.id };
}
