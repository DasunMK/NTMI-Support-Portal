package lk.ntmi.support_portal_api.payload.request;

//import jakarta.validation.constraints.*;
import lombok.Data;
//import java.util.Set;

@Data
public class SignupRequest {
    private String username;
    private String password;
    private String fullName;
    private String email;
    private String role; // "ADMIN" or "BRANCH_USER"
    
    // The frontend sends just the ID, e.g., 5
    private Integer branchId; 
}