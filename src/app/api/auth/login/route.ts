import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password } = body;

  const agent = await prisma.agent.findUnique({
    where: { email },
  });

  if (!agent) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(password, agent.password);

  if (!valid) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const token = jwt.sign(
    {
      id: agent.id,
      email: agent.email,
      plan: agent.plan,
    },
    process.env.JWT_SECRET || "dev_secret_key",
    { expiresIn: "7d" }
  );

  return NextResponse.json({
    token,
    agent,
  });
}
