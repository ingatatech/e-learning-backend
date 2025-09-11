import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { Request } from 'express';

// Extend the SessionData interface to include custom properties
declare module 'express-session' {
  interface SessionData {
    otp?: string;
    otpEmail?: string;
    otpExpiry?: number;
    lastname?: string;
    firstname?: string;
    tempPassword?: string;
  }
}

// Load environment variables from .env file
dotenv.config();

// Generate a random OTP (6 alphanumeric characters)
export const generateOtp = (): string => {
  let otp = '';
  otp = Math.floor(100000 + Math.random() * 900000).toString(); // e.g. 6-digit code

  return otp;
};

// Send account credentials via email and
export const sendCreds = async (email: string,lastName:string,firstName:string, req: Request, tempPassword?: string): Promise<boolean> => {
  try {
    const otp = generateOtp();

    req.session.otp = otp;
    req.session.otpExpiry = Date.now() + 30 * 60 * 1000;
    req.session.otpEmail = email;
    req.session.tempPassword = tempPassword;
    req.session.lastname = lastName;
    req.session.firstname = firstName;
    

    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
      console.error("GMAIL_USER or GMAIL_PASSWORD not defined in environment variables.");
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });


const emailContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Welcome to EduPlatform - Your Learning Journey Begins</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    /* Base styles */
    body {
      background-color: oklch(0.97 0 0);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Email wrapper - landscape orientation */
    .email-wrapper {
      background-color: oklch(0.97 0 0);
      padding: 20px 10px;
      min-height: 100vh;
    }

    /* Main container - wider for landscape */
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: oklch(1 0 0);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
      border: 1px solid oklch(0.922 0 0);
    }

    /* Header section - landscape layout */
    .header {
      background: linear-gradient(135deg, oklch(0.77 0.17 152.0) 0%, oklch(0.649 0.169 162.4) 100%);
      padding: 32px 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: white;
      position: relative;
      overflow: hidden;
    }

    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 200px;
      height: 200px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      z-index: 0;
    }

    .header-content {
      z-index: 1;
      flex: 1;
    }

    .logo {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logo::before {
      content: '🎓';
      font-size: 32px;
    }

    .tagline {
      font-size: 16px;
      opacity: 0.95;
      font-weight: 400;
    }

    .header-graphic {
      z-index: 1;
      font-size: 120px;
      opacity: 0.2;
      line-height: 1;
    }

    /* Content section - landscape grid */
    .content {
      padding: 40px 48px;
      display: grid;
      gap: 40px;
      align-items: start;
    }

    .content-left {
      display: flex;
      flex-direction: column;
    }

    .greeting {
      font-size: 28px;
      font-weight: 600;
      color: oklch(0.145 0 0);
      margin-bottom: 16px;
      line-height: 1.2;
      grid-column: 1 / -1;
    }

    .intro-text {
      font-size: 16px;
      color: oklch(0.556 0 0);
      margin-bottom: 24px;
      line-height: 1.6;
    }

    /* Credentials card */
    .credentials-card {
      background: linear-gradient(135deg, oklch(0.97 0 0) 0%, oklch(0.985 0 0) 100%);
      border: 2px solid oklch(0.922 0 0);
      border-radius: 16px;
      padding: 28px;
      position: relative;
      overflow: hidden;
    }

    .credentials-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, oklch(0.77 0.17 152.0), oklch(0.649 0.169 162.4));
    }

    .credentials-title {
      font-size: 18px;
      font-weight: 600;
      color: oklch(0.145 0 0);
      margin-bottom: 20px;
      display: flex;
      align-items: center;
    }

    .credentials-title::before {
      content: '🔑';
      margin-right: 8px;
      font-size: 20px;
    }

    .credential-item {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      padding: 16px 20px;
      background-color: oklch(1 0 0);
      border-radius: 12px;
      border: 1px solid oklch(0.922 0 0);
      transition: all 0.2s ease;
    }

    .credential-item:hover {
      border-color: oklch(0.77 0.17 152.0);
      box-shadow: 0 2px 8px rgba(34, 197, 94, 0.1);
    }

    .credential-item:last-child {
      margin-bottom: 0;
    }

    .credential-label {
      font-weight: 600;
      color: oklch(0.556 0 0);
      min-width: 140px;
      font-size: 14px;
    }

    .credential-value {
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      color: oklch(0.77 0.17 152.0);
      font-weight: 600;
      background-color: oklch(0.985 0 0);
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 14px;
      word-break: break-all;
      border: 1px solid oklch(0.922 0 0);
    }

    /* Features section */
    .features-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .features-title {
      font-size: 18px;
      font-weight: 600;
      color: oklch(0.145 0 0);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
    }

    .features-title::before {
      content: '✨';
      margin-right: 8px;
      font-size: 20px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      background-color: oklch(0.985 0 0);
      border-radius: 10px;
      border: 1px solid oklch(0.922 0 0);
    }

    .feature-icon {
      margin-right: 12px;
      font-size: 18px;
    }

    .feature-text {
      font-size: 14px;
      color: oklch(0.556 0 0);
      font-weight: 500;
    }

    /* Security notice */
    .security-notice {
      background-color: oklch(0.985 0.05 70);
      border: 1px solid oklch(0.768 0.171 70.67);
      border-radius: 12px;
      padding: 20px;
      margin-top: 24px;
      display: flex;
      align-items: flex-start;
      grid-column: 1 / -1;
    }

    .security-notice-icon {
      font-size: 20px;
      margin-right: 12px;
      margin-top: 2px;
    }

    .security-notice-text {
      font-size: 14px;
      color: oklch(0.4 0.1 70);
      line-height: 1.5;
    }

    /* Action button */
    .action-section {
      text-align: center;
      margin: 32px 0;
      grid-column: 1 / -1;
    }

    .cta-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, oklch(0.77 0.17 152.0) 0%, oklch(0.649 0.169 162.4) 100%);
      color: oklch(0.145 0 0);
      text-decoration: none;
      padding: 18px 36px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(34, 197, 94, 0.25);
      letter-spacing: 0.3px;
      position: relative;
      overflow: hidden;
    }

    .cta-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.5s;
    }

    .cta-button:hover::before {
      left: 100%;
    }

    .cta-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(34, 197, 94, 0.35);
    }

    /* Support section */
    .support-section {
      background: linear-gradient(135deg, oklch(0.985 0 0) 0%, oklch(0.97 0 0) 100%);
      border-radius: 12px;
      padding: 24px;
      margin-top: 24px;
      text-align: center;
      border: 1px solid oklch(0.922 0 0);
      grid-column: 1 / -1;
    }

    .support-text {
      font-size: 14px;
      color: oklch(0.556 0 0);
      margin-bottom: 8px;
    }

    .support-contact {
      font-size: 14px;
      color: oklch(0.77 0.17 152.0);
      text-decoration: none;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .support-contact::before {
      content: '💬';
      font-size: 16px;
    }

    /* Footer */
    .footer {
      background: linear-gradient(135deg, oklch(0.205 0 0) 0%, oklch(0.145 0 0) 100%);
      padding: 32px 48px;
      text-align: center;
      color: oklch(0.708 0 0);
    }

    .footer-brand {
      font-size: 18px;
      font-weight: 600;
      color: oklch(0.985 0 0);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .footer-brand::before {
      content: '🎓';
      font-size: 20px;
    }

    .footer-text {
      font-size: 13px;
      line-height: 1.5;
    }

    /* Mobile responsiveness */
    @media only screen and (max-width: 768px) {
      .container {
        max-width: 100%;
        margin: 0 10px;
        border-radius: 12px;
      }

      .header {
        flex-direction: column;
        text-align: center;
        padding: 24px 20px;
      }

      .header-graphic {
        display: none;
      }

      .content {
        grid-template-columns: 1fr;
        gap: 24px;
        padding: 24px 20px;
      }

      .greeting {
        font-size: 22px;
        grid-column: 1;
      }

      .credentials-card {
        padding: 20px;
      }

      .credential-item {
        flex-direction: column;
        align-items: flex-start;
        padding: 12px 16px;
      }

      .credential-label {
        min-width: auto;
        margin-bottom: 4px;
      }

      .credential-value {
        width: 100%;
        text-align: left;
      }

      .cta-button {
        padding: 16px 28px;
        font-size: 15px;
      }

      .footer {
        padding: 24px 20px;
      }

      .security-notice,
      .action-section,
      .support-section {
        grid-column: 1;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      body,
      .email-wrapper {
        background-color: oklch(0.145 0 0);
      }

      .container {
        background-color: oklch(0.145 0 0);
        border-color: oklch(0.269 0 0);
      }

      .header {
        background: linear-gradient(135deg, oklch(0.85 0.14 152.0) 0%, oklch(0.749 0.169 162.4) 100%);
      }
      
      .content {
        background-color: oklch(0.145 0 0);
      }
      
      .greeting {
        color: oklch(0.985 0 0);
      }
      
      .intro-text {
        color: oklch(0.708 0 0);
      }
      
      .credentials-card {
        background: linear-gradient(135deg, oklch(0.269 0 0) 0%, oklch(0.205 0 0) 100%);
        border-color: oklch(0.269 0 0);
      }
      
      .credentials-title {
        color: oklch(0.985 0 0);
      }
      
      .credential-item {
        background-color: oklch(0.269 0 0);
        border-color: oklch(0.269 0 0);
      }

      .credential-item:hover {
        border-color: oklch(0.85 0.14 152.0);
      }
      
      .credential-label {
        color: oklch(0.708 0 0);
      }

      .credential-value {
        color: oklch(0.85 0.14 152.0);
        background-color: oklch(0.205 0 0);
        border-color: oklch(0.269 0 0);
      }

      .features-title {
        color: oklch(0.985 0 0);
      }

      .feature-item {
        background-color: oklch(0.205 0 0);
        border-color: oklch(0.269 0 0);
      }

      .feature-text {
        color: oklch(0.708 0 0);
      }

      .support-section {
        background: linear-gradient(135deg, oklch(0.205 0 0) 0%, oklch(0.269 0 0) 100%);
        border-color: oklch(0.269 0 0);
      }

      .support-text {
        color: oklch(0.708 0 0);
      }

      .support-contact {
        color: oklch(0.85 0.14 152.0);
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <div class="logo">EduPlatform</div>
          <div class="tagline">Your Gateway to Digital Learning Excellence</div>
        </div>
        <div class="header-graphic">📚</div>
      </div>

      <!-- Main Content -->
      <div class="content">
        <h1 class="greeting">Welcome to your learning journey, ${req.session.firstname}! 🌟</h1>
        
        <div class="content-left">
          <p class="intro-text">
            Your EduPlatform account is now active! You're about to embark on an exciting educational adventure with access to interactive courses, expert instructors, and a vibrant learning community.
          </p>

          <!-- Credentials Section -->
          <div class="credentials-card">
            <div class="credentials-title">Your Login Credentials</div>
            
            <div class="credential-item">
              <span class="credential-label">Email Address:</span>
              <span class="credential-value">${email}</span>
            </div>
            
            <div class="credential-item">
              <span class="credential-label">Temporary Password:</span>
              <span class="credential-value">${tempPassword}</span>
            </div>
          </div>
        </div>

        <!-- Security Notice -->
        <div class="security-notice">
          <span class="security-notice-icon">🔒</span>
          <div class="security-notice-text">
            <strong>Security First:</strong> This is a temporary password for your protection. Please log in and create a strong, unique password immediately. We recommend using a combination of uppercase letters, lowercase letters, numbers, and special characters (minimum 8 characters).
          </div>
        </div>

        <!-- Call to Action -->
        <div class="action-section">
          <a href="${process.env.FRONTEND_URL}" class="cta-button" style="color: oklch(0.145 0 0);">
            Start Learning Now
          </a>
        </div>

        <!-- Support Section -->
        <div class="support-section">
          <p class="support-text">Questions about getting started?</p>
          <a href="mailto:support@eduplatform.com" class="support-contact">Get help from our learning specialists</a>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-brand">EduPlatform</div>
        <div class="footer-text">
          This email was sent to ${req.session.firstname} ${req.session.lastname} (${email})<br>
          © ${new Date().getFullYear()} EduPlatform. Empowering minds, one lesson at a time.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;



    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: `Welcome ${req.session.firstname} ${req.session.lastname}`,
      html: emailContent,
    };

    return new Promise<boolean>((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending OTP email:', error);
          reject(false);
        } else {
          console.log(`OTP email sent to ${email}: ${info.response}`);
          resolve(true);
        }
      });
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
};


export const sendOtpEmail = async (email: string, lastName: string, firstName: string, otp: string): Promise<boolean> => {

  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
    console.error("GMAIL creds missing");
    return false;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>EduPlatform - Your Security Code</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    /* Base styles */
    body {
      background-color: oklch(0.97 0 0);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Email wrapper - landscape orientation */
    .email-wrapper {
      background-color: oklch(0.97 0 0);
      padding: 20px 10px;
      min-height: 100vh;
    }

    /* Main container - wider for landscape */
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: oklch(1 0 0);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
      border: 1px solid oklch(0.922 0 0);
    }

    /* Header section - landscape layout */
    .header {
      background: linear-gradient(135deg, oklch(0.77 0.17 152.0) 0%, oklch(0.649 0.169 162.4) 100%);
      padding: 28px 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: white;
      position: relative;
      overflow: hidden;
    }

    .header::before {
      content: '';
      position: absolute;
      top: -30%;
      right: -15%;
      width: 150px;
      height: 150px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      z-index: 0;
    }

    .header-content {
      z-index: 1;
      flex: 1;
    }

    .logo {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logo::before {
      content: '🛡️';
      font-size: 28px;
    }

    .tagline {
      font-size: 14px;
      opacity: 0.95;
      font-weight: 400;
    }

    .header-graphic {
      z-index: 1;
      font-size: 80px;
      opacity: 0.2;
      line-height: 1;
    }

    /* Content section - landscape grid */
    .content {
      padding: 36px 48px;
      display: grid;
      gap: 36px;
      align-items: start;
    }

    .content-left {
      display: flex;
      flex-direction: column;
    }

    .content-right {
      display: flex;
      flex-direction: column;
    }

    .greeting {
      font-size: 26px;
      font-weight: 600;
      color: oklch(0.145 0 0);
      margin-bottom: 16px;
      line-height: 1.2;
      grid-column: 1 / -1;
    }

    .intro-text {
      font-size: 16px;
      color: oklch(0.556 0 0);
      margin-bottom: 28px;
      line-height: 1.6;
    }

    /* OTP Card */
    .otp-card {
      background: linear-gradient(135deg, oklch(0.97 0 0) 0%, oklch(0.985 0 0) 100%);
      border: 2px solid oklch(0.922 0 0);
      border-radius: 20px;
      padding: 36px 28px;
      text-align: center;
      position: relative;
      overflow: hidden;
      box-shadow: 0 8px 25px rgba(34, 197, 94, 0.1);
    }

    .otp-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, oklch(0.77 0.17 152.0), oklch(0.649 0.169 162.4));
    }

    .otp-card::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(34, 197, 94, 0.03) 0%, transparent 70%);
      z-index: 0;
    }

    .otp-title {
      font-size: 18px;
      font-weight: 600;
      color: oklch(0.145 0 0);
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 1;
    }

    .otp-title::before {
      content: '🔐';
      margin-right: 8px;
      font-size: 20px;
    }

    .otp-code {
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      font-size: 48px;
      font-weight: 800;
      color: oklch(0.77 0.17 152.0);
      letter-spacing: 10px;
      margin: 24px 0;
      padding: 20px 28px;
      background: linear-gradient(135deg, oklch(1 0 0) 0%, oklch(0.985 0 0) 100%);
      border-radius: 16px;
      border: 2px solid oklch(0.77 0.17 152.0);
      position: relative;
      z-index: 1;
      box-shadow: 0 4px 20px rgba(34, 197, 94, 0.15);
    }

    .otp-subtitle {
      font-size: 14px;
      color: oklch(0.556 0 0);
      margin-top: 16px;
      font-weight: 500;
      position: relative;
      z-index: 1;
    }

    /* Timer section */
    .timer-section {
      background: linear-gradient(135deg, oklch(0.985 0.05 70) 0%, oklch(0.97 0.05 70) 100%);
      border: 1px solid oklch(0.768 0.171 70.67);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .timer-icon {
      font-size: 22px;
      margin-right: 12px;
    }

    .timer-text {
      font-size: 15px;
      color: oklch(0.4 0.1 70);
      font-weight: 600;
    }

    .timer-highlight {
      color: oklch(0.577 0.245 27.325);
      font-weight: 700;
      font-size: 16px;
    }

    /* Instructions section */
    .instructions {
      background: linear-gradient(135deg, oklch(0.985 0 0) 0%, oklch(0.97 0 0) 100%);
      border-radius: 12px;
      padding: 24px;
      border: 1px solid oklch(0.922 0 0);
    }

    .instructions-title {
      font-size: 18px;
      font-weight: 600;
      color: oklch(0.145 0 0);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
    }

    .instructions-title::before {
      content: '📋';
      margin-right: 8px;
      font-size: 20px;
    }

    .instructions-list {
      font-size: 14px;
      color: oklch(0.556 0 0);
      line-height: 1.6;
      padding-left: 20px;
    }

    .instructions-list li {
      margin-bottom: 10px;
      padding-left: 8px;
    }

    .instructions-list li::marker {
      color: oklch(0.77 0.17 152.0);
      font-weight: 600;
    }

    /* Security notice */
    .security-notice {
      background: linear-gradient(135deg, oklch(0.985 0.05 162) 0%, oklch(0.97 0.05 162) 100%);
      border: 1px solid oklch(0.649 0.169 162.4);
      border-radius: 12px;
      padding: 20px;
      margin-top: 24px;
      display: flex;
      align-items: flex-start;
      grid-column: 1 / -1;
    }

    .security-notice-icon {
      font-size: 20px;
      margin-right: 12px;
      margin-top: 2px;
    }

    .security-notice-text {
      font-size: 14px;
      color: oklch(0.3 0.1 162);
      line-height: 1.5;
    }

    /* Learning tip section */
    .learning-tip {
      background: linear-gradient(135deg, oklch(0.985 0 0) 0%, oklch(0.97 0 0) 100%);
      border: 1px solid oklch(0.922 0 0);
      border-radius: 12px;
      padding: 20px;
      margin-top: 20px;
    }

    .learning-tip-title {
      font-size: 16px;
      font-weight: 600;
      color: oklch(0.145 0 0);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }

    .learning-tip-title::before {
      content: '💡';
      margin-right: 8px;
      font-size: 18px;
    }

    .learning-tip-text {
      font-size: 14px;
      color: oklch(0.556 0 0);
      line-height: 1.5;
    }

    /* Footer */
    .footer {
      background: linear-gradient(135deg, oklch(0.205 0 0) 0%, oklch(0.145 0 0) 100%);
      padding: 28px 48px;
      text-align: center;
      color: oklch(0.708 0 0);
    }

    .footer-brand {
      font-size: 18px;
      font-weight: 600;
      color: oklch(0.985 0 0);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .footer-brand::before {
      content: '🎓';
      font-size: 20px;
    }

    .footer-text {
      font-size: 13px;
      line-height: 1.5;
    }

    /* Mobile responsiveness */
    @media only screen and (max-width: 768px) {
      .container {
        max-width: 100%;
        margin: 0 10px;
        border-radius: 12px;
      }

      .header {
        flex-direction: column;
        text-align: center;
        padding: 20px;
      }

      .header-graphic {
        display: none;
      }

      .content {
        grid-template-columns: 1fr;
        gap: 20px;
        padding: 24px 20px;
      }

      .greeting {
        font-size: 22px;
        grid-column: 1;
      }

      .otp-card {
        padding: 28px 20px;
      }

      .otp-code {
        font-size: 36px;
        letter-spacing: 6px;
        padding: 16px 20px;
      }

      .timer-section {
        flex-direction: column;
        text-align: center;
        padding: 16px;
      }

      .timer-icon {
        margin-right: 0;
        margin-bottom: 8px;
      }

      .instructions {
        padding: 20px;
      }

      .footer {
        padding: 20px;
      }

      .security-notice {
        grid-column: 1;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      body,
      .email-wrapper {
        background-color: oklch(0.145 0 0);
      }

      .container {
        background-color: oklch(0.145 0 0);
        border-color: oklch(0.269 0 0);
      }

      .header {
        background: linear-gradient(135deg, oklch(0.85 0.14 152.0) 0%, oklch(0.749 0.169 162.4) 100%);
      }
      
      .content {
        background-color: oklch(0.145 0 0);
      }
      
      .greeting {
        color: oklch(0.985 0 0);
      }
      
      .intro-text {
        color: oklch(0.708 0 0);
      }
      
      .otp-card {
        background: linear-gradient(135deg, oklch(0.269 0 0) 0%, oklch(0.205 0 0) 100%);
        border-color: oklch(0.269 0 0);
      }
      
      .otp-title {
        color: oklch(0.985 0 0);
      }

      .otp-code {
        color: oklch(0.85 0.14 152.0);
        background: linear-gradient(135deg, oklch(0.205 0 0) 0%, oklch(0.269 0 0) 100%);
        border-color: oklch(0.85 0.14 152.0);
      }

      .otp-subtitle {
        color: oklch(0.708 0 0);
      }

      .timer-section {
        background: linear-gradient(135deg, oklch(0.205 0.05 70) 0%, oklch(0.269 0.05 70) 100%);
        border-color: oklch(0.868 0.171 70.67);
      }

      .timer-text {
        color: oklch(0.6 0.1 70);
      }

      .timer-highlight {
        color: oklch(0.677 0.245 27.325);
      }
      
      .instructions {
        background: linear-gradient(135deg, oklch(0.205 0 0) 0%, oklch(0.269 0 0) 100%);
        border-color: oklch(0.269 0 0);
      }
      
      .instructions-title {
        color: oklch(0.985 0 0);
      }
      
      .instructions-list {
        color: oklch(0.708 0 0);
      }

      .learning-tip {
        background: linear-gradient(135deg, oklch(0.205 0 0) 0%, oklch(0.269 0 0) 100%);
        border-color: oklch(0.269 0 0);
      }

      .learning-tip-title {
        color: oklch(0.985 0 0);
      }

      .learning-tip-text {
        color: oklch(0.708 0 0);
      }

      .security-notice {
        background: linear-gradient(135deg, oklch(0.205 0.05 162) 0%, oklch(0.269 0.05 162) 100%);
        border-color: oklch(0.749 0.169 162.4);
      }

      .security-notice-text {
        color: oklch(0.7 0.1 162);
      }
    }

    /* Animation for OTP code */
    @keyframes pulse-glow {
      0% { 
        transform: scale(1);
        box-shadow: 0 4px 20px rgba(34, 197, 94, 0.15);
      }
      50% { 
        transform: scale(1.02);
        box-shadow: 0 6px 25px rgba(34, 197, 94, 0.25);
      }
      100% { 
        transform: scale(1);
        box-shadow: 0 4px 20px rgba(34, 197, 94, 0.15);
      }
    }

    .otp-code {
      animation: pulse-glow 3s ease-in-out infinite;
    }

    /* Hover effects */
    .otp-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(34, 197, 94, 0.15);
      transition: all 0.3s ease;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <div class="logo">EduPlatform</div>
          <div class="tagline">Secure Learning Access</div>
        </div>
        <div class="header-graphic">🔐</div>
      </div>

      <!-- Main Content -->
      <div class="content">
        <h1 class="greeting">Secure Access Code Required 🔒</h1>
        
        <div class="content-left">
          <p class="intro-text">
            Hi <strong>${firstName}</strong>, we've generated a secure verification code to protect your learning account. Please use the code below to complete your authentication and access your courses.
          </p>

          <!-- OTP Card -->
          <div class="otp-card">
            <div class="otp-title">Your Verification Code</div>
            <div class="otp-code">${otp}</div>
            <div class="otp-subtitle">Enter this code on your login screen</div>
          </div>

          <!-- Timer Section -->
          <div class="timer-section">
            <span class="timer-icon">⏱️</span>
            <div class="timer-text">
              Code expires in <span class="timer-highlight">10 minutes</span>
            </div>
          </div>
        </div>


        <!-- Security Notice -->
        <div class="security-notice">
          <span class="security-notice-icon">🛡️</span>
          <div class="security-notice-text">
            <strong>Didn't request this code?</strong> If you didn't try to log into your EduPlatform account, you can safely ignore this email. Your learning account remains secure and protected.
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-brand">EduPlatform</div>
        <div class="footer-text">
          Security code requested for ${firstName} ${lastName}<br>
          © ${new Date().getFullYear()} EduPlatform. Empowering secure learning experiences.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Your Login OTP",
    html,
  };

  return new Promise<boolean>((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending OTP email:", error);
        reject(false);
      } else {
        resolve(true);
      }
    });
  });
};


