import { auth, db } from "../config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 1. HANDLE LOGOUT BUTTON
// ==========================================
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    });
}

// ==========================================
// 2. CHECK AUTH & LOAD DASHBOARD
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    try {
        // A. Load User Name & Basic Data
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const firstName = userData.fullName ? userData.fullName.split(" ")[0] : "Student";
            
            // Smart Greeting (Checks if account was made in the last 24 hours)
            const createdDate = userData.createdAt ? userData.createdAt.toDate() : new Date();
            const hoursSinceCreation = (new Date() - createdDate) / 36e5;
            
            const welcomeHeading = document.getElementById("welcome-heading");
            if (hoursSinceCreation < 24) {
                welcomeHeading.innerText = `Welcome to the Portal, ${firstName}`;
            } else {
                welcomeHeading.innerText = `Welcome back, ${firstName}`;
            }

            document.getElementById("welcome-subtitle").innerText = `${formatDepartment(userData.department)} • Year 1, Semester 1`;
            document.getElementById("nav-student-name").innerText = userData.fullName || "Student";
            document.getElementById("nav-student-id").innerText = userData.referenceNumber || "N/A";
        }

        // B. Load Registered Courses
        await loadStudentSchedule(user.uid);

    } catch (error) {
        console.error("Error loading dashboard:", error);
    }
});

// ==========================================
// 3. FETCH REGISTRATIONS & BUILD TABLE
// ==========================================
async function loadStudentSchedule(uid) {
    const tbody = document.getElementById("dash-schedule-body");
    const tableContainer = document.getElementById("dash-table-container");
    const emptyState = document.getElementById("dash-empty-state");
    const metricCredits = document.getElementById("dash-credits");
    const metricCourses = document.getElementById("dash-courses");
    const metricPercent = document.getElementById("dash-credit-percent");
    const metricTag = document.getElementById("dash-course-tag");

    try {
        // Query the registrations collection for this specific student
        const q = query(collection(db, "registrations"), where("studentUid", "==", uid));
        const querySnapshot = await getDocs(q);

        // If no courses are registered, show the empty state and set numbers to 0
        if (querySnapshot.empty) {
            tableContainer.style.display = "none";
            emptyState.style.display = "block";
            
            metricCredits.innerText = "0";
            metricCourses.innerText = "0";
            metricPercent.innerText = "0% Allocated";
            metricTag.innerHTML = `✏️ No active registrations`;
            return;
        }

        // If courses exist, show the table and hide the empty state
        tableContainer.style.display = "block";
        emptyState.style.display = "none";
        tbody.innerHTML = "";

        let totalCredits = 0;
        let courseCount = 0;

        // Loop through each registration and fetch the course details
        for (const regDoc of querySnapshot.docs) {
            const regData = regDoc.data();
            const courseDoc = await getDoc(doc(db, "courses", regData.courseId));
            
            if (courseDoc.exists()) {
                const course = courseDoc.data();
                totalCredits += Number(course.credits) || 0;
                courseCount++;

                // Add the course to the table
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>
                        <strong class="course-code">${course.code}</strong>
                        <span class="course-meta">Sec 01 • Core Major</span>
                    </td>
                    <td class="schedule-cell">
                        ${course.schedule}
                        <small>${course.room}</small>
                    </td>
                    <td>${course.instructor}</td>
                    <td style="font-weight: 700">${course.credits}</td>
                    <td><span class="status-enrolled">Enrolled</span></td>
                `;
                tbody.appendChild(tr);
            }
        }

        // Update the top metrics dynamically based on the courses found
        metricCredits.innerText = totalCredits.toFixed(1);
        metricCourses.innerText = courseCount;
        
        const percent = Math.round((totalCredits / 18) * 100);
        metricPercent.innerText = `${percent}% Allocated`;
        metricTag.innerHTML = `✏️ ${courseCount} Courses Confirmed`;

    } catch (error) {
        console.error("Error loading schedule:", error);
    }
}

// ==========================================
// 4. HELPER FUNCTIONS
// ==========================================
function formatDepartment(dept) {
    const depts = {
        "cs": "B.Sc. Computer Science & AI",
        "math": "B.Sc. Mathematics & Statistics",
        "eng": "B.Eng. Engineering Sciences",
        "bus": "B.Com. Business Analytics"
    };
    return depts[dept] || "General Studies";
}