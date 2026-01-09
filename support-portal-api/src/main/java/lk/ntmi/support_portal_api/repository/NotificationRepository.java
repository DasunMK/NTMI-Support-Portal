package lk.ntmi.support_portal_api.repository;

import lk.ntmi.support_portal_api.model.Notification;
import lk.ntmi.support_portal_api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // Fetch unread messages for a specific user
    List<Notification> findByRecipientAndIsReadFalseOrderByCreatedAtDesc(User recipient);
}