package lk.ntmi.support_portal_api.repository;

import lk.ntmi.support_portal_api.model.ErrorType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ErrorTypeRepository extends JpaRepository<ErrorType, Integer> {
    boolean existsByName(String name);
}