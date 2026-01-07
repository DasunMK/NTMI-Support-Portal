package lk.ntmi.support_portal_api.repository;

import lk.ntmi.support_portal_api.model.User;
import lk.ntmi.support_portal_api.model.enums.Role; // <--- Import your Role enum
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List; // <--- Import List
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    
    // "Magic Method": Spring automatically writes the SQL for this!
    // SELECT * FROM users WHERE username = ?
    Optional<User> findByUsername(String username);

    // Checks if a username exists (for registration validation)
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);

    // --- NEW METHOD ---
    // This allows us to find all users who are ADMINs so we can notify them
    List<User> findByRole(Role role);
}