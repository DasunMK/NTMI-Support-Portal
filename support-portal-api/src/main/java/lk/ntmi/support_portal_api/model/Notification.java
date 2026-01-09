package lk.ntmi.support_portal_api.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String message;
    private String type; // INFO, WARNING, SUCCESS

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User recipient; // Who sees this notification

    private boolean isRead = false;
    
    private Long relatedTicketId;
    private String ticketNumber; 

    // Detailed Info
    private String branchName;
    private String errorCategory;
    private String errorType;
    private String triggerUser; // Who caused the action

    @CreationTimestamp
    private LocalDateTime createdAt;

    public Notification(String message, String type, User recipient, Long relatedTicketId, 
                        String ticketNumber, String branchName, String errorCategory, 
                        String errorType, String triggerUser) {
        this.message = message;
        this.type = type;
        this.recipient = recipient;
        this.relatedTicketId = relatedTicketId;
        this.ticketNumber = ticketNumber;
        this.branchName = branchName;
        this.errorCategory = errorCategory;
        this.errorType = errorType;
        this.triggerUser = triggerUser;
    }
}