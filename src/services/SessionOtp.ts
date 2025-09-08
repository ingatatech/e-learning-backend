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
  <title>Welcome to FMS - Your Account is Ready</title>
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
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Email wrapper */
    .email-wrapper {
      background-color: #f8fafc;
      padding: 40px 20px;
      min-height: 100vh;
    }

    /* Main container */
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }

    /* Header section */
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 40px 30px;
      text-align: center;
      color: white;
    }

    .logo {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }

    .tagline {
      font-size: 16px;
      opacity: 0.9;
      font-weight: 400;
    }

    /* Content section */
    .content {
      padding: 40px;
    }

    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 16px;
      line-height: 1.3;
    }

    .intro-text {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 32px;
      line-height: 1.6;
    }

    /* Credentials card */
    .credentials-card {
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 28px;
      margin: 32px 0;
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
      background: linear-gradient(90deg, #667eea, #764ba2);
    }

    .credentials-title {
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
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
      padding: 12px 16px;
      background-color: white;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .credential-item:last-child {
      margin-bottom: 0;
    }

    .credential-label {
      font-weight: 600;
      color: #4a5568;
      min-width: 120px;
      font-size: 14px;
    }

    .credential-value {
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      color: #667eea;
      font-weight: 600;
      background-color: #f7fafc;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 14px;
      word-break: break-all;
    }

    /* Security notice */
    .security-notice {
      background-color: #fef5e7;
      border: 1px solid #f6ad55;
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
      display: flex;
      align-items: flex-start;
    }

    .security-notice-icon {
      font-size: 20px;
      margin-right: 12px;
      margin-top: 2px;
    }

    .security-notice-text {
      font-size: 14px;
      color: #744210;
      line-height: 1.5;
    }

    /* Action button */
    .action-section {
      text-align: center;
      margin: 32px 0;
    }

    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      letter-spacing: 0.3px;
    }

    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    /* Support section */
    .support-section {
      background-color: #f7fafc;
      border-radius: 8px;
      padding: 20px;
      margin-top: 32px;
      text-align: center;
    }

    .support-text {
      font-size: 14px;
      color: #4a5568;
      margin-bottom: 8px;
    }

    .support-contact {
      font-size: 14px;
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }

    /* Footer */
    .footer {
      background-color: #2d3748;
      padding: 32px 40px;
      text-align: center;
      color: #a0aec0;
    }

    .footer-brand {
      font-size: 18px;
      font-weight: 600;
      color: white;
      margin-bottom: 8px;
    }

    .footer-text {
      font-size: 13px;
      line-height: 1.5;
    }

    /* Mobile responsiveness */
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 10px;
      }
      
      .header,
      .content,
      .footer {
        padding-left: 24px;
        padding-right: 24px;
      }

      .credentials-card {
        padding: 20px;
      }

      .credential-item {
        flex-direction: column;
        align-items: flex-start;
      }

      .credential-label {
        min-width: auto;
        margin-bottom: 4px;
      }

      .credential-value {
        width: 100%;
        text-align: left;
      }

      .greeting {
        font-size: 20px;
      }

      .cta-button {
        padding: 14px 28px;
        font-size: 15px;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .container {
        background-color: #1a202c;
        border-color: #2d3748;
      }
      
      .content {
        background-color: #1a202c;
      }
      
      .greeting {
        color: #f7fafc;
      }
      
      .intro-text {
        color: #a0aec0;
      }
      
      .credentials-card {
        background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
        border-color: #4a5568;
      }
      
      .credentials-title {
        color: #f7fafc;
      }
      
      .credential-item {
        background-color: #2d3748;
        border-color: #4a5568;
      }
      
      .credential-label {
        color: #a0aec0;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="logo">FMS</div>
        <div class="tagline">File Management System</div>
      </div>

      <!-- Main Content -->
      <div class="content">
        <h1 class="greeting">Welcome aboard, ${req.session.firstname}! 🎉</h1>
        
        <p class="intro-text">
          Your File Management System account has been successfully created. You now have secure access to our comprehensive file management platform designed to streamline your workflow.
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

        <!-- Security Notice -->
        <div class="security-notice">
          <span class="security-notice-icon">🔒</span>
          <div class="security-notice-text">
            <strong>Important Security Notice:</strong> This is a temporary password. For your account security, please change it immediately after your first login. Choose a strong password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.
          </div>
        </div>

        <!-- Call to Action -->
        <div class="action-section">
          <a href="${process.env.FRONTEND_URL}" class="cta-button" style="color: #fff;">
            Access Your Account →
          </a>
        </div>

        <!-- Support Section -->
        <div class="support-section">
          <p class="support-text">Need assistance getting started?</p>
          <a href="mailto:support@fms.com" class="support-contact">Contact our support team</a>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-brand">File Management System</div>
        <div class="footer-text">
          This email was sent to ${req.session.firstname} ${req.session.lastname} (${email})<br>
          © ${new Date().getFullYear()} FMS. All rights reserved.
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
    console.error("GMAIL creds missing 💀");
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
  <title>FMS - Your Security Code</title>
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
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Email wrapper */
    .email-wrapper {
      background-color: #f8fafc;
      padding: 40px 20px;
      min-height: 100vh;
    }

    /* Main container */
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }

    /* Header section */
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 32px 40px 24px;
      text-align: center;
      color: white;
    }

    .logo {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 6px;
    }

    .tagline {
      font-size: 14px;
      opacity: 0.9;
      font-weight: 400;
    }

    /* Content section */
    .content {
      padding: 40px;
    }

    .greeting {
      font-size: 22px;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 16px;
      line-height: 1.3;
    }

    .intro-text {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 32px;
      line-height: 1.6;
    }

    /* OTP Card */
    .otp-card {
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      padding: 32px;
      margin: 32px 0;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .otp-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea, #764ba2);
    }

    .otp-title {
      font-size: 16px;
      font-weight: 600;
      color: #4a5568;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .otp-title::before {
      content: '🔐';
      margin-right: 8px;
      font-size: 18px;
    }

    .otp-code {
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      font-size: 42px;
      font-weight: 800;
      color: #667eea;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: 8px;
      margin: 20px 0;
      padding: 16px 24px;
      background-color: white;
      border-radius: 12px;
      border: 2px dashed #cbd5e0;
      position: relative;
    }

    .otp-subtitle {
      font-size: 14px;
      color: #718096;
      margin-top: 16px;
    }

    /* Timer section */
    .timer-section {
      background-color: #fef5e7;
      border: 1px solid #f6ad55;
      border-radius: 10px;
      padding: 20px;
      margin: 24px 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .timer-icon {
      font-size: 20px;
      margin-right: 12px;
    }

    .timer-text {
      font-size: 15px;
      color: #744210;
      font-weight: 600;
    }

    .timer-highlight {
      color: #c53030;
      font-weight: 700;
    }

    /* Security notice */
    .security-notice {
      background-color: #e6fffa;
      border: 1px solid #38b2ac;
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
      display: flex;
      align-items: flex-start;
    }

    .security-notice-icon {
      font-size: 18px;
      margin-right: 12px;
      margin-top: 2px;
    }

    .security-notice-text {
      font-size: 14px;
      color: #234e52;
      line-height: 1.5;
    }

    /* Instructions section */
    .instructions {
      background-color: #f7fafc;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }

    .instructions-title {
      font-size: 16px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }

    .instructions-title::before {
      content: '📋';
      margin-right: 8px;
    }

    .instructions-list {
      font-size: 14px;
      color: #4a5568;
      line-height: 1.6;
    }

    .instructions-list li {
      margin-bottom: 8px;
      padding-left: 4px;
    }

    /* Footer */
    .footer {
      background-color: #2d3748;
      padding: 24px 40px;
      text-align: center;
      color: #a0aec0;
    }

    .footer-brand {
      font-size: 16px;
      font-weight: 600;
      color: white;
      margin-bottom: 6px;
    }

    .footer-text {
      font-size: 12px;
      line-height: 1.5;
    }

    /* Mobile responsiveness */
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 10px;
      }
      
      .header,
      .content,
      .footer {
        padding-left: 24px;
        padding-right: 24px;
      }

      .otp-card {
        padding: 24px 16px;
      }

      .otp-code {
        font-size: 36px;
        letter-spacing: 6px;
        padding: 12px 16px;
      }

      .greeting {
        font-size: 20px;
      }

      .timer-section,
      .security-notice,
      .instructions {
        padding: 16px;
      }

      .timer-section {
        flex-direction: column;
        text-align: center;
      }

      .timer-icon {
        margin-right: 0;
        margin-bottom: 8px;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .container {
        background-color: #1a202c;
        border-color: #2d3748;
      }
      
      .content {
        background-color: #1a202c;
      }
      
      .greeting {
        color: #f7fafc;
      }
      
      .intro-text {
        color: #a0aec0;
      }
      
      .otp-card {
        background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
        border-color: #4a5568;
      }
      
      .otp-title {
        color: #f7fafc;
      }

      .otp-code {
        background-color: #2d3748;
        border-color: #4a5568;
      }
      
      .instructions {
        background-color: #2d3748;
      }
      
      .instructions-title {
        color: #f7fafc;
      }
      
      .instructions-list {
        color: #a0aec0;
      }
    }

    /* Animation for OTP code */
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    .otp-code {
      animation: pulse 2s ease-in-out infinite;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="logo">FMS</div>
        <div class="tagline">File Management System</div>
      </div>

      <!-- Main Content -->
      <div class="content">
        <h1 class="greeting">Security Code Required 🔒</h1>
        
        <p class="intro-text">
          Hi <strong>${firstName}</strong>, we've generated a secure one-time password to complete your authentication. Please use the code below to proceed with your login.
        </p>

        <!-- OTP Card -->
        <div class="otp-card">
          <div class="otp-title">Your Verification Code</div>
          <div class="otp-code">${otp}</div>
          <div class="otp-subtitle">Enter this code in your login screen</div>
        </div>

        <!-- Timer Section -->
        <div class="timer-section">
          <span class="timer-icon">⏱️</span>
          <div class="timer-text">
            This code expires in <span class="timer-highlight">10 minutes</span>
          </div>
        </div>

        <!-- Instructions -->
        <div class="instructions">
          <div class="instructions-title">How to use this code:</div>
          <ol class="instructions-list">
            <li>Return to the FMS login page where you requested this code</li>
            <li>Enter the 6-digit code exactly as shown above</li>
            <li>Complete your secure login process</li>
          </ol>
        </div>

        <!-- Security Notice -->
        <div class="security-notice">
          <span class="security-notice-icon">🛡️</span>
          <div class="security-notice-text">
            <strong>Security Notice:</strong> If you didn't request this verification code, please ignore this email. Your account remains secure, and no action is needed from your end.
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-brand">File Management System</div>
        <div class="footer-text">
          This security code was requested for ${firstName} ${lastName}<br>
          © ${new Date().getFullYear()} FMS. All rights reserved.
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
    subject: "Your FMS Login OTP",
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

export const sendOrgCreatedEmail = async (email: string, orgName: string) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
    console.error("Missing GMAIL creds");
    return;
  }

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
  <title>FMS - Organization Successfully Created</title>
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
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Email wrapper */
    .email-wrapper {
      background-color: #f8fafc;
      padding: 40px 20px;
      min-height: 100vh;
    }

    /* Main container */
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }

    /* Header section */
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 40px 30px;
      text-align: center;
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
      animation: shimmer 3s ease-in-out infinite;
    }

    @keyframes shimmer {
      0%, 100% { transform: translateX(-100%); }
      50% { transform: translateX(100%); }
    }

    .logo {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
      position: relative;
      z-index: 1;
    }

    .tagline {
      font-size: 16px;
      opacity: 0.9;
      font-weight: 400;
      position: relative;
      z-index: 1;
    }

    /* Content section */
    .content {
      padding: 40px;
    }

    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 16px;
      line-height: 1.3;
    }

    .intro-text {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 32px;
      line-height: 1.6;
    }

    /* Organization card */
    .organization-card {
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      padding: 32px;
      margin: 32px 0;
      position: relative;
      overflow: hidden;
    }

    .organization-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea, #764ba2);
    }

    .org-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .org-icon {
      font-size: 48px;
      margin-bottom: 12px;
      display: block;
    }

    .org-name {
      font-size: 24px;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 8px;
      word-break: break-word;
    }

    .org-subtitle {
      font-size: 14px;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }

    /* Role section */
    .role-section {
      background-color: white;
      border-radius: 12px;
      padding: 20px;
      margin-top: 24px;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .role-info {
      display: flex;
      align-items: center;
    }

    .role-icon {
      font-size: 24px;
      margin-right: 12px;
    }

    .role-details {
      flex: 1;
    }

    .role-title {
      font-size: 16px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 4px;
    }

    .role-description {
      font-size: 13px;
      color: #718096;
    }

    .role-badge {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Next steps section */
    .next-steps {
      background-color: #f0f9ff;
      border: 1px solid #0ea5e9;
      border-radius: 12px;
      padding: 24px;
      margin: 32px 0;
    }

    .next-steps-title {
      font-size: 18px;
      font-weight: 600;
      color: #0c4a6e;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
    }

    .next-steps-title::before {
      content: '🚀';
      margin-right: 8px;
      font-size: 20px;
    }

    .steps-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .step-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 16px;
      padding: 12px;
      background-color: white;
      border-radius: 8px;
      border: 1px solid #e0f2fe;
    }

    .step-item:last-child {
      margin-bottom: 0;
    }

    .step-number {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .step-content {
      flex: 1;
    }

    .step-title {
      font-size: 14px;
      font-weight: 600;
      color: #0c4a6e;
      margin-bottom: 4px;
    }

    .step-description {
      font-size: 13px;
      color: #075985;
      line-height: 1.4;
    }

    /* Action button */
    .action-section {
      text-align: center;
      margin: 32px 0;
    }

    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      letter-spacing: 0.3px;
    }

    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    /* Support section */
    .support-section {
      background-color: #f7fafc;
      border-radius: 8px;
      padding: 20px;
      margin-top: 32px;
      text-align: center;
    }

    .support-text {
      font-size: 14px;
      color: #4a5568;
      margin-bottom: 8px;
    }

    .support-contact {
      font-size: 14px;
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }

    /* Footer */
    .footer {
      background-color: #2d3748;
      padding: 32px 40px;
      text-align: center;
      color: #a0aec0;
    }

    .footer-brand {
      font-size: 18px;
      font-weight: 600;
      color: white;
      margin-bottom: 8px;
    }

    .footer-text {
      font-size: 13px;
      line-height: 1.5;
    }

    /* Mobile responsiveness */
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 10px;
      }
      
      .header,
      .content,
      .footer {
        padding-left: 24px;
        padding-right: 24px;
      }

      .organization-card {
        padding: 24px 20px;
      }

      .org-name {
        font-size: 20px;
      }

      .role-section {
        flex-direction: column;
        text-align: center;
        padding: 16px;
      }

      .role-info {
        margin-bottom: 12px;
      }

      .step-item {
        flex-direction: column;
        text-align: center;
      }

      .step-number {
        margin-right: 0;
        margin-bottom: 8px;
      }

      .greeting {
        font-size: 20px;
      }

      .cta-button {
        padding: 14px 28px;
        font-size: 15px;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .container {
        background-color: #1a202c;
        border-color: #2d3748;
      }
      
      .content {
        background-color: #1a202c;
      }
      
      .greeting {
        color: #f7fafc;
      }
      
      .intro-text {
        color: #a0aec0;
      }
      
      .organization-card {
        background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
        border-color: #4a5568;
      }
      
      .org-name {
        color: #f7fafc;
      }
      
      .role-section {
        background-color: #2d3748;
        border-color: #4a5568;
      }
      
      .role-title {
        color: #f7fafc;
      }
      
      .step-item {
        background-color: #2d3748;
        border-color: #4a5568;
      }
      
      .support-section {
        background-color: #2d3748;
      }
      
      .support-text {
        color: #a0aec0;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="logo">FMS</div>
        <div class="tagline">File Management System</div>
      </div>

      <!-- Main Content -->
      <div class="content">
        <h1 class="greeting">Organization Successfully Created! 🎉</h1>
        
        <p class="intro-text">
          Congratulations! Your organization has been successfully set up in the File Management System. You're now ready to build and manage your team's digital workspace.
        </p>

        <!-- Organization Card -->
        <div class="organization-card">
          <div class="org-header">
            <div class="org-icon">🏢</div>
            <div class="org-name">${orgName}</div>
            <div class="org-subtitle">Your Organization</div>
          </div>

          <!-- Role Section -->
          <div class="role-section">
            <div class="role-info">
              <div class="role-icon">👑</div>
              <div class="role-details">
                <div class="role-title">Organization Administrator</div>
                <div class="role-description">Full access to all organization features</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Next Steps -->
        <div class="next-steps">
          <div class="next-steps-title">Get Started with Your Organization</div>
          <ul class="steps-list">
            <li class="step-item">
              <div class="step-content">
                <div class="step-title">Invite Team Members</div>
                <div class="step-description">Add your colleagues and assign appropriate roles to build your team</div>
              </div>
            </li>
            <li class="step-item">
              <div class="step-content">
                <div class="step-title">Set Up File Structure</div>
                <div class="step-description">Create folders and establish your organization's file management system</div>
              </div>
            </li>
            <li class="step-item">
              <div class="step-content">
                <div class="step-title">Configure Permissions</div>
                <div class="step-description">Set up access controls and permissions to keep your files secure</div>
              </div>
            </li>
          </ul>
        </div>

        <!-- Call to Action -->
        <div class="action-section">
          <a href="${process.env.FRONTEND_URL}" class="cta-button" style="color: #fff; text-decoration: none;">
            Manage Your Organization →
          </a>
        </div>

        <!-- Support Section -->
        <div class="support-section">
          <p class="support-text">Need help setting up your organization?</p>
          <a href="mailto:support@fms.com" class="support-contact">Contact our support team</a>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-brand">File Management System</div>
        <div class="footer-text">
          Organization created for ${orgName}<br>
          © ${new Date().getFullYear()} FMS. All rights reserved.
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
    subject: `Organization "${orgName}" Created`,
    html: htmlContent,
  });
};

