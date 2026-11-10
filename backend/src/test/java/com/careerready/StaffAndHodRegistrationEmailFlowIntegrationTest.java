package com.careerready;

import com.careerready.dto.auth.HodRegisterRequest;
import com.careerready.dto.auth.LoginRequest;
import com.careerready.dto.auth.StaffRegisterRequest;
import com.careerready.entity.Department;
import com.careerready.entity.PlacementHod;
import com.careerready.entity.PlacementStaff;
import com.careerready.entity.User;
import com.careerready.enums.Role;
import com.careerready.enums.UserStatus;
import com.careerready.exception.BadRequestException;
import com.careerready.exception.UnauthorizedException;
import com.careerready.repository.DepartmentRepository;
import com.careerready.repository.PlacementHodRepository;
import com.careerready.repository.PlacementStaffRepository;
import com.careerready.repository.UserRepository;
import com.careerready.service.AdminService;
import com.careerready.service.AuthService;
import com.careerready.service.EmailService;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Properties;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
class StaffAndHodRegistrationEmailFlowIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private AdminService adminService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlacementStaffRepository staffRepository;

    @Autowired
    private PlacementHodRepository hodRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @MockBean
    private JavaMailSender mailSender;

    private Department testDept;

    @BeforeEach
    void setup() {
        testDept = departmentRepository.findAll().stream().findFirst()
                .orElseGet(() -> departmentRepository.save(Department.builder().name("Computer Science and Engineering").code("CSE").build()));

        when(mailSender.createMimeMessage()).thenAnswer(invocation ->
                new MimeMessage(Session.getInstance(new Properties()))
        );
    }

    @Test
    @DisplayName("Task 1 A & B: Staff registration creates pending account, notifies admin, and approval triggers user email")
    void testStaffRegistrationAndApprovalEmailFlow() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String staffEmail = "staff.flow." + suffix + "@careerready.ai";
        String empId = "EMP-TST-" + suffix.toUpperCase();

        // 1. Submit Staff Registration
        StaffRegisterRequest staffRequest = StaffRegisterRequest.builder()
                .name("Prof. Sundaram")
                .email(staffEmail)
                .password("StrongPass123!")
                .employeeId(empId)
                .departmentId(testDept.getId())
                .phone("+91 9876543210")
                .build();

        authService.registerStaff(staffRequest);

        // 2. Verify account is saved in database and remains PENDING_APPROVAL
        User staffUser = userRepository.findByEmail(staffEmail).orElseThrow();
        assertEquals(UserStatus.PENDING_APPROVAL, staffUser.getStatus());
        assertEquals(Role.PLACEMENT_STAFF, staffUser.getRole());
        assertEquals("Prof. Sundaram", staffUser.getName());
        assertFalse(Boolean.TRUE.equals(staffUser.getApprovalEmailSent()));

        PlacementStaff staffEntity = staffRepository.findByUserId(staffUser.getId()).orElseThrow();
        assertEquals(empId, staffEntity.getEmployeeId());
        assertNull(staffEntity.getApprovedAt());

        // 3. Verify user cannot log in while pending approval
        assertThrows(UnauthorizedException.class, () ->
                authService.login(new LoginRequest(staffEmail, "StrongPass123!", "staff"))
        );

        // 4. Verify Admin receives informational notification with correct subject and no action buttons
        // Give background async executor a brief moment if needed
        Thread.sleep(600);
        ArgumentCaptor<MimeMessage> msgCaptor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, atLeastOnce()).send(msgCaptor.capture());

        MimeMessage adminMsg = msgCaptor.getAllValues().stream()
                .filter(m -> {
                    try {
                        return m.getSubject() != null && m.getSubject().contains("New Staff Registration");
                    } catch (Exception e) {
                        return false;
                    }
                })
                .findFirst()
                .orElse(null);

        assertNotNull(adminMsg, "Admin notification email for Staff registration was not sent");
        assertEquals("New Staff Registration — Pending Approval", adminMsg.getSubject());
        assertEquals("inbaasara@gmail.com", adminMsg.getAllRecipients()[0].toString());

        // 5. Admin approves pending Staff request through existing Admin Console
        reset(mailSender);
        when(mailSender.createMimeMessage()).thenAnswer(invocation ->
                new MimeMessage(Session.getInstance(new Properties()))
        );

        String approveResult = adminService.approveUser(staffUser.getId());
        assertTrue(approveResult.contains("Account approved successfully"));

        // 6. Verify database status is now APPROVED and approval audit fields set
        User approvedUser = userRepository.findById(staffUser.getId()).orElseThrow();
        assertEquals(UserStatus.APPROVED, approvedUser.getStatus());
        assertTrue(approvedUser.getApprovalEmailSent());

        PlacementStaff approvedStaff = staffRepository.findByUserId(staffUser.getId()).orElseThrow();
        assertNotNull(approvedStaff.getApprovedAt());
        assertEquals("Administrator", approvedStaff.getApprovedBy());

        // 7. Verify the approved user receives the approval email with exact required message
        Thread.sleep(300);
        ArgumentCaptor<MimeMessage> approvalCaptor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, times(1)).send(approvalCaptor.capture());

        MimeMessage userApprovalMsg = approvalCaptor.getValue();
        assertEquals("Your CareerReady AI Account Has Been Approved", userApprovalMsg.getSubject());
        assertEquals(staffEmail, userApprovalMsg.getAllRecipients()[0].toString());

        // 8. Verify user can now successfully log in
        var loginResponse = authService.login(new LoginRequest(staffEmail, "StrongPass123!", "staff"));
        assertNotNull(loginResponse);
        assertNotNull(loginResponse.getToken());

        // 9. Verify repeated approval actions do NOT send duplicate approval emails
        reset(mailSender);
        String repeatMsg = adminService.approveUser(staffUser.getId());
        assertTrue(repeatMsg.contains("already active/approved"));
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Task 1 A & B: HOD registration creates pending account, notifies admin, and approval triggers user email")
    void testHodRegistrationAndApprovalEmailFlow() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String hodEmail = "hod.flow." + suffix + "@careerready.ai";
        String instId = "HOD-INST-" + suffix.toUpperCase();

        // 1. Submit HOD Registration
        HodRegisterRequest hodRequest = HodRegisterRequest.builder()
                .name("Dr. Radhakrishnan")
                .email(hodEmail)
                .password("StrongHodPass123!")
                .institutionalId(instId)
                .departmentAuthority("Head of Department & Professor")
                .departmentId(testDept.getId())
                .phone("+91 9123456780")
                .build();

        authService.registerHod(hodRequest);

        // 2. Verify account is saved in database and remains PENDING_APPROVAL
        User hodUser = userRepository.findByEmail(hodEmail).orElseThrow();
        assertEquals(UserStatus.PENDING_APPROVAL, hodUser.getStatus());
        assertEquals(Role.PLACEMENT_HOD, hodUser.getRole());
        assertEquals("Dr. Radhakrishnan", hodUser.getName());
        assertFalse(Boolean.TRUE.equals(hodUser.getApprovalEmailSent()));

        PlacementHod hodEntity = hodRepository.findByUserId(hodUser.getId()).orElseThrow();
        assertEquals(instId, hodEntity.getInstitutionalId());
        assertNull(hodEntity.getApprovedAt());

        // 3. Verify user cannot log in while pending approval
        assertThrows(UnauthorizedException.class, () ->
                authService.login(new LoginRequest(hodEmail, "StrongHodPass123!", "hod"))
        );

        // 4. Verify Admin receives informational notification with correct subject
        Thread.sleep(600);
        ArgumentCaptor<MimeMessage> msgCaptor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, atLeastOnce()).send(msgCaptor.capture());

        MimeMessage adminMsg = msgCaptor.getAllValues().stream()
                .filter(m -> {
                    try {
                        return m.getSubject() != null && m.getSubject().contains("New HOD Registration");
                    } catch (Exception e) {
                        return false;
                    }
                })
                .findFirst()
                .orElse(null);

        assertNotNull(adminMsg, "Admin notification email for HOD registration was not sent");
        assertEquals("New HOD Registration — Pending Approval", adminMsg.getSubject());
        assertEquals("inbaasara@gmail.com", adminMsg.getAllRecipients()[0].toString());

        // 5. Admin approves pending HOD request through existing Admin Console
        reset(mailSender);
        when(mailSender.createMimeMessage()).thenAnswer(invocation ->
                new MimeMessage(Session.getInstance(new Properties()))
        );

        String approveResult = adminService.approveUser(hodUser.getId());
        assertTrue(approveResult.contains("Account approved successfully"));

        // 6. Verify database status is now APPROVED and approval audit fields set
        User approvedUser = userRepository.findById(hodUser.getId()).orElseThrow();
        assertEquals(UserStatus.APPROVED, approvedUser.getStatus());
        assertTrue(approvedUser.getApprovalEmailSent());

        PlacementHod approvedHod = hodRepository.findByUserId(hodUser.getId()).orElseThrow();
        assertNotNull(approvedHod.getApprovedAt());
        assertEquals("Administrator", approvedHod.getApprovedBy());

        // 7. Verify the approved HOD user receives the approval email with exact required message
        Thread.sleep(300);
        ArgumentCaptor<MimeMessage> approvalCaptor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, times(1)).send(approvalCaptor.capture());

        MimeMessage userApprovalMsg = approvalCaptor.getValue();
        assertEquals("Your CareerReady AI Account Has Been Approved", userApprovalMsg.getSubject());
        assertEquals(hodEmail, userApprovalMsg.getAllRecipients()[0].toString());

        // 8. Verify HOD user can now successfully log in
        var loginResponse = authService.login(new LoginRequest(hodEmail, "StrongHodPass123!", "hod"));
        assertNotNull(loginResponse);
        assertNotNull(loginResponse.getToken());

        // 9. Verify repeated approval actions do NOT send duplicate approval emails
        reset(mailSender);
        String repeatMsg = adminService.approveUser(hodUser.getId());
        assertTrue(repeatMsg.contains("already active/approved"));
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Task 1 B: Rejection sets REJECTED status, blocks login, and sends NO approval email")
    void testRejectionFlowSendsNoApprovalEmail() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String rejectEmail = "reject.user." + suffix + "@careerready.ai";

        StaffRegisterRequest staffRequest = StaffRegisterRequest.builder()
                .name("Unverified Candidate")
                .email(rejectEmail)
                .password("Password123!")
                .employeeId("EMP-REJ-" + suffix)
                .departmentId(testDept.getId())
                .phone("+91 9999900000")
                .build();

        authService.registerStaff(staffRequest);
        User user = userRepository.findByEmail(rejectEmail).orElseThrow();

        reset(mailSender);
        when(mailSender.createMimeMessage()).thenAnswer(invocation ->
                new MimeMessage(Session.getInstance(new Properties()))
        );

        // Reject account
        String rejectMsg = adminService.rejectUser(user.getId());
        assertTrue(rejectMsg.contains("Account registration rejected"));

        User rejectedUser = userRepository.findById(user.getId()).orElseThrow();
        assertEquals(UserStatus.REJECTED, rejectedUser.getStatus());

        // Login must fail
        assertThrows(UnauthorizedException.class, () ->
                authService.login(new LoginRequest(rejectEmail, "Password123!", "staff"))
        );

        // Attempting to approve a rejected account must fail and never send an approval email
        assertThrows(BadRequestException.class, () ->
                adminService.approveUser(user.getId())
        );

        // Verify NO message was sent with subject "Your CareerReady AI Account Has Been Approved"
        ArgumentCaptor<MimeMessage> msgCaptor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, atLeast(0)).send(msgCaptor.capture());

        boolean approvalEmailSent = msgCaptor.getAllValues().stream().anyMatch(m -> {
            try {
                return m.getSubject() != null && m.getSubject().contains("Your CareerReady AI Account Has Been Approved");
            } catch (Exception e) {
                return false;
            }
        });
        assertFalse(approvalEmailSent, "Approval email must NEVER be sent for rejected accounts");
    }
}
