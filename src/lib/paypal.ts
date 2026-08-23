const PAYPAL_BASE =
  process.env.PAYPAL_MODE === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";


export async function getPayPalAccessToken() {

  const auth =
    Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString("base64");


  const response = await fetch(
    `${PAYPAL_BASE}/v1/oauth2/token`,
    {
      method: "POST",

      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type":
          "application/x-www-form-urlencoded",
      },

      body:
        "grant_type=client_credentials",
    }
  );


  const data = await response.json();
  console.log("PayPal Token Response:", data);
  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }



  return data.access_token;
}


export async function paypalRequest(
  url:string,
  options:any={}
){

  const token =
    await getPayPalAccessToken();


  return fetch(
    `${PAYPAL_BASE}${url}`,
    {
      ...options,

      headers:{
        Authorization:
          `Bearer ${token}`,

        "Content-Type":
          "application/json",

        ...options.headers,
      }
    }
  );

}
