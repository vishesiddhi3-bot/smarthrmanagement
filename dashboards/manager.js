// =====================================================
// SmartHR - FINAL MANAGER DASHBOARD
// =====================================================

const API_BASE = "http://localhost:5000/api";

let currentManager = null;
let selectedDepartment = null;

// Store currently loaded dashboard data
let managerDashboardData = {
    employees: [],
    team: [],
    attendance: [],
    leaves: [],
    pendingLeaves: [],
    performance: [],
    recognition: [],
    progress: [],
    stats: {}
};


// =====================================================
// START
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    setupMobileMenu();
    setupSidebar();
    setupRefresh();

    loadManager();

});


// =====================================================
// LOGGED-IN USER
// =====================================================

function getLoggedInUser() {

    const possibleKeys = [
        "smartHRUser",
        "user",
        "loggedInUser",
        "currentUser",
        "smarthr_user"
    ];

    for (const key of possibleKeys) {

        const value = localStorage.getItem(key);

        if (!value) {
            continue;
        }

        try {

            const parsed = JSON.parse(value);

            if (parsed && parsed.id) {
                return parsed;
            }

        } catch (error) {

            console.warn(
                "Invalid localStorage user:",
                key
            );

        }

    }

    return null;

}


// =====================================================
// LOAD MANAGER
// =====================================================

async function loadManager() {

    currentManager = getLoggedInUser();

    if (!currentManager || !currentManager.id) {

        showError(
            "Manager login information not found."
        );

        return;

    }

    setManagerName(
        getManagerName(currentManager)
    );

    const savedDepartment =
        localStorage.getItem(
            getDepartmentKey()
        );

    if (savedDepartment) {

        selectedDepartment = savedDepartment;

        showLockedDepartment(
            savedDepartment
        );

        await loadDepartmentDashboard(
            savedDepartment
        );

        return;

    }

    await loadDepartments();

}


// =====================================================
// LOAD DEPARTMENTS
// =====================================================

async function loadDepartments() {

    const select =
        document.getElementById(
            "managerDepartment"
        );

    if (!select) {
        return;
    }

    select.disabled = true;

    select.innerHTML = `
        <option value="">
            Loading departments...
        </option>
    `;

    try {

        const response =
            await fetch(
                `${API_BASE}/manager/departments`
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load departments."
            );

        }

        const departments =
            Array.isArray(data.departments)
                ? data.departments
                : [];

        select.innerHTML = `
            <option value="">
                Select Department
            </option>
        `;

        departments.forEach(
            department => {

                const option =
                    document.createElement("option");

                option.value =
                    department.name ||
                    department.department;

                option.textContent =
                    department.name ||
                    department.department;

                select.appendChild(option);

            }
        );

        select.disabled = false;

        const saveButton =
            document.getElementById(
                "saveManagerDepartment"
            );

        if (saveButton) {

            saveButton.disabled =
                departments.length === 0;

        }

    } catch (error) {

        console.error(
            "DEPARTMENT LOAD ERROR:",
            error
        );

        select.innerHTML = `
            <option value="">
                Unable to load departments
            </option>
        `;

        select.disabled = false;

        showDepartmentMessage(
            error.message ||
            "Unable to load departments.",
            "error"
        );

    }

}


// =====================================================
// SAVE DEPARTMENT
// =====================================================