export const sendOrgTransferEmail = async (email: string, orgName: string) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
    console.error("Missing GMAIL creds");
    return;
  }

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
  <title>FMS - You Are Now System Administrator</title>
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
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Email wrapper */
    .email-wrapper {
      background-color: #f8fafc;
      padding: 40px 20px;
      min-height: 100vh;
    }

    /* Main container */
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }

    /* Header section */
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 40px 40px 30px;
      text-align: center;
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
      background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
      animation: pulse 4s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.05); }
    }

    .logo {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
      position: relative;
      z-index: 1;
    }

    .tagline {
      font-size: 16px;
      opacity: 0.9;
      font-weight: 400;
      position: relative;
      z-index: 1;
    }

    /* Content section */
    .content {
      padding: 40px;
    }

    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 16px;
      line-height: 1.3;
    }

    .intro-text {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 32px;
      line-height: 1.6;
    }

    /* Promotion banner */
    .promotion-banner {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 2px solid #f59e0b;
      border-radius: 16px;
      padding: 32px;
      margin: 32px 0;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .promotion-banner::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #f59e0b, #d97706);
    }

    .promotion-icon {
      font-size: 64px;
      margin-bottom: 16px;
      display: block;
      animation: bounce 2s ease-in-out infinite;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .promotion-title {
      font-size: 28px;
      font-weight: 800;
      color: #92400e;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .promotion-subtitle {
      font-size: 16px;
      color: #a16207;
      font-weight: 500;
    }

    /* Organization details */
    .organization-details {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 28px;
      margin: 32px 0;
      position: relative;
      overflow: hidden;
    }

    .organization-details::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #10b981, #059669);
    }

    .org-header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }

    .org-icon {
      font-size: 32px;
      margin-right: 12px;
    }

    .org-info {
      flex: 1;
    }

    .org-name {
      font-size: 20px;
      font-weight: 700;
      color: #065f46;
      margin-bottom: 4px;
      word-break: break-word;
    }

    .org-subtitle {
      font-size: 14px;
      color: #047857;
      font-weight: 500;
    }

    .ownership-badge {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 8px 16px;
      border-radius: 25px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    /* Privileges section */
    .privileges-section {
      background-color: #f8fafc;
      border-radius: 12px;
      padding: 24px;
      margin: 32px 0;
    }

    .privileges-title {
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
    }

    .privileges-title::before {
      content: '⚡';
      margin-right: 8px;
      font-size: 20px;
    }

    .privileges-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .privilege-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      background-color: white;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      transition: all 0.3s ease;
    }

    .privilege-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .privilege-icon {
      font-size: 20px;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .privilege-text {
      font-size: 14px;
      color: #4a5568;
      font-weight: 500;
    }

    /* Important notice */
    .important-notice {
      background-color: #fef2f2;
      border: 1px solid #f87171;
      border-radius: 10px;
      padding: 20px;
      margin: 24px 0;
      display: flex;
      align-items: flex-start;
    }

    .notice-icon {
      font-size: 20px;
      margin-right: 12px;
      margin-top: 2px;
    }

    .notice-content {
      flex: 1;
    }

    .notice-title {
      font-size: 15px;
      font-weight: 600;
      color: #991b1b;
      margin-bottom: 8px;
    }

    .notice-text {
      font-size: 14px;
      color: #7f1d1d;
      line-height: 1.5;
    }

    /* Action button */
    .action-section {
      text-align: center;
      margin: 32px 0;
    }

    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
      letter-spacing: 0.3px;
    }

    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
    }

    /* Support section */
    .support-section {
      background-color: #f7fafc;
      border-radius: 8px;
      padding: 20px;
      margin-top: 32px;
      text-align: center;
    }

    .support-text {
      font-size: 14px;
      color: #4a5568;
      margin-bottom: 8px;
    }

    .support-contact {
      font-size: 14px;
      color: #10b981;
      text-decoration: none;
      font-weight: 600;
    }

    /* Footer */
    .footer {
      background-color: #2d3748;
      padding: 32px 40px;
      text-align: center;
      color: #a0aec0;
    }

    .footer-brand {
      font-size: 18px;
      font-weight: 600;
      color: white;
      margin-bottom: 8px;
    }

    .footer-text {
      font-size: 13px;
      line-height: 1.5;
    }

    /* Mobile responsiveness */
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 10px;
      }
      
      .header,
      .content,
      .footer {
        padding-left: 24px;
        padding-right: 24px;
      }

      .promotion-banner {
        padding: 24px 20px;
      }

      .promotion-title {
        font-size: 24px;
      }

      .promotion-icon {
        font-size: 48px;
      }

      .organization-details {
        padding: 20px;
      }

      .org-header {
        flex-direction: column;
        text-align: center;
      }

      .org-icon {
        margin-right: 0;
        margin-bottom: 8px;
      }

      .ownership-badge {
        margin-top: 12px;
      }

      .privileges-grid {
        grid-template-columns: 1fr;
      }

      .greeting {
        font-size: 20px;
      }

      .cta-button {
        padding: 14px 28px;
        font-size: 15px;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .container {
        background-color: #1a202c;
        border-color: #2d3748;
      }
      
      .content {
        background-color: #1a202c;
      }
      
      .greeting {
        color: #f7fafc;
      }
      
      .intro-text {
        color: #a0aec0;
      }
      
      .privileges-section {
        background-color: #2d3748;
      }
      
      .privileges-title {
        color: #f7fafc;
      }
      
      .privilege-item {
        background-color: #2d3748;
        border-color: #4a5568;
      }
      
      .privilege-text {
        color: #a0aec0;
      }
      
      .support-section {
        background-color: #2d3748;
      }
      
      .support-text {
        color: #a0aec0;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="logo">FMS</div>
        <div class="tagline">File Management System</div>
      </div>

      <!-- Main Content -->
      <div class="content">
        <h1 class="greeting">Congratulations on Your Promotion! 🎊</h1>
        
        <p class="intro-text">
          You have top-level access within organization.
        </p>

        <!-- Promotion Banner -->
        <div class="promotion-banner">
          <div class="promotion-icon">👑</div>
          <div class="promotion-title">You Are Now</div>
          <div class="promotion-subtitle">System Administrator</div>
        </div>

        <!-- Organization Details -->
        <div class="organization-details">
          <div class="org-header">
            <div class="org-icon">🏢</div>
            <div class="org-info">
              <div class="org-name">${orgName}</div>
              <div class="org-subtitle">Your Organization</div>
            </div>
          </div>
        </div>

        <!-- Privileges Section -->
        <div class="privileges-section">
          <div class="privileges-title">Your New Privileges & Responsibilities</div>
          <div class="privileges-grid">
            <div class="privilege-item">
              <div class="privilege-icon">🔧</div>
              <div class="privilege-text">Complete administrative control</div>
            </div>
            <div class="privilege-item">
              <div class="privilege-icon">👥</div>
              <div class="privilege-text">Manage all team members</div>
            </div>
            <div class="privilege-item">
              <div class="privilege-icon">🗂️</div>
              <div class="privilege-text">Full file system access</div>
            </div>
            <div class="privilege-item">
              <div class="privilege-icon">⚙️</div>
              <div class="privilege-text">Configure organization settings</div>
            </div>
            <div class="privilege-item">
              <div class="privilege-icon">🔐</div>
              <div class="privilege-text">Security & permissions control</div>
            </div>
            <div class="privilege-item">
              <div class="privilege-icon">📊</div>
              <div class="privilege-text">Access to all reports & analytics</div>
            </div>
          </div>
        </div>

        <!-- Important Notice -->
        <div class="important-notice">
          <div class="notice-icon">⚠️</div>
          <div class="notice-content">
            <div class="notice-title">Important Responsibility</div>
            <div class="notice-text">
              As the system administator, you have supreme authority over all aspects of this organization. Please use these privileges responsibly and ensure the security and integrity of your team's data.
            </div>
          </div>
        </div>

        <!-- Call to Action -->
        <div class="action-section">
          <a href="${process.env.FRONTEND_URL}" class="cta-button" style="color: white; text-decoration: none;">
            Access Your Organization →
          </a>
        </div>

        <!-- Support Section -->
        <div class="support-section">
          <p class="support-text">Questions about your new role and responsibilities?</p>
          <a href="mailto:support@fms.com" class="support-contact">Contact our support team</a>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-brand">File Management System</div>
        <div class="footer-text">
          Ownership assigned for ${orgName}<br>
          © ${new Date().getFullYear()} FMS. All rights reserved.
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
    subject: `You're now the owner of "${orgName}"`,
    html: htmlContent,
  });
};

