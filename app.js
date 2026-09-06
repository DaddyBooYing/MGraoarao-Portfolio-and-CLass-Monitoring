/**
 * Mr. Madgenino Gleanson S Arao-arao, LPT, MPA. - Instructor Portfolio & Class Monitoring System
 * Interactive Web Application Engine
 */

// Initial Default Classes & Students Data
const DEFAULT_CLASSES_DATA = {
    "THC 102": {
        id: "THC 102 RM",
        code: "THC 102",
        title: "Risk Management as applied safety, security, and sanitation",
        schedule: "Mon Wed Sat 1:00PM - 4:00PM",
        room: "Lab 302",
        syllabusUrl: "#",
        weights: { quiz: 0.20, midterm: 0.25, project: 0.30, final: 0.25 },
        students: [
            { id: "PCIC 2026-0020", firstName: "JEMCIL HEART", middleName: "ONDONG", surname: "ACOSTA", yearLevel: "1st Year", section: "Block B", gender: "Female", email: "acosta@pcic.edu.ph", attendance: { "2026-09-02": "Present" }, q1: 88, q2: 90, midterm: 89, project: 92, final: 91 },
            { id: "PCIC 2026-0089", firstName: "ALCHER", middleName: "RELACION", surname: "AGEAS", yearLevel: "1st Year", section: "Block B", gender: "Male", email: "ageas@pcic.edu.ph", attendance: { "2026-09-02": "Present" }, q1: 85, q2: 87, midterm: 86, project: 88, final: 89 }
        ]
    },
    "CS101": {
        id: "CS101",
        code: "CS 101",
        title: "Web Engineering & Software Systems",
        schedule: "Tue & Thu • 01:00 PM - 03:00 PM",
        room: "Lab 405",
        syllabusUrl: "#",
        weights: { quiz: 0.20, midterm: 0.25, project: 0.30, final: 0.25 },
        students: [
            { id: "2025-CS-101", firstName: "Alexander", middleName: "V.", surname: "Vance Jr.", yearLevel: "1st Year", section: "Section B", gender: "Male", email: "a.vancejr@univ.edu", attendance: { "2026-09-02": "Present" }, q1: 95, q2: 92, midterm: 96, project: 98, final: 94 }
        ]
    }
};

// Global Application State
let classesData = {};
let currentClassId = "THC 102";
let activeMainTab = "portfolio";
let activeSubTab = "attendance";
let isInstructor = false;

// Default Google Sheets Published CSV & Apps Script Config
const DEFAULT_GSHEETS_CONFIG = {
    masterUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQqxwdlahfTZH2pYIoQOO0yJbQbr9K_Tog_QU-AyzwpYjL2fP0xsbMVQozo9Yfx8mUoFxitMmC98oqs/pub?gid=0&single=true&output=csv",
    attendanceUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQqxwdlahfTZH2pYIoQOO0yJbQbr9K_Tog_QU-AyzwpYjL2fP0xsbMVQozo9Yfx8mUoFxitMmC98oqs/pub?gid=1384867909&single=true&output=csv",
    gradesUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQqxwdlahfTZH2pYIoQOO0yJbQbr9K_Tog_QU-AyzwpYjL2fP0xsbMVQozo9Yfx8mUoFxitMmC98oqs/pub?gid=0&single=true&output=csv",
    scriptUrl: "https://script.google.com/macros/s/AKfycbypVaXtgSqfMmVUYWKDYRWPEJh_lTnI3L1LoTKYdL-1BdCiYPYRv9ShUjXDgLVX79vc/exec",
    projectUrl: "https://script.google.com/home/projects/10GbMUg1zQYsyeSlhUFv37xYVMATtzq6YKF3qhW3p-SDf6h31cpLkwdgm/edit"
};
let gsheetsConfig = { ...DEFAULT_GSHEETS_CONFIG };

// Chart Instances
let chartGradeDistribution = null;
let chartAssessmentComparison = null;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    loadStateFromLocalStorage();
    initTheme();
    setupTodayDate();
    renderCourseCards();
    populateClassSelector();
    refreshMonitoringDashboard();
    checkInstructorAccess();
    if (window.lucide) lucide.createIcons();
    fetchLiveDataFromGoogleSheets();
});

