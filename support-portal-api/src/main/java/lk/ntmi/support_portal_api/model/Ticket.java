package lk.ntmi.support_portal_api.model;

import jakarta.persistence.*;
import lk.ntmi.support_portal_api.model.enums.TicketPriority;
import lk.ntmi.support_portal_api.model.enums.TicketStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList; // Import added
import java.util.List;      // Import added

@Entity
@Table(name = "tickets")
@Data
@NoArgsConstructor
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String ticketNumber; 

    @Column(nullable = false, length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    private TicketStatus status = TicketStatus.OPEN;

    @Enumerated(EnumType.STRING)
    private TicketPriority priority = TicketPriority.MEDIUM;

    private Integer branchId;
    private Integer errorTypeId; 
    
    @ManyToOne
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy; 

    @ManyToOne
    @JoinColumn(name = "assigned_admin_id")
    private User assignedTo; 

    // --- NEW: THIS WAS MISSING ---
    @ElementCollection
    @CollectionTable(name = "ticket_images", joinColumns = @JoinColumn(name = "ticket_id"))
    @Column(name = "image_path")
    private List<String> imagePaths = new ArrayList<>();
    // -----------------------------

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}