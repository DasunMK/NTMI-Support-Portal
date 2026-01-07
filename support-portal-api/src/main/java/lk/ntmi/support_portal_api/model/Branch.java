package lk.ntmi.support_portal_api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank; // Added for validation
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "branches")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Branch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank(message = "Branch name cannot be empty") // Validation
    @Column(nullable = false, unique = true)
    private String name;

    // Custom constructor needed for the Seeding script
    public Branch(String name) {
        this.name = name;
    }
}