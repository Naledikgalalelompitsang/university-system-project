import { auth, db } from "../config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function () {

    // ============================================================
    // 1. TAB SWITCHING — Schedule List vs Weekly Calendar
    // ============================================================
    const tabButtons = document.querySelectorAll('.tab-selector .tab-btn');
    const scheduleView = document.getElementById('schedule-list-view');
    const calendarView = document.getElementById('calendar-grid-view');

    if (tabButtons.length && scheduleView && calendarView) {
        function activateTab(target) {
            tabButtons.forEach(btn => {
                const isActive = btn === target;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });

            const isCalendar = target.dataset.tab === 'calendar';
            scheduleView.style.display = isCalendar ? 'none' : 'block';
            calendarView.style.display = isCalendar ? 'block' : 'none';

            try {
                localStorage.setItem('starRegActiveTab', isCalendar ? 'calendar' : 'schedule');
            } catch (e) { /* ignore */ }
        }

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => activateTab(btn));
        });

        let savedTab = 'schedule';
        try {
            savedTab = localStorage.getItem('starRegActiveTab') || 'schedule';
        } catch (e) { /* ignore */ }

        const initialBtn = Array.from(tabButtons)
            .find(b => b.dataset.tab === savedTab) || tabButtons[0];
        activateTab(initialBtn);
    }

    // ============================================================
    // 2. SWAP / DROP COURSE CONFIRMATIONS
    // ============================================================
    document.querySelectorAll('.action-links a.drop').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const row = link.closest('tr');
            const courseTitle = row?.querySelector('.course-title')?.textContent?.trim() || 'this course';
            const confirmed = window.confirm(
                `Are you sure you want to DROP:\n\n${courseTitle}\n\nThis action will be logged in your academic record.`
            );
            if (confirmed) {
                alert(`✓ Drop request submitted for: ${courseTitle}`);
            }
        });
    });

    document.querySelectorAll('.action-links a.swap').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const row = link.closest('tr');
            const courseTitle = row?.querySelector('.course-title')?.textContent?.trim() || 'this course';
            alert(`↻ Swap request initiated for:\n\n${courseTitle}`);
        });
    });

    // ============================================================
    // 3. DOWNLOAD / PRINT / EMAIL UTILITY BUTTONS
    // ============================================================
    document.querySelectorAll('.top-action-controls .btn-secondary-outline').forEach(btn => {
        const action = btn.dataset.action;

        if (action === 'download') {
            btn.addEventListener('click', () => {
                alert('📥 Preparing your official registration PDF...\n\nYour download will begin shortly.');
            });
        }

        if (action === 'print') {
            btn.addEventListener('click', () => {
                window.print();
            });
        }

        if (action === 'email') {
            btn.addEventListener('click', () => {
                const email = prompt(
                    'Send schedule to which email address?',
                    'student@university.edu'
                );
                if (email && email.includes('@')) {
                    alert(`✉ Schedule queued for delivery to:\n\n${email}`);
                } else if (email) {
                    alert('⚠ That doesn\'t look like a valid email address.');
                }
            });
        }
    });

    // ============================================================
    // 4. HANDLE LOGOUT BUTTON
    // ============================================================
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                await signOut(auth);
                // onAuthStateChanged will catch this and redirect to login
            } catch (error) {
                console.error("Error signing out: ", error);
            }
        });
    }

    // ============================================================
    // 5. CHECK AUTH & LOAD REAL REGISTRATION DATA
    // ============================================================
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Load User Name
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    document.getElementById("nav-student-name").innerText = userData.fullName || "Student";
                    document.getElementById("nav-student-id").innerText = userData.referenceNumber || "N/A";
                    document.getElementById("status-student-id").innerText = userData.referenceNumber || "N/A";
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }

            // Load their Registered Courses from Firestore
            try {
                // Query the "registrations" collection for this specific student's UID
                const q = query(collection(db, "registrations"), where("studentUid", "==", user.uid));
                const querySnapshot = await getDocs(q);

                const tbody = document.getElementById("registration-tbody");
                const scheduleContainer = document.getElementById("schedule-container");
                const emptyStateContainer = document.getElementById("empty-state-container");
                const tabSelector = document.querySelector(".tab-selector");
                const rosterHeader = document.querySelector(".roster-header");
                const seatsBadge = document.getElementById("seats-locked-badge");

                // If they have no registrations, show the empty state
                if (querySnapshot.empty) {
                    if (scheduleContainer) scheduleContainer.style.display = "none";
                    if (emptyStateContainer) emptyStateContainer.style.display = "block";
                    if (tabSelector) tabSelector.style.display = "none";
                    if (rosterHeader) rosterHeader.style.display = "none";
                    return;
                }

                // If they DO have registrations, show the table and hide empty state
                if (scheduleContainer) scheduleContainer.style.display = "block";
                if (emptyStateContainer) emptyStateContainer.style.display = "none";
                if (tabSelector) tabSelector.style.display = "flex";
                if (rosterHeader) rosterHeader.style.display = "flex";
                
                tbody.innerHTML = ""; // Clear any old data
                let totalCredits = 0;
                let count = 0;

                // Loop through each registration document
                for (const regDoc of querySnapshot.docs) {
                    const regData = regDoc.data();
                    
                    // Fetch the course details using the courseId saved in the registration
                    const courseDoc = await getDoc(doc(db, "courses", regData.courseId));
                    
                    if (courseDoc.exists()) {
                        const course = courseDoc.data();
                        totalCredits += Number(course.credits) || 0;
                        count++;

                        // Create the HTML row
                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td class="crn-cell">${course.crn || 'N/A'}</td>
                            <td>
                                <span class="course-code">${course.code}</span>
                                <span class="course-sec-tag">SEC 01</span>
                                <h3 class="course-title">${course.title}</h3>
                            </td>
                            <td><span class="instructor-tag">👤</span>${course.instructor}</td>
                            <td class="schedule-cell">
                                ${course.schedule}
                            </td>
                            <td>${course.room}</td>
                            <td style="font-weight:700;">${course.credits}</td>
                            <td><span class="status-pill">Enrolled</span></td>
                            <td class="action-links">
                                <a href="#" class="swap">Swap</a>
                                <a href="#" class="drop">Drop</a>
                            </td>
                        `;
                        tbody.appendChild(tr);
                    }
                }

                // Update Metrics
                document.querySelectorAll(".metric-main-val")[0].innerText = totalCredits.toFixed(1); // Credits
                document.querySelectorAll(".metric-main-val")[1].innerText = count; // Number of Courses
                if (seatsBadge) seatsBadge.innerText = `${count} of ${count} Seats Locked`;

            } catch (error) {
                console.error("Error loading registrations:", error);
            }

        } else {
            // Since this is inside the javascript folder, go up one level to find login.html
            window.location.href = "./login.html"; 
        }
    });
});