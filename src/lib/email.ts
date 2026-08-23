import { Resend } from "resend";

export async function sendVerificationEmail(
  email: string,
  name: string,
  verifyToken: string
) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("RESEND_API_KEY is missing");
    throw new Error("RESEND_API_KEY is not configured");
  }

  const resend = new Resend(apiKey);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const verifyUrl =
    `${appUrl}/api/auth/verify-email?token=${verifyToken}`;

  const result = await resend.emails.send({
    from:
      process.env.EMAIL_FROM ||
      "LandVest Malaysia <onboarding@resend.dev>",

    to: email,

    subject: "Verify your LandVest Malaysia account",

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Welcome to LandVest Malaysia, ${name}!</h2>

        <p>
          Thank you for registering your LandVest Malaysia account.
        </p>

        <p>
          Please click the button below to verify your email address:
        </p>

        <p>
          <a
            href="${verifyUrl}"
            style="
              display:inline-block;
              padding:12px 24px;
              background:#16a34a;
              color:white;
              text-decoration:none;
              border-radius:6px;
            "
          >
            Verify My Email
          </a>
        </p>

        <p>
          Or copy this link into your browser:
        </p>

        <p>${verifyUrl}</p>

        <p>
          If you did not create this account, you can ignore this email.
        </p>

        <hr />

        <p>
          LandVest Malaysia
        </p>
      </div>
    `,
  });

  if (result.error) {
    console.error("Verification email error:", result.error);
    throw new Error("Failed to send verification email");
  }

  return result;
}
