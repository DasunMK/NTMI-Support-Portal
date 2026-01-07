package lk.ntmi.support_portal_api.payload.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TicketRequest {

    @NotBlank
    private String description;

    @NotBlank
    private String priority; // "LOW", "MEDIUM", "HIGH"

    // Optional: We can add branchId or errorTypeId later.
    // For now, let's keep it simple.
    private Integer branchId; 
}