// --- SCROLL HELPER FOR TABLE CONTAINERS ---
function scrollTable(containerId, direction) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (direction === 'top') {
        container.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (direction === 'bottom') {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
}

// --- AUTHENTICATION & RESTRICTION CONTROLS ---
function checkInstructorAccess() {
    isInstructor = sessionStorage.getItem("is_instructor_logged_in") === "true";
    updateInstructorUI();
}

function openInstructorLoginModal() {
    if (isInstructor) {
        if (confirm("Sign out of Instructor Admin mode?")) {
            sessionStorage.removeItem("is_instructor_logged_in");
            isInstructor = false;
            updateInstructorUI();
            showToast("Signed out. Switched to View-Only mode.", "info");
        }
    } else {
        openModal("instructor-login-modal");
        setTimeout(() => {
            const input = document.getElementById("instructor-pin-input");
            if (input) {
                input.value = "";
                input.focus();
            }
        }, 100);
    }
}

function handleInstructorPinSubmit(event) {
    if (event) event.preventDefault();
    const pinInput = document.getElementById("instructor-pin-input");
    const pass = pinInput ? pinInput.value.trim() : "";

    if (pass === "2026-PCIC-ADMIN") {
        sessionStorage.setItem("is_instructor_logged_in", "true");
        isInstructor = true;
        closeModal("instructor-login-modal");
        updateInstructorUI();
        showToast("Instructor access granted! All edits unlocked.", "success");
    } else {
        alert("Incorrect PIN. System remains in View-Only mode.");
    }
}

function updateInstructorUI() {
    const btnLabel = document.getElementById("auth-btn-label");
    if (btnLabel) {
        btnLabel.textContent = isInstructor ? "Lock (Sign Out)" : "Instructor Login";
    }

    document.querySelectorAll(".instructor-only").forEach(el => {
        if (isInstructor) el.classList.remove("hidden");
        else el.classList.add("hidden");
    });

    document.querySelectorAll(".grade-input").forEach(input => {
        if (isInstructor) input.removeAttribute("disabled");
        else input.setAttribute("disabled", "true");
    });

    document.querySelectorAll(".att-btn").forEach(btn => {
        if (isInstructor) btn.removeAttribute("disabled");
        else btn.setAttribute("disabled", "true");
    });
}

// --- STATE & LOCAL STORAGE ---
function loadStateFromLocalStorage() {
    // Purge legacy storage keys
    localStorage.removeItem("alex_vance_app_data_v1");
    localStorage.removeItem("alex_vance_gsheet_config_v1");

    const saved = localStorage.getItem("pcic_thc102_data_v2");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed["THC 102"] && parsed["THC 102"].students && parsed["THC 102"].students.some(s => s.id.includes("2024-IT"))) {
                classesData = JSON.parse(JSON.stringify(DEFAULT_CLASSES_DATA));
            } else {
                classesData = parsed;
            }
        } catch (e) {
            classesData = JSON.parse(JSON.stringify(DEFAULT_CLASSES_DATA));
        }
    } else {
        classesData = JSON.parse(JSON.stringify(DEFAULT_CLASSES_DATA));
    }

    const savedGSheets = localStorage.getItem("pcic_thc102_gsheets_v2");
    if (savedGSheets) {
        try {
            gsheetsConfig = JSON.parse(savedGSheets);
        } catch (e) {
            gsheetsConfig = { ...DEFAULT_GSHEETS_CONFIG };
        }
    }
}

function saveStateToLocalStorage() {
    localStorage.setItem("pcic_thc102_data_v2", JSON.stringify(classesData));
    localStorage.setItem("pcic_thc102_gsheets_v2", JSON.stringify(gsheetsConfig));
}

function resetClassDataToDefaults() {
    if (!isInstructor) {
        showToast("Restricted: Instructor login required.", "error");
        return;
    }
    if (confirm("Are you sure you want to reset all class records back to default template?")) {
        classesData = JSON.parse(JSON.stringify(DEFAULT_CLASSES_DATA));
        saveStateToLocalStorage();
        renderCourseCards();
        populateClassSelector();
        refreshMonitoringDashboard();
        showToast("System data reset to defaults.", "info");
    }
}

