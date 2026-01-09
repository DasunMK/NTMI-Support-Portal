package lk.ntmi.support_portal_api.controllers;

import lk.ntmi.support_portal_api.model.Branch;
import lk.ntmi.support_portal_api.model.Category;
import lk.ntmi.support_portal_api.model.ErrorType;
import lk.ntmi.support_portal_api.model.User;
import lk.ntmi.support_portal_api.model.enums.Role;
import lk.ntmi.support_portal_api.payload.response.MessageResponse;
import lk.ntmi.support_portal_api.repository.BranchRepository;
import lk.ntmi.support_portal_api.repository.CategoryRepository;
import lk.ntmi.support_portal_api.repository.ErrorTypeRepository;
import lk.ntmi.support_portal_api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/settings")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, allowedHeaders = "*", allowCredentials = "true")
public class SettingsController {

    @Autowired BranchRepository branchRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired ErrorTypeRepository errorTypeRepository;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder encoder;

    // =========================================================
    // 1. GET METHODS (To populate dropdowns)
    // =========================================================
    
    @GetMapping("/branches")
    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }

    @GetMapping("/categories")
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @GetMapping("/types")
    public List<ErrorType> getAllErrorTypes() {
        return errorTypeRepository.findAll();
    }

    // =========================================================
    // 2. CREATE METHODS (User Input - No Hardcoding)
    // =========================================================

    @PostMapping("/branches")
    public ResponseEntity<?> createBranch(@RequestBody Branch branch) {
        if (branchRepository.existsByName(branch.getName())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Branch already exists!"));
        }
        Branch saved = branchRepository.save(branch);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/categories")
    public ResponseEntity<?> createCategory(@RequestBody Category category) {
        // Optional check for duplicates
        if (categoryRepository.findByName(category.getName()).isPresent()) {
             return ResponseEntity.badRequest().body(new MessageResponse("Error: Category already exists!"));
        }
        
        Category saved = categoryRepository.save(category);
        return ResponseEntity.ok(saved);
    }

   @PostMapping("/types")
    public ResponseEntity<?> createErrorType(@RequestBody Map<String, Object> payload) {
        try {
            String name = (String) payload.get("name");
            
            // --- SMART ID LOOKUP (Checks multiple possible variable names) ---
            Object catIdObj = payload.get("categoryId");
            if (catIdObj == null) catIdObj = payload.get("category_id"); // Try snake_case
            if (catIdObj == null) catIdObj = payload.get("category");    // Try simple name
            if (catIdObj == null) catIdObj = payload.get("id");          // Try just id

            // If it is STILL null, then the frontend is definitely broken
            if (catIdObj == null) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: categoryId is missing! Check your React code."));
            }

            // Safe Conversion to Integer
            Integer categoryId;
            if (catIdObj instanceof String) {
                try {
                    categoryId = Integer.parseInt((String) catIdObj);
                } catch (NumberFormatException e) {
                    return ResponseEntity.badRequest().body(new MessageResponse("Error: categoryId must be a number!"));
                }
            } else if (catIdObj instanceof Integer) {
                categoryId = (Integer) catIdObj;
            } else {
                 return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid categoryId format!"));
            }

            // Check Duplicates
            if (errorTypeRepository.existsByName(name)) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Error Type already exists!"));
            }

            // Find Category
            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new RuntimeException("Error: Category not found with ID: " + categoryId));

            // Save
            ErrorType errorType = new ErrorType();
            errorType.setName(name);
            errorType.setCategory(category);
            
            ErrorType saved = errorTypeRepository.save(errorType);
            
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            e.printStackTrace(); // Print full error to console for debugging
            return ResponseEntity.internalServerError().body(new MessageResponse("Error creating type: " + e.getMessage()));
        }
    }

    // =========================================================
    // 3. ADMIN SEED (Only for Initial Login)
    // =========================================================
    
    @PostMapping("/seed") // Kept as POST for security
    public ResponseEntity<?> seedAdminUser() {
        // We ONLY seed the Admin user so you can log in to create the rest.
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@ntmi.lk");
            admin.setFullName("System Admin");
            admin.setPassword(encoder.encode("password123")); 
            admin.setRole(Role.ADMIN);
            admin.setActive(true);
            
            // Try to link to a branch if one exists (Optional for Admin)
            List<Branch> anyBranch = branchRepository.findAll();
            if (!anyBranch.isEmpty()) {
                admin.setBranch(anyBranch.get(0));
            }

            userRepository.save(admin);
            return ResponseEntity.ok(new MessageResponse("Admin User (admin/password123) Created successfully."));
        }
        return ResponseEntity.badRequest().body(new MessageResponse("Admin user already exists."));
    }


    // =========================================================
    // 4. DELETE METHODS
    // =========================================================

    @DeleteMapping("/branches/{id}")
    public ResponseEntity<?> deleteBranch(@PathVariable Integer id) {
        try {
            if (!branchRepository.existsById(id)) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Branch not found!"));
            }
            branchRepository.deleteById(id);
            return ResponseEntity.ok(new MessageResponse("Branch deleted successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Cannot delete: This branch is in use by users."));
        }
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Integer id) {
        try {
            if (!categoryRepository.existsById(id)) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Category not found!"));
            }
            categoryRepository.deleteById(id);
            return ResponseEntity.ok(new MessageResponse("Category deleted successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Cannot delete: This category contains Error Types. Delete them first."));
        }
    }

    @DeleteMapping("/types/{id}")
    public ResponseEntity<?> deleteErrorType(@PathVariable Integer id) {
        try {
            if (!errorTypeRepository.existsById(id)) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Type not found!"));
            }
            errorTypeRepository.deleteById(id);
            return ResponseEntity.ok(new MessageResponse("Error Type deleted successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Cannot delete: This Error Type is used in tickets."));
        }
    }
}