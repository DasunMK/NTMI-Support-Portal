package lk.ntmi.support_portal_api.repository;

import lk.ntmi.support_portal_api.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

// --- FIX: Changed <Ticket, Long> to <Ticket, Integer> ---
@Repository
public interface TicketRepository extends JpaRepository<Ticket, Integer> {
    
    // Find all tickets created by a specific user (For Branch Users seeing their own tickets)
    List<Ticket> findByCreatedBy_Id(Integer userId);

    // Find all tickets assigned to a specific admin (For IT Admin seeing their jobs)
    List<Ticket> findByAssignedTo_Id(Integer userId);

    // Optional: Find tickets by Branch ID (Useful for filtering)
    List<Ticket> findByBranchId(Integer branchId);
}