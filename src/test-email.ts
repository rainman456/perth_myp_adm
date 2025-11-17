import nodemailer from "nodemailer";
import * as dotenv from "dotenv";
import { config } from "./config";
dotenv.config();


const emailEnabled = config.smtp.enabled;
if (!emailEnabled) {
  console.warn("Email service disabled: SMTP credentials not configured");
}

const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure, // true for port 465, false for 587
    auth: emailEnabled ? {
      user: config.smtp.user,
      pass: config.smtp.pass,
    } : undefined,
    connectionTimeout: config.smtp.connectionTimeout, // 5 seconds
    socketTimeout: config.smtp.socketTimeout, // 5 seconds
  });
  
async function testSend() {
  try {
    await transporter.verify();
    console.log("Connection OK");
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: "simonlevi453@gmail.com",  // Use a real email you control
      subject: "Test Email",
      text: "This is a test.",
    });
    console.log("Test email sent:", info.messageId);
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testSend();