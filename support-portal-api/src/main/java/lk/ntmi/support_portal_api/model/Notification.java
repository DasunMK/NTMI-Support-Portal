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
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User recipient;

    private boolean isRead = false;
    
    // FIX: Changed from Integer to Long to match Ticket ID
    private Long relatedTicketId; 

    @CreationTimestamp
    private LocalDateTime createdAt;

    // FIX: Updated constructor to accept Long
    public Notification(String message, User recipient, Long relatedTicketId) {
        this.message = message;
        this.recipient = recipient;
        this.relatedTicketId = relatedTicketId;
    }
}