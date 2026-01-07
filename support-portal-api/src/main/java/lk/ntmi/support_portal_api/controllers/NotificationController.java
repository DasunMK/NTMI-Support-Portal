package lk.ntmi.support_portal_api.controllers;

import lk.ntmi.support_portal_api.model.Notification;
import lk.ntmi.support_portal_api.model.User;
import lk.ntmi.support_portal_api.repository.NotificationRepository;
import lk.ntmi.support_portal_api.repository.UserRepository;
import lk.ntmi.support_portal_api.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", allowCredentials = "true")
public class NotificationController {

    @Autowired NotificationRepository notificationRepository;
    @Autowired UserRepository userRepository;

    @GetMapping
    public List<Notification> getMyNotifications(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userRepository.findById(userDetails.getId()).orElseThrow();
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user);
    }

    @PutMapping("/{id}/read")
    public void markAsRead(@PathVariable Long id) {
        Notification n = notificationRepository.findById(id).orElse(null);
        if(n != null) {
            n.setRead(true);
            notificationRepository.save(n);
        }
    }

    @DeleteMapping("/clear-read")
    @Transactional
    public void clearReadNotifications(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userRepository.findById(userDetails.getId()).orElseThrow();
        notificationRepository.deleteByRecipientAndIsReadTrue(user);
    }
}