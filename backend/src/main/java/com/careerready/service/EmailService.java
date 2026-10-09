package com.careerready.service;

public interface EmailService {
    boolean sendApprovalEmail(String recipientEmail, String recipientName, String roleName);
    boolean sendRejectionEmail(String recipientEmail, String recipientName, String roleName);
    boolean sendPasswordResetEmail(String recipientEmail, String recipientName, String roleName, String resetLink, int expiryMinutes);
}