// --- THEME ENGINE ---
function initTheme() {
    const isDark = localStorage.getItem("theme") === "dark" || 
        (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
}

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

function toggleMobileMenu() {
    const menu = document.getElementById("mobile-menu");
    if (menu) menu.classList.toggle("hidden");
}

function setupTodayDate() {
    const dateInput = document.getElementById("attendance-date");
    if (dateInput) {
        dateInput.value = "2026-09-02";
    }
}

// --- NAVIGATION TABS ---
function switchMainTab(tab) {
    activeMainTab = tab;
    const secPortfolio = document.getElementById("section-portfolio");
    const secMonitoring = document.getElementById("section-monitoring");
    const navPortfolio = document.getElementById("nav-portfolio");
    const navMonitoring = document.getElementById("nav-monitoring");

    if (!secPortfolio || !secMonitoring || !navPortfolio || !navMonitoring) return;

    if (tab === "portfolio") {
        secPortfolio.classList.remove("hidden");
        secMonitoring.classList.add("hidden");

        navPortfolio.className = "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm";
        navMonitoring.className = "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200";
    } else {
        secPortfolio.classList.add("hidden");
        secMonitoring.classList.remove("hidden");

        navMonitoring.className = "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm";
        navPortfolio.className = "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200";

        refreshMonitoringDashboard();
    }
}

function switchSubTab(subTab) {
    activeSubTab = subTab;
    const subtabs = ["attendance", "grades", "analytics", "atrisk"];

    subtabs.forEach(st => {
        const btn = document.getElementById(`subtab-${st}`);
        const content = document.getElementById(`subtab-content-${st}`);
        if (!btn || !content) return;

        if (st === subTab) {
            btn.className = "flex items-center space-x-2 px-5 py-3 border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold text-sm transition";
            content.classList.remove("hidden");
        } else {
            btn.className = "flex items-center space-x-2 px-5 py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium text-sm transition";
            content.classList.add("hidden");
        }
    });

    if (subTab === "analytics") {
        setTimeout(() => renderCharts(), 100);
    }
}

// --- PORTFOLIO UI RENDER ---
function renderCourseCards() {
    const grid = document.getElementById("courses-card-grid");
    if (!grid) return;

    grid.innerHTML = "";
    Object.values(classesData).forEach(cls => {
        const studentCount = cls.students.length;
        const avgScore = calculateClassAverageScore(cls);

        const card = document.createElement("div");
        card.className = "bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition flex flex-col justify-between group cursor-pointer";
        card.onclick = () => {
            currentClassId = cls.id;
            const sel = document.getElementById("class-selector");
            if (sel) sel.value = cls.id;
            switchMainTab("monitoring");
        };

        card.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-3">
                    <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50">${cls.code}</span>
                    <span class="text-xs font-semibold text-slate-400 flex items-center gap-1"><i data-lucide="users" class="w-3.5 h-3.5"></i> ${studentCount} Students</span>
                </div>
                <h4 class="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">${cls.title}</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5"><i data-lucide="clock" class="w-3.5 h-3.5"></i> ${cls.schedule}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5"><i data-lucide="map-pin" class="w-3.5 h-3.5"></i> ${cls.room}</p>
            </div>

            <div class="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                    <span class="block text-[10px] uppercase tracking-wider font-bold text-slate-400">Class Average</span>
                    <span class="text-sm font-black text-emerald-600 dark:text-emerald-400">${avgScore.toFixed(1)}%</span>
                </div>
                <span class="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                    <span>Monitor Class</span>
                    <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                </span>
            </div>
        `;
        grid.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
}

function populateClassSelector() {
    const selector = document.getElementById("class-selector");
    if (!selector) return;

    selector.innerHTML = "";
    Object.values(classesData).forEach(cls => {
        const option = document.createElement("option");
        option.value = cls.id;
        option.textContent = `${cls.code} — ${cls.title}`;
        if (cls.id === currentClassId) option.selected = true;
        selector.appendChild(option);
    });
}

function onClassChange() {
    const selector = document.getElementById("class-selector");
    if (selector) {
        currentClassId = selector.value;
        refreshMonitoringDashboard();
    }
}

function refreshMonitoringDashboard() {
    const cls = classesData[currentClassId] || Object.values(classesData)[0];
    if (!cls) return;

    currentClassId = cls.id;
    renderKPISummary(cls);
    renderAttendanceTable();
    renderGradebookTable();
    renderAtRiskTable();
    renderCharts();
    updateInstructorUI();
    if (window.lucide) lucide.createIcons();
}

// --- KPI CALCULATIONS & RENDERING ---
function renderKPISummary(cls) {
    const summaryContainer = document.getElementById("class-kpi-summary");
    if (!summaryContainer) return;

    const totalStudents = cls.students.length;
    const avgAttendance = calculateClassAvgAttendance(cls);
    const avgGrade = calculateClassAverageScore(cls);
    const atRiskStudents = getAtRiskStudents(cls);

    summaryContainer.innerHTML = `
        <div class="bg-slate-50 dark:bg-slate-700/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Enrolled</span>
            <div class="flex items-baseline space-x-2 mt-1">
                <span class="text-2xl font-black text-slate-900 dark:text-white">${totalStudents}</span>
                <span class="text-xs font-medium text-slate-500">Students</span>
            </div>
        </div>

        <div class="bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40">
            <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Attendance Rate</span>
            <div class="flex items-baseline space-x-2 mt-1">
                <span class="text-2xl font-black text-emerald-700 dark:text-emerald-300">${avgAttendance.toFixed(1)}%</span>
            </div>
        </div>

        <div class="bg-indigo-50/60 dark:bg-indigo-950/30 p-3.5 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/40">
            <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Class GPA Avg</span>
            <div class="flex items-baseline space-x-2 mt-1">
                <span class="text-2xl font-black text-indigo-700 dark:text-indigo-300">${avgGrade.toFixed(1)}%</span>
                <span class="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">${getLetterGrade(avgGrade)}</span>
            </div>
        </div>

        <div class="bg-rose-50/60 dark:bg-rose-950/30 p-3.5 rounded-2xl border border-rose-200/60 dark:border-rose-800/40">
            <span class="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">At-Risk Alerts</span>
            <div class="flex items-baseline space-x-2 mt-1">
                <span class="text-2xl font-black text-rose-700 dark:text-rose-300">${atRiskStudents.length}</span>
                <span class="text-xs font-medium text-rose-600 dark:text-rose-400">Needs Support</span>
            </div>
        </div>
    `;

    const badgeAtt = document.getElementById("badge-attendance-rate");
    if (badgeAtt) badgeAtt.textContent = `${avgAttendance.toFixed(0)}%`;

    const badgeRisk = document.getElementById("badge-atrisk-count");
    if (badgeRisk) badgeRisk.textContent = atRiskStudents.length;
}

function getFullName(st) {
    if (!st) return "";
    if (st.firstName || st.surname) {
        return `${st.firstName || ''} ${st.middleName ? st.middleName + ' ' : ''}${st.surname || ''}`.trim();
    }
    return st.name || "";
}

// Preserves exact Student ID format (e.g., "PCIC 2026-0020")
function normalizeStudentId(id) {
    if (!id) return "";
    return id.toString().trim().replace(/^"|"$/g, '').replace(/\s+/g, ' ').toUpperCase();
}

function updateRecordStatus(studentId, dateStr, newStatus) {
    if (!isInstructor) {
        showToast("View-only mode: login as instructor to change attendance.", "error");
        return;
    }
    const cls = classesData[currentClassId];
    if (!cls) return;

    if (cls.attendanceRecords) {
        const rec = cls.attendanceRecords.find(r => r.studentId === studentId && r.date === dateStr);
        if (rec) rec.status = newStatus;
    }

    const student = cls.students.find(s => s.id === studentId);
    if (student) {
        student.attendance[dateStr] = newStatus;
    }

    saveStateToLocalStorage();
    renderAttendanceTable();
    renderKPISummary(cls);
    renderAtRiskTable();
}

// --- ATTENDANCE TRACKER LOGIC ---
function renderAttendanceTable() {
    const cls = classesData[currentClassId];
    if (!cls) return;

    const tbody = document.getElementById("attendance-table-body");
    const searchVal = (document.getElementById("attendance-search")?.value || "").toLowerCase();
    const currentDate = document.getElementById("attendance-date")?.value || "2026-09-02";

    if (!tbody) return;
    tbody.innerHTML = "";

    const records = cls.attendanceRecords || [];
    let filteredRecords = records.filter(r => {
        const fullStr = `${r.studentId} ${r.studentName} ${r.courseTitle} ${r.instructorName} ${r.yearSection} ${r.status} ${r.date}`.toLowerCase();
        return fullStr.includes(searchVal);
    });

    if (filteredRecords.length === 0 && records.length === 0 && cls.students.length > 0) {
        filteredRecords = cls.students.map(st => ({
            studentId: st.id,
            date: currentDate,
            courseTitle: cls.title,
            instructorName: "MADGENINO GLEANSON ARAO-ARAO. LPT, MPA",
            studentName: getFullName(st),
            yearSection: `${st.yearLevel || '1st Year'} - ${st.section || 'Block B'}`,
            status: st.attendance[currentDate] || "Present",
            timestamp: currentDate
        })).filter(r => {
            const fullStr = `${r.studentId} ${r.studentName} ${r.courseTitle} ${r.yearSection} ${r.status}`.toLowerCase();
            return fullStr.includes(searchVal);
        });
    }

    if (filteredRecords.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-slate-400 font-medium">No attendance logs found.</td></tr>`;
        return;
    }

    filteredRecords.forEach(rec => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition";

        const badgeBg = rec.status === "Present" 
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
            : rec.status === "Absent"
            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
            : rec.status === "Late"
            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
            : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300";

        tr.innerHTML = `
            <td class="py-3.5 px-4 font-mono text-xs font-bold text-slate-600 dark:text-slate-300">${rec.studentId}</td>
            <td class="py-3.5 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300">${rec.date}</td>
            <td class="py-3.5 px-4 text-xs font-medium text-slate-700 dark:text-slate-200 max-w-[220px] truncate" title="${rec.courseTitle}">${rec.courseTitle}</td>
            <td class="py-3.5 px-4 text-xs font-medium text-slate-600 dark:text-slate-300 max-w-[180px] truncate" title="${rec.instructorName}">${rec.instructorName}</td>
            <td class="py-3.5 px-4 text-xs font-bold text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600" onclick="viewStudentReportCard('${rec.studentId}')">${rec.studentName}</td>
            <td class="py-3.5 px-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">${rec.yearSection}</td>
            <td class="py-3.5 px-4 text-center">
                ${isInstructor ? `
                    <div class="inline-flex p-0.5 bg-slate-100 dark:bg-slate-700/80 rounded-lg space-x-1 border border-slate-200 dark:border-slate-600">
                        <button onclick="updateRecordStatus('${rec.studentId}', '${rec.date}', 'Present')" class="att-btn px-2 py-0.5 rounded text-[11px] font-bold ${rec.status === 'Present' ? 'bg-emerald-500 text-white' : 'text-slate-500'}">P</button>
                        <button onclick="updateRecordStatus('${rec.studentId}', '${rec.date}', 'Late')" class="att-btn px-2 py-0.5 rounded text-[11px] font-bold ${rec.status === 'Late' ? 'bg-amber-500 text-white' : 'text-slate-500'}">L</button>
                        <button onclick="updateRecordStatus('${rec.studentId}', '${rec.date}', 'Absent')" class="att-btn px-2 py-0.5 rounded text-[11px] font-bold ${rec.status === 'Absent' ? 'bg-rose-500 text-white' : 'text-slate-500'}">A</button>
                        <button onclick="updateRecordStatus('${rec.studentId}', '${rec.date}', 'Excused')" class="att-btn px-2 py-0.5 rounded text-[11px] font-bold ${rec.status === 'Excused' ? 'bg-blue-500 text-white' : 'text-slate-500'}">E</button>
                    </div>
                ` : `
                    <span class="px-2.5 py-1 rounded-full text-xs font-extrabold ${badgeBg}">
                        ${rec.status}
                    </span>
                `}
            </td>
            <td class="py-3.5 px-3 text-center text-xs font-mono text-slate-500 dark:text-slate-400">${rec.timestamp}</td>
        `;
        tbody.appendChild(tr);
    });

    const summaryElem = document.getElementById("session-attendance-summary");
    if (summaryElem) {
        let pCount = filteredRecords.filter(r => r.status === "Present").length;
        let lCount = filteredRecords.filter(r => r.status === "Late").length;
        let aCount = filteredRecords.filter(r => r.status === "Absent").length;
        let eCount = filteredRecords.filter(r => r.status === "Excused").length;
        summaryElem.textContent = `Displaying ${filteredRecords.length} Records (${pCount} Present, ${lCount} Late, ${aCount} Absent, ${eCount} Excused)`;
    }
}

function updateStudentSessionStatus(studentId, dateStr, status) {
    if (!isInstructor) {
        showToast("View-only mode: login as instructor to change attendance.", "error");
        return;
    }
    const cls = classesData[currentClassId];
    if (!cls) return;

    const student = cls.students.find(s => s.id === studentId);
    if (student) {
        student.attendance[dateStr] = status;
        saveStateToLocalStorage();
        renderAttendanceTable();
        renderKPISummary(cls);
        renderAtRiskTable();
    }
}

function markAllAttendance(status) {
    if (!isInstructor) return;
    const cls = classesData[currentClassId];
    if (!cls) return;

    const currentDate = document.getElementById("attendance-date")?.value || "2026-09-02";
    cls.students.forEach(s => { s.attendance[currentDate] = status; });

    saveStateToLocalStorage();
    renderAttendanceTable();
    renderKPISummary(cls);
    renderAtRiskTable();
    showToast(`Marked all students as ${status} for ${currentDate}`, "success");
}

function saveAttendanceRecord() {
    if (!isInstructor) return;
    saveStateToLocalStorage();
    showToast("Attendance saved successfully!", "success");
}

// --- GRADEBOOK LOGIC ---
function renderGradebookTable() {
    const cls = classesData[currentClassId];
    if (!cls) return;

    const tbody = document.getElementById("gradebook-table-body");
    const searchVal = (document.getElementById("grades-search")?.value || "").toLowerCase();
    if (!tbody) return;

    tbody.innerHTML = "";

    const filteredStudents = cls.students.filter(s => {
        const fullName = getFullName(s).toLowerCase();
        return fullName.includes(searchVal) || s.id.toLowerCase().includes(searchVal);
    });

    if (filteredStudents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" class="py-8 text-center text-slate-400 font-medium">No student records found.</td></tr>`;
        return;
    }

    filteredStudents.forEach(st => {
        const weightedScore = calculateStudentWeightedScore(st, cls.weights);
        const letterGrade = getLetterGrade(weightedScore);
        const fullName = getFullName(st);

        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition";

        tr.innerHTML = `
            <td class="py-3.5 px-4 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">${st.id}</td>
            <td class="py-3.5 px-4">
                <div class="font-bold text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600" onclick="viewStudentReportCard('${st.id}')">${fullName}</div>
                <div class="text-xs text-slate-400">${st.email}</div>
            </td>
            <td class="py-3.5 px-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">${st.yearLevel || '1st Year'} • ${st.section || 'Block B'}</td>
            <td class="py-3.5 px-3 text-center"><input type="number" min="0" max="100" value="${st.q1}" onchange="updateStudentGrade('${st.id}', 'q1', this.value)" class="grade-input w-14 text-center bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg py-1 text-xs font-bold outline-none"></td>
            <td class="py-3.5 px-3 text-center"><input type="number" min="0" max="100" value="${st.q2}" onchange="updateStudentGrade('${st.id}', 'q2', this.value)" class="grade-input w-14 text-center bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg py-1 text-xs font-bold outline-none"></td>
            <td class="py-3.5 px-3 text-center"><input type="number" min="0" max="100" value="${st.midterm}" onchange="updateStudentGrade('${st.id}', 'midterm', this.value)" class="grade-input w-14 text-center bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg py-1 text-xs font-bold outline-none"></td>
            <td class="py-3.5 px-3 text-center"><input type="number" min="0" max="100" value="${st.project}" onchange="updateStudentGrade('${st.id}', 'project', this.value)" class="grade-input w-14 text-center bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg py-1 text-xs font-bold outline-none"></td>
            <td class="py-3.5 px-3 text-center"><input type="number" min="0" max="100" value="${st.final}" onchange="updateStudentGrade('${st.id}', 'final', this.value)" class="grade-input w-14 text-center bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg py-1 text-xs font-bold outline-none"></td>
            <td class="py-3.5 px-4 text-center font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">${weightedScore.toFixed(1)}%</td>
            <td class="py-3.5 px-3 text-center"><span class="px-2.5 py-1 rounded-lg text-xs font-extrabold ${getBadgeClassForGrade(letterGrade)}">${letterGrade}</span></td>
            <td class="py-3.5 px-4 text-right">
                <div class="flex items-center justify-end space-x-1">
                    <button onclick="editStudentRecordModal('${st.id}')" class="instructor-only hidden p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 transition" title="Edit Student"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                    <button onclick="deleteStudentRecord('${st.id}')" class="instructor-only hidden p-1.5 rounded-lg text-slate-500 hover:text-rose-600 transition" title="Delete Student"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    if (window.lucide) lucide.createIcons();
}

function updateStudentGrade(studentId, field, val) {
    if (!isInstructor) {
        showToast("View-only mode: login as instructor to edit scores.", "error");
        renderGradebookTable();
        return;
    }
    const cls = classesData[currentClassId];
    if (!cls) return;

    const student = cls.students.find(s => s.id === studentId);
    if (student) {
        student[field] = Math.max(0, Math.min(100, parseFloat(val) || 0));
        saveStateToLocalStorage();
        renderGradebookTable();
        renderKPISummary(cls);
        renderAtRiskTable();
        if (activeSubTab === "analytics") renderCharts();
    }
}

function recalculateAllGrades() {
    if (!isInstructor) return;
    saveStateToLocalStorage();
    refreshMonitoringDashboard();
    showToast("Weighted grades recalculated!", "success");
}

// --- AT-RISK LOGIC ---
function renderAtRiskTable() {
    const cls = classesData[currentClassId];
    if (!cls) return;

    const tbody = document.getElementById("atrisk-table-body");
    if (!tbody) return;

    tbody.innerHTML = "";
    const atRiskList = getAtRiskStudents(cls);

    if (atRiskList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-emerald-600 font-semibold">No students currently flagged as At-Risk in this class.</td></tr>`;
        return;
    }

    atRiskList.forEach(st => {
        const fullName = getFullName(st);
        const tr = document.createElement("tr");
        tr.className = "hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition";

        tr.innerHTML = `
            <td class="py-3.5 px-4 font-mono text-xs font-bold text-slate-500">${st.id}</td>
            <td class="py-3.5 px-4"><div class="font-bold text-slate-900 dark:text-white">${fullName}</div></td>
            <td class="py-3.5 px-3 text-center text-xs font-semibold">${st.yearLevel || '1st Year'} • ${st.section || 'Block B'}</td>
            <td class="py-3.5 px-4 text-center font-bold ${st.attRate < 75 ? 'text-rose-600' : 'text-slate-700'}">${st.attRate.toFixed(0)}%</td>
            <td class="py-3.5 px-4 text-center font-bold ${st.weighted < 70 ? 'text-rose-600' : 'text-slate-700'}">${st.weighted.toFixed(1)}% (${st.letter})</td>
            <td class="py-3.5 px-4"><div class="flex flex-wrap gap-1">${st.reasons.map(r => `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700">${r}</span>`).join('')}</div></td>
        `;
        tbody.appendChild(tr);
    });
}

// --- STUDENT MODAL & CARD ACTIONS ---
function handleSaveStudent(event) {
    event.preventDefault();
    if (!isInstructor) return;

    const editId = document.getElementById("student-edit-id").value;
    const cls = classesData[currentClassId];
    if (!cls) return;

    // Normalizes input to "PCIC 2026-0020"
    const id = normalizeStudentId(document.getElementById("student-id-input").value);
    const fname = document.getElementById("student-fname-input").value.trim();
    const mname = document.getElementById("student-mname-input")?.value.trim() || "";
    const sname = document.getElementById("student-sname-input").value.trim();
    const yearLevel = document.getElementById("student-year-input").value;
    const section = document.getElementById("student-section-input").value.trim();
    const gender = document.getElementById("student-gender-input").value;
    const email = document.getElementById("student-email-input").value.trim();

    const q1 = parseFloat(document.getElementById("student-q1-input").value) || 0;
    const q2 = parseFloat(document.getElementById("student-q2-input").value) || 0;
    const midterm = parseFloat(document.getElementById("student-midterm-input").value) || 0;
    const project = parseFloat(document.getElementById("student-project-input").value) || 0;
    const finalScore = parseFloat(document.getElementById("student-final-input").value) || 0;

    if (editId) {
        const student = cls.students.find(s => s.id === editId);
        if (student) {
            Object.assign(student, { id, firstName: fname, middleName: mname, surname: sname, yearLevel, section, gender, email, q1, q2, midterm, project, final: finalScore });
            showToast(`Updated student profile for ${id}.`, "success");
        }
    } else {
        cls.students.push({
            id, firstName: fname, middleName: mname, surname: sname, yearLevel, section, gender, email,
            attendance: { "2026-09-02": "Present" }, q1, q2, midterm, project, final: finalScore
        });
        showToast(`Added student ${id} to ${cls.code}`, "success");
    }

    saveStateToLocalStorage();
    closeModal("add-student-modal");
    refreshMonitoringDashboard();
}

function editStudentRecordModal(studentId) {
    if (!isInstructor) return;
    const cls = classesData[currentClassId];
    if (!cls) return;

    const st = cls.students.find(s => s.id === studentId);
    if (!st) return;

    document.getElementById("student-modal-title").textContent = "Edit Student Record";
    document.getElementById("student-edit-id").value = st.id;
    document.getElementById("student-id-input").value = st.id;
    document.getElementById("student-fname-input").value = st.firstName || "";
    document.getElementById("student-mname-input").value = st.middleName || "";
    document.getElementById("student-sname-input").value = st.surname || "";
    document.getElementById("student-year-input").value = st.yearLevel || "1st Year";
    document.getElementById("student-section-input").value = st.section || "Block B";
    document.getElementById("student-gender-input").value = st.gender || "Female";
    document.getElementById("student-email-input").value = st.email;
    document.getElementById("student-q1-input").value = st.q1;
    document.getElementById("student-q2-input").value = st.q2;
    document.getElementById("student-midterm-input").value = st.midterm;
    document.getElementById("student-project-input").value = st.project;
    document.getElementById("student-final-input").value = st.final;

    openModal("add-student-modal");
}

function deleteStudentRecord(studentId) {
    if (!isInstructor) return;
    const cls = classesData[currentClassId];
    if (!cls) return;

    const st = cls.students.find(s => s.id === studentId);
    if (!st) return;

    if (confirm(`Delete ${getFullName(st)} (${st.id})?`)) {
        cls.students = cls.students.filter(s => s.id !== studentId);
        saveStateToLocalStorage();
        refreshMonitoringDashboard();
        showToast(`Record deleted.`, "info");
    }
}

function viewStudentReportCard(studentId) {
    const cls = classesData[currentClassId];
    if (!cls) return;

    const st = cls.students.find(s => s.id === studentId);
    if (!st) return;

    const attStats = calculateStudentAttendanceStats(st);
    const weighted = calculateStudentWeightedScore(st, cls.weights);
    const letter = getLetterGrade(weighted);

    const body = document.getElementById("student-report-card-body");
    body.innerHTML = `
        <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
            <div>
                <h4 class="font-extrabold text-slate-900 dark:text-white text-lg">${getFullName(st)}</h4>
                <p class="text-xs text-slate-500 font-mono">${st.id} • ${st.email}</p>
            </div>
            <span class="px-3 py-1 rounded-xl text-sm font-black ${getBadgeClassForGrade(letter)}">${letter} (${weighted.toFixed(1)}%)</span>
        </div>
        <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                <span class="text-slate-500 block">Attendance Rate</span>
                <span class="text-xl font-bold text-indigo-600">${attStats.rate.toFixed(0)}%</span>
            </div>
            <div class="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                <span class="text-slate-500 block">Class</span>
                <span class="text-lg font-bold text-purple-600">${cls.code}</span>
            </div>
        </div>
    `;
    openModal("student-card-modal");
}

// --- CHART.JS ENGINE ---
function renderCharts() {
    const cls = classesData[currentClassId];
    if (!cls) return;

    const distCanvas = document.getElementById("chart-grade-distribution");
    if (distCanvas && window.Chart) {
        if (chartGradeDistribution) chartGradeDistribution.destroy();
        const gradeCounts = { "A": 0, "B": 0, "C": 0, "D": 0, "F": 0 };
        cls.students.forEach(s => {
            const letter = getLetterGrade(calculateStudentWeightedScore(s, cls.weights));
            if (letter.startsWith("A")) gradeCounts["A"]++;
            else if (letter.startsWith("B")) gradeCounts["B"]++;
            else if (letter.startsWith("C")) gradeCounts["C"]++;
            else if (letter.startsWith("D")) gradeCounts["D"]++;
            else gradeCounts["F"]++;
        });

        chartGradeDistribution = new Chart(distCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Grade A', 'Grade B', 'Grade C', 'Grade D', 'Grade F'],
                datasets: [{
                    data: Object.values(gradeCounts),
                    backgroundColor: ['#10b981', '#6366f1', '#f59e0b', '#f97316', '#ef4444']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    const compCanvas = document.getElementById("chart-assessment-comparison");
    if (compCanvas && window.Chart) {
        if (chartAssessmentComparison) chartAssessmentComparison.destroy();
        const getScores = (key) => cls.students.map(s => s[key] || 0);
        chartAssessmentComparison = new Chart(compCanvas, {
            type: 'bar',
            data: {
                labels: ['Quiz 1', 'Quiz 2', 'Midterm', 'Project', 'Final'],
                datasets: [{
                    label: 'Class Average',
                    data: [avg(getScores('q1')), avg(getScores('q2')), avg(getScores('midterm')), avg(getScores('project')), avg(getScores('final'))],
                    backgroundColor: '#6366f1',
                    borderRadius: 8
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100 } } }
        });
    }
}

// --- CSV EXPORT & MODAL HELPERS ---
function exportClassDataCSV() {
    const cls = classesData[currentClassId];
    if (!cls) return;

    let csv = "Student ID,First Name,Middle Name,Surname,Year Level,Section,Gender,Email,Weighted Score %,Letter Grade\n";
    cls.students.forEach(st => {
        const score = calculateStudentWeightedScore(st, cls.weights);
        csv += `"${st.id}","${st.firstName || ''}","${st.middleName || ''}","${st.surname || ''}","${st.yearLevel || ''}","${st.section || ''}","${st.gender || ''}","${st.email}",${score.toFixed(1)},"${getLetterGrade(score)}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${cls.code}_Gradebook.csv`;
    link.click();
    showToast(`Exported gradebook CSV.`, "success");
}

function openModal(id) { document.getElementById(id)?.classList.remove("hidden"); }
function closeModal(id) { document.getElementById(id)?.classList.add("hidden"); }

function openGoogleSheetLink(type) {
    let url = "https://docs.google.com/spreadsheets/d/1RfXwj9dcIauK7z6GSnadyO2gXQd7hqECAfgXNFcZwI0/edit?gid=0#gid=0";
    if (type === "attendance") {
        url = "https://docs.google.com/spreadsheets/d/1RfXwj9dcIauK7z6GSnadyO2gXQd7hqECAfgXNFcZwI0/edit?gid=1384867909#gid=1384867909";
    } else if (type === "script" || type === "project") {
        url = gsheetsConfig.projectUrl || DEFAULT_GSHEETS_CONFIG.projectUrl;
    }
    window.open(url, "_blank");
}

// --- CALCULATION FORMULAS ---
function calculateStudentWeightedScore(st, weights) {
    const quizAvg = (st.q1 + st.q2) / 2;
    return (quizAvg * weights.quiz) + (st.midterm * weights.midterm) + (st.project * weights.project) + (st.final * weights.final);
}

function calculateClassAverageScore(cls) {
    if (!cls.students.length) return 0;
    return cls.students.reduce((sum, st) => sum + calculateStudentWeightedScore(st, cls.weights), 0) / cls.students.length;
}

function calculateStudentAttendanceStats(st) {
    const dates = Object.keys(st.attendance);
    if (!dates.length) return { pCount: 0, aCount: 0, rate: 100 };
    let pCount = 0, aCount = 0;
    dates.forEach(d => {
        if (st.attendance[d] === "Present") pCount++;
        else if (st.attendance[d] === "Absent") aCount++;
        else if (st.attendance[d] === "Late") pCount += 0.8;
    });
    return { pCount, aCount, rate: Math.min(100, (pCount / dates.length) * 100) };
}

function calculateClassAvgAttendance(cls) {
    if (!cls.students.length) return 100;
    return cls.students.reduce((acc, st) => acc + calculateStudentAttendanceStats(st).rate, 0) / cls.students.length;
}

function getAtRiskStudents(cls) {
    const atRisk = [];
    cls.students.forEach(st => {
        const attStats = calculateStudentAttendanceStats(st);
        const weighted = calculateStudentWeightedScore(st, cls.weights);
        const reasons = [];
        if (attStats.rate < 75) reasons.push("Low Attendance (<75%)");
        if (weighted < 70) reasons.push("Low Grade (<70%)");
        if (reasons.length) atRisk.push({ ...st, attRate: attStats.rate, weighted, letter: getLetterGrade(weighted), reasons });
    });
    return atRisk;
}

function getLetterGrade(score) {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
}

function getBadgeClassForGrade(letter) {
    if (letter.startsWith("A")) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300";
    if (letter.startsWith("B")) return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300";
    if (letter.startsWith("C")) return "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300";
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300";
}

function avg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }

// --- CSV PARSING & DATA FETCH ---
function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    const result = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const row = [];
        let insideQuotes = false;
        let entry = '';
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') insideQuotes = !insideQuotes;
            else if (char === ',' && !insideQuotes) { row.push(entry.trim()); entry = ''; }
            else entry += char;
        }
        row.push(entry.trim());
        result.push(row);
    }
    return result;
}

