// FIX: Added 's' to 'controllers' to match your folder
package lk.ntmi.support_portal_api.controllers; 

import lk.ntmi.support_portal_api.model.Branch;
import lk.ntmi.support_portal_api.repository.BranchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, maxAge = 3600, allowCredentials="true")
@RestController
@RequestMapping("/api/v1/branches")
public class BranchController {

    @Autowired
    BranchRepository branchRepository;

    @GetMapping("/all")
    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }
    
    @PostMapping("/create")
    public ResponseEntity<?> createBranch(@RequestBody Branch branch) {
        if (branchRepository.findByName(branch.getName()).isPresent()) {
            return ResponseEntity.badRequest().body("Error: Branch name already exists!");
        }
        branchRepository.save(branch);
        return ResponseEntity.ok("Branch created successfully!");
    }
}