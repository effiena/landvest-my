import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Unauthorized</h2>
        <p>Please login to access your dashboard.</p>
      </div>
    );
  }

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

  const agent = await prisma.agent.findUnique({
    where: { id: decoded.id },
    include: {
      listings: {
        include: { images: true },
        orderBy: { createdAt: "desc" },
      },
      wantToBuy: {
        where: {
          status: {
            not: "closed",
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!agent) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Agent not found</h2>
        <p>Your account could not be found.</p>
      </div>
    );
  }

  /*
   * Visitor statistics are visible ONLY to Yoori and Della.
   */
  const agentName = agent.name.trim().toLowerCase();
  const canViewVisitorStats =
    agentName === "yoori" || agentName === "della";

  let contactMessages: any[] = [];

  if (canViewVisitorStats) {
    contactMessages = await prisma.contactMessage.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  let visitorStats = null;

  if (canViewVisitorStats) {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const [totalVisitors, todayVisitors, monthVisitors] =
      await Promise.all([
        prisma.visitor.count(),

        prisma.visitor.count({
          where: {
            createdAt: {
              gte: startOfToday,
            },
          },
        }),

        prisma.visitor.count({
          where: {
            createdAt: {
              gte: startOfMonth,
            },
          },
        }),
      ]);

    visitorStats = {
      total: totalVisitors,
      today: todayVisitors,
      month: monthVisitors,
    };
  }

  return (
    <div>
      {visitorStats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            padding: "20px 24px 0",
            maxWidth: 1400,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 14,
              padding: 20,
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: "#666",
                marginBottom: 8,
              }}
            >
              👁️ Total Visitors
            </div>

            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: "#111",
              }}
            >
              {visitorStats.total}
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: 14,
              padding: 20,
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: "#666",
                marginBottom: 8,
              }}
            >
              📅 Today
            </div>

            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: "#111",
              }}
            >
              {visitorStats.today}
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: 14,
              padding: 20,
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: "#666",
                marginBottom: 8,
              }}
            >
              📊 This Month
            </div>

            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: "#111",
              }}
            >
              {visitorStats.month}
            </div>
          </div>
        </div>
      )}

      <AdminClient
        agent={agent}
        lands={agent.listings}
        wantToBuy={agent.wantToBuy}
        contactMessages={contactMessages}
      />
    </div>
  );
}
