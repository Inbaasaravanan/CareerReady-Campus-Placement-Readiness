package com.careerready.dto.cms;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchCmsUpdateRequest {

    @NotEmpty(message = "Items list cannot be empty")
    private List<CmsContentDto> items;
}
