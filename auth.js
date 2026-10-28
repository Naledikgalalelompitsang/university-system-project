import { auth,db } from "../config.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import{doc,setDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';



export async function signUp(email, password,fullname,studentid) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
      fullname,
      studentid
    );

    const user = userCredential.user;
    await setDoc(doc(db, "users", user.uid),{
      uid: user.uid,
      email: user.email,
      fullname: user.fullname,
      studentid: user.studentid,
    })

    return user;
  } catch (error) {
    console.log(error.message);
    throw error;
  }
}

export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    const user = userCredential.user;
    return user;
  } catch (error) {
    console.log(error.message);
    throw error;
  }
}

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);

    console.log("Password reset email sent successfully!");
  } catch (error) {
    console.log(error.message);
    throw error;
  }
}

