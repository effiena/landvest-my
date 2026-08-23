import { NextResponse } from "next/server";
import { getPayPalAccessToken } from "@/lib/paypal";


export async function GET(){

  const token =
    await getPayPalAccessToken();


  return NextResponse.json({
    success:true,
    tokenLength: token?.length
  });

}
