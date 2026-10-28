import { db, auth } from "./config.js"; 
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const coursesContainer = document.getElementById("courses-container");
const resultsCount = document.getElementById("results-count");
const searchBar = document.getElementById("search-bar");
const openSeatsToggle = document.getElementById("open-seats-toggle");

let allCourses = []; 

// ==========================================
// 1. LOAD AND RENDER COURSES
// ==========================================
async function loadAllCourses() {
    try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        coursesContainer.innerHTML = ""; 
        allCourses = []; 

        querySnapshot.forEach((doc) => {
            allCourses.push({ id: doc.id, ...doc.data() });
        });

        renderCourses(allCourses);

    } catch (error) {
        console.error("Error loading courses: ", error);
        coursesContainer.innerHTML = `<p style="color:red;">Failed to load courses from database.</p>`;
    }
}

function renderCourses(coursesToRender) {
    coursesContainer.innerHTML = "";
    resultsCount.innerHTML = `<strong>${coursesToRender.length} Results</strong> • Filtered from database`;

    if (coursesToRender.length === 0) {
        coursesContainer.innerHTML = "<p>No courses found matching your search.</p>";
        return;
    }

    coursesToRender.forEach((course) => {
        const seatsOpen = (course.capacity || 0) - (course.enrolled || 0);

        const prereqHTML = course.prerequisites 
            ? `<div class="prereq-status-banner">🔒 Prerequisites Required: ${course.prerequisites}</div>`
            : `<div class="prereq-status-banner clear">✓ General Elective — No special approvals needed</div>`;

        const cardHTML = `
            <div class="catalog-course-card">
                <div>
                    <div class="card-top-meta">
                        <div class="meta-left">
                            <span class="course-tag-id">${course.code || 'N/A'}</span>
                            <span class="course-tag-dept">${course.department || 'N/A'}</span>
                        </div>
                        <span class="course-tag-credits">${course.credits || 0} Credits</span>
                    </div>
                    
                    <h3>${course.title || 'Untitled Course'}</h3>
                    
                    <div class="professor-line">
                        👤 ${course.instructor || 'TBA'} • <span>${course.department || 'N/A'}</span>
                    </div>
                    
                    <div class="inner-schedule-box">
                        <div>📅 ${course.schedule || 'TBA'}</div>
                        <div>📍 ${course.room || 'TBA'}</div>
                    </div>
                    
                    ${prereqHTML}
                </div>
                
                <div class="card-action-footer">
                    <div class="seats-indicator">
                        <strong>${seatsOpen}</strong> of ${course.capacity || 0} seats <span>Open</span>
                    </div>
                    <a href="./course-registration.html?id=${course.id}" class="btn-card-register">View Details →</a>
                </div>
            </div>
        `;

        coursesContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// ==========================================
// 2. SEARCH & FILTERS
// ==========================================
searchBar.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allCourses.filter(c => 
        (c.code && c.code.toLowerCase().includes(query)) || 
        (c.title && c.title.toLowerCase().includes(query))
    );
    renderCourses(filtered);
});

if (openSeatsToggle) {
    openSeatsToggle.addEventListener('click', () => {
        openSeatsToggle.classList.toggle('active');
        const showOnlyOpen = openSeatsToggle.classList.contains('active');
        
        if (showOnlyOpen) {
            const openCourses = allCourses.filter(c => (c.capacity || 0) > (c.enrolled || 0));
            renderCourses(openCourses);
        } else {
            renderCourses(allCourses);
        }
    });
}

// ==========================================
// 3. HANDLE LOGOUT BUTTON
// ==========================================
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            await signOut(auth);
            // The onAuthStateChanged listener below will catch this and redirect
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    });
}

// ==========================================
// 4. CHECK AUTH, LOAD NAVBAR, AND START APP
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is logged in, fetch their name for the navbar
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

        // NOW it's safe to load the courses
        loadAllCourses();

    } else {
        // If no user is logged in, redirect to login
        window.location.href = "login.html"; 
    }
});