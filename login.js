import { auth } from "./config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", function () {
    /* ===== Element refs ===== */
    const studentTab = document.getElementById("student-tab");
    const staffTab = document.getElementById("staff-tab");
    const loginForm = document.getElementById("portal-login-form");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const usernameWrapper = document.getElementById("username-wrapper");
    const passwordWrapper = document.getElementById("password-wrapper");
    const usernameError = document.getElementById("username-error");
    const passwordError = document.getElementById("password-error");
    const rememberMe = document.getElementById("remember-me");
    const submitBtn = document.getElementById("submit-btn");
    const submitBtnText = document.getElementById("submit-btn-text");
    const submitBtnArrow = document.getElementById("submit-btn-arrow");

    let selectedRole = "student";

    /* ===== Restore remembered username ===== */
    try {
        const savedUser = localStorage.getItem("starRememberedUser");
        if (savedUser) {
            usernameInput.value = savedUser;
            if(rememberMe) rememberMe.checked = true;
        }
    } catch (e) { /* ignore */ }

    /* ===== Tab switching ===== */
    function setRole(role) {
        selectedRole = role;
        const isStudent = role === "student";

        studentTab.classList.toggle("active", isStudent);
        staffTab.classList.toggle("active", !isStudent);
        
        if (usernameInput) {
            usernameInput.placeholder = isStudent 
                ? "e.g. naledi.k@university.edu or STU-884210" 
                : "e.g. a.chen@university.edu or STAFF-1042";
        }
    }

    if (studentTab && staffTab) {
        studentTab.addEventListener("click", () => setRole("student"));
        staffTab.addEventListener("click", () => setRole("staff"));
    }

    /* ===== Submit handler ===== */
    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const email = usernameInput.value.trim();
            const password = passwordInput.value;

            // Simple validation
            if (!email) {
                usernameWrapper.classList.add("error");
                usernameError.classList.add("visible");
                return;
            } else {
                usernameWrapper.classList.remove("error");
                usernameError.classList.remove("visible");
            }

            if (!password) {
                passwordWrapper.classList.add("error");
                passwordError.classList.add("visible");
                return;
            } else {
                passwordWrapper.classList.remove("error");
                passwordError.classList.remove("visible");
            }

            // Remember me logic
            try {
                if (rememberMe && rememberMe.checked) {
                    localStorage.setItem("starRememberedUser", email);
                } else {
                    localStorage.removeItem("starRememberedUser");
                }
            } catch (e) { /* ignore */ }

            // Lock UI & Show Spinner
            submitBtn.disabled = true;
            submitBtnText.textContent = "Authenticating...";
            submitBtnArrow.style.display = "none";

            const spinner = document.createElement("div");
            spinner.className = "spinner";
            submitBtn.appendChild(spinner);

            try {
                // ACTUALLY LOG IN USING FIREBASE
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                
                // Redirect based on role
                if (selectedRole === "staff") {
                    window.location.href = "admin-dashboard.html";
                } else {
                    window.location.href = "student-dashboard.html";
                }

            } catch (error) {
                console.error("Login failed:", error.message);
                
                if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                    alert("Invalid email or password. Please try again.");
                } else {
                    alert("Login Error: " + error.message);
                }

                // Reset UI on failure
                submitBtn.disabled = false;
                submitBtnText.textContent = "Authenticate & Enter Portal";
                submitBtnArrow.style.display = "block";
                spinner.remove();
            }
        });
    }
});