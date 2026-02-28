// @ts-nocheck
const nodemailer = require('nodemailer');
//import { Resend } from 'resend';

// Configure the transporter with environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,  // 10s
  greetingTimeout: 10000,
  socketTimeout: 10000,
}); 

const mailService = {
  /**
   * Sends a 6-digit verification code for password reset.
   */
  sendPasswordResetCode: async (user, code) => {
    if (!user || !user.email) return;

    const mailOptions = {
      from: `"MyHR Security" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `MyHR Security Code: ${code}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; color: #334155; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="background-color: #10b981; color: white; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; display: inline-block; font-weight: 900; font-size: 20px;">HR</div>
            <h1 style="font-size: 20px; margin-top: 12px; color: #0f172a;">Password Recovery</h1>
          </div>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>We received a request to reset your MyHR password. Use the verification code below to proceed:</p>
          <div style="background-color: #f8fafc; padding: 32px; border-radius: 16px; text-align: center; margin: 24px 0; border: 1px dashed #cbd5e1;">
            <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #10b981;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #64748b;">This code will expire in 15 minutes. If you did not request this, please ignore this email or contact Sarah Chen from HR immediately.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; text-transform: uppercase; letter-spacing: 1px;">MyHR Cloud Security Node • Automated Transmission</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`📧 Password reset email sent to: ${user.email}`);
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw error;
    }
  },

  /**
   * Notifies the manager when a new leave is applied, with Admin, HR and CC in loop.
   */
  sendLeaveApplied: async (leave, employee, manager, additionalCC = []) => {
    if (!manager || !manager.email) return;

    // Filter out potential duplicates or empty values
    const ccList = [...new Set(additionalCC)].filter(email => email && email !== manager.email);

    const mailOptions = {
      from: `"MyHR Notifications" <${process.env.SMTP_USER}>`,
      to: manager.email,
      cc: ccList,
      subject: `New Leave Request: ${employee.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; color: #334155;">
          <h2 style="color: #10b981;">New Leave Application</h2>
          <p>Hi <strong>${manager.name}</strong>,</p>
          <p><strong>${employee.name}</strong> has submitted a new leave request for your approval.</p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Type:</strong> ${leave.type}</p>
            <p style="margin: 5px 0;"><strong>Dates:</strong> ${leave.startDate} to ${leave.endDate}</p>
            <p style="margin: 5px 0;"><strong>Reason:</strong> ${leave.reason}</p>
          </div>
          <p>Please log in to the <a href="${process.env.APP_URL || 'http://localhost:3000'}/approvals">MyHR Portal</a> to review this request.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">This is an automated message from MyHR Cloud. CC: Admin/HR Team.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`📧 Leave application email sent to manager: ${manager.email} (CC: ${ccList.join(', ')})`);
    } catch (error) {
      console.error('❌ Failed to send leave application email:', error);
    }
  },

  /**
   * Notifies the employee when their leave status is updated, with Admin, HR and CC in loop.
   */
  sendLeaveProcessed: async (leave, employee, additionalCC = []) => {
    if (!employee || !employee.email) return;

    const isApproved = leave.status === 'APPROVED';
    const statusColor = isApproved ? '#10b981' : '#f43f5e';
    
    // Filter out potential duplicates or empty values
    const ccList = [...new Set(additionalCC)].filter(email => email && email !== employee.email);

    const mailOptions = {
      from: `"MyHR Notifications" <${process.env.SMTP_USER}>`,
      to: employee.email,
      cc: ccList,
      subject: `Leave Request Update: ${leave.status}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; color: #334155;">
          <h2 style="color: ${statusColor};">Leave Request ${leave.status}</h2>
          <p>Hi <strong>${employee.name}</strong>,</p>
          <p>Your leave request from <strong>${leave.startDate}</strong> to <strong>${leave.endDate}</strong> has been <strong>${leave.status.toLowerCase()}</strong>.</p>
          ${leave.processedBy ? `<p>Processed by: ${leave.processedBy}</p>` : ''}
          <div style="margin-top: 20px;">
            <a href="${process.env.APP_URL || 'http://localhost:3000'}/leave" style="background-color: ${statusColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View in Portal</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">This is an automated message from MyHR Cloud. CC: Admin/HR Team.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`📧 Leave status update email sent to employee: ${employee.email} (CC: ${ccList.join(', ')})`);
    } catch (error) {
      console.error('❌ Failed to send leave update email:', error);
    }
  }
};

module.exports = mailService;
