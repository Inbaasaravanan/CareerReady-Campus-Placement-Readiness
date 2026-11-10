package com.careerready.service.impl;

import com.careerready.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class StaffRegistrationNotificationDispatcher {

    private final EmailService emailService;

    /**
     * Dispatches the Admin staff registration notification asynchronously via the managed mail thread pool.
     * This ensures the user's registration HTTP request returns immediately without waiting for SMTP network I/O.
     */
    @Async("mailTaskExecutor")
    public void dispatchNotificationAsync(
            String applicantName,
            String applicantEmail,
            String employeeId,
            String departmentName,
            String phone,
            LocalDateTime registeredAt,
            String approveUrl,
            String rejectUrl) {

        try {
            log.info("[ASYNC EMAIL] Initiating asynchronous staff registration email for applicant: {} (Employee ID: {})",
                    applicantEmail, employeeId);
            boolean sent = emailService.sendStaffRegistrationNotification(
                    applicantName,
                    applicantEmail,
                    employeeId,
                    departmentName,
                    phone,
                    registeredAt,
                    approveUrl,
                    rejectUrl
            );
            if (sent) {
                log.info("[ASYNC EMAIL SUCCESS] Admin staff registration notification delivered successfully for {}", applicantEmail);
            } else {
                log.warn("[ASYNC EMAIL WARNING] Admin notification dispatch for {} returned false (no SMTP server bound or provider rejected message).", applicantEmail);
            }
        } catch (Exception ex) {
            log.error("[ASYNC EMAIL ERROR] Failed to dispatch staff registration notification for {}: {}", applicantEmail, ex.getMessage(), ex);
        }
    }

    /**
     * Dispatches the Admin HOD registration notification asynchronously via the managed mail thread pool.
     */
    @Async("mailTaskExecutor")
    public void dispatchHodNotificationAsync(
            String applicantName,
            String applicantEmail,
            String institutionalId,
            String departmentName,
            String phone,
            LocalDateTime registeredAt) {

        try {
            log.info("[ASYNC EMAIL] Initiating asynchronous HOD registration email for applicant: {} (Institutional ID: {})",
                    applicantEmail, institutionalId);
            boolean sent = emailService.sendPendingRegistrationAdminNotification(
                    applicantName,
                    applicantEmail,
                    "Placement HOD",
                    institutionalId,
                    departmentName,
                    phone,
                    registeredAt
            );
            if (sent) {
                log.info("[ASYNC EMAIL SUCCESS] Admin HOD registration notification delivered successfully for {}", applicantEmail);
            } else {
                log.warn("[ASYNC EMAIL WARNING] Admin HOD notification dispatch for {} returned false (no SMTP server bound or provider rejected message).", applicantEmail);
            }
        } catch (Exception ex) {
            log.error("[ASYNC EMAIL ERROR] Failed to dispatch HOD registration notification for {}: {}", applicantEmail, ex.getMessage(), ex);
        }
    }
}
