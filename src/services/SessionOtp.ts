import dotenv from 'dotenv';
import { Request } from 'express';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

interface CourseInfo {
  title: string;
  instructorName: string;
  startUrl?: string;
}

// Load environment variables from .env file
dotenv.config();

// Generate a random OTP (6 alphanumeric characters)
export const generateOtp = (): string => {
  let otp = '';
  otp = Math.floor(100000 + Math.random() * 900000).toString(); // e.g. 6-digit code
  return otp;
};

// Send account credentials via email
export const sendCreds = async (email: string, lastName: string, firstName: string, req: Request, tempPassword?: string): Promise<boolean> => {
  try {
    const otp = generateOtp();

    req.session.otp = otp;
    req.session.otpExpiry = Date.now() + 30 * 60 * 1000;
    req.session.otpEmail = email;
    req.session.tempPassword = tempPassword;
    req.session.lastname = lastName;
    req.session.firstname = firstName;

    const emailContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Ingata E-learning</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 30px; border-radius: 8px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 24px; font-weight: bold; color: #333; margin-bottom: 8px;">
        🎓 Ingata E-learning
      </div>
      <div style="font-size: 14px; color: #666;">
        Your Gateway to Digital Learning
      </div>
    </div>

    <!-- Main Content -->
    <div style="margin-bottom: 30px;">
      <h1 style="font-size: 20px; color: #333; margin-bottom: 20px;">
        Welcome, ${req.session.firstname}!
      </h1>
      
      <p style="color: #666; margin-bottom: 25px;">
        Your Ingata E-learning account is now active. Here are your login details:
      </p>

      <!-- Credentials -->
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
        <div style="margin-bottom: 15px;">
          <strong style="color: #333; display: block; margin-bottom: 5px;">Email:</strong>
          <code style="background-color: #fff; padding: 8px 12px; border-radius: 4px; font-family: monospace; color: #333;">
            ${email}
          </code>
        </div>
        
        <div>
          <strong style="color: #333; display: block; margin-bottom: 5px;">Temporary Password:</strong>
          <code style="background-color: #fff; padding: 8px 12px; border-radius: 4px; font-family: monospace; color: #333;">
            ${tempPassword}
          </code>
        </div>
      </div>

      <!-- Security Note -->
      <div style="background-color: #fff8e1; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin-bottom: 25px;">
        <strong>Important:</strong> This is a temporary password. Please log in and change it immediately.
      </div>
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${process.env.FRONTEND_URL}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Start Learning Now
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
      <div style="margin-bottom: 10px;">
        Need help? <a href="mailto:support@ingatatechnologies.com" style="color: #007bff;">Contact support</a>
      </div>
      <div>
        © ${new Date().getFullYear()} Ingata E-learning. Sent to ${req.session.firstname} ${req.session.lastname}
      </div>
    </div>
  </div>
</body>
</html>
`;

    await resend.emails.send({
      from: process.env.RESEND_TEMP_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: `Welcome ${req.session.firstname} ${req.session.lastname}`,
      html: emailContent,
    });

    console.log(`Credentials email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending credentials email:', error);
    return false;
  }
};

export const sendOtpEmail = async (email: string, lastName: string, firstName: string, otp: string): Promise<boolean> => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ingata E-learning - Your Security Code</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 30px; border-radius: 8px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 24px; font-weight: bold; color: #333; margin-bottom: 8px;">
        🛡️ Ingata E-learning
      </div>
      <div style="font-size: 14px; color: #666;">
        Secure Learning Access
      </div>
    </div>

    <!-- Main Content -->
    <div style="margin-bottom: 30px;">
      <h1 style="font-size: 20px; color: #333; margin-bottom: 20px;">
        Secure Access Code Required
      </h1>
      
      <p style="color: #666; margin-bottom: 25px;">
        Hi <strong>${firstName}</strong>, use the verification code below to access your account.
      </p>

      <!-- OTP Code -->
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="font-size: 14px; color: #666; margin-bottom: 10px;">Your Verification Code</div>
        <div style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; color: #007bff; letter-spacing: 8px; padding: 15px; background-color: #f9f9f9; border-radius: 6px; display: inline-block;">
          ${otp}
        </div>
        <div style="font-size: 13px; color: #666; margin-top: 10px;">
          Expires in 10 minutes
        </div>
      </div>

      <!-- Security Note -->
      <div style="background-color: #fff8e1; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin-top: 20px;">
        <strong>Security Notice:</strong> If you didn't request this code, you can safely ignore this email.
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
      <div style="margin-bottom: 10px;">
        Need help? <a href="mailto:support@ingatatechnologies.com" style="color: #007bff;">Contact support</a>
      </div>
      <div>
        © ${new Date().getFullYear()} Ingata E-learning. Sent to ${firstName} ${lastName}
      </div>
    </div>
  </div>
