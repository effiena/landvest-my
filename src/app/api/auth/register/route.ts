import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Agent registration is currently closed."
    },
    {
      status: 403
    }
  );
}
