package com.careerready.service;

public interface EmailService {
    boolean sendApprovalEmail(String recipientEmail, String recipientName, String roleName);
    boolean sendRejectionEmail(String recipientEmail, String recipientName, String roleName);
    boolean sendPasswordResetEmail(String recipientEmail, String recipientName, String roleName, String resetLink, int expiryMinutes);
    boolean sendAdminRegistrationNotification(String applicantName, String applicantEmail, String roleName, String identifier, String departmentName, String phone);
    boolean sendPendingRegistrationAdminNotification(String applicantName, String applicantEmail, String roleName, String identifier, String departmentName, String phone, java.time.LocalDateTime registeredAt);
    boolean sendStaffRegistrationNotification(String applicantName, String applicantEmail, String employeeId, String departmentName, String phone, java.time.LocalDateTime registeredAt, String approveUrl, String rejectUrl);
}
