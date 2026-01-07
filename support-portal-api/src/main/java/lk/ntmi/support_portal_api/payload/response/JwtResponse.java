package lk.ntmi.support_portal_api.payload.response;

import lombok.Data;
import java.util.List;

@Data
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Integer id;
    private String username;
    private String email;
    private List<String> roles;
    
    // --- ADDED FIELDS ---
    private Integer branchId;   // <--- Added (For Dropdown Logic)
    private String branchName;  // <--- Added (For Display)

    // Updated Constructor to match AuthController
    public JwtResponse(String accessToken, Integer id, String username, String email, List<String> roles, Integer branchId, String branchName) {
        this.token = accessToken;
        this.id = id;
        this.username = username;
        this.email = email;
        this.roles = roles;
        this.branchId = branchId;     // <--- Set this
        this.branchName = branchName; // <--- Set this
    }
}