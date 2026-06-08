import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({});
const TO_EMAIL = process.env.TO_EMAIL;
const FROM_EMAIL = process.env.FROM_EMAIL;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const SERVICE_LABELS = {
  "brand-launch": "Brand Launch Kit",
  "explainer-video": "Explainer Video Package",
  "social-motion": "Social Motion Pack",
  "full-brand-web": "Full Brand + Web",
  consultation: "General Consultation",
};

function corsHeaders(origin) {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0] || "*";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
  };
}

function jsonResponse(statusCode, body, origin) {
  return {
    statusCode,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

function cleanText(value, maxLength) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export const handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || "";
  const method = event.requestContext?.http?.method || event.httpMethod;

  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders(origin),
      body: "",
    };
  }

  if (method !== "POST") {
    return jsonResponse(405, { ok: false, error: "Method not allowed" }, origin);
  }

  try {
    const payload = JSON.parse(event.body || "{}");

    if (payload.website) {
      return jsonResponse(200, { ok: true }, origin);
    }

    const name = cleanText(payload.name, 120);
    const email = cleanText(payload.email, 254);
    const company = cleanText(payload.company, 160);
    const service = cleanText(payload.service, 80);
    const message = cleanText(payload.message, 5000);

    if (!name || !email || !service || !message) {
      return jsonResponse(400, { ok: false, error: "Missing required fields" }, origin);
    }

    if (!isValidEmail(email)) {
      return jsonResponse(400, { ok: false, error: "Invalid email address" }, origin);
    }

    const serviceLabel = SERVICE_LABELS[service] || service;
    const subject = `Project inquiry from ${name}`;
    const textBody = [
      "New contact form submission from aknightmedia.com",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Company: ${company || "N/A"}`,
      `Service: ${serviceLabel}`,
      "",
      "Message:",
      message,
    ].join("\n");

    await ses.send(
      new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: {
          ToAddresses: [TO_EMAIL],
        },
        ReplyToAddresses: [email],
        Message: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: {
            Text: { Data: textBody, Charset: "UTF-8" },
          },
        },
      })
    );

    return jsonResponse(200, { ok: true }, origin);
  } catch (error) {
    console.error("Contact form submission failed", error);
    return jsonResponse(500, { ok: false, error: "Unable to send message" }, origin);
  }
};
