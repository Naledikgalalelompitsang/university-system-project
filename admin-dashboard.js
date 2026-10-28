import { auth, db } from "../config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 1. HANDLE LOGOUT BUTTON
// ==========================================
const logoutBtn = document.getElementById("admin-logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "../login.html";
        } catch (error) {
            console.error("Error logging out: ", error);
        }
    });
}

// ==========================================
// 2. CHECK AUTH & LOAD ADMIN DATA
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    try {
        const adminDoc = await getDoc(doc(db, "users", user.uid));
        const nameDisplay = document.getElementById("admin-name-display");
        
        if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            if (nameDisplay) nameDisplay.innerText = adminData.fullName || "Registrar Admin";
        } else {
            if (nameDisplay) nameDisplay.innerText = "Registrar Admin";
        }
    } catch (error) {
        console.error("Error fetching admin data:", error);
    }

    // Load Dashboard Data
    loadStudents();
    loadCourses();
    populateAuditTrail();
});

// ==========================================
// 3. LOAD STUDENTS FROM FIRESTORE
// ==========================================
async function loadStudents() {
    const tbody = document.getElementById("students-tbody");
    const countDisplay = document.getElementById("total-students-count");
    
    if (!tbody) return;

    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        tbody.innerHTML = ""; 
        let studentCount = 0;

        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            
            if (userData.role === "student") {
                studentCount++;
                const tr = document.createElement("tr");
                
                tr.innerHTML = `
                    <td>
                        <strong style="color:#2563eb;">${userData.fullName || 'Unknown Name'}</strong><br />
                        <span style="color:#64748b; font-size:11px;">Ref: ${userData.referenceNumber || 'N/A'}</span>
                    </td>
                    <td>
                        ${formatDepartment(userData.department)}<br />
                        <span style="color:#64748b; font-size:11px;">${userData.email || 'N/A'}</span>
                    </td>
                    <td style="font-weight:700;">0.0 Credits</td>
                    <td style="font-weight:700; color:#2f855a;">N/A</td>
                    <td><span style="font-size:12px; font-weight:700; color:#2f855a;">● None (Clear)</span></td>
                    <td style="text-align:right;">
                        <button class="btn-secondary-outline" onclick="alert('Opening transcript for ${userData.fullName}...')">Transcript</button>
                    </td>
                `;
                tbody.appendChild(tr);
            }
        });

        if (countDisplay) countDisplay.innerText = studentCount;
        
        const paginationStatus = document.getElementById("pagination-status");
        if (paginationStatus) {
            paginationStatus.innerText = `Displaying 1 - ${studentCount} of ${studentCount} registered scholars`;
        }

        if (studentCount === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: #64748b;">No students registered yet.</td></tr>`;
        }

    } catch (error) {
        console.error("Error loading students: ", error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: red;">Failed to load student records.</td></tr>`;
    }
}

// Helper to format department codes
function formatDepartment(dept) {
    const depts = {
        "cs": "B.Sc. Computer Science",
        "math": "B.Sc. Mathematics",
        "eng": "B.Eng. Engineering",
        "bus": "B.Com. Business Analytics"
    };
    return depts[dept] || "General Studies";
}

// ==========================================
// 4. LOAD COURSES FROM FIRESTORE
// ==========================================
async function loadCourses() {
    const coursesTbody = document.querySelector("#courses-table tbody");
    const countDisplay = document.getElementById("total-courses-count");
    
    if (!coursesTbody) return;

    try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        coursesTbody.innerHTML = "";
        let courseCount = 0;

        if (querySnapshot.empty) {
            coursesTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: #64748b;">No courses in database.</td></tr>`;
            return;
        }

        querySnapshot.forEach((doc) => {
            const course = doc.data();
            courseCount++;
            
            // Determine status pill color
            let statusClass = "pill-green";
            let statusText = "Open";
            if (course.enrolled >= course.capacity) {
                statusClass = "pill-gold";
                statusText = "Full";
            }

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <strong>${course.crn || 'N/A'}</strong><br />
                    <span class="tag-course-code">${course.code}</span>
                </td>
                <td>
                    <strong style="color:#2563eb; font-size:14px;">${course.title}</strong><br />
                    <span style="color:#64748b; font-size:12px;">⏰ ${course.schedule}</span>
                </td>
                <td><span class="tag-course-credits" style="color:#2563eb; background:#eff6ff;">${course.department}</span></td>
                <td style="font-weight:700;">${course.enrolled} / ${course.capacity}</td>
                <td><span class="meta-pill ${statusClass}">${statusText}</span></td>
                <td style="text-align:right;">
                    <a class="back-link" style="margin-right:10px;">Edit Quota</a>
                </td>
            `;
            coursesTbody.appendChild(tr);
        });

        if (countDisplay) countDisplay.innerHTML = `${courseCount} <span style="font-size:14px; font-weight:600; color:#64748b;">Sections</span>`;

    } catch (error) {
        console.error("Error loading courses: ", error);
        coursesTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: red;">Failed to load courses.</td></tr>`;
    }
}

// ==========================================
// 5. POPULATE FAKE AUDIT TRAIL
// ==========================================
function populateAuditTrail() {
    const container = document.getElementById("audit-trail-container");
    if (!container) return;

    const logs = [
        { action: "🔑 Prerequisite Override", time: "14:22", desc: "Granted for STU-884210 by Dr. M. Sithole" },
        { action: "⚡ Capacity Expansion", time: "13:50", desc: "CS-301 capacity increased from 50 to 60 seats" },
        { action: "⚙️ Degree Audit Run", time: "11:15", desc: "Automated batch clearance checking completed" }
    ];

    container.innerHTML = "";
    logs.forEach(log => {
        container.innerHTML += `
            <div class="timeline-log-node">
                <div class="log-meta-top"><span>${log.action}</span><span>${log.time}</span></div>
                <div class="log-main-desc">${log.desc}</div>
            </div>
        `;
    });
}