async function saveDepartment() {

    const select =
        document.getElementById(
            "managerDepartment"
        );

    if (!select || !select.value) {

        showDepartmentMessage(
            "Please select a department.",
            "error"
        );

        return;

    }

    if (selectedDepartment) {
        return;
    }

    const department = select.value;

    const saveButton =
        document.getElementById(
            "saveManagerDepartment"
        );

    try {

        if (saveButton) {

            saveButton.disabled = true;

            saveButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Saving...
            `;

        }

        const response =
            await fetch(
                `${API_BASE}/manager/${currentManager.id}/department`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        department: department
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to save department."
            );

        }

        localStorage.setItem(
            getDepartmentKey(),
            department
        );

        selectedDepartment = department;

        showLockedDepartment(
            department
        );

        showDepartmentMessage(
            "Department saved successfully.",
            "success"
        );

        await loadDepartmentDashboard(
            department
        );

    } catch (error) {

        console.error(
            "SAVE DEPARTMENT ERROR:",
            error
        );

        if (saveButton) {

            saveButton.disabled = false;

            saveButton.innerHTML = `
                <i class="fa-solid fa-check"></i>
                Save Department
            `;

        }

        showDepartmentMessage(
            error.message ||
            "Unable to save department.",
            "error"
        );

    }

}


// =====================================================
// LOCK DEPARTMENT
// =====================================================

function showLockedDepartment(department) {

    const select =
        document.getElementById(
            "managerDepartment"
        );

    const saveButton =
        document.getElementById(
            "saveManagerDepartment"
        );

    if (select) {

        select.innerHTML = "";

        const option =
            document.createElement("option");

        option.value = department;
        option.textContent = department;
        option.selected = true;

        select.appendChild(option);

        select.disabled = true;

    }

    if (saveButton) {

        saveButton.disabled = true;

        saveButton.innerHTML = `
            <i class="fa-solid fa-lock"></i>
            Department Locked
        `;

    }

    const heading =
        document.querySelector(
            ".manager-department-card h2"
        );

    if (heading) {
        heading.textContent =
            "Your Department";
    }

    const paragraph =
        document.querySelector(
            ".manager-department-card p"
        );

    if (paragraph) {

        paragraph.textContent =
            "Your department is permanently assigned to this manager.";

    }

}


// =====================================================
// LOAD DEPARTMENT DASHBOARD
// =====================================================

async function loadDepartmentDashboard(department) {

    selectedDepartment = department;

    showLoading();

    try {

        const response =
            await fetch(
                `${API_BASE}/manager/department/${encodeURIComponent(department)}`
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load department dashboard."
            );

        }

        console.log(
            "MANAGER DEPARTMENT DATA:",
            data
        );

        const employees =
            Array.isArray(data.employees)
                ? data.employees
                : [];

        const team =
            Array.isArray(data.team)
                ? data.team
                : employees;

        const attendance =
            Array.isArray(data.attendance)
                ? data.attendance
                : [];

        const leaves =
            Array.isArray(data.leaves)
                ? data.leaves
                : [];

        const pendingLeaves =
            Array.isArray(data.leave_requests)
                ? data.leave_requests
                : [];

        const performance =
            Array.isArray(data.performance)
                ? data.performance
                : [];

        const recognition =
            Array.isArray(data.recognition)
                ? data.recognition
                : [];

        const progress =
            Array.isArray(data.progress)
                ? data.progress
                : [];

        const stats =
            data.stats || {};

        managerDashboardData = {
            employees,
            team,
            attendance,
            leaves,
            pendingLeaves,
            performance,
            recognition,
            progress,
            stats
        };

        // =================================================
        // STATS
        // =================================================

        setText(
            "teamMembersCount",
            stats.team_members ?? employees.length
        );

        // =================================================
// CALCULATE TODAY'S ATTENDANCE STATS
// =================================================

const todayAttendance = attendance.filter(record => {

    const status = String(
        record.status || ""
    ).trim().toLowerCase();

    return (
        status === "present" ||
        status === "late" ||
        status === "late_present" ||
        status === "absent"
    );

});

const presentToday = todayAttendance.filter(record => {

    const status = String(
        record.status || ""
    ).trim().toLowerCase();

    return (
        status === "present" ||
        status === "late" ||
        status === "late_present"
    );

}).length;

const absentToday = todayAttendance.filter(record => {

    const status = String(
        record.status || ""
    ).trim().toLowerCase();

    return status === "absent";

}).length;


// =================================================
// TOP STATS
// =================================================

setText(
    "teamMembersCount",
    stats.team_members ?? employees.length
);

setText(
    "presentCount",
    presentToday
);

setText(
    "leaveCount",
    stats.on_leave ?? 0
);

setText(
    "pendingCount",
    stats.pending_leaves ?? pendingLeaves.length
);
        // =================================================
        // NORMAL DASHBOARD
        // =================================================

        renderTeam(team);

        renderAttendance(
            attendance,
            employees
        );

        renderLeaves(
            pendingLeaves
        );

        // =================================================
        // DETAIL SECTIONS
        // =================================================

        renderEmployeeDetails(
            employees,
            performance,
            recognition,
            progress
        );

        renderPerformance(
            performance
        );

        renderRecognition(
            recognition
        );

        renderProgress(
            progress
        );

        // =================================================
        // KEEP DETAILS HIDDEN INITIALLY
        // =================================================

        hideAllDetailViews();

    } catch (error) {

        console.error(
            "DEPARTMENT DASHBOARD ERROR:",
            error
        );

        showAllErrors(
            error.message ||
            "Unable to load department data."
        );

    }

}


// =====================================================
// TEAM
// =====================================================

function renderTeam(employees) {

    const container =
        document.getElementById(
            "teamList"
        );

    if (!container) {
        return;
    }

    if (!employees.length) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-users"></i>
                <span>
                    No employees found in
                    ${escapeHTML(
                        selectedDepartment || ""
                    )}
                </span>
            </div>
        `;

        return;

    }

    container.innerHTML =
        employees.map(employee => {

            const name =
                `${employee.first_name || ""} ${employee.last_name || ""}`
                    .trim() ||
                employee.username ||
                "Employee";

            const initials =
                getInitials(name);

            const designation =
                employee.designation ||
                "Employee";

            const status =
                String(
                    employee.status ||
                    "active"
                ).toLowerCase();

            return `
                <div class="team-member">

                    <div class="member-left">

                        <div class="member-avatar">
                            ${escapeHTML(initials)}
                        </div>

                        <div>

                            <div class="member-name">
                                ${escapeHTML(name)}
                            </div>

                            <span class="member-role">
                                ${escapeHTML(designation)}
                            </span>

                        </div>

                    </div>

                    <span class="member-status ${
                        status === "active"
                            ? "status-active"
                            : "status-inactive"
                    }">

                        ${
                            status === "active"
                                ? "Active"
                                : "Inactive"
                        }

                    </span>

                </div>
            `;

        }).join("");

}


// =====================================================
// ATTENDANCE
// =====================================================

function renderAttendance(
    attendance,
    employees
) {

    const container =
        document.getElementById(
            "attendanceList"
        );

    if (!container) {
        return;
    }

    const attendanceMap = {};

    attendance.forEach(record => {

        attendanceMap[
            Number(record.employee_id)
        ] = record;

    });

    container.innerHTML =
        employees.map(employee => {

            const record =
                attendanceMap[
                    Number(employee.id)
                ];

            const status =
                record
                    ? String(
                        record.status ||
                        "present"
                    ).toLowerCase()
                    : "not marked";

            let className = "present";

            if (status === "absent") {

                className = "absent";

            } else if (
                status === "late" ||
                status === "late_present"
            ) {

                className = "late";

            } else if (
                status === "not marked"
            ) {

                className = "not-marked";

            }

            const name =
                `${employee.first_name || ""} ${employee.last_name || ""}`
                    .trim() ||
                employee.username ||
                "Employee";

            return `
                <div class="attendance-row">

                    <div class="attendance-name">

                        <div class="attendance-avatar">
                            ${escapeHTML(
                                getInitials(name)
                            )}
                        </div>

                        <span>
                            ${escapeHTML(name)}
                        </span>

                    </div>

                    <span class="attendance-status ${className}">
                        ${escapeHTML(
                            capitalize(status)
                        )}
                    </span>

                </div>
            `;

        }).join("");

    if (!employees.length) {

        container.innerHTML = `
            <div class="empty-state">
                No employees available.
            </div>
        `;

    }

}


// =====================================================
// LEAVES
// =====================================================

function renderLeaves(leaves) {

    const container =
        document.getElementById(
            "leaveList"
        );

    if (!container) {
        return;
    }

    if (!leaves.length) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-calendar-check"></i>
                <span>
                    No pending leave requests.
                </span>
            </div>
        `;

        return;

    }

    container.innerHTML =
        leaves.map(leave => {

            const name =
                leave.employee_name ||
                `${leave.first_name || ""} ${leave.last_name || ""}`
                    .trim() ||
                leave.username ||
                "Employee";

            let days =
                Number(
                    leave.days || 0
                );

            if (
                days <= 0 &&
                leave.start_date &&
                leave.end_date
            ) {

                days =
                    calculateDays(
                        leave.start_date,
                        leave.end_date
                    );

            }

            if (days <= 0) {
                days = 1;
            }

            const leaveType =
                leave.leave_type ||
                leave.type ||
                "Leave";

            return `
                <div class="leave-item">

                    <div class="leave-top">

                        <div>

                            <div class="leave-name">
                                ${escapeHTML(name)}
                            </div>

                            <div class="leave-type">
                                ${escapeHTML(leaveType)}
                            </div>

                        </div>

                        <div class="leave-days">
                            ${days}
                            ${days === 1 ? "day" : "days"}
                        </div>

                    </div>

                    <div class="leave-details">

                        ${
                            leave.start_date
                                ? `
                                    <div class="leave-detail">
                                        <i class="fa-regular fa-calendar"></i>
                                        From:
                                        ${escapeHTML(
                                            formatDate(
                                                leave.start_date
                                            )
                                        )}
                                    </div>
                                `
                                : ""
                        }

                        ${
                            leave.end_date
                                ? `
                                    <div class="leave-detail">
                                        <i class="fa-regular fa-calendar"></i>
                                        To:
                                        ${escapeHTML(
                                            formatDate(
                                                leave.end_date
                                            )
                                        )}
                                    </div>
                                `
                                : ""
                        }

                        ${
                            leave.reason
                                ? `
                                    <div class="leave-detail leave-reason">
                                        <i class="fa-solid fa-comment"></i>
                                        ${escapeHTML(
                                            leave.reason
                                        )}
                                    </div>
                                `
                                : ""
                        }

                    </div>

                    <div class="leave-bottom">

                        <button
                            type="button"
                            class="leave-btn approve-btn"
                            onclick="updateLeave(
                                ${Number(leave.id)},
                                'approved'
                            )">

                            <i class="fa-solid fa-check"></i>
                            Approve

                        </button>

                        <button
                            type="button"
                            class="leave-btn reject-btn"
                            onclick="updateLeave(
                                ${Number(leave.id)},
                                'rejected'
                            )">

                            <i class="fa-solid fa-xmark"></i>
                            Reject

                        </button>

                    </div>

                </div>
            `;

        }).join("");

}


// =====================================================
// UPDATE LEAVE
// =====================================================

async function updateLeave(
    leaveId,
    status
) {

    if (!leaveId) {
        return;
    }

    const confirmText =
        status === "approved"
            ? "Approve this leave request?"
            : "Reject this leave request?";

    if (!confirm(confirmText)) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/leave/${leaveId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        status: status
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok || data.success === false) {

            throw new Error(
                data.message ||
                "Unable to update leave."
            );

        }

        alert(
            status === "approved"
                ? "Leave approved successfully."
                : "Leave rejected successfully."
        );

        await loadDepartmentDashboard(
            selectedDepartment
        );

    } catch (error) {

        console.error(
            "UPDATE LEAVE ERROR:",
            error
        );

        alert(
            error.message ||
            "Unable to update leave."
        );

    }

}


// =====================================================
// EMPLOYEE DETAILS
// =====================================================

function renderEmployeeDetails(
    employees,
    performance,
    recognition,
    progress
) {

    const container =
        document.getElementById(
            "employeeDetailsList"
        );

    if (!container) {
        return;
    }

    if (!employees.length) {

        container.innerHTML = `
            <div class="empty-state">

                <i class="fa-solid fa-users"></i>

                <span>
                    No employees found in
                    ${escapeHTML(
                        selectedDepartment || "this department"
                    )}
                </span>

            </div>
        `;

        return;
    }

    container.innerHTML = `

        <div class="employee-details-summary">

            <div class="employee-details-summary-text">

                <h3>
                    ${employees.length}
                    Employee${employees.length === 1 ? "" : "s"}
                </h3>

                <p>
                    Employees assigned to
                    <strong>
                        ${escapeHTML(
                            selectedDepartment || "your department"
                        )}
                    </strong>
                </p>

            </div>

            <button
                type="button"
                class="module-btn detail-open-btn"
                onclick="openDetailView('employeeDetails')">

                <i class="fa-solid fa-eye"></i>

                View Employee Details

            </button>

        </div>

    `;

    createEmployeeDetailsView(
        employees,
        performance,
        recognition,
        progress
    );

}


// =====================================================
// CREATE EMPLOYEE DETAILS VIEW
// =====================================================

function createEmployeeDetailsView(
    employees,
    performance,
    recognition,
    progress
) {

    let section =
        document.getElementById(
            "employeeDetailsView"
        );

    if (!section) {

        section =
            document.createElement("section");

        section.id =
            "employeeDetailsView";

        section.className =
            "dashboard-detail-view";

        const target =
            document.getElementById(
                "details"
            );

        if (target && target.parentNode) {

            target.parentNode.insertBefore(
                section,
                target.nextSibling
            );

        } else {

            document.querySelector(
                ".content"
            )?.appendChild(section);

        }

    }

    section.innerHTML = `

        <div class="detail-view-header">

            <div>

                <span class="detail-label">
                    EMPLOYEE INFORMATION
                </span>

                <h2>
                    Employee Details
                </h2>

                <p>
                    Complete details of employees in
                    ${escapeHTML(
                        selectedDepartment || "your department"
                    )}
                </p>

            </div>

            <button
                type="button"
                class="back-detail-btn"
                onclick="closeDetailView('employeeDetails')">

                <i class="fa-solid fa-arrow-left"></i>

                Back

            </button>

        </div>


        <div class="detail-content">

            ${
                employees.length

                    ? employees.map(
                        employee =>
                            buildEmployeeDetailCard(
                                employee,
                                performance,
                                recognition,
                                progress
                            )
                    ).join("")

                    : `

                        <div class="empty-state">

                            <i class="fa-solid fa-users"></i>

                            No employee details available.

                        </div>

                    `
            }

        </div>

    `;

    section.style.display = "none";

}


// =====================================================
// CREATE EMPLOYEE DETAILS VIEW
// =====================================================

function createEmployeeDetailsView(
    employees,
    performance,
    recognition,
    progress
) {

    let section =
        document.getElementById(
            "employeeDetailsView"
        );

    if (!section) {

        section =
            document.createElement("section");

        section.id =
            "employeeDetailsView";

        section.className =
            "dashboard-detail-view";

        const target =
            document.getElementById(
                "employeeDetails"
            ) ||
            document.getElementById(
                "details"
            );

        if (target && target.parentNode) {

            target.parentNode.insertBefore(
                section,
                target.nextSibling
            );

        } else {

            document.querySelector(
                ".content"
            )?.appendChild(section);

        }

    }

    section.innerHTML = `

        <div class="detail-view-header">

            <div>

                <span class="detail-label">
                    EMPLOYEE INFORMATION
                </span>

                <h2>
                    Employee Details
                </h2>

                <p>
                    Complete details of employees in
                    ${escapeHTML(
                        selectedDepartment || "your department"
                    )}
                </p>

            </div>

            <button
                type="button"
                class="back-detail-btn"
                onclick="closeDetailView('employeeDetails')">

                <i class="fa-solid fa-arrow-left"></i>
                Back

            </button>

        </div>

        <div class="detail-content">

            ${
                employees.length
                    ? employees.map(
                        employee =>
                            buildEmployeeDetailCard(
                                employee,
                                performance,
                                recognition,
                                progress
                            )
                    ).join("")
                    : `
                        <div class="empty-state">
                            <i class="fa-solid fa-users"></i>
                            No employee details available.
                        </div>
                    `
            }

        </div>

    `;

    section.style.display = "none";

}


// =====================================================
// BUILD EMPLOYEE DETAIL CARD
// =====================================================

function buildEmployeeDetailCard(
    employee,
    performance,
    recognition,
    progress
) {

    const name =
        `${employee.first_name || ""} ${employee.last_name || ""}`
            .trim() ||
        employee.username ||
        "Employee";

    const employeePerformance =
        performance.filter(
            item =>
                Number(item.employee_id) ===
                Number(employee.id)
        );

    const employeeRecognition =
        recognition.filter(
            item =>
                Number(item.to_employee_id) ===
                Number(employee.id) ||
                Number(item.employee_id) ===
                Number(employee.id)
        );

    const employeeProgress =
        progress.filter(
            item =>
                Number(item.employee_id) ===
                Number(employee.id)
        );

    const latestPerformance =
        employeePerformance.length
            ? employeePerformance[0]
            : null;

    const completedTasks =
        employeeProgress.filter(
            task =>
                String(
                    task.status || ""
                ).toLowerCase() ===
                "completed"
        ).length;

    return `

        <div class="employee-detail-card">

            <div class="employee-detail-header">

                <div class="employee-detail-avatar">
                    ${escapeHTML(
                        getInitials(name)
                    )}
                </div>

                <div>

                    <h3>
                        ${escapeHTML(name)}
                    </h3>

                    <p>
                        ${escapeHTML(
                            employee.designation ||
                            "Employee"
                        )}
                    </p>

                </div>

                <span class="employee-detail-status ${
                    String(
                        employee.status || "active"
                    ).toLowerCase() === "active"
                        ? "active"
                        : "inactive"
                }">

                    ${
                        String(
                            employee.status || "active"
                        ).toLowerCase() === "active"
                            ? "Active"
                            : "Inactive"
                    }

                </span>

            </div>

            <div class="employee-detail-grid">

                <div>
                    <span>Employee Code</span>
                    <strong>
                        ${escapeHTML(
                            employee.employee_code || "-"
                        )}
                    </strong>
                </div>

                <div>
                    <span>Department</span>
                    <strong>
                        ${escapeHTML(
                            employee.department ||
                            selectedDepartment ||
                            "-"
                        )}
                    </strong>
                </div>

                <div>
                    <span>Email</span>
                    <strong>
                        ${escapeHTML(
                            employee.email || "-"
                        )}
                    </strong>
                </div>

                <div>
                    <span>Phone</span>
                    <strong>
                        ${escapeHTML(
                            employee.phone || "-"
                        )}
                    </strong>
                </div>

                <div>
                    <span>Performance</span>
                    <strong>
                        ${
                            latestPerformance
                                ? `${Number(
                                    latestPerformance.overall_score || 0
                                )}%`
                                : "No record"
                        }
                    </strong>
                </div>

                <div>
                    <span>Recognition</span>
                    <strong>
                        ${employeeRecognition.length}
                    </strong>
                </div>

                <div>
                    <span>Total Tasks</span>
                    <strong>
                        ${employeeProgress.length}
                    </strong>
                </div>

                <div>
                    <span>Completed Tasks</span>
                    <strong>
                        ${completedTasks}
                    </strong>
                </div>

            </div>

        </div>

    `;

}


// =====================================================
// PERFORMANCE SUMMARY
// =====================================================

function renderPerformance(performance) {

    const container =
        document.querySelector(
            "#performance .module-card"
        );

    if (!container) {
        return;
    }

    const average =
        performance.length
            ? Math.round(
                performance.reduce(
                    (sum, item) =>
                        sum +
                        Number(
                            item.overall_score || 0
                        ),
                    0
                ) /
                performance.length
            )
            : 0;

    container.innerHTML = `

        <div class="module-icon purple-module">
            <i class="fa-solid fa-bullseye"></i>
        </div>

        <h2>
            Team Performance
        </h2>

        <p>
            ${
                performance.length
                    ? `
                        ${performance.length}
                        performance record(s).
                        Average score:
                        <strong>${average}%</strong>
                    `
                    : `
                        No performance records found
                        for this department.
                    `
            }
        </p>

        <button
            type="button"
            class="module-btn detail-open-btn"
            onclick="openDetailView('performance')">

            <i class="fa-solid fa-chart-column"></i>
            View Performance

        </button>

    `;

    createPerformanceView(
        performance
    );

}


// =====================================================
// PERFORMANCE DETAILS
// =====================================================

function createPerformanceView(performance) {

    let section =
        document.getElementById(
            "performanceView"
        );

    if (!section) {

        section =
            document.createElement("section");

        section.id =
            "performanceView";

        section.className =
            "dashboard-detail-view";

        const target =
            document.getElementById(
                "performance"
            );

        if (target && target.parentNode) {

            target.parentNode.insertBefore(
                section,
                target.nextSibling
            );

        } else {

            document.querySelector(
                ".content"
            )?.appendChild(section);

        }

    }

    section.innerHTML = `

        <div class="detail-view-header">

            <div>

                <span class="detail-label">
                    TEAM PERFORMANCE
                </span>

                <h2>
                    Performance Details
                </h2>

                <p>
                    Employee-wise performance records
                </p>

            </div>

            <button
                type="button"
                class="back-detail-btn"
                onclick="closeDetailView('performance')">

                <i class="fa-solid fa-arrow-left"></i>
                Back

            </button>

        </div>

        <div class="detail-table-wrapper">

            ${
                performance.length
                    ? `
                        <table class="detail-table">

                            <thead>

                                <tr>
                                    <th>Employee</th>
                                    <th>Review Period</th>
                                    <th>Score</th>
                                    <th>Rating</th>
                                </tr>

                            </thead>

                            <tbody>

                                ${performance.map(item => {

                                    const name =
                                        `${item.first_name || ""} ${item.last_name || ""}`
                                            .trim() ||
                                        item.employee_name ||
                                        "Employee";

                                    const score =
                                        Number(
                                            item.overall_score || 0
                                        );

                                    return `
                                        <tr>

                                            <td>
                                                <strong>
                                                    ${escapeHTML(name)}
                                                </strong>
                                            </td>

                                            <td>
                                                ${escapeHTML(
                                                    item.review_period || "-"
                                                )}
                                            </td>

                                            <td>
                                                <span class="score-badge">
                                                    ${score}%
                                                </span>
                                            </td>

                                            <td>
                                                ${escapeHTML(
                                                    item.rating ||
                                                    getPerformanceRating(score)
                                                )}
                                            </td>

                                        </tr>
                                    `;

                                }).join("")}

                            </tbody>

                        </table>
                    `
                    : `
                        <div class="empty-state">
                            <i class="fa-solid fa-bullseye"></i>
                            No performance records found.
                        </div>
                    `
            }

        </div>

    `;

    section.style.display = "none";

}


// =====================================================
// RECOGNITION SUMMARY
// =====================================================

function renderRecognition(recognition) {

    const container =
        document.querySelector(
            "#recognition .module-card"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `

        <div class="module-icon orange-module">
            <i class="fa-solid fa-trophy"></i>
        </div>

        <h2>
            Recognition
        </h2>

        <p>
            ${
                recognition.length
                    ? `
                        ${recognition.length}
                        recognition record(s)
                        for your team.
                    `
                    : `
                        No recognition records found
                        for this department.
                    `
            }
        </p>

        <button
            type="button"
            class="module-btn detail-open-btn"
            onclick="openDetailView('recognition')">

            <i class="fa-solid fa-trophy"></i>
            View Recognition

        </button>

    `;

    createRecognitionView(
        recognition
    );

}


// =====================================================
// RECOGNITION DETAILS
// =====================================================

function createRecognitionView(recognition) {

    let section =
        document.getElementById(
            "recognitionView"
        );

    if (!section) {

        section =
            document.createElement("section");

        section.id =
            "recognitionView";

        section.className =
            "dashboard-detail-view";

        const target =
            document.getElementById(
                "recognition"
            );

        if (target && target.parentNode) {

            target.parentNode.insertBefore(
                section,
                target.nextSibling
            );

        } else {

            document.querySelector(
                ".content"
            )?.appendChild(section);

        }

    }

    section.innerHTML = `

        <div class="detail-view-header">

            <div>

                <span class="detail-label">
                    TEAM RECOGNITION
                </span>

                <h2>
                    Recognition Details
                </h2>

                <p>
                    Recognition and achievements
                    of your team members
                </p>

            </div>

            <button
                type="button"
                class="back-detail-btn"
                onclick="closeDetailView('recognition')">

                <i class="fa-solid fa-arrow-left"></i>
                Back

            </button>

        </div>

        <div class="recognition-detail-grid">

            ${
                recognition.length
                    ? recognition.map(item => {

                        const name =
                            `${item.first_name || ""} ${item.last_name || ""}`
                                .trim() ||
                            item.employee_name ||
                            "Employee";

                        return `
                            <div class="recognition-detail-card">

                                <div class="recognition-icon">
                                    🏆
                                </div>

                                <div>

                                    <h3>
                                        ${escapeHTML(name)}
                                    </h3>

                                    <strong>
                                        ${escapeHTML(
                                            item.title ||
                                            "Recognition"
                                        )}
                                    </strong>

                                    ${
                                        item.description
                                            ? `
                                                <p>
                                                    ${escapeHTML(
                                                        item.description
                                                    )}
                                                </p>
                                            `
                                            : ""
                                    }

                                    ${
                                        item.created_at
                                            ? `
                                                <span>
                                                    ${escapeHTML(
                                                        formatDate(
                                                            item.created_at
                                                        )
                                                    )}
                                                </span>
                                            `
                                            : ""
                                    }

                                </div>

                            </div>
                        `;

                    }).join("")
                    : `
                        <div class="empty-state">
                            <i class="fa-solid fa-trophy"></i>
                            No recognition records found.
                        </div>
                    `
            }

        </div>

    `;

    section.style.display = "none";

}


// =====================================================
// TEAM PROGRESS SUMMARY
// =====================================================

function renderProgress(progress) {

    const container =
        document.querySelector(
            "#progress .module-card"
        );

    if (!container) {
        return;
    }

    const completed =
        progress.filter(
            task =>
                String(
                    task.status || ""
                ).toLowerCase() ===
                "completed"
        ).length;

    const inProgress =
        progress.filter(
            task =>
                String(
                    task.status || ""
                ).toLowerCase() ===
                "in_progress"
        ).length;

    const pending =
        progress.filter(
            task =>
                String(
                    task.status || ""
                ).toLowerCase() ===
                "pending"
        ).length;

    container.innerHTML = `

        <div class="module-icon green-module">
            <i class="fa-solid fa-chart-line"></i>
        </div>

        <h2>
            Team Progress
        </h2>

        <p>
            Total Tasks:
            <strong>${progress.length}</strong>
        </p>

        <div class="progress-summary">

            <div>
                <strong>
                    ${completed}
                </strong>

                <span>
                    Completed
                </span>
            </div>

            <div>
                <strong>
                    ${inProgress}
                </strong>

                <span>
                    In Progress
                </span>
            </div>

            <div>
                <strong>
                    ${pending}
                </strong>

                <span>
                    Pending
                </span>
            </div>

        </div>

        <button
            type="button"
            class="module-btn detail-open-btn"
            onclick="openDetailView('progress')">

            <i class="fa-solid fa-chart-line"></i>
            View Team Progress

        </button>

    `;

    createProgressView(
        progress
    );

}


// =====================================================
// TEAM PROGRESS DETAILS
// =====================================================

function createProgressView(progress) {

    let section =
        document.getElementById(
            "progressView"
        );

    if (!section) {

        section =
            document.createElement("section");

        section.id =
            "progressView";

        section.className =
            "dashboard-detail-view";

        const target =
            document.getElementById(
                "progress"
            );

        if (target && target.parentNode) {

            target.parentNode.insertBefore(
                section,
                target.nextSibling
            );

        } else {

            document.querySelector(
                ".content"
            )?.appendChild(section);

        }

    }

    section.innerHTML = `

        <div class="detail-view-header">

            <div>

                <span class="detail-label">
                    TEAM PROGRESS
                </span>

                <h2>
                    Team Progress Details
                </h2>

                <p>
                    Employee-wise task progress
                </p>

            </div>

            <button
                type="button"
                class="back-detail-btn"
                onclick="closeDetailView('progress')">

                <i class="fa-solid fa-arrow-left"></i>
                Back

            </button>

        </div>

        <div class="detail-table-wrapper">

            ${
                progress.length
                    ? `
                        <table class="detail-table">

                            <thead>

                                <tr>
                                    <th>Employee</th>
                                    <th>Task</th>
                                    <th>Status</th>
                                    <th>Progress</th>
                                </tr>

                            </thead>

                            <tbody>

                                ${progress.map(task => {

                                    const name =
                                        `${task.first_name || ""} ${task.last_name || ""}`
                                            .trim() ||
                                        task.employee_name ||
                                        "Employee";

                                    const status =
                                        String(
                                            task.status ||
                                            "pending"
                                        ).toLowerCase();

                                    const progressValue =
                                        Number(
                                            task.progress ??
                                            task.progress_percentage ??
                                            (
                                                status === "completed"
                                                    ? 100
                                                    : 0
                                            )
                                        );

                                    return `
                                        <tr>

                                            <td>
                                                <strong>
                                                    ${escapeHTML(name)}
                                                </strong>
                                            </td>

                                            <td>
                                                ${escapeHTML(
                                                    task.title ||
                                                    task.task_title ||
                                                    "Task"
                                                )}
                                            </td>

                                            <td>

                                                <span class="
                                                    task-status
                                                    ${getTaskStatusClass(status)}
                                                ">

                                                    ${escapeHTML(
                                                        capitalize(
                                                            status.replace(
                                                                /_/g,
                                                                " "
                                                            )
                                                        )
                                                    )}

                                                </span>

                                            </td>

                                            <td>

                                                <div class="progress-cell">

                                                    <div class="progress-bar">
                                                        <span style="
                                                            width:${Math.min(
                                                                100,
                                                                Math.max(
                                                                    0,
                                                                    progressValue
                                                                )
                                                            )}%;
                                                        "></span>
                                                    </div>

                                                    <strong>
                                                        ${Math.min(
                                                            100,
                                                            Math.max(
                                                                0,
                                                                progressValue
                                                            )
                                                        )}%
                                                    </strong>

                                                </div>

                                            </td>

                                        </tr>
                                    `;

                                }).join("")}

                            </tbody>

                        </table>
                    `
                    : `
                        <div class="empty-state">
                            <i class="fa-solid fa-chart-line"></i>
                            No team tasks found.
                        </div>
                    `
            }

        </div>

    `;

    section.style.display = "none";

}


// =====================================================
// OPEN DETAIL VIEW
// =====================================================

function openDetailView(type) {

    const ids = [
        "employeeDetailsView",
        "performanceView",
        "recognitionView",
        "progressView"
    ];

    ids.forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {
            element.style.display = "none";
        }

    });

    const map = {
        employeeDetails:
            "employeeDetailsView",

        performance:
            "performanceView",

        recognition:
            "recognitionView",

        progress:
            "progressView"
    };

    const viewId =
        map[type];

    const view =
        document.getElementById(viewId);

    if (!view) {
        return;
    }

    view.style.display = "block";

    setTimeout(() => {

        view.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }, 50);

}


// =====================================================
// CLOSE DETAIL VIEW
// =====================================================

function closeDetailView(type) {

    const map = {
        employeeDetails:
            "employeeDetailsView",

        performance:
            "performanceView",

        recognition:
            "recognitionView",

        progress:
            "progressView"
    };

    const view =
        document.getElementById(
            map[type]
        );

    if (view) {
        view.style.display = "none";
    }

    const targetMap = {
        employeeDetails:
            "employeeDetails",

        performance:
            "performance",

        recognition:
            "recognition",

        progress:
            "progress"
    };

    const target =
        document.getElementById(
            targetMap[type]
        );

    if (target) {

        setTimeout(() => {

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }, 50);

    }

}


// =====================================================
// HIDE ALL DETAIL VIEWS
// =====================================================

function hideAllDetailViews() {

    [
        "employeeDetailsView",
        "performanceView",
        "recognitionView",
        "progressView"
    ].forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {

            element.style.display =
                "none";

        }

    });

}


// =====================================================
// PERFORMANCE RATING
// =====================================================

function getPerformanceRating(score) {

    if (score >= 90) {
        return "Excellent";
    }

    if (score >= 75) {
        return "Very Good";
    }

    if (score >= 60) {
        return "Good";
    }

    if (score >= 40) {
        return "Needs Improvement";
    }

    return "Poor";

}


// =====================================================
// TASK STATUS CLASS
// =====================================================

function getTaskStatusClass(status) {

    switch (status) {

        case "completed":
            return "task-completed";

        case "in_progress":
            return "task-in-progress";

        case "pending":
            return "task-pending";

        default:
            return "task-default";

    }

}


// =====================================================
// EXTRA SECTIONS
// =====================================================

function renderExtraSections(
    employees,
    leaves
) {

    const performance =
        document.querySelector(
            "#performance .module-card p"
        );

    if (performance) {

        performance.textContent =
            `${employees.length} employees are currently assigned to ${selectedDepartment}.`;

    }

    const recognition =
        document.querySelector(
            "#recognition .module-card p"
        );

    if (recognition) {

        recognition.textContent =
            `Recognition information for ${employees.length} team members.`;

    }

    const announcements =
        document.querySelector(
            "#announcements .module-card p"
        );

    if (announcements) {

        announcements.textContent =
            `Team announcements for the ${selectedDepartment} department.`;

    }

    const progress =
        document.querySelector(
            "#progress .module-card p"
        );

    if (progress) {

        progress.textContent =
            `Tracking progress for ${employees.length} employees in ${selectedDepartment}.`;

    }

}


// =====================================================
// LOADING
// =====================================================

function showLoading() {

    const team =
        document.getElementById(
            "teamList"
        );

    const attendance =
        document.getElementById(
            "attendanceList"
        );

    const leaves =
        document.getElementById(
            "leaveList"
        );

    if (team) {

        team.innerHTML = `
            <div class="loading">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Loading ${escapeHTML(
                    selectedDepartment || "team"
                )} employees...
            </div>
        `;

    }

    if (attendance) {

        attendance.innerHTML = `
            <div class="loading">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Loading attendance...
            </div>
        `;

    }

    if (leaves) {

        leaves.innerHTML = `
            <div class="loading">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Loading leave requests...
            </div>
        `;

    }

}


// =====================================================
// ERROR
// =====================================================

function showAllErrors(message) {

    const text =
        escapeHTML(message);

    [
        "teamList",
        "attendanceList",
        "leaveList"
    ].forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {

            element.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    ${text}
                </div>
            `;

        }

    });

}


