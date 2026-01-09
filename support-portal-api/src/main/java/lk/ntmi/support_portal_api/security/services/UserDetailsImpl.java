package lk.ntmi.support_portal_api.security.services;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lk.ntmi.support_portal_api.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

public class UserDetailsImpl implements UserDetails {
    private static final long serialVersionUID = 1L;

    private Integer id;
    private String username;
    private String email;

    @JsonIgnore
    private String password;

    private Collection<? extends GrantedAuthority> authorities;
    
    private Integer branchId;

    public UserDetailsImpl(Integer id, String username, String email, String password,
                           Collection<? extends GrantedAuthority> authorities, Integer branchId) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.authorities = authorities;
        this.branchId = branchId;
    }

    public static UserDetailsImpl build(User user) {
        // SAFETY CHECK: If role is null in DB, default to "USER"
        String roleName = (user.getRole() != null) ? user.getRole().name() : "USER";
        
        List<GrantedAuthority> authorities = Collections.singletonList(
            new SimpleGrantedAuthority("ROLE_" + roleName)
        );

        Integer bId = (user.getBranch() != null) ? user.getBranch().getId() : null;

        // --- CRITICAL FIX: TRIM THE PASSWORD ---
        // SQL Server often adds invisible spaces to passwords. We must remove them.
        String cleanPassword = (user.getPassword() != null) ? user.getPassword().trim() : null;

        // DEBUG LOG (To prove this code is running)
        System.out.println(">>> LOGIN ATTEMPT for: " + user.getUsername());
        System.out.println("    > DB Password (Trimmed): '" + cleanPassword + "'");

        return new UserDetailsImpl(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            cleanPassword, // <--- Using the trimmed password
            authorities,
            bId
        );
    }

    public Integer getBranchId() { return branchId; }
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    public Integer getId() { return id; }
    public String getEmail() { return email; }
    @Override
    public String getPassword() { return password; }
    @Override
    public String getUsername() { return username; }
    @Override
    public boolean isAccountNonExpired() { return true; }
    @Override
    public boolean isAccountNonLocked() { return true; }
    @Override
    public boolean isCredentialsNonExpired() { return true; }
    @Override
    public boolean isEnabled() { return true; }
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserDetailsImpl user = (UserDetailsImpl) o;
        return Objects.equals(id, user.id);
    }
}