
import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export default async function AdminDashboard() {
  // =========================
  // GET LOGIN COOKIE
  // =========================
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Unauthorized</h2>
        <p>Please login to access admin dashboard.</p>
      </div>
    );
  }

  // =========================
  // VERIFY JWT
  // =========================
  let decoded: any;

  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_secret_key"
    );
  } catch {
    return (
      <div style={{ padding: 40 }}>
        <h2>Session Invalid</h2>
        <p>Please login again.</p>
      </div>
    );
  }

  // =========================
  // FIND LOGGED-IN AGENT
  // =========================
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

  if (!agent) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Agent not found</h2>
      </div>
    );
  }

  // =========================
  // MASTERLISTER ACCESS
  // =========================
  if (agent.role !== "masterlister") {
    return (
      <div style={{ padding: 40 }}>
        <h2>Access Denied</h2>
        <p>
          You do not have masterlister access.
        </p>
      </div>
    );
  }

  // =========================
  // MASTERLISTER DASHBOARD
  // =========================
  return (
    <AdminClient
      agent={agent}
      lands={agent.listings}
    />
  );
}
