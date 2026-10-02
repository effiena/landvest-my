import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

async function getAuthorizedAgent() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_secret_key"
    ) as { id?: number };

    if (!decoded.id) {
      return null;
    }

    const agent = await prisma.agent.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
      },
    });

    if (!agent) {
      return null;
    }

    const name = agent.name.trim().toLowerCase();

    if (name !== "yoori" && name !== "della") {
      return null;
    }

    return agent;
  } catch {
    return null;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await getAuthorizedAgent();

    if (!agent) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const messageId = Number(id);

    if (!Number.isInteger(messageId)) {
      return NextResponse.json(
        { error: "Invalid message ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const status = String(body.status ?? "").trim();

    if (!["read", "replied", "closed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status." },
        { status: 400 }
      );
    }

    const message = await prisma.contactMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message not found." },
        { status: 404 }
      );
    }

    const updated = await prisma.contactMessage.update({
      where: { id: messageId },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      message: updated,
    });
  } catch (error) {
    console.error("Contact message update error:", error);

    return NextResponse.json(
      { error: "Unable to update message." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await getAuthorizedAgent();

    if (!agent) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const messageId = Number(id);

    if (!Number.isInteger(messageId)) {
      return NextResponse.json(
        { error: "Invalid message ID." },
        { status: 400 }
      );
    }

    const message = await prisma.contactMessage.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message not found." },
        { status: 404 }
      );
    }

    if (message.status === "new") {
      return NextResponse.json(
        { error: "Message must be marked as read before deletion." },
        { status: 400 }
      );
    }

    await prisma.contactMessage.delete({
      where: { id: messageId },
    });

    return NextResponse.json({
      success: true,
      id: messageId,
    });
  } catch (error) {
    console.error("Contact message delete error:", error);

    return NextResponse.json(
      { error: "Unable to delete message." },
      { status: 500 }
    );
  }
}
