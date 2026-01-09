package lk.ntmi.support_portal_api.controllers;

import lk.ntmi.support_portal_api.model.Branch;
import lk.ntmi.support_portal_api.model.User;
import lk.ntmi.support_portal_api.repository.BranchRepository;
import lk.ntmi.support_portal_api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, allowedHeaders = "*", allowCredentials = "true")
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    BranchRepository branchRepository;
    
    @Autowired
    PasswordEncoder encoder;

    // 1. Get All Users
    @GetMapping("/all")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // 2. Update User
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Integer id, @RequestBody User userDetails) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFullName(userDetails.getFullName());
        user.setUsername(userDetails.getUsername());
        user.setEmail(userDetails.getEmail());
        user.setRole(userDetails.getRole());

        // Handle Branch Update
        if (userDetails.getBranch() != null && userDetails.getBranch().getId() != null) {
            Branch branch = branchRepository.findById(userDetails.getBranch().getId()).orElse(null);
            user.setBranch(branch);
        } else if (userDetails.getBranchId() != null) {
             Branch branch = branchRepository.findById(userDetails.getBranchId()).orElse(null);
            user.setBranch(branch);
        }

        // Only update password if provided
        if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
            user.setPassword(encoder.encode(userDetails.getPassword()));
        }

        userRepository.save(user);
        return ResponseEntity.ok("User updated successfully");
    }

    // 3. Delete User
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok("User deleted successfully");
    }
}