function showError(message) {

    showAllErrors(message);

    showDepartmentMessage(
        message,
        "error"
    );

}


// =====================================================
// MANAGER NAME
// =====================================================

function getManagerName(user) {

    if (user.first_name) {

        return (
            `${user.first_name} ${user.last_name || ""}`
                .trim()
        );

    }

    return (
        user.name ||
        user.username ||
        "Manager"
    );

}


function setManagerName(name) {

    const sidebar =
        document.getElementById(
            "sidebarManagerName"
        );

    const welcome =
        document.getElementById(
            "welcomeHeading"
        );

    const avatar =
        document.getElementById(
            "sidebarAvatar"
        );

    const topAvatar =
        document.getElementById(
            "topbarAvatar"
        );

    if (sidebar) {
        sidebar.textContent = name;
    }

    if (welcome) {

        welcome.textContent =
            `Good Morning, ${name} 👋`;

    }

    const initials =
        getInitials(name);

    if (avatar) {
        avatar.textContent = initials;
    }

    if (topAvatar) {
        topAvatar.textContent = initials;
    }

}


// =====================================================
// DEPARTMENT STORAGE
// =====================================================

function getDepartmentKey() {

    const id =
        currentManager?.id ||
        "default";

    return (
        "smarthr_manager_department_" +
        id
    );

}


