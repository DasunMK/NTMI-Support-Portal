package lk.ntmi.support_portal_api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "error_types")
@Data
@NoArgsConstructor
public class ErrorType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    // --- FIX IS HERE ---
    // We removed @JsonIgnore so the frontend can see the category!
    // We added @JsonIgnoreProperties to prevent potential loops if Category has a list of types.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    @JsonIgnoreProperties("errorTypes") 
    private Category category;

    // Custom constructor
    public ErrorType(String name, Category category) {
        this.name = name;
        this.category = category;
    }
}