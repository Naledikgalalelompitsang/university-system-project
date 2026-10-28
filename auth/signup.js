import { signUp } from "./auth.js";

document
  .getElementById("signup-btn")
  .addEventListener("click", async function () {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmpassword = document.getElementById("confirm-password").value;
  
    if (!email || !password || !confirmpassword) {
        alert("Please fill in all fields (Email, Password, and Confirm Password).");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
    }
  
    try {
      if(password ===confirmpassword){
         await signUp(email, password);
      console.log("Sign-up successful!");
      window.location.href = "./signin.html"; 
      } else {
        alert("Passwords do not match. Please try again.");
      }
    } catch (error) {
      console.error("Sign-up failed:", error.message);
    }
  });
