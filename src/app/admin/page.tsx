import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export default async function AdminDashboard() {
  // 🍪 GET COOKIES (NEXT.JS 16 FIX)
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // ❌ NO TOKEN
  if (!token) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Unauthorized</h2>
        <p>Please login to access admin dashboard.</p>
      </div>
    );
  }

  // 🔓 VERIFY JWT
  let decoded: any;

  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_secret_key"
    );
  } catch (err) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Session Invalid</h2>
        <p>Please login again.</p>
      </div>
    );
  }

  // 👤 GET AGENT + THEIR LISTINGS
  const agent = await prisma.agent.findUnique({
    where: {
      id: decoded.id,
    },
    include: {
      listings: {
        include: {
          images: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  // ❌ AGENT NOT FOUND
  if (!agent) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Agent not found</h2>
      </div>
    );
  }

  // 📦 SEND DATA TO CLIENT UI
  return (
    <AdminClient
      agent={agent}
      lands={agent.listings}
    />
  );
}
