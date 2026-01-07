import axios from "axios";

// This is the Base URL of your Java API
const API_URL = "http://localhost:8080/api/v1/auth/";

// 1. LOGIN FUNCTION
const login = (username, password) => {
  return axios
    .post(API_URL + "signin", {
      username,
      password,
    })
    .then((response) => {
      // If we get a Token, save it to Local Storage (The Browser's Memory)
      if (response.data.token) {
        localStorage.setItem("user", JSON.stringify(response.data));
      }
      return response.data;
    });
};

// 2. LOGOUT FUNCTION
const logout = () => {
  localStorage.removeItem("user");
};

// 3. GET CURRENT USER (Check if logged in)
const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem("user"));
};

const AuthService = {
  login,
  logout,
  getCurrentUser,
};

export default AuthService;