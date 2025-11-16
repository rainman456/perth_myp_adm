import nodemailer from "nodemailer";
import * as dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function testSend() {
  try {
    await transporter.verify();
    console.log("Connection OK");
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: "simonlevi12@tutamail.com",  // Use a real email you control
      subject: "Test Email",
      text: "This is a test.",
    });
    console.log("Test email sent:", info.messageId);
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testSend();