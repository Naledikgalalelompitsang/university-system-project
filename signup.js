import { auth, db } from "../config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const signupForm = document.getElementById("portal-registration-form");

signupForm.addEventListener("submit", async function (event) {
    event.preventDefault(); 
    
    
    const email = document.getElementById("email")?.value.trim() || "";
    const password = document.getElementById("password")?.value || "";
    const confirmPassword = document.getElementById("confirm-password")?.value || "";
    const fullname = document.getElementById("fullname")?.value.trim() || "";
    const reference = document.getElementById("reference")?.value.trim() || "";
    const department = document.getElementById("department")?.value || "";

    
    if (!email || !password || !confirmPassword || !fullname || !reference) {
        alert("Please fill in all required fields.");
        return;
    }
    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }
    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }

    try {
    
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

    
        await setDoc(doc(db, "users", user.uid), {
            fullName: fullname,
            referenceNumber: reference,
            department: department,
            email: email,
            uid: user.uid,
            role: "student",
            createdAt: new Date()
        });

        alert("Success! Account created.");
        window.location.href = "./login.html";

    } catch (error) {
        console.error(error);
        alert("Error: " + error.message);
    }
});