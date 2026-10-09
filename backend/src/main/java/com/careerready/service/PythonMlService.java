package com.careerready.service;

import com.careerready.config.PythonMlConfig;
import com.careerready.dto.readiness.PythonMlPredictRequest;
import com.careerready.dto.readiness.PythonMlPredictResponse;
import com.careerready.exception.MlServiceUnavailableException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PythonMlService {

    private final RestTemplate restTemplate;
    private final PythonMlConfig pythonMlConfig;

    /**
     * Sends student feature vector to Python Flask ML service (POST /predict)
     * Throws MlServiceUnavailableException if Python service is unreachable.
     */
    public PythonMlPredictResponse predict(PythonMlPredictRequest request) {
        String url = pythonMlConfig.getMlServiceUrl() + "/predict";
        log.info("Dispatching ML inference request to Python service: {}", url);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<PythonMlPredictRequest> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<PythonMlPredictResponse> response = restTemplate.postForEntity(
                    url, entity, PythonMlPredictResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("Received real Python ML prediction: category={}, score={}, confidence={}",
                        response.getBody().getReadinessCategory(),
                        response.getBody().getReadinessScore(),
                        response.getBody().getConfidence());
                return response.getBody();
            } else {
                throw new MlServiceUnavailableException(
                        "Python ML service responded with non-success status: " + response.getStatusCode()
                );
            }
        } catch (ResourceAccessException ex) {
            log.error("Failed to connect to Python ML service at {}: {}", url, ex.getMessage());
            throw new MlServiceUnavailableException(
                    "ML prediction service is unavailable. Please ensure the Python ML service is running on "
                            + pythonMlConfig.getMlServiceUrl() + "."
            );
        } catch (RestClientResponseException ex) {
            log.error("Python ML service returned error {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new MlServiceUnavailableException(
                    "Python ML service error (" + ex.getStatusCode() + "): " + ex.getResponseBodyAsString()
            );
        } catch (Exception ex) {
            log.error("Unexpected error invoking Python ML service: {}", ex.getMessage(), ex);
            throw new MlServiceUnavailableException(
                    "Error executing ML readiness inference: " + ex.getMessage()
            );
        }
    }

    /**
     * Check if Python Flask ML service is running and healthy (GET /health)
     */
    @SuppressWarnings("unchecked")
    public boolean isServiceHealthy() {
        String url = pythonMlConfig.getMlServiceUrl() + "/health";
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getStatusCode().is2xxSuccessful()
                    && response.getBody() != null
                    && "UP".equalsIgnoreCase(String.valueOf(response.getBody().get("status")));
        } catch (Exception ex) {
            log.warn("Python ML service health check failed at {}: {}", url, ex.getMessage());
            return false;
        }
    }
}