// Function to invalidate OTP for a specific email
export const invalidateOtp = (req: Request, email: string): void => {
  if (req.session.otpEmail === email) {
    delete req.session.otp;
    delete req.session.otpEmail;
    delete req.session.otpExpiry;
    console.log(`OTP invalidated for email: ${email}`); // Add logging
  } else {
    console.log(`Email in session (${req.session.otpEmail}) does not match provided email (${email}). OTP not invalidated.`);
  }
};

export const sendResetPasswordEmail = async (email: string, resetToken: string, frontendBaseUrl: string) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
    console.error("Missing GMAIL creds");
    return;
  }

  const resetUrl = `${frontendBaseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>EduPlatform - Password Reset Request</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    /* Base styles */
    body {
      background-color: oklch(0.97 0 0);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Email wrapper - landscape orientation */
    .email-wrapper {
      background-color: oklch(0.97 0 0);
      padding: 20px 10px;
      min-height: 100vh;
    }

    /* Main container - wider for landscape */
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: oklch(1 0 0);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
      border: 1px solid oklch(0.922 0 0);
    }

    /* Header section - landscape layout */
    .header {
      background: linear-gradient(135deg, oklch(0.77 0.17 152.0) 0%, oklch(0.649 0.169 162.4) 100%);
      padding: 32px 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: white;
      position: relative;
      overflow: hidden;
    }

    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: shimmer 4s ease-in-out infinite;
    }

    @keyframes shimmer {
      0%, 100% { transform: translateX(-100%) rotate(0deg); }
      50% { transform: translateX(100%) rotate(180deg); }
    }

    .header-content {
      z-index: 1;
      flex: 1;
    }

    .logo {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
      z-index: 1;
    }

    .logo::before {
      content: '🔐';
      font-size: 32px;
    }

    .tagline {
      font-size: 16px;
      opacity: 0.95;
      font-weight: 400;
      position: relative;
      z-index: 1;
    }

    .header-graphic {
      z-index: 1;
      font-size: 100px;
      opacity: 0.2;
      line-height: 1;
    }

    /* Content section - landscape grid */
    .content {
      padding: 40px 48px;
      display: grid;
      gap: 40px;
      align-items: start;
    }

    .content-left {
      display: flex;
      flex-direction: column;
    }

    .greeting {
      font-size: 28px;
      font-weight: 600;
      color: oklch(0.145 0 0);
      margin-bottom: 16px;
      line-height: 1.2;
      grid-column: 1 / -1;
    }

    .intro-text {
      font-size: 16px;
      color: oklch(0.556 0 0);
      margin-bottom: 28px;
      line-height: 1.6;
    }

    /* Security alert card */
    .security-card {
      background: linear-gradient(135deg, oklch(0.985 0.05 70) 0%, oklch(0.97 0.05 70) 100%);
      border: 2px solid oklch(0.768 0.171 70.67);
      border-radius: 16px;
      padding: 28px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(251, 146, 60, 0.1);
    }

    .security-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, oklch(0.768 0.171 70.67), oklch(0.627 0.118 70.67));
    }

    .security-header {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }

    .security-icon {
      font-size: 24px;
      margin-right: 12px;
    }

    .security-title {
      font-size: 18px;
      font-weight: 600;
      color: oklch(0.4 0.1 70);
    }

    .security-text {
      font-size: 14px;
      color: oklch(0.4 0.1 70);
      line-height: 1.5;
    }

    /* Reset instructions */
    .reset-instructions {
      background: linear-gradient(135deg, oklch(0.985 0.05 162) 0%, oklch(0.97 0.05 162) 100%);
      border: 1px solid oklch(0.649 0.169 162.4);
      border-radius: 16px;
      padding: 28px;
      box-shadow: 0 4px 20px rgba(34, 197, 94, 0.08);
    }

    .instructions-title {
      font-size: 18px;
      font-weight: 600;
      color: oklch(0.145 0 0);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
    }

    .instructions-title::before {
      content: '🔑';
      margin-right: 8px;
      font-size: 20px;
    }

    .instructions-text {
      font-size: 14px;
      color: oklch(0.3 0.1 162);
      line-height: 1.5;
      margin-bottom: 24px;
    }

    /* Action button */
    .action-section {
      text-align: center;
      margin-bottom: 16px;
    }

    .reset-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, oklch(0.77 0.17 152.0) 0%, oklch(0.649 0.169 162.4) 100%);
      color: oklch(0.145 0 0);
      text-decoration: none;
      padding: 18px 36px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(34, 197, 94, 0.25);
      letter-spacing: 0.3px;
      position: relative;
      overflow: hidden;
    }

    .reset-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.5s;
    }

    .reset-button:hover::before {
      left: 100%;
    }

    .reset-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(34, 197, 94, 0.35);
    }

    .button-note {
      font-size: 12px;
      color: oklch(0.556 0 0);
      font-style: italic;
      margin-top: 8px;
    }

    /* Expiry notice */
    .expiry-notice {
      background: linear-gradient(135deg, oklch(0.985 0.05 70) 0%, oklch(0.97 0.05 70) 100%);
      border: 1px solid oklch(0.768 0.171 70.67);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      box-shadow: 0 2px 10px rgba(251, 146, 60, 0.1);
    }

    .expiry-icon {
      font-size: 22px;
      margin-right: 12px;
    }

    .expiry-text {
      font-size: 13px;
      color: oklch(0.4 0.1 70);
      line-height: 1.4;
    }

    /* Learning tip section */
    .learning-tip {
      background: linear-gradient(135deg, oklch(0.985 0 0) 0%, oklch(0.97 0 0) 100%);
      border: 1px solid oklch(0.922 0 0);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
    }

    .learning-tip-title {
      font-size: 16px;
      font-weight: 600;
      color: oklch(0.145 0 0);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }

    .learning-tip-title::before {
      content: '🎓';
      margin-right: 8px;
      font-size: 18px;
    }

    .learning-tip-text {
      font-size: 14px;
      color: oklch(0.556 0 0);
      line-height: 1.5;
    }

    /* Alternative section */
    .alternative-section {
      background: linear-gradient(135deg, oklch(0.985 0 0) 0%, oklch(0.97 0 0) 100%);
      border-radius: 12px;
      padding: 24px;
      border: 1px solid oklch(0.922 0 0);
      grid-column: 1 / -1;
      margin-top: 24px;
    }

    .alternative-title {
      font-size: 18px;
      font-weight: 600;
      color: oklch(0.145 0 0);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }

    .alternative-title::before {
      content: '❓';
      margin-right: 8px;
      font-size: 18px;
    }

    .alternative-text {
      font-size: 14px;
      color: oklch(0.556 0 0);
      margin-bottom: 8px;
      line-height: 1.5;
    }

    .alternative-link {
      font-size: 14px;
      color: oklch(0.77 0.17 152.0);
      text-decoration: none;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .alternative-link::before {
      content: '💬';
      font-size: 14px;
    }

    /* Support section */
    .support-section {
      background: linear-gradient(135deg, oklch(0.985 0 0) 0%, oklch(0.97 0 0) 100%);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      border: 1px solid oklch(0.922 0 0);
      grid-column: 1 / -1;
      margin-top: 20px;
    }

    .support-text {
      font-size: 14px;
      color: oklch(0.556 0 0);
      margin-bottom: 8px;
    }

    .support-contact {
      font-size: 14px;
      color: oklch(0.77 0.17 152.0);
      text-decoration: none;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .support-contact::before {
      content: '🎧';
      font-size: 16px;
    }

    /* Footer */
    .footer {
      background: linear-gradient(135deg, oklch(0.205 0 0) 0%, oklch(0.145 0 0) 100%);
      padding: 32px 48px;
      text-align: center;
      color: oklch(0.708 0 0);
    }

    .footer-brand {
      font-size: 18px;
      font-weight: 600;
      color: oklch(0.985 0 0);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .footer-brand::before {
      content: '🎓';
      font-size: 20px;
    }

    .footer-text {
      font-size: 13px;
      line-height: 1.5;
    }

    /* Mobile responsiveness */
    @media only screen and (max-width: 768px) {
      .container {
        max-width: 100%;
        margin: 0 10px;
        border-radius: 12px;
      }

      .header {
        flex-direction: column;
        text-align: center;
        padding: 24px 20px;
      }

      .header-graphic {
        display: none;
      }

      .content {
        grid-template-columns: 1fr;
        gap: 24px;
        padding: 24px 20px;
      }

      .greeting {
        font-size: 22px;
        grid-column: 1;
      }

      .security-card,
      .reset-instructions {
        padding: 20px;
      }

      .reset-button {
        padding: 16px 28px;
        font-size: 15px;
      }

      .security-header {
        flex-direction: column;
        text-align: center;
      }

      .security-icon {
        margin-right: 0;
        margin-bottom: 8px;
      }

      .expiry-notice {
        flex-direction: column;
        text-align: center;
        padding: 16px;
      }

      .expiry-icon {
        margin-right: 0;
        margin-bottom: 8px;
      }

      .footer {
        padding: 24px 20px;
      }

      .alternative-section,
      .support-section {
        grid-column: 1;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      body,
      .email-wrapper {
        background-color: oklch(0.145 0 0);
      }

      .container {
        background-color: oklch(0.145 0 0);
        border-color: oklch(0.269 0 0);
      }

      .header {
        background: linear-gradient(135deg, oklch(0.85 0.14 152.0) 0%, oklch(0.749 0.169 162.4) 100%);
      }
      
      .content {
        background-color: oklch(0.145 0 0);
      }
      
      .greeting {
        color: oklch(0.985 0 0);
      }
      
      .intro-text {
        color: oklch(0.708 0 0);
      }

      .security-card {
        background: linear-gradient(135deg, oklch(0.205 0.05 70) 0%, oklch(0.269 0.05 70) 100%);
        border-color: oklch(0.868 0.171 70.67);
      }

      .security-title {
        color: oklch(0.6 0.1 70);
      }

      .security-text {
        color: oklch(0.6 0.1 70);
      }

      .reset-instructions {
        background: linear-gradient(135deg, oklch(0.205 0.05 162) 0%, oklch(0.269 0.05 162) 100%);
        border-color: oklch(0.749 0.169 162.4);
      }

      .instructions-title {
        color: oklch(0.985 0 0);
      }

      .instructions-text {
        color: oklch(0.7 0.1 162);
      }

      .expiry-notice {
        background: linear-gradient(135deg, oklch(0.205 0.05 70) 0%, oklch(0.269 0.05 70) 100%);
        border-color: oklch(0.868 0.171 70.67);
      }

      .expiry-text {
        color: oklch(0.6 0.1 70);
      }

      .learning-tip {
        background: linear-gradient(135deg, oklch(0.205 0 0) 0%, oklch(0.269 0 0) 100%);
        border-color: oklch(0.269 0 0);
      }

      .learning-tip-title {
        color: oklch(0.985 0 0);
      }

      .learning-tip-text {
        color: oklch(0.708 0 0);
      }
      
      .alternative-section,
      .support-section {
        background: linear-gradient(135deg, oklch(0.205 0 0) 0%, oklch(0.269 0 0) 100%);
        border-color: oklch(0.269 0 0);
      }
      
      .alternative-title {
        color: oklch(0.985 0 0);
      }
      
      .alternative-text,
      .support-text {
        color: oklch(0.708 0 0);
      }

      .alternative-link,
      .support-contact {
        color: oklch(0.85 0.14 152.0);
      }

      .button-note {
        color: oklch(0.708 0 0);
      }
    }

    /* Enhanced animations */
    @keyframes pulse-security {
      0% { 
        transform: scale(1);
        box-shadow: 0 4px 20px rgba(251, 146, 60, 0.1);
      }
      50% { 
        transform: scale(1.01);
        box-shadow: 0 6px 25px rgba(251, 146, 60, 0.15);
      }
      100% { 
        transform: scale(1);
        box-shadow: 0 4px 20px rgba(251, 146, 60, 0.1);
      }
    }

    .security-card:hover {
      animation: pulse-security 2s ease-in-out;
    }

    .reset-instructions:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(34, 197, 94, 0.12);
      transition: all 0.3s ease;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <div class="logo">EduPlatform</div>
          <div class="tagline">Secure Learning Access Recovery</div>
        </div>
        <div class="header-graphic">🔑</div>
      </div>

      <!-- Main Content -->
      <div class="content">
        <h1 class="greeting">Reset Your Learning Password 🔐</h1>

        <div class="content-right">
          <!-- Reset Instructions -->
          <div class="reset-instructions">
            <div class="instructions-title">Reset Your Password</div>
            <div class="instructions-text">
              Click the secure button below to create a new password for your learning account. You'll be taken to a protected page where you can safely update your credentials.
            </div>

            <!-- Call to Action -->
            <div class="action-section">
              <a href="\${resetUrl}" class="reset-button" style="color: oklch(0.145 0 0)">
                Reset Password Now
              </a>
            </div>
            <div class="button-note">This link redirects to our secure password reset portal</div>
          </div>

          <!-- Learning Tip -->
          <div class="learning-tip">
            <div class="learning-tip-title">Password Security Tip</div>
            <div class="learning-tip-text">
              Create a strong password with at least 8 characters, including uppercase letters, numbers, and symbols. Consider using a passphrase related to your learning goals!
            </div>
          </div>
        </div>

        <!-- Alternative Section -->
        <div class="alternative-section">
          <div class="alternative-title">Didn't Request This Reset?</div>
          <div class="alternative-text">
            If you didn't request a password reset, you can safely ignore this email. Your EduPlatform account remains secure and no changes have been made to your learning progress or profile.
          </div>
          <div class="alternative-text">
            If you're concerned about your account security, please reach out to our dedicated learning support team:
          </div>
          <a href="mailto:support@eduplatform.com" class="alternative-link">Contact Learning Support</a>
        </div>

        <!-- Support Section -->
        <div class="support-section">
          <p class="support-text">Need help with your password reset or have questions?</p>
          <a href="mailto:support@eduplatform.com" class="support-contact">Get help from our learning specialists</a>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-brand">EduPlatform</div>
        <div class="footer-text">
          This email was sent because a password reset was requested for your learning account.<br>
          © \${new Date().getFullYear()} EduPlatform. Empowering secure learning experiences worldwide.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Password Reset Instructions',
    html: htmlContent,
  });
};