export const sendFolderShareEmail = async (recipientEmail: string, recipientName: string, folderName: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

const emailHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>FMS - Folder Access Granted</title>
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
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Email wrapper */
    .email-wrapper {
      background-color: #f8fafc;
      padding: 40px 20px;
      min-height: 100vh;
    }

    /* Main container */
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }

    /* Header section */
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 40px 40px 30px;
      text-align: center;
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
      animation: shimmer 3s ease-in-out infinite;
    }

    @keyframes shimmer {
      0%, 100% { transform: translateX(-100%); }
      50% { transform: translateX(100%); }
    }

    .logo {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
      position: relative;
      z-index: 1;
    }

    .tagline {
      font-size: 16px;
      opacity: 0.9;
      font-weight: 400;
      position: relative;
      z-index: 1;
    }

    /* Content section */
    .content {
      padding: 40px;
    }

    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 16px;
      line-height: 1.3;
    }

    .intro-text {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 32px;
      line-height: 1.6;
    }

    /* Folder access card */
    .folder-card {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 2px solid #bbf7d0;
      border-radius: 16px;
      padding: 32px;
      margin: 32px 0;
      position: relative;
      overflow: hidden;
    }

    .folder-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #10b981, #059669);
    }

    .folder-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .folder-icon {
      font-size: 48px;
      margin-bottom: 12px;
      display: block;
    }

    .folder-name {
      font-size: 24px;
      font-weight: 700;
      color: #065f46;
      margin-bottom: 8px;
      word-break: break-word;
    }

    .folder-subtitle {
      font-size: 14px;
      color: #059669;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }

    /* Access info section */
    .access-section {
      background-color: white;
      border-radius: 12px;
      padding: 20px;
      margin-top: 24px;
      border: 1px solid #bbf7d0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .access-info {
      display: flex;
      align-items: center;
    }

    .access-icon {
      font-size: 24px;
      margin-right: 12px;
    }

    .access-details {
      flex: 1;
    }

    .access-title {
      font-size: 16px;
      font-weight: 600;
      color: #065f46;
      margin-bottom: 4px;
    }

    .access-description {
      font-size: 13px;
      color: #059669;
    }

    .access-badge {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* What's next section */
    .next-steps {
      background-color: #f0f9ff;
      border: 1px solid #0ea5e9;
      border-radius: 12px;
      padding: 24px;
      margin: 32px 0;
    }

    .next-steps-title {
      font-size: 18px;
      font-weight: 600;
      color: #0c4a6e;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
    }

    .next-steps-title::before {
      content: '📁';
      margin-right: 8px;
      font-size: 20px;
    }

    .steps-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .step-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 16px;
      padding: 12px;
      background-color: white;
      border-radius: 8px;
      border: 1px solid #e0f2fe;
    }

    .step-item:last-child {
      margin-bottom: 0;
    }

    .step-number {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .step-content {
      flex: 1;
    }

    .step-title {
      font-size: 14px;
      font-weight: 600;
      color: #0c4a6e;
      margin-bottom: 4px;
    }

    .step-description {
      font-size: 13px;
      color: #075985;
      line-height: 1.4;
    }

    /* Action button */
    .action-section {
      text-align: center;
      margin: 32px 0;
    }

    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
      letter-spacing: 0.3px;
    }

    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
    }

    /* Support section */
    .support-section {
      background-color: #f7fafc;
      border-radius: 8px;
      padding: 20px;
      margin-top: 32px;
      text-align: center;
    }

    .support-text {
      font-size: 14px;
      color: #4a5568;
      margin-bottom: 8px;
    }

    .support-contact {
      font-size: 14px;
      color: #10b981;
      text-decoration: none;
      font-weight: 600;
    }

    /* Footer */
    .footer {
      background-color: #2d3748;
      padding: 32px 40px;
      text-align: center;
      color: #a0aec0;
    }

    .footer-brand {
      font-size: 18px;
      font-weight: 600;
      color: white;
      margin-bottom: 8px;
    }

    .footer-text {
      font-size: 13px;
      line-height: 1.5;
    }

    /* Mobile responsiveness */
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 10px;
      }
      
      .header,
      .content,
      .footer {
        padding-left: 24px;
        padding-right: 24px;
      }

      .folder-card {
        padding: 24px 20px;
      }

      .folder-name {
        font-size: 20px;
      }

      .access-section {
        flex-direction: column;
        text-align: center;
        padding: 16px;
      }

      .access-info {
        margin-bottom: 12px;
      }

      .step-item {
        flex-direction: column;
        text-align: center;
      }

      .step-number {
        margin-right: 0;
        margin-bottom: 8px;
      }

      .greeting {
        font-size: 20px;
      }

      .cta-button {
        padding: 14px 28px;
        font-size: 15px;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .container {
        background-color: #1a202c;
        border-color: #2d3748;
      }
      
      .content {
        background-color: #1a202c;
      }
      
      .greeting {
        color: #f7fafc;
      }
      
      .intro-text {
        color: #a0aec0;
      }
      
      .folder-card {
        background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
        border-color: #4a5568;
      }
      
      .folder-name {
        color: #f7fafc;
      }
      
      .access-section {
        background-color: #2d3748;
        border-color: #4a5568;
      }
      
      .access-title {
        color: #f7fafc;
      }
      
      .step-item {
        background-color: #2d3748;
        border-color: #4a5568;
      }
      
      .support-section {
        background-color: #2d3748;
      }
      
      .support-text {
        color: #a0aec0;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="logo">FMS</div>
        <div class="tagline">File Management System</div>
      </div>

      <!-- Main Content -->
      <div class="content">
        <h1 class="greeting">Folder Access Granted! 🎉</h1>
        
        <p class="intro-text">
          Dear ${recipientName}, great news! You have been granted access to a new folder in the File Management System. You can now view, manage, and collaborate on the files within this folder.
        </p>

        <!-- Folder Card -->
        <div class="folder-card">
          <div class="folder-header">
            <div class="folder-icon">📁</div>
            <div class="folder-name">${folderName}</div>
            <div class="folder-subtitle">Shared Folder</div>
          </div>

          <!-- Access Section -->
          <div class="access-section">
            <div class="access-info">
              <div class="access-icon">🔓</div>
              <div class="access-details">
                <div class="access-title">Full Access Granted</div>
                <div class="access-description">View, download, and manage files</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Next Steps -->
        <div class="next-steps">
          <div class="next-steps-title">What You Can Do Now</div>
          <ul class="steps-list">
            <li class="step-item">
              <div class="step-content">
                <div class="step-title">Browse Files</div>
                <div class="step-description">Explore all files and subfolders within your newly accessible folder</div>
              </div>
            </li>
            <li class="step-item">
              <div class="step-content">
                <div class="step-title">Download & View</div>
                <div class="step-description">Download files you need or preview them directly in the browser</div>
              </div>
            </li>
            <li class="step-item">
              <div class="step-content">
                <div class="step-title">Upload Content</div>
                <div class="step-description">Add your own files to collaborate with your team members</div>
              </div>
            </li>
            <li class="step-item">
              <div class="step-content">
                <div class="step-title">Share & Collaborate</div>
                <div class="step-description">Work together with other team members who have access to this folder</div>
              </div>
            </li>
          </ul>
        </div>

        <!-- Call to Action -->
        <div class="action-section">
          <a href="${process.env.FRONTEND_URL}" class="cta-button" style="color: #fff; text-decoration: none;">
            Access Your Folder →
          </a>
        </div>

        <!-- Support Section -->
        <div class="support-section">
          <p class="support-text">Need help accessing your files?</p>
          <a href="mailto:support@fms.com" class="support-contact">Contact our support team</a>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-brand">File Management System</div>
        <div class="footer-text">
          Folder access granted to ${recipientName}<br>
          © ${new Date().getFullYear()} FMS. All rights reserved.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;


  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: recipientEmail,
    subject: `Folder shared with you: ${folderName}`,
    html: emailHTML,
  });
};

export const sendFileShareEmail = async (recipientEmail: string, recipientName: string, filename: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  const emailHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>FMS - File Shared With You</title>
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
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Email wrapper */
    .email-wrapper {
      background-color: #f8fafc;
      padding: 40px 20px;
      min-height: 100vh;
    }

    /* Main container */
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }

    /* Header section */
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      padding: 40px 40px 30px;
      text-align: center;
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
      animation: shimmer 3s ease-in-out infinite;
    }

    @keyframes shimmer {
      0%, 100% { transform: translateX(-100%); }
      50% { transform: translateX(100%); }
    }

    .logo {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
      position: relative;
      z-index: 1;
    }

    .tagline {
      font-size: 16px;
      opacity: 0.9;
      font-weight: 400;
      position: relative;
      z-index: 1;
    }

    /* Content section */
    .content {
      padding: 40px;
    }

    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 16px;
      line-height: 1.3;
    }

    .intro-text {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 32px;
      line-height: 1.6;
    }

    /* File card */
    .file-card {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 2px solid #fbbf24;
      border-radius: 16px;
      padding: 32px;
      margin: 32px 0;
      position: relative;
      overflow: hidden;
    }

    .file-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #f59e0b, #d97706);
    }

    .file-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .file-icon {
      font-size: 48px;
      margin-bottom: 12px;
      display: block;
    }

    .file-name {
      font-size: 24px;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 8px;
      word-break: break-word;
    }

    .file-subtitle {
      font-size: 14px;
      color: #d97706;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }

    /* File details section */
    .file-details {
      background-color: white;
      border-radius: 12px;
      padding: 20px;
      margin-top: 24px;
      border: 1px solid #fbbf24;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .file-info {
      display: flex;
      align-items: center;
    }

    .file-info-icon {
      font-size: 24px;
      margin-right: 12px;
    }

    .file-meta {
      flex: 1;
    }

    .file-meta-title {
      font-size: 16px;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 4px;
    }

    .file-meta-description {
      font-size: 13px;
      color: #d97706;
    }

    .file-badge {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* What's next section */
    .next-steps {
      background-color: #f0f9ff;
      border: 1px solid #0ea5e9;
      border-radius: 12px;
      padding: 24px;
      margin: 32px 0;
    }

    .next-steps-title {
      font-size: 18px;
      font-weight: 600;
      color: #0c4a6e;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
    }

    .next-steps-title::before {
      content: '📄';
      margin-right: 8px;
      font-size: 20px;
    }

    .steps-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .step-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 16px;
      padding: 12px;
      background-color: white;
      border-radius: 8px;
      border: 1px solid #e0f2fe;
    }

    .step-item:last-child {
      margin-bottom: 0;
    }

    .step-number {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .step-content {
      flex: 1;
    }

    .step-title {
      font-size: 14px;
      font-weight: 600;
      color: #0c4a6e;
      margin-bottom: 4px;
    }

    .step-description {
      font-size: 13px;
      color: #075985;
      line-height: 1.4;
    }

    /* Action button */
    .action-section {
      text-align: center;
      margin: 32px 0;
    }

    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
      letter-spacing: 0.3px;
    }

    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
    }

    /* Support section */
    .support-section {
      background-color: #f7fafc;
      border-radius: 8px;
      padding: 20px;
      margin-top: 32px;
      text-align: center;
    }

    .support-text {
      font-size: 14px;
      color: #4a5568;
      margin-bottom: 8px;
    }

    .support-contact {
      font-size: 14px;
      color: #f59e0b;
      text-decoration: none;
      font-weight: 600;
    }

    /* Footer */
    .footer {
      background-color: #2d3748;
      padding: 32px 40px;
      text-align: center;
      color: #a0aec0;
    }

    .footer-brand {
      font-size: 18px;
      font-weight: 600;
      color: white;
      margin-bottom: 8px;
    }

    .footer-text {
      font-size: 13px;
      line-height: 1.5;
    }

    /* Mobile responsiveness */
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 10px;
      }
      
      .header,
      .content,
      .footer {
        padding-left: 24px;
        padding-right: 24px;
      }

      .file-card {
        padding: 24px 20px;
      }

      .file-name {
        font-size: 20px;
      }

      .file-details {
        flex-direction: column;
        text-align: center;
        padding: 16px;
      }

      .file-info {
        margin-bottom: 12px;
      }

      .step-item {
        flex-direction: column;
        text-align: center;
      }

      .step-number {
        margin-right: 0;
        margin-bottom: 8px;
      }

      .greeting {
        font-size: 20px;
      }

      .cta-button {
        padding: 14px 28px;
        font-size: 15px;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .container {
        background-color: #1a202c;
        border-color: #2d3748;
      }
      
      .content {
        background-color: #1a202c;
      }
      
      .greeting {
        color: #f7fafc;
      }
      
      .intro-text {
        color: #a0aec0;
      }
      
      .file-card {
        background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
        border-color: #4a5568;
      }
      
      .file-name {
        color: #f7fafc;
      }
      
      .file-details {
        background-color: #2d3748;
        border-color: #4a5568;
      }
      
      .file-meta-title {
        color: #f7fafc;
      }
      
      .step-item {
        background-color: #2d3748;
        border-color: #4a5568;
      }
      
      .support-section {
        background-color: #2d3748;
      }
      
      .support-text {
        color: #a0aec0;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="logo">FMS</div>
        <div class="tagline">File Management System</div>
      </div>

      <!-- Main Content -->
      <div class="content">
        <h1 class="greeting">File Shared With You! 🎉</h1>
        
        <p class="intro-text">
          Dear ${recipientName}, you have received a new file! A team member has shared a file with you through the File Management System. You can now access, view, and download this file.
        </p>

        <!-- File Card -->
        <div class="file-card">
          <div class="file-header">
            <div class="file-icon">📄</div>
            <div class="file-name">${filename}</div>
            <div class="file-subtitle">Shared File</div>
          </div>

          <!-- File Details Section -->
          <div class="file-details">
            <div class="file-info">
              <div class="file-info-icon">🔗</div>
              <div class="file-meta">
                <div class="file-meta-title">File Access Granted</div>
                <div class="file-meta-description">View, download, and preview</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Next Steps -->
        <div class="next-steps">
          <div class="next-steps-title">What You Can Do</div>
          <ul class="steps-list">
            <li class="step-item">
              <div class="step-content">
                <div class="step-title">Open & Preview</div>
                <div class="step-description">View the file content directly in your browser without downloading</div>
              </div>
            </li>
            <li class="step-item">
              <div class="step-content">
                <div class="step-title">Download File</div>
                <div class="step-description">Save the file to your device for offline access and editing</div>
              </div>
            </li>
            <li class="step-item">
              <div class="step-content">
                <div class="step-title">Share Feedback</div>
                <div class="step-description">Leave comments or collaborate with the file owner</div>
              </div>
            </li>
            <li class="step-item">
              <div class="step-content">
                <div class="step-title">Manage Access</div>
                <div class="step-description">View sharing permissions and see who else has access to this file</div>
              </div>
            </li>
          </ul>
        </div>

        <!-- Call to Action -->
        <div class="action-section">
          <a href="${process.env.FRONTEND_URL}" class="cta-button" style="color: #ffffff; text-decoration: none;">
            View Your File →
          </a>
        </div>

        <!-- Support Section -->
        <div class="support-section">
          <p class="support-text">Having trouble accessing your file?</p>
          <a href="mailto:support@fms.com" class="support-contact">Contact our support team</a>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-brand">File Management System</div>
        <div class="footer-text">
          File shared with ${recipientName}<br>
          © ${new Date().getFullYear()} FMS. All rights reserved.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: recipientEmail,
    subject: `File shared with you: ${filename}`,
    html: emailHTML,
  });
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
  <title>FMS - Password Reset Request</title>
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
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Email wrapper */
    .email-wrapper {
      background-color: #f8fafc;
      padding: 40px 20px;
      min-height: 100vh;
    }

    /* Main container */
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }

    /* Header section */
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 40px 30px;
      text-align: center;
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
      animation: shimmer 3s ease-in-out infinite;
    }

    @keyframes shimmer {
      0%, 100% { transform: translateX(-100%); }
      50% { transform: translateX(100%); }
    }

    .logo {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
      position: relative;
      z-index: 1;
    }

    .tagline {
      font-size: 16px;
      opacity: 0.9;
      font-weight: 400;
      position: relative;
      z-index: 1;
    }

    /* Content section */
    .content {
      padding: 40px;
    }

    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 16px;
      line-height: 1.3;
    }

    .intro-text {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 32px;
      line-height: 1.6;
    }

    /* Security alert card */
    .security-card {
      background: linear-gradient(135deg, #fef7f0 0%, #fed7aa 20%, #fef7f0 100%);
      border: 2px solid #fb923c;
      border-radius: 16px;
      padding: 24px;
      margin: 32px 0;
      position: relative;
      overflow: hidden;
    }

    .security-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #f97316, #ea580c);
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
      color: #9a3412;
    }

    .security-text {
      font-size: 14px;
      color: #c2410c;
      line-height: 1.5;
    }

    /* Reset instructions */
    .reset-instructions {
      background-color: #f0f9ff;
      border: 1px solid #0ea5e9;
      border-radius: 12px;
      padding: 24px;
      margin: 32px 0;
    }

    .instructions-title {
      font-size: 18px;
      font-weight: 600;
      color: #0c4a6e;
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
      color: #075985;
      line-height: 1.5;
      margin-bottom: 20px;
    }

    /* Action button */
    .action-section {
      text-align: center;
      margin: 32px 0;
    }

    .reset-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      letter-spacing: 0.3px;
      margin-bottom: 16px;
    }

    .reset-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    .button-note {
      font-size: 12px;
      color: #718096;
      font-style: italic;
    }

    /* Expiry notice */
    .expiry-notice {
      background-color: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
      display: flex;
      align-items: center;
    }

    .expiry-icon {
      font-size: 20px;
      margin-right: 12px;
    }

    .expiry-text {
      font-size: 13px;
      color: #92400e;
      line-height: 1.4;
    }

    /* Alternative section */
    .alternative-section {
      background-color: #f7fafc;
      border-radius: 8px;
      padding: 20px;
      margin: 32px 0;
    }

    .alternative-title {
      font-size: 16px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 12px;
    }

    .alternative-text {
      font-size: 14px;
      color: #4a5568;
      margin-bottom: 8px;
      line-height: 1.5;
    }

    .alternative-link {
      font-size: 14px;
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }

    /* Support section */
    .support-section {
      background-color: #f7fafc;
      border-radius: 8px;
      padding: 20px;
      margin-top: 32px;
      text-align: center;
    }

    .support-text {
      font-size: 14px;
      color: #4a5568;
      margin-bottom: 8px;
    }

    .support-contact {
      font-size: 14px;
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }

    /* Footer */
    .footer {
      background-color: #2d3748;
      padding: 32px 40px;
      text-align: center;
      color: #a0aec0;
    }

    .footer-brand {
      font-size: 18px;
      font-weight: 600;
      color: white;
      margin-bottom: 8px;
    }

    .footer-text {
      font-size: 13px;
      line-height: 1.5;
    }

    /* Mobile responsiveness */
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 10px;
      }
      
      .header,
      .content,
      .footer {
        padding-left: 24px;
        padding-right: 24px;
      }

      .security-card,
      .reset-instructions {
        padding: 20px;
      }

      .greeting {
        font-size: 20px;
      }

      .reset-button {
        padding: 14px 28px;
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
      }

      .expiry-icon {
        margin-right: 0;
        margin-bottom: 8px;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .container {
        background-color: #1a202c;
        border-color: #2d3748;
      }
      
      .content {
        background-color: #1a202c;
      }
      
      .greeting {
        color: #f7fafc;
      }
      
      .intro-text {
        color: #a0aec0;
      }
      
      .alternative-section,
      .support-section {
        background-color: #2d3748;
      }
      
      .alternative-title {
        color: #f7fafc;
      }
      
      .alternative-text,
      .support-text {
        color: #a0aec0;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="logo">FMS</div>
        <div class="tagline">File Management System</div>
      </div>

      <!-- Main Content -->
      <div class="content">
        <h1 class="greeting">Password Reset Request 🔐</h1>
        
        <p class="intro-text">
          Hey there! We received a request to reset your password for your File Management System account.
        </p>

        <!-- Security Alert Card -->
        <div class="security-card">
          <div class="security-header">
            <div class="security-icon">⚠️</div>
            <div class="security-title">Security Notice</div>
          </div>
          <div class="security-text">
            If you didn't request this password reset, please ignore this email or contact our support team immediately to secure your account.
          </div>
        </div>

        <!-- Reset Instructions -->
        <div class="reset-instructions">
          <div class="instructions-title">How to Reset Your Password</div>
          <div class="instructions-text">
            Click the button below to create a new password for your account. You'll be redirected to a secure page where you can set your new password.
          </div>

          <!-- Call to Action -->
          <div class="action-section">
            <a href="${resetUrl}" class="reset-button" style="color: white">
              Reset My Password →
            </a>
            <div class="button-note">This link will redirect you to a secure password reset page</div>
          </div>
        </div>

        <!-- Expiry Notice -->
        <div class="expiry-notice">
          <div class="expiry-icon">⏰</div>
          <div class="expiry-text">
            <strong>Important:</strong> This password reset link will expire in 1 hour for security reasons. If you need a new link, please request another password reset.
          </div>
        </div>

        <!-- Alternative Section -->
        <div class="alternative-section">
          <div class="alternative-title">Didn't request this?</div>
          <div class="alternative-text">
            If you didn't ask for a password reset, you can safely ignore this email. Your account remains secure and no changes have been made.
          </div>
          <div class="alternative-text">
            If you're concerned about your account security, please contact us via this email
          </div>
        </div>

        <!-- Support Section -->
        <div class="support-section">
          <p class="support-text">Need help with your password reset?</p>
          <a href="mailto:support@fms.com" class="support-contact">Contact our support team</a>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-brand">File Management System</div>
        <div class="footer-text">
          This email was sent because a password reset was requested for your account.<br>
          © \${new Date().getFullYear()} FMS. All rights reserved.
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


