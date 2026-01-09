import axios from "axios";

const API_URL = "http://localhost:8080/api/v1/auth/";

const login = (username, password) => {
  return axios
    .post(API_URL + "signin", { username, password })
    .then((response) => {
      if (response.data.token) {
        localStorage.setItem("user", JSON.stringify(response.data));
      }
      return response.data;
    });
};

const logout = () => {
  localStorage.removeItem("user");
};

// --- CRASH PROOF GET USER ---
const getCurrentUser = () => {
  try {
      const userStr = localStorage.getItem("user");
      if (!userStr || userStr === "undefined") return null;
      return JSON.parse(userStr);
  } catch (e) {
      // If data is corrupt, clear it and return null
      localStorage.removeItem("user");
      return null;
  }
};

const authHeader = () => {
  const user = getCurrentUser(); // Reuse safe function
  if (user && user.token) {
    return { Authorization: 'Bearer ' + user.token };
  } else {
    return {};
  }
};

const AuthService = {
  login,
  logout,
  getCurrentUser,
  authHeader,
};

export default AuthService;