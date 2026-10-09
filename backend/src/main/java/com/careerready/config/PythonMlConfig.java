package com.careerready.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class PythonMlConfig {

    @Value("${ml.service.url:http://localhost:5000}")
    private String mlServiceUrl;

    @Value("${ml.service.auto-start:true}")
    private boolean autoStart;

    @Value("${ml.service.python-cmd:py -3.13,python}")
    private String pythonCmd;

    public String getMlServiceUrl() {
        return mlServiceUrl;
    }

    public boolean isAutoStart() {
        return autoStart;
    }

    public String getPythonCmd() {
        return pythonCmd;
    }

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
    }
}
