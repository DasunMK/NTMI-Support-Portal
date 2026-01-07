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
    
    // --- ADD THIS ---
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
        // Handle Role -> Authority
        List<GrantedAuthority> authorities = Collections.singletonList(
            new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
        );

        // Handle Branch ID safely (it might be null for Admin)
        Integer bId = (user.getBranch() != null) ? user.getBranch().getId() : null;

        return new UserDetailsImpl(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getPassword(),
            authorities,
            bId // Pass branch ID
        );
    }

    // --- ADD GETTER ---
    public Integer getBranchId() {
        return branchId;
    }

    // Standard UserDetails methods
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