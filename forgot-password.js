import { resetPassword } from "./auth.js";

async function forgotPassword() {
  try {
    await resetPassword("naledikgalalelompitsang@gmail.com");

    console.log("Check your email for the password reset link!");
  } catch (error) {
    console.error("Password reset failed:", error.message);
  }
}

forgotPassword();