async function fetchCsvWithFallback(url) {
    try {
        const res = await fetch(url);
        if (res.ok) return await res.text();
    } catch (e) {
        console.warn("Direct fetch blocked, attempting proxy fallback for:", url);
    }

    try {
        const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(url);
        const resProxy = await fetch(proxyUrl);
        if (resProxy.ok) return await resProxy.text();
    } catch (err) {
        console.error("All fetch routes failed for URL:", url);
    }
    return null;
}

// Live Google Sheets Data Fetcher
async function fetchLiveDataFromGoogleSheets() {
    const studentListCsvUrl = gsheetsConfig.masterUrl;
    const attendanceCsvUrl = gsheetsConfig.attendanceUrl;

    try {
        const [studentCsvText, attCsvText] = await Promise.all([
            fetchCsvWithFallback(studentListCsvUrl),
            fetchCsvWithFallback(attendanceCsvUrl)
        ]);

        if (studentCsvText) {
            const studentRows = parseCSV(studentCsvText);

            if (studentRows.length > 1) {
                const header = studentRows[0].map(h => (h || "").toLowerCase().trim());
                
                let idCol = header.findIndex(h => h.includes("id") || h.includes("code"));
                let fnCol = header.findIndex(h => h.includes("first") || h.includes("fname"));
                let mnCol = header.findIndex(h => h.includes("middle") || h.includes("mname"));
                let lnCol = header.findIndex(h => h.includes("sur") || h.includes("last") || h.includes("family"));
                let nameCol = header.findIndex(h => h === "name" || h.includes("full name") || h.includes("student name"));
                let yrCol = header.findIndex(h => h.includes("year") || h.includes("level"));
                let secCol = header.findIndex(h => h.includes("sec") || h.includes("block"));
                let genderCol = header.findIndex(h => h.includes("gender") || h.includes("sex"));

                if (idCol === -1) idCol = 0;
                if (fnCol === -1 && nameCol === -1) fnCol = 1;
                if (mnCol === -1 && nameCol === -1) mnCol = 2;
                if (lnCol === -1 && nameCol === -1) lnCol = 3;

                const cleanCell = (row, idx) => (idx !== -1 && row[idx]) ? row[idx].replace(/^"|"$/g, '').trim() : '';

                const fetchedStudents = [];
                for (let i = 1; i < studentRows.length; i++) {
                    const row = studentRows[i];
                    const rawId = (row[idCol] || "").replace(/^"|"$/g, '').trim();
                    if (!rawId) continue;

                    let firstName = cleanCell(row, fnCol);
                    let middleName = cleanCell(row, mnCol);
                    let surname = cleanCell(row, lnCol);

                    if (!firstName && !surname && nameCol !== -1) {
                        const parts = cleanCell(row, nameCol).split(" ");
                        firstName = parts[0] || "";
                        surname = parts.slice(1).join(" ") || "";
                    }

                    fetchedStudents.push({
                        id: normalizeStudentId(rawId),
                        firstName: firstName || "Student",
                        middleName: middleName || "",
                        surname: surname || "",
                        yearLevel: cleanCell(row, yrCol) || '1st Year',
                        section: cleanCell(row, secCol) || 'Block B',
                        gender: cleanCell(row, genderCol) || 'N/A',
                        email: `${surname.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student'}@pcic.edu.ph`,
                        attendance: {},
                        q1: 88, q2: 90, midterm: 89, project: 92, final: 91
                    });
                }

                const attendanceRecords = [];
                if (attCsvText) {
                    const attRows = parseCSV(attCsvText);

                    if (attRows.length > 1) {
                        for (let j = 1; j < attRows.length; j++) {
                            const attRow = attRows[j];
                            if (!attRow || attRow.length < 2) continue;

                            const getCell = (idx) => (idx < attRow.length && attRow[idx]) ? attRow[idx].replace(/^"|"$/g, '').trim() : '';

                            const rawId = getCell(0);
                            if (!rawId || rawId.toLowerCase().includes("student id")) continue;

                            const studentId = normalizeStudentId(rawId);
                            const date = getCell(1) || '2026-09-02';
                            const courseTitle = getCell(2) || 'THC 102 - RISK MANAGEMENT AS APPLIED TO SAFETY, SECURITY AND SANITATION';
                            const instructorName = getCell(3) || 'MADGENINO GLEANSON ARAO-ARAO. LPT, MPA';
                            const studentName = getCell(4) || 'Student';
                            const yearSection = getCell(5) || '1st Year - Block B';
                            const rawStatus = getCell(6);
                            const timestamp = getCell(7) || date;

                            let status = "Present";
                            const sLower = rawStatus.toLowerCase();
                            if (sLower.startsWith("a")) status = "Absent";
                            else if (sLower.startsWith("l")) status = "Late";
                            else if (sLower.startsWith("e")) status = "Excused";
                            else if (sLower.startsWith("p")) status = "Present";

                            attendanceRecords.push({
                                studentId,
                                date,
                                courseTitle,
                                instructorName,
                                studentName,
                                yearSection,
                                status,
                                timestamp
                            });

                            const match = fetchedStudents.find(s => s.id === studentId);
                            if (match) {
                                match.attendance[date] = status;
                            }
                        }
                    }
                }

                if (classesData["THC 102"] && fetchedStudents.length > 0) {
                    classesData["THC 102"].students = fetchedStudents;
                    classesData["THC 102"].attendanceRecords = attendanceRecords;
                    saveStateToLocalStorage();
                    refreshMonitoringDashboard();
                    
                    const countBadge = document.getElementById("portfolio-student-count");
                    if (countBadge) countBadge.textContent = fetchedStudents.length;

                    showToast(`Synced ${fetchedStudents.length} student records and ${attendanceRecords.length} attendance logs!`, "success");
                }
            }
        }
    } catch (err) {
        console.warn("Live Google Sheets Sync Notice:", err);
    }
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `pointer-events-auto flex items-center space-x-2 px-4 py-3 rounded-2xl text-xs font-bold text-white shadow-xl transition-all duration-300 transform translate-y-2 opacity-0 ${
        type === "success" ? "bg-emerald-600" : type === "error" ? "bg-rose-600" : "bg-indigo-600"
    }`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.remove("translate-y-2", "opacity-0"), 10);
    setTimeout(() => {
        toast.classList.add("opacity-0", "translate-y-2");
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}