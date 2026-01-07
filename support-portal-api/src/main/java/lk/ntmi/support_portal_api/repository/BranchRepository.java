package lk.ntmi.support_portal_api.repository;

import lk.ntmi.support_portal_api.model.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Integer> {
    
    // 1. Find full branch details by name (e.g., for Data Seeding or Login lookup)
    Optional<Branch> findByName(String name);

    // 2. Efficiently check if a branch exists (returns true/false)
    // Useful for validation to prevent duplicates without fetching the whole object
    boolean existsByName(String name);
}