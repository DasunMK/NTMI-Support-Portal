package lk.ntmi.support_portal_api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor; // Import Added
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "categories")
@Data
@NoArgsConstructor
@AllArgsConstructor // Annotation Added
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false)
    private String name;

    // Custom constructor for easy creation (e.g., new Category("Hardware"))
    public Category(String name) {
        this.name = name;
    }
}