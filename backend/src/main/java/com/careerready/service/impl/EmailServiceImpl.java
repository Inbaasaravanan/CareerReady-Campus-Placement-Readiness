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

    @Value("${app.mail.admin-notification-email:inbaasara@gmail.com}")
    private String adminNotificationEmail;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public EmailServiceImpl() {
        this.mailSender = null;
    }

    @Autowired(required = false)
    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public boolean sendApprovalEmail(String recipientEmail, String recipientName, String roleName) {
        String subject = "Your CareerReady AI Account Has Been Approved";
        String displayName = (recipientName != null && !recipientName.isBlank()) ? recipientName.trim() : "User";

        String displayRole = "Staff/HOD";
        if (roleName != null && !roleName.isBlank()) {
            String upper = roleName.toUpperCase().trim();
            if (upper.contains("HOD")) {
                displayRole = "HOD";
            } else if (upper.contains("STAFF")) {
                displayRole = "Staff";
            } else if (upper.contains("ADMIN")) {
                displayRole = "Administrator";
            } else {
                displayRole = roleName.trim();
            }
        }

        String textBody = String.format(
                "Hello %s,\n\n" +
                "Your %s registration request for CareerReady AI has been approved by the Admin. Your account is now approved. You can sign in using your registered email and existing login method.\n\n" +
                "Regards,\n" +
                "CareerReady AI Administration",
                displayName, displayRole
        );

        String loginUrl = (frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl.replaceAll("/+$", "") + "/login" : "http://localhost:5173/login";

        String htmlBody = String.format(
                "<!DOCTYPE html>" +
                "<html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "<title>Your CareerReady AI Account Has Been Approved</title></head>" +
                "<body style='font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;'>" +
                "<div style='max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;'>" +
                "  <div style='background: linear-gradient(135deg, #0f172a 0%%, #1e3a8a 100%%); padding: 32px 28px; text-align: center; color: #ffffff;'>" +
                "    <h1 style='margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;'>CareerReady AI</h1>" +
                "    <p style='margin: 8px 0 0; font-size: 14px; opacity: 0.85;'>Placement Readiness System &bull; Account Approved</p>" +
                "  </div>" +
                "  <div style='padding: 32px 28px;'>" +
                "    <div style='display: inline-block; background: #ecfdf5; color: #065f46; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 16px; border: 1px solid #a7f3d0;'>Account Approved</div>" +
                "    <h2 style='margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0f172a;'>Hello %s,</h2>" +
                "    <p style='margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;'>Your <strong>%s</strong> registration request for CareerReady AI has been approved by the Admin. Your account is now approved. You can sign in using your registered email and existing login method.</p>" +
                "    <div style='background: #f1f5f9; border-radius: 8px; padding: 18px; margin: 0 0 24px; border-left: 4px solid #10b981;'>" +
                "      <p style='margin: 0 0 8px; font-size: 13px; color: #64748b;'><strong>Registered Email:</strong> %s</p>" +
                "      <p style='margin: 0 0 8px; font-size: 13px; color: #64748b;'><strong>Assigned Role:</strong> <span style='color: #1e40af; font-weight: 600;'>%s</span></p>" +
                "      <p style='margin: 0; font-size: 13px; color: #64748b;'><strong>Account Status:</strong> <span style='color: #059669; font-weight: 600;'>APPROVED</span></p>" +
                "    </div>" +
                "    <div style='text-align: center; margin: 28px 0;'>" +
                "      <a href='%s' style='display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);'>Sign In to CareerReady AI</a>" +
                "    </div>" +
                "    <p style='margin: 24px 0 0; font-size: 14px; color: #475569;'>Regards,<br><strong>CareerReady AI Administration</strong></p>" +
                "  </div>" +
                "  <div style='background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; text-align: center; font-size: 12px; color: #94a3b8;'>" +
                "    &copy; %d CareerReady AI Placement Readiness System. All rights reserved." +
                "  </div>" +
                "</div>" +
                "</body></html>",
                displayName, displayRole, recipientEmail, displayRole, loginUrl, Year.now().getValue()
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

    @Override
    public boolean sendPendingRegistrationAdminNotification(
            String applicantName,
            String applicantEmail,
            String roleName,
            String identifier,
            String departmentName,
            String phone,
            java.time.LocalDateTime registeredAt) {

        String targetAdmin = (adminNotificationEmail != null && !adminNotificationEmail.isBlank())
                ? adminNotificationEmail.trim()
                : "inbaasara@gmail.com";

        String normalizedRole = "Staff";
        if (roleName != null && !roleName.isBlank()) {
            String upper = roleName.toUpperCase().trim();
            if (upper.contains("HOD")) {
                normalizedRole = "HOD";
            } else if (upper.contains("STAFF")) {
                normalizedRole = "Staff";
            } else if (upper.contains("ADMIN")) {
                normalizedRole = "Admin";
            } else {
                normalizedRole = roleName.trim();
            }
        }

        String subject = String.format("New %s Registration — Pending Approval", normalizedRole);
        String displayName = (applicantName != null && !applicantName.isBlank()) ? applicantName.trim() : "Applicant";
        String displayRole = normalizedRole.equals("Admin") ? "Administrator" : (normalizedRole.equals("HOD") ? "Placement HOD" : "Placement Staff");
        String displayIdentifier = (identifier != null && !identifier.isBlank()) ? identifier.trim() : "Not Applicable";
        String displayDept = (departmentName != null && !departmentName.isBlank()) ? departmentName.trim() : "General";
        String displayPhone = (phone != null && !phone.isBlank()) ? phone.trim() : "Not Provided";
        String approvalUrl = (frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl.replaceAll("/+$", "") + "/admin/approvals" : "http://localhost:5173/admin/approvals";

        java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
        String formattedDate = (registeredAt != null) ? registeredAt.format(dtf) : java.time.LocalDateTime.now().format(dtf);

        String textBody = String.format(
                "%s\n\n" +
                "Dear Administrator,\n\n" +
                "A new %s account registration request has been submitted and is currently waiting for your review and approval.\n\n" +
                "Applicant Registration Details:\n" +
                "- Full Name: %s\n" +
                "- Registered Email: %s\n" +
                "- Role: %s\n" +
                "- Identifier / ID: %s\n" +
                "- Department: %s\n" +
                "- Contact Phone: %s\n" +
                "- Registration Date: %s\n" +
                "- Account Status: PENDING APPROVAL\n\n" +
                "This account has not been granted login access. The request is waiting for Admin review.\n\n" +
                "Please review the request and approve or reject it through the Admin Console:\n" +
                "%s\n\n" +
                "Regards,\n" +
                "CareerReady AI Administration",
                subject, normalizedRole, displayName, applicantEmail, displayRole, displayIdentifier, displayDept, displayPhone, formattedDate, approvalUrl
        );

        String htmlBody = String.format(
                "<!DOCTYPE html>" +
                "<html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "<title>%s</title></head>" +
                "<body style='font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;'>" +
                "<div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;'>" +
                "  <div style='background: linear-gradient(135deg, #0f172a 0%%, #1e3a8a 100%%); padding: 32px 28px; text-align: center; color: #ffffff;'>" +
                "    <h1 style='margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;'>CareerReady AI</h1>" +
                "    <p style='margin: 8px 0 0; font-size: 13px; opacity: 0.9;'>Placement Readiness Analytics System &bull; Admin Notification</p>" +
                "  </div>" +
                "  <div style='padding: 32px 28px;'>" +
                "    <div style='display: inline-block; background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 16px; border: 1px solid #fde68a;'>Pending Approval</div>" +
                "    <h2 style='margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0f172a;'>New %s Registration</h2>" +
                "    <p style='margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;'>A new user has submitted a registration request for the <strong>%s</strong> role and is waiting for your review. Please review the applicant details below in the Admin Console before granting system privileges.</p>" +
                "    <div style='background: #f8fafc; border-radius: 8px; padding: 20px; margin: 0 0 24px; border: 1px solid #e2e8f0; border-left: 4px solid #f59e0b;'>" +
                "      <table style='width: 100%%; font-size: 13px; line-height: 1.8; color: #334155; border-collapse: collapse;'>" +
                "        <tr><td style='width: 140px; color: #64748b; font-weight: 600;'>Applicant Name:</td><td><strong style='color: #0f172a;'>%s</strong></td></tr>" +
                "        <tr><td style='color: #64748b; font-weight: 600;'>Registered Email:</td><td><a href='mailto:%s' style='color: #2563eb; text-decoration: none;'>%s</a></td></tr>" +
                "        <tr><td style='color: #64748b; font-weight: 600;'>Applicant Role:</td><td><span style='background: #eff6ff; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 12px;'>%s</span></td></tr>" +
                "        <tr><td style='color: #64748b; font-weight: 600;'>Identifier / ID:</td><td><code style='background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 12px; color: #0f172a;'>%s</code></td></tr>" +
                "        <tr><td style='color: #64748b; font-weight: 600;'>Department:</td><td>%s</td></tr>" +
                "        <tr><td style='color: #64748b; font-weight: 600;'>Contact Phone:</td><td>%s</td></tr>" +
                "        <tr><td style='color: #64748b; font-weight: 600;'>Registration Date:</td><td>%s</td></tr>" +
                "        <tr><td style='color: #64748b; font-weight: 600;'>Account Status:</td><td><span style='background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;'>PENDING APPROVAL</span></td></tr>" +
                "      </table>" +
                "    </div>" +
                "    <p style='margin: 0 0 20px; font-size: 13px; color: #64748b; line-height: 1.5;'>This account has not been granted login access. The request is waiting for Admin review. Please sign in to the Admin Console to review, approve, or reject this request.</p>" +
                "    <div style='text-align: center; margin: 28px 0;'>" +
                "      <a href='%s' style='display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);'>Open Admin Console</a>" +
                "    </div>" +
                "    <p style='margin: 0; font-size: 12px; color: #94a3b8; text-align: center; word-break: break-all;'>Direct Link: <a href='%s' style='color: #2563eb;'>%s</a></p>" +
                "  </div>" +
                "  <div style='background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; text-align: center; font-size: 12px; color: #94a3b8;'>" +
                "    &copy; %d CareerReady AI Placement Readiness Analytics System. All rights reserved." +
                "  </div>" +
                "</div>" +
                "</body></html>",
                subject, normalizedRole, displayRole, displayName, applicantEmail, applicantEmail,
                displayRole, displayIdentifier, displayDept, displayPhone, formattedDate,
                approvalUrl, approvalUrl, approvalUrl, Year.now().getValue()
        );

        log.info("[ADMIN REGISTRATION NOTIFICATION] Dispatching informational notification to: {} for applicant: {} ({})", targetAdmin, applicantEmail, normalizedRole);
        return sendMimeEmail(targetAdmin, subject, textBody, htmlBody);
    }

    @Override
    public boolean sendAdminRegistrationNotification(String applicantName, String applicantEmail, String roleName, String identifier, String departmentName, String phone) {
        return sendPendingRegistrationAdminNotification(applicantName, applicantEmail, roleName, identifier, departmentName, phone, java.time.LocalDateTime.now());
    }

    @Override
    public boolean sendStaffRegistrationNotification(
            String applicantName,
            String applicantEmail,
            String employeeId,
            String departmentName,
            String phone,
            java.time.LocalDateTime registeredAt,
            String approveUrl,
            String rejectUrl) {
        return sendPendingRegistrationAdminNotification(applicantName, applicantEmail, "Placement Staff", employeeId, departmentName, phone, registeredAt);
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
            InternetAddress fromAddress = new InternetAddress(sender, "CareerReady AI");
            helper.setFrom(fromAddress);
            helper.setReplyTo(fromAddress);
            helper.setTo(toEmail.trim());
            helper.setSubject(subject);
            helper.setText(textBody, htmlBody);

            // Set RFC compliant and anti-spam headers
            mimeMessage.setHeader("Auto-Submitted", "auto-generated");
            mimeMessage.setHeader("X-Auto-Response-Suppress", "All");
            mimeMessage.setHeader("X-Priority", "3");
            mimeMessage.setHeader("Importance", "Normal");

            mailSender.send(mimeMessage);
            log.info("Email notification successfully sent to {} with subject: '{}'", toEmail, subject);
            return true;
        } catch (Exception ex) {
            log.error("Failed to send email to {}: {}. Text notification content:\n{}", toEmail, ex.getMessage(), textBody);
            return false;
        }
    }
}

