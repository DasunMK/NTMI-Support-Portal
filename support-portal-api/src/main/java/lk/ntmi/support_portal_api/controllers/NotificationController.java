package lk.ntmi.support_portal_api.controllers; // FIX: Added 's' to match your folder

import lk.ntmi.support_portal_api.model.Notification;
import lk.ntmi.support_portal_api.model.User;
import lk.ntmi.support_portal_api.repository.NotificationRepository;
import lk.ntmi.support_portal_api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired private NotificationRepository notificationRepository;
    @Autowired private UserRepository userRepository;

    // Get unread notifications for logged-in user
    @GetMapping("/{username}")
    public List<Notification> getUserNotifications(@PathVariable String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return notificationRepository.findByRecipientAndIsReadFalseOrderByCreatedAtDesc(user);
    }

    // Mark as read
    @PutMapping("/{id}/read")
    public void markAsRead(@PathVariable Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }
}