package com.careerready.service.impl;

import com.careerready.service.EmailService;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.Year;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Value("${app.mail.from:placement@careerready.ai}")
    private String fromEmail;

    public EmailServiceImpl() {
        this.mailSender = null;
    }

    @Autowired(required = false)
    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public boolean sendApprovalEmail(String recipientEmail, String recipientName, String roleName) {
        String subject = "Placement Readiness System - Account Approved";
        String displayName = (recipientName != null && !recipientName.isBlank()) ? recipientName.trim() : "Member";
        String displayRole = (roleName != null && !roleName.isBlank()) ? roleName.trim() : "Placement Officer";

        String textBody = String.format(
                "Dear %s,\n\n" +
                "Congratulations! Your account registration for the Placement Readiness Analytics System has been approved by the Administrator.\n\n" +
                "Account Details:\n" +
                "- Name: %s\n" +
                "- Role: %s\n" +
                "- Email: %s\n" +
                "- Status: ACTIVE\n\n" +
                "You can now log in using your registered credentials at:\n" +
                "http://localhost:5173/login\n\n" +
                "Regards,\n" +
                "Placement Administration Team\n" +
                "CareerReady Analytics",
                displayName, displayName, displayRole, recipientEmail
        );

        String htmlBody = String.format(
                "<!DOCTYPE html>" +
                "<html><head><meta charset='UTF-8'></head>" +
                "<body style='font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;'>" +
                "<div style='max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;'>" +
                "  <div style='background: linear-gradient(135deg, #0f172a 0%%, #1e3a8a 100%%); padding: 32px 28px; text-align: center; color: #ffffff;'>" +
                "    <h1 style='margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;'>Placement Readiness System</h1>" +
                "    <p style='margin: 8px 0 0; font-size: 14px; opacity: 0.85;'>Official Account Notification</p>" +
                "  </div>" +
                "  <div style='padding: 32px 28px;'>" +
                "    <div style='display: inline-block; background: #ecfdf5; color: #065f46; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 16px; border: 1px solid #a7f3d0;'>Account Approved</div>" +
                "    <h2 style='margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0f172a;'>Welcome, %s!</h2>" +
                "    <p style='margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;'>Your account registration for the <strong>CareerReady Placement Portal</strong> has been verified and approved by the Administrator. You now have full access to manage students, assessments, and placement analytics.</p>" +
                "    <div style='background: #f1f5f9; border-radius: 8px; padding: 18px; margin: 0 0 24px; border-left: 4px solid #3b82f6;'>" +
                "      <p style='margin: 0 0 8px; font-size: 13px; color: #64748b;'><strong>Registered Email:</strong> %s</p>" +
                "      <p style='margin: 0 0 8px; font-size: 13px; color: #64748b;'><strong>Assigned Role:</strong> <span style='color: #1e40af; font-weight: 600;'>%s</span></p>" +
                "      <p style='margin: 0; font-size: 13px; color: #64748b;'><strong>Account Status:</strong> <span style='color: #059669; font-weight: 600;'>ACTIVE</span></p>" +
                "    </div>" +
                "    <div style='text-align: center; margin: 28px 0;'>" +
                "      <a href='http://localhost:5173/login' style='display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);'>Login to Placement Portal</a>" +
                "    </div>" +
                "    <p style='margin: 0; font-size: 13px; line-height: 1.5; color: #94a3b8; text-align: center;'>If you did not request this account or believe this is an error, please contact your administrator.</p>" +
                "  </div>" +
                "  <div style='background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; text-align: center; font-size: 12px; color: #94a3b8;'>" +
                "    &copy; %d CareerReady Placement Readiness Analytics System. All rights reserved." +
                "  </div>" +
                "</div>" +
                "</body></html>",
                displayName, recipientEmail, displayRole, Year.now().getValue()
        );

        return sendMimeEmail(recipientEmail, subject, textBody, htmlBody);
    }

    @Override
    public boolean sendRejectionEmail(String recipientEmail, String recipientName, String roleName) {
        String subject = "Placement Readiness System - Registration Status Update";
        String displayName = (recipientName != null && !recipientName.isBlank()) ? recipientName.trim() : "Member";

        String textBody = String.format(
                "Dear %s,\n\n" +
                "Your account registration request for the Placement Readiness Analytics System could not be approved at this time.\n\n" +
                "Please contact the Placement Administration for further information.\n\n" +
                "Regards,\n" +
                "Placement Administration Team\n" +
                "CareerReady Analytics",
                displayName
        );

        String htmlBody = String.format(
                "<!DOCTYPE html>" +
                "<html><head><meta charset='UTF-8'></head>" +
                "<body style='font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;'>" +
                "<div style='max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;'>" +
                "  <div style='background: #1e293b; padding: 28px; text-align: center; color: #ffffff;'>" +
                "    <h1 style='margin: 0; font-size: 22px; font-weight: 700;'>Placement Readiness System</h1>" +
                "  </div>" +
                "  <div style='padding: 32px 28px;'>" +
                "    <div style='display: inline-block; background: #fef2f2; color: #991b1b; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 16px; border: 1px solid #fecaca;'>Registration Update</div>" +
                "    <h2 style='margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #0f172a;'>Hello %s,</h2>" +
                "    <p style='margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;'>Your account registration for the Placement Readiness System could not be approved by the administrator at this time.</p>" +
                "    <p style='margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;'>Please verify your institutional identification or contact the placement department office for assistance.</p>" +
                "  </div>" +
                "  <div style='background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; text-align: center; font-size: 12px; color: #94a3b8;'>" +
                "    &copy; %d CareerReady Placement Readiness Analytics System. All rights reserved." +
                "  </div>" +
                "</div>" +
                "</body></html>",
                displayName, Year.now().getValue()
        );

        return sendMimeEmail(recipientEmail, subject, textBody, htmlBody);
    }

    @Override
    public boolean sendPasswordResetEmail(String recipientEmail, String recipientName, String roleName, String resetLink, int expiryMinutes) {
        String subject = "Placement Readiness System - Password Reset Request";
        String displayName = (recipientName != null && !recipientName.isBlank()) ? recipientName.trim() : "User";
        String displayRole = (roleName != null && !roleName.isBlank()) ? roleName.trim() : "Member";

        String textBody = String.format(
                "Dear %s,\n\n" +
                "Someone requested a password reset for your Placement Readiness Analytics account (%s role).\n\n" +
                "To reset your password, please click the link below (or copy and paste it into your browser):\n" +
                "%s\n\n" +
                "Note: This link will expire in %d minutes and can only be used once.\n\n" +
                "If you did not request this password reset, please ignore this email or contact support. Your password will remain unchanged.\n\n" +
                "Regards,\n" +
                "Placement Administration Team\n" +
                "CareerReady Analytics",
                displayName, displayRole, resetLink, expiryMinutes
        );

        String htmlBody = String.format(
                "<!DOCTYPE html>" +
                "<html><head><meta charset='UTF-8'></head>" +
                "<body style='font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;'>" +
                "<div style='max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;'>" +
                "  <div style='background: linear-gradient(135deg, #0f172a 0%%, #1e3a8a 100%%); padding: 32px 28px; text-align: center; color: #ffffff;'>" +
                "    <h1 style='margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;'>Placement Readiness System</h1>" +
                "    <p style='margin: 8px 0 0; font-size: 14px; opacity: 0.85;'>Password Reset Request</p>" +
                "  </div>" +
                "  <div style='padding: 32px 28px;'>" +
                "    <div style='display: inline-block; background: #eff6ff; color: #1e40af; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 16px; border: 1px solid #bfdbfe;'>Security Notification</div>" +
                "    <h2 style='margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0f172a;'>Hello, %s</h2>" +
                "    <p style='margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;'>Someone requested a password reset for your <strong>Placement Readiness Analytics</strong> account associated with the <strong>%s</strong> role.</p>" +
                "    <p style='margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #64748b;'>Click the button below to choose a new password. This reset link is valid for <strong>%d minutes</strong> and can only be used once.</p>" +
                "    <div style='text-align: center; margin: 28px 0;'>" +
                "      <a href='%s' style='display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);'>Reset My Password</a>" +
                "    </div>" +
                "    <div style='background: #f1f5f9; border-radius: 8px; padding: 14px 18px; margin: 24px 0; font-size: 12px; color: #64748b; word-break: break-all;'>" +
                "      <strong>Having trouble with the button?</strong> Copy and paste this URL into your browser:<br/>" +
                "      <span style='color: #2563eb;'>%s</span>" +
                "    </div>" +
                "    <p style='margin: 0; font-size: 13px; line-height: 1.5; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 18px;'>" +
                "      If you did not request a password reset, you can safely ignore this email. Your password will not change until you access the link above and create a new one." +
                "    </p>" +
                "  </div>" +
                "  <div style='background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; text-align: center; font-size: 12px; color: #94a3b8;'>" +
                "    &copy; %d CareerReady Placement Readiness Analytics System. All rights reserved." +
                "  </div>" +
                "</div>" +
                "</body></html>",
                displayName, displayRole, expiryMinutes, resetLink, resetLink, Year.now().getValue()
        );

        log.info("[PASSWORD RESET LINK] Recipient: {}, Role: {}, Reset URL: {}", recipientEmail, displayRole, resetLink);
        return sendMimeEmail(recipientEmail, subject, textBody, htmlBody);
    }

    private boolean sendMimeEmail(String toEmail, String subject, String textBody, String htmlBody) {
        if (toEmail == null || toEmail.trim().isEmpty()) {
            log.warn("Cannot send email: recipient email is empty");
            return false;
        }

        if (mailSender == null) {
            log.info("[EMAIL DISPATCH RECORDED] (No SMTP server bound) To: {}, Subject: {}\nBody:\n{}", toEmail, subject, textBody);
            return false;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            String sender = (smtpUsername != null && !smtpUsername.isBlank()) ? smtpUsername.trim() : fromEmail;
            helper.setFrom(new InternetAddress(sender, "CareerReady Placement Portal"));
            helper.setTo(toEmail.trim());
            helper.setSubject(subject);
            helper.setText(textBody, htmlBody);

            mailSender.send(mimeMessage);
            log.info("Email notification successfully sent to {} with subject: '{}'", toEmail, subject);
            return true;
        } catch (Exception ex) {
            log.error("Failed to send email to {}: {}. Text notification content:\n{}", toEmail, ex.getMessage(), textBody);
            return false;
        }
    }
}

