import { db, auth } from "../config.js"; 
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ==========================================
// 1. LOAD COURSE DETAILS FROM URL ID
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('id');

async function loadCourseDetails() {
    if (!courseId) {
        alert("No course selected. Redirecting to catalog...");
        window.location.href = "course-search.html";
        return;
    }

    try {
        const docRef = doc(db, "courses", courseId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const course = docSnap.data();
            const seatsOpen = (course.capacity || 0) - (course.enrolled || 0);

            // Inject the data into the HTML
            document.getElementById("dyn-title").innerText = `${course.code}: ${course.title}`;
            document.getElementById("dyn-crumb-code").innerText = `${course.code} Registration`;
            document.getElementById("dyn-dept-crumb").innerText = `${course.department} Stream`;
            document.getElementById("dyn-desc-title").innerText = course.title;
            document.getElementById("dyn-badge").innerText = `${course.code} • Section 01`;
            document.getElementById("dyn-desc").innerText = `Fall 2026 • ${course.credits} Credit Hours • 👤 ${course.instructor} • Dept. of ${course.department}`;
            document.getElementById("dyn-seats-open").innerText = seatsOpen;
            document.getElementById("dyn-seats-total").innerText = `/ ${course.capacity} enrolled`;
            document.getElementById("dyn-prereq-text").innerText = `Prerequisite Validated: ${course.prerequisites || 'None'}`;
            document.getElementById("dyn-schedule").innerText = course.schedule;
            document.getElementById("dyn-room").innerText = course.room;
            document.getElementById("dyn-room-card").innerText = course.room;
            document.getElementById("dyn-instructor").innerText = course.instructor;
            document.getElementById("dyn-code-footer").innerText = course.code;

        } else {
            console.log("No such course found in database!");
            alert("Course not found in database.");
        }
    } catch (error) {
        console.error("Error getting course: ", error);
    }
}

// ==========================================
// 2. CONFIRM REGISTRATION BUTTON
// ==========================================
const finalizeBtn = document.getElementById('finalize-enrollment-btn');
if (finalizeBtn) {
    finalizeBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to register.");
            return;
        }

        if (!courseId) {
            alert("Course ID missing from URL.");
            return;
        }

        const originalText = finalizeBtn.innerText;
        finalizeBtn.innerText = "Processing...";
        finalizeBtn.disabled = true;

        try {
            // Save the registration to Firestore!
            // Using a specific ID (uid_courseId) prevents duplicate registrations.
            await setDoc(doc(db, "registrations", `${user.uid}_${courseId}`), {
                studentUid: user.uid,
                courseId: courseId,
                registeredAt: new Date(),
                status: "Enrolled"
            });

            alert("✓ Transaction Complete!\n\nThis course has been successfully added to your active confirmed registration list.");
            window.location.href = "registration-status.html"; // Go back to root

        } catch (error) {
            console.error("Error registering: ", error);
            alert("Failed to register: " + error.message);
            finalizeBtn.innerText = originalText;
            finalizeBtn.disabled = false;
        }
    });
}

// ==========================================
// 3. HANDLE LOGOUT & NAVBAR
// ==========================================
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try { await signOut(auth); } catch (error) { console.error(error); }
    });
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const nameEl = document.getElementById("nav-student-name");
                const idEl = document.getElementById("nav-student-id");
                if (nameEl) nameEl.innerText = userData.fullName || "Student";
                if (idEl) idEl.innerText = userData.referenceNumber || "N/A";
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
        loadCourseDetails();
    } else {
        window.location.href = "../login.html"; 
    }
});