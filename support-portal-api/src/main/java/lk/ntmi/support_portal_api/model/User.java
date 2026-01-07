package lk.ntmi.support_portal_api.model;

import jakarta.persistence.*;
import lk.ntmi.support_portal_api.model.enums.Role; // <--- CRITICAL IMPORT
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id; // Using Integer to match your other tables

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(nullable = false)
    private String password; 

    @Column(length = 100)
    private String fullName;

    @Column(length = 100)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Role role;

    // --- RELATIONSHIP CONFIGURATION ---
    // We link to the Branch entity directly.
    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = true)
    private Branch branch;

    // This helper method allows the Frontend to read "branchId" easily in the JSON response
    // without needing to save a separate field in the database.
    public Integer getBranchId() {
        return branch != null ? branch.getId() : null;
    }
    // ----------------------------------

    // Lombok generates: setActive(boolean) and isActive()
    @Column(name = "is_active")
    private boolean isActive = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Constructor for easy creation
    public User(String username, String password, String fullName, String email, Role role) {
        this.username = username;
        this.password = password;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
    }
}