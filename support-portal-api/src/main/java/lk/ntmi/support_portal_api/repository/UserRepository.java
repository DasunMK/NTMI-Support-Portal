package lk.ntmi.support_portal_api.repository;

import lk.ntmi.support_portal_api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String username);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);

    // FIX: Force SQL search for 'ADMIN' to avoid Enum mapping errors
    @Query(value = "SELECT * FROM users WHERE role = 'ADMIN'", nativeQuery = true)
    List<User> findAllAdmins();
}