package lk.ntmi.support_portal_api.service;

import lk.ntmi.support_portal_api.model.User;
import lk.ntmi.support_portal_api.model.enums.Role; // <--- MUST MATCH PACKAGE "model.enums"
import lk.ntmi.support_portal_api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    public void registerUser(String username, String email, String password, String fullName) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPassword(encoder.encode(password));
        
        // This 'USER' comes from the Role Enum we just defined above
        user.setRole(Role.USER); 
        
        user.setActive(true);
        
        userRepository.save(user);
    }
}