// =====================================================
// DEPARTMENT MESSAGE
// =====================================================

function showDepartmentMessage(
    text,
    type
) {

    const element =
        document.getElementById(
            "managerDepartmentMessage"
        );

    if (!element) {
        return;
    }

    element.textContent =
        text;

    element.className =
        `manager-department-message ${type}`;

}


// =====================================================
// REFRESH
// =====================================================

function setupRefresh() {

    const button =
        document.getElementById(
            "refreshTeamBtn"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        async function () {

            if (!selectedDepartment) {
                return;
            }

            const original =
                this.innerHTML;

            this.disabled = true;

            this.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Refreshing
            `;

            await loadDepartmentDashboard(
                selectedDepartment
            );

            this.disabled = false;

            this.innerHTML =
                original;

        }
    );

}


// =====================================================
// MOBILE
// =====================================================

function setupMobileMenu() {

    const button =
        document.getElementById(
            "mobileMenuBtn"
        );

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    if (!button || !sidebar) {
        return;
    }

    button.addEventListener(
        "click",
        function () {

            sidebar.classList.toggle(
                "open"
            );

        }
    );

}


// =====================================================
// SIDEBAR
// =====================================================

function setupSidebar() {

    const links =
        document.querySelectorAll(
            ".sidebar-menu > a"
        );

    links.forEach(link => {

        link.addEventListener(
            "click",
            function () {

                links.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );

                this.classList.add(
                    "active"
                );

            }
        );

    });

    const saveButton =
        document.getElementById(
            "saveManagerDepartment"
        );

    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveDepartment
        );

    }

}


// =====================================================
// UTILITIES
// =====================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value ?? 0;

    }

}


// =====================================================
// CALCULATE LEAVE DAYS
// =====================================================

function calculateDays(
    start,
    end
) {

    const s =
        new Date(
            `${String(start).substring(0, 10)}T00:00:00`
        );

    const e =
        new Date(
            `${String(end).substring(0, 10)}T00:00:00`
        );

    if (
        isNaN(s.getTime()) ||
        isNaN(e.getTime())
    ) {

        return 0;

    }

    return Math.max(
        1,
        Math.floor(
            (
                e.getTime() -
                s.getTime()
            ) /
            (
                1000 *
                60 *
                60 *
                24
            )
        ) + 1
    );

}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(
            `${String(value).substring(0, 10)}T00:00:00`
        );

    if (isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// =====================================================
// INITIALS
// =====================================================

function getInitials(name) {

    const parts =
        String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (!parts.length) {
        return "MA";
    }

    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

}


// =====================================================
// CAPITALIZE
// =====================================================

function capitalize(value) {

    const text =
        String(value || "");

    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =====================================================
// GLOBAL LOGOUT
// =====================================================

function logoutManager() {

    [
        "token",
        "authToken",
        "jwt",
        "user",
        "loggedInUser",
        "currentUser",
        "smarthr_user",
        "smartHRUser"
    ].forEach(
        key =>
            localStorage.removeItem(key)
    );

    window.location.href =
        "../index.html";

}


// =====================================================
// GLOBAL FUNCTIONS
// =====================================================

window.updateLeave =
    updateLeave;

window.openDetailView =
    openDetailView;

window.closeDetailView =
    closeDetailView;

window.logoutManager =
    logoutManager;

window.saveDepartment =
    saveDepartment;