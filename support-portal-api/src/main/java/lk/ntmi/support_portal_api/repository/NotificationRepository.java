package lk.ntmi.support_portal_api.repository;
import lk.ntmi.support_portal_api.model.Notification;
import lk.ntmi.support_portal_api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);
    void deleteByRecipientAndIsReadTrue(User recipient);
}