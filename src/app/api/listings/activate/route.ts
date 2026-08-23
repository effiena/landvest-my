import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {

  const { orderId } = await request.json();

  // verify PayPal here

  const agentId = 1; // replace with logged in agent

  await prisma.agent.update({

    where:{
      id:agentId
    },

    data:{
      extraListings:{
        increment:1
      }
    }

  });

  return NextResponse.json({

    success:true

  });

}
