package com.careerready;

import com.careerready.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SecurityTest {

    private JwtTokenProvider jwtTokenProvider;
    private final String secret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(secret, 3600000L);
    }

    @Test
    @DisplayName("Should generate valid JWT and correctly extract claims")
    void testJwtGenerationAndExtraction() {
        String token = jwtTokenProvider.generateTokenFromUser(1L, "student@careerready.ai", "STUDENT");

        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));
        assertEquals("student@careerready.ai", jwtTokenProvider.getUsernameFromToken(token));
        assertEquals(1L, jwtTokenProvider.getUserIdFromToken(token));
        assertEquals("STUDENT", jwtTokenProvider.getRoleFromToken(token));
    }

    @Test
    @DisplayName("Should reject malformed or tampered JWT token")
    void testInvalidJwt() {
        String invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.token";
        assertFalse(jwtTokenProvider.validateToken(invalidToken));
    }
}
