import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await req.json();

    const land = await prisma.land.update({
      where: {
        id: Number(id),
      },
      data: {
        title: body.title,
        location: body.location,
        state: body.state,
        acreage: Number(body.acreage),
        price: body.price,
        description: body.description,
        whatsapp: body.whatsapp,
      },
    });

    return NextResponse.json({
      success: true,
      land,
    });

  } catch (err) {
    console.error("UPDATE LAND ERROR:", err);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update land",
      },
      {
        status: 500,
      }
    );
  }
}



export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.land.delete({
      where: {
        id: Number(id),
      },
    });

    return NextResponse.json({
      success: true,
    });

  } catch (err) {

    console.error("DELETE LAND ERROR:", err);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete",
      },
      {
        status: 500,
      }
    );
  }
}