</body>
</html>
`;

  try {
    await resend.emails.send({
      from: process.env.RESEND_TEMP_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'Your Login OTP',
      html,
    });
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

export const sendResetPasswordEmail = async (email: string, resetToken: string, frontendBaseUrl: string): Promise<boolean> => {
  try {
    const resetUrl = `${frontendBaseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ingata E-learning - Password Reset Request</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 30px; border-radius: 8px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 24px; font-weight: bold; color: #333; margin-bottom: 8px;">
        🔐 Ingata E-learning
      </div>
      <div style="font-size: 14px; color: #666;">
        Password Reset Request
      </div>
    </div>

    <!-- Main Content -->
    <div style="margin-bottom: 30px;">
      <h1 style="font-size: 20px; color: #333; margin-bottom: 20px;">
        Reset Your Password
      </h1>
      
      <p style="color: #666; margin-bottom: 25px;">
        We received a request to reset your password. Click the button below to create a new password.
      </p>

      <!-- Reset Button -->
      <div style="text-align: center; margin-bottom: 25px;">
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Reset Password
        </a>
        <div style="font-size: 12px; color: #666; margin-top: 8px;">
          This link expires in 1 hour
        </div>
      </div>

      <!-- Security Note -->
      <div style="background-color: #fff8e1; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
        <strong>Security Tip:</strong> Create a strong password with at least 8 characters including uppercase, lowercase, numbers, and symbols.
      </div>

      <!-- Alternative Section -->
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin-top: 20px;">
        <div style="font-size: 14px; color: #666;">
          <strong>Didn't request this?</strong> If you didn't request a password reset, you can safely ignore this email. Your account remains secure.
        </div>
      </div>
    </div>

    <!-- Support Section -->
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 14px; color: #666; margin-bottom: 10px;">
        Need help? Contact our support team
      </div>
      <a href="mailto:support@ingatatechnologies.com" style="color: #007bff; text-decoration: none; font-weight: bold;">
        support@ingatatechnologies.com
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
      <div>
        © ${new Date().getFullYear()} Ingata E-learning. This email was sent in response to a password reset request.
      </div>
    </div>
  </div>
</body>
</html>
`;

    await resend.emails.send({
      from: process.env.RESEND_TEMP_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'Password Reset Instructions',
      html: htmlContent,
    });

    console.log(`Reset password email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending reset password email:', error);
    return false;
  }
};

