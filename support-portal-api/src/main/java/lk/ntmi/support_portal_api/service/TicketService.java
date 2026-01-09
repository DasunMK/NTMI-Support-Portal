package lk.ntmi.support_portal_api.service;

import lk.ntmi.support_portal_api.model.Notification;
import lk.ntmi.support_portal_api.model.Ticket;
import lk.ntmi.support_portal_api.model.User;
import lk.ntmi.support_portal_api.model.enums.TicketStatus; 
import lk.ntmi.support_portal_api.repository.NotificationRepository;
import lk.ntmi.support_portal_api.repository.TicketRepository;
import lk.ntmi.support_portal_api.repository.UserRepository;
import lk.ntmi.support_portal_api.repository.BranchRepository;
import lk.ntmi.support_portal_api.repository.ErrorTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TicketService {

    @Autowired private TicketRepository ticketRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private BranchRepository branchRepository;
    @Autowired private ErrorTypeRepository errorTypeRepository;

    // 1. Create Ticket & Notify Admins
    public Ticket createTicket(Ticket ticket) {
        Ticket savedTicket = ticketRepository.save(ticket);

        // Get details for notification
        String branchName = branchRepository.findById(savedTicket.getBranchId())
            .map(b -> b.getName()).orElse("Unknown");
        
        String errCat = "Unknown";
        String errType = "Unknown";
        var typeObj = errorTypeRepository.findById(savedTicket.getErrorTypeId()).orElse(null);
        if (typeObj != null) {
             errType = typeObj.getName();
             if (typeObj.getCategory() != null) errCat = typeObj.getCategory().getName();
        }

        // Find Admins using the Native Query
        List<User> admins = userRepository.findAllAdmins();
        System.out.println("DEBUG: Notifying " + admins.size() + " admins.");

        for (User admin : admins) {
            Notification notif = new Notification(
                "New Ticket Raised", "WARNING", admin, 
                Long.valueOf(savedTicket.getId()), savedTicket.getTicketNumber(),
                branchName, errCat, errType, savedTicket.getCreatedBy().getUsername()
            );
            notificationRepository.save(notif);
        }
        return savedTicket;
    }

    // 2. Update Status & Notify Branch User
    public Ticket updateStatus(Integer ticketId, String newStatusString, String adminUsername) {
        Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new RuntimeException("Ticket not found"));
        
        ticket.setStatus(TicketStatus.valueOf(newStatusString));
        
        User admin = userRepository.findByUsername(adminUsername)
            .orElseThrow(() -> new RuntimeException("Admin not found"));
        ticket.setAssignedTo(admin);
        
        Ticket updatedTicket = ticketRepository.save(ticket);

        // Prepare Notification
        String msg = newStatusString.equals("IN_PROGRESS") ? "Ticket Started" : "Ticket Resolved";
        String type = newStatusString.equals("IN_PROGRESS") ? "INFO" : "SUCCESS";
        
        String branchName = branchRepository.findById(ticket.getBranchId())
            .map(b -> b.getName()).orElse("Unknown");
        
        String errCat = "Unknown";
        String errType = "Unknown";
        var typeObj = errorTypeRepository.findById(ticket.getErrorTypeId()).orElse(null);
        if (typeObj != null) {
             errType = typeObj.getName();
             if (typeObj.getCategory() != null) errCat = typeObj.getCategory().getName();
        }

        // Notify the Creator
        Notification notif = new Notification(
            msg, type, ticket.getCreatedBy(), 
            Long.valueOf(ticket.getId()), ticket.getTicketNumber(),
            branchName, errCat, errType, adminUsername
        );
        notificationRepository.save(notif);

        return updatedTicket;
    }
    
    // 3. Get Notifications for a User
    public List<Notification> getNotifications(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.findByRecipientAndIsReadFalseOrderByCreatedAtDesc(user);
    }

    // 4. Mark Read
    public void markAsRead(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }
}