package lk.ntmi.support_portal_api.controllers;

import lk.ntmi.support_portal_api.model.Ticket;
import lk.ntmi.support_portal_api.model.User;
import lk.ntmi.support_portal_api.model.enums.TicketPriority;
import lk.ntmi.support_portal_api.model.enums.TicketStatus;
import lk.ntmi.support_portal_api.payload.request.TicketStatusRequest;
import lk.ntmi.support_portal_api.payload.response.MessageResponse;
import lk.ntmi.support_portal_api.repository.TicketRepository;
import lk.ntmi.support_portal_api.repository.UserRepository;
import lk.ntmi.support_portal_api.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, allowedHeaders = "*", allowCredentials = "true")
public class TicketController {

    @Autowired
    TicketRepository ticketRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    FileStorageService fileStorageService;

    // --- 1. CREATE TICKET (With Image Upload) ---
    @PostMapping
    public ResponseEntity<?> createTicket(
            // FIX: Make ticketNumber optional so auto-generation works
            @RequestParam(value = "ticketNumber", required = false) String ticketNumber,
            @RequestParam("description") String description,
            @RequestParam("priority") String priority,
            @RequestParam("branchId") Integer branchId,
            @RequestParam("errorTypeId") Integer errorTypeId,
            @RequestParam(value = "userId", required = false) Integer userId, 
            @RequestParam(value = "images", required = false) MultipartFile[] files
    ) {
        try {
            Ticket ticket = new Ticket();
            // If ticket number not provided, generate one
            if(ticketNumber == null || ticketNumber.isEmpty()) {
                ticketNumber = "TKT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            }
            ticket.setTicketNumber(ticketNumber);
            ticket.setDescription(description);
            ticket.setPriority(TicketPriority.valueOf(priority.toUpperCase()));
            ticket.setStatus(TicketStatus.OPEN);
            ticket.setBranchId(branchId);
            ticket.setErrorTypeId(errorTypeId);
            
            // Link User if provided
            if (userId != null) {
                User user = userRepository.findById(userId).orElse(null);
                if(user != null) {
                    ticket.setCreatedBy(user);
                }
            }

            // Handle Images
            if (files != null && files.length > 0) {
                List<String> imagePaths = new ArrayList<>();
                for (MultipartFile file : files) {
                    String path = fileStorageService.storeFile(file);
                    imagePaths.add(path);
                }
                ticket.setImagePaths(imagePaths);
            }

            Ticket savedTicket = ticketRepository.save(ticket);
            return ResponseEntity.ok(savedTicket);

        } catch (Exception e) {
            e.printStackTrace(); // Helpful for debugging in terminal
            return ResponseEntity.badRequest().body(new MessageResponse("Error creating ticket: " + e.getMessage()));
        }
    }

    // --- 2. GET ALL TICKETS ---
    @GetMapping
    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    // --- 3. GET TICKETS BY BRANCH ---
    @GetMapping("/branch/{branchName}")
    public List<Ticket> getTicketsByBranch(@PathVariable String branchName) {
        // You might need to adjust logic if you only store branchId
        return ticketRepository.findAll(); 
    }

    // --- 4. UPDATE STATUS ---
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateTicketStatus(@PathVariable Integer id, @RequestBody TicketStatusRequest request) {
        return ticketRepository.findById(id).map(ticket -> {
            try {
                // Parse Status String to Enum
                TicketStatus newStatus = TicketStatus.valueOf(request.getStatus().toUpperCase());
                ticket.setStatus(newStatus);
                
                // If status is IN_PROGRESS, assign the admin
                if (newStatus == TicketStatus.IN_PROGRESS && request.getUsername() != null) {
                    User admin = userRepository.findByUsername(request.getUsername()).orElse(null);
                    if (admin != null) {
                        ticket.setAssignedTo(admin);
                    }
                }
                
                ticketRepository.save(ticket);
                return ResponseEntity.ok(new MessageResponse("Ticket status updated successfully!"));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(new MessageResponse("Invalid status provided."));
            }
        }).orElse(ResponseEntity.notFound().build());
    }
}