export const sendPasswordResetSuccessEmail = async (email: string): Promise<boolean> => {
  try {
    const htmlContent = `
  <!DOCTYPE html>

  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset Successful - Ingata E-learning</title>
  </head>
  <body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 30px; border-radius: 8px;">

  <!-- Header -->
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="font-size: 24px; font-weight: bold; color: #333; margin-bottom: 8px;">
      Ingata E-learning
    </div>
    <div style="font-size: 14px; color: #666;">
      Password Reset Successful
    </div>
  </div>

  <!-- Main Content -->
  <div style="margin-bottom: 30px;">
    <h1 style="font-size: 20px; color: #333; margin-bottom: 20px;">
      Your Password Has Been Reset Successfully
    </h1>

    <p style="color: #666; margin-bottom: 25px;">
      This is a confirmation that your password was successfully reset. You can now sign in with your new password.
    </p>

    <div style="text-align: center; margin-bottom: 25px;">
      <a href="${process.env.FRONTEND_URL}/login" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Go to Login
      </a>
    </div>

    <div style="background-color: #eaf8ea; padding: 15px; border-radius: 6px; border-left: 4px solid #28a745;">
      <strong>Tip:</strong> If this wasn't you, change your password again immediately or contact support below.
    </div>
  </div>

  <!-- Support Section -->
  <div style="text-align: center; margin-bottom: 20px;">
    <div style="font-size: 14px; color: #666; margin-bottom: 10px;">
      Need help? Contact our support team
    </div>
    <a href="mailto:support@ingatatechnologies.com" style="color: #007bff; text-decoration: none; font-weight: bold;">
      support@ingatatechnologies.com
    </a>
  </div>

  <!-- Footer -->
  <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
    <div>
      © ${new Date().getFullYear()} Ingata E-learning. This is a confirmation email for your password reset.
    </div>
  </div>
</div>

  </body>
  </html>
  `;

    await resend.emails.send({
      from: process.env.RESEND_TEMP_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'Your Password Has Been Reset Successfully',
      html: htmlContent,
    });

    console.log(`Password reset success email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset success email:', error);
    return false;
  }
};

export const sendDocumentReviewNotification = async (
  email: string,
  status: "approved" | "rejected",
  courseTitle: string,
  reviewNotes?: string
): Promise<boolean> => {
  try {
    const isApproved = status === "approved";
    const mainColor = isApproved ? "#28a745" : "#dc3545"; // green for approved, red for rejected
    const bgColor = isApproved ? "#eaf8ea" : "#f8eaea";
    const statusText = isApproved ? "Approved" : "Rejected";

    const htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Course Review Notification - Ingata E-learning</title>
  </head>
  <body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 30px; border-radius: 8px;">

      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 24px; font-weight: bold; color: ${mainColor}; margin-bottom: 8px;">
          Ingata E-learning
        </div>
        <div style="font-size: 14px; color: #666;">
          Course Submission ${statusText}
        </div>
      </div>

      <!-- Main Content -->
      <div style="margin-bottom: 30px;">
        <h1 style="font-size: 20px; color: #333; margin-bottom: 20px;">
          Your course "${courseTitle}" has been ${statusText.toLowerCase()}
        </h1>

        ${reviewNotes && !isApproved ? `<p style="color: #666; margin-bottom: 25px;">Review notes: ${reviewNotes}</p>` : ""}

        <div style="text-align: center; margin-bottom: 25px;">
          <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: ${mainColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Go to Dashboard
          </a>
        </div>

        <div style="background-color: ${bgColor}; padding: 15px; border-radius: 6px; border-left: 4px solid ${mainColor};">
          <strong>Tip:</strong> If something looks wrong, contact support below.
        </div>
      </div>

      <!-- Support Section -->
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 14px; color: #666; margin-bottom: 10px;">
          Need help? Contact our support team
        </div>
        <a href="mailto:support@ingatatechnologies.com" style="color: #007bff; text-decoration: none; font-weight: bold;">
          support@ingatatechnologies.com
        </a>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
        <div>
          © ${new Date().getFullYear()} Ingata E-learning. This is a notification for your course review.
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

    await resend.emails.send({
      from: process.env.RESEND_TEMP_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: `Your course "${courseTitle}" has been ${statusText}`,
      html: htmlContent,
    });

    console.log(`Document review notification sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending document review notification:', error);
    return false;
  }
};

export const sendEnrollmentEmail = async (
  email: string,
  lastName: string,
  firstName: string,
  courses: CourseInfo[],
  req: Request
): Promise<boolean> => {
  console.log(email, firstName, lastName, courses);
  try {
    const coursesHtml = courses.map(c => `
      <li style="margin-bottom: 10px;">
        <strong>${c.title}</strong> - Instructor: ${c.instructorName}
        ${c.startUrl ? `<br><a href="${c.startUrl}" style="color: #007bff;">Start Course</a>` : ""}
      </li>
    `).join("");

    const emailContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><title>Course Enrollment</title></head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333;">Hello ${firstName} ${lastName},</h2>
          <p>You have been enrolled in the following course${courses.length > 1 ? "s" : ""}:</p>
          <ul style="padding-left: 20px;">${coursesHtml}</ul>
          <p>Log in to your account to start learning and track your progress.</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL}/student" style="background-color: #007bff; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">Sent to ${firstName} ${lastName} (${email})</p>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: process.env.RESEND_TEMP_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: `You have been enrolled in a course`,
      html: emailContent,
    });

    console.log(`Enrollment email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending enrollment email:', error);
    return false;
  }
};

export const sendGradingCompleteEmail = async (
  email: string,
  lastName: string,
  firstName: string,
  assessmentTitle: string,
  req: Request
): Promise<boolean> => {
  try {
    const emailContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><title>Assessment Graded</title></head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333;">Hello ${firstName} ${lastName},</h2>
          <p>Your instructor has finished grading your assessment:</p>
          <ul style="padding-left: 20px;">
            <li><strong>${assessmentTitle}</strong></li>
          </ul>
          <p>Log in to your student dashboard to view your grades and feedback.</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL}/courses/11/learn" style="background-color: #28a745; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Grades</a>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">Sent to ${firstName} ${lastName} (${email})</p>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: process.env.RESEND_TEMP_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: `Your assessment has been graded`,
      html: emailContent,
    });

    console.log(`Grading complete email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending grading complete email:', error);
    return false;
  }
};

// Function to invalidate OTP for a specific email
export const invalidateOtp = (req: Request, email: string): void => {
  if (req.session.otpEmail === email) {
    delete req.session.otp;
    delete req.session.otpEmail;
    delete req.session.otpExpiry;
    console.log(`OTP invalidated for email: ${email}`);
  } else {
    console.log(`Email in session (${req.session.otpEmail}) does not match provided email (${email}). OTP not invalidated.`);
  }
};