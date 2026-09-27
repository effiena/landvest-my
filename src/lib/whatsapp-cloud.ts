const META_GRAPH_VERSION = "v23.0";

export async function sendWhatsAppOtp(
  phoneNumber: string,
  otp: string
) {
  const accessToken =
    process.env.WHATSAPP_ACCESS_TOKEN;

  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken) {
    throw new Error(
      "WHATSAPP_ACCESS_TOKEN is not configured."
    );
  }

  if (!phoneNumberId) {
    throw new Error(
      "WHATSAPP_PHONE_NUMBER_ID is not configured."
    );
  }

  const response = await fetch(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "template",
        template: {
          name: "hello_world",
          language: {
            code: "en_US",
          },
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "Meta WhatsApp API error:",
      data
    );

    throw new Error(
      data?.error?.message ||
        "Failed to send WhatsApp message."
    );
  }

  return data;
}

