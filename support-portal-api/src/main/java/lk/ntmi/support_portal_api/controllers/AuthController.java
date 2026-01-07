package lk.ntmi.support_portal_api.controllers;

import jakarta.validation.Valid;
import lk.ntmi.support_portal_api.model.Branch;
import lk.ntmi.support_portal_api.model.User;
import lk.ntmi.support_portal_api.model.enums.Role; // <--- FIX: CHANGED TO CORRECT ENUM IMPORT
import lk.ntmi.support_portal_api.payload.request.LoginRequest;
import lk.ntmi.support_portal_api.payload.request.SignupRequest;
import lk.ntmi.support_portal_api.payload.response.JwtResponse;
import lk.ntmi.support_portal_api.payload.response.MessageResponse;
import lk.ntmi.support_portal_api.repository.BranchRepository;
import lk.ntmi.support_portal_api.repository.UserRepository;
import lk.ntmi.support_portal_api.security.jwt.JwtUtils;
import lk.ntmi.support_portal_api.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:5173", maxAge = 3600, allowCredentials="true")
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    BranchRepository branchRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();    
        List<String> roles = userDetails.getAuthorities().stream()
            .map(item -> item.getAuthority())
            .collect(Collectors.toList());

        // --- FETCH BRANCH DETAILS SAFELY ---
        // We fetch the User object again to ensure we get the latest Branch links
        User user = userRepository.findById(userDetails.getId()).orElse(null);
        
        Integer branchId = null;
        String branchName = "Head Office";

        if (user != null && user.getBranch() != null) {
            branchId = user.getBranch().getId();
            branchName = user.getBranch().getName();
        }
        // -----------------------------------

        return ResponseEntity.ok(new JwtResponse(
                         jwt, 
                         userDetails.getId(), 
                         userDetails.getUsername(), 
                         userDetails.getEmail(), 
                         roles,
                         branchId,   // Added ID (Required for Frontend Auto-Select)
                         branchName  // Added Name
        )); 
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
        }

        // Handle Role Enum Conversion
        Role userRole;
        try {
            userRole = Role.valueOf(signUpRequest.getRole()); 
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid Role provided."));
        }

        // Create User
        User user = new User(
            signUpRequest.getUsername(),
            encoder.encode(signUpRequest.getPassword()),
            signUpRequest.getFullName(),
            signUpRequest.getEmail(),
            userRole
        );

        // Handle Branch Association
        if (userRole == Role.BRANCH_USER) {
            if (signUpRequest.getBranchId() == null) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Branch ID is required for Branch Users."));
            }
            
            Branch branch = branchRepository.findById(signUpRequest.getBranchId())
                .orElseThrow(() -> new RuntimeException("Error: Branch not found."));
            
            user.setBranch(branch);
        }

        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }
}