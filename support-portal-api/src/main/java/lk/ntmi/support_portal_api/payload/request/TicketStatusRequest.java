package lk.ntmi.support_portal_api.payload.request;

import lombok.Data;

@Data
public class TicketStatusRequest {
    private String status;
    private String username; // The admin who is changing the status
}