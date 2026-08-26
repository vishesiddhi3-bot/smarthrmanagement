// ==========================================
// SmartHR - HR DASHBOARD FRONTEND
// ==========================================

const API_URL = "https://smarthrmanagement-backend.onrender.com/api";


// ==========================================
// DOM READY
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    loadHRDashboard();

    setupNavigation();

    setupLogout();

});


// ==========================================
// LOAD HR DASHBOARD
// ==========================================

async function loadHRDashboard() {

    try {

        const response = await fetch(
            `${API_URL}/dashboard`
        );


        const data = await response.json();


        console.log(
            "HR DASHBOARD RESPONSE:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load dashboard"
            );

        }


        if (!data.success) {

            throw new Error(
                data.message ||
                "Dashboard data unavailable"
            );

        }


        updateStatistics(
            data.stats
        );


        renderRecentEmployees(
            data.recentEmployees || []
        );


        renderDepartmentPerformance(
            data.departmentPerformance || []
        );
renderAttendanceChart(
    data.attendanceOverview || []
);

        renderRecentActivity(
            data.recentLeaves || [],
            data.recentPayroll || []
        );


// ==========================================
// LIVE ATTENDANCE CHART
// ==========================================

function renderAttendanceChart(
    attendanceData
) {

    const chart =
        document.getElementById(
            "attendanceChart"
        );


    const labels =
        document.getElementById(
            "attendanceChartLabels"
        );


    if (!chart || !labels) {
        return;
    }


    // Clear old chart

    chart.innerHTML = "";
    labels.innerHTML = "";


    if (!attendanceData.length) {

        chart.innerHTML = `
            <div style="
                width:100%;
                text-align:center;
                padding:40px 10px;
                color:#64748b;
            ">
                No attendance data available
            </div>
        `;

        return;

    }


    attendanceData.forEach(day => {

        const percentage =
            Number(day.percentage || 0);


        // Maximum height = 100%
        const height =
            Math.max(
                Math.min(
                    percentage,
                    100
                ),
                2
            );


        const date =
            new Date(day.date);


        const dayName =
            date.toLocaleDateString(
                "en-IN",
                {
                    weekday: "short"
                }
            );


        const isToday =
            day.date ===
            new Date()
                .toISOString()
                .split("T")[0];


        // ==================================
        // BAR
        // ==================================

        const bar =
            document.createElement("div");


        bar.className =
            "bar";


        bar.style.height =
            `${height}%`;


        bar.title =
            `${day.present} employees present - ${percentage}%`;


        // ==================================
        // LABEL
        // ==================================

        const label =
            document.createElement("span");


        label.textContent =
            isToday
                ? "Today"
                : dayName;


        chart.appendChild(bar);

        labels.appendChild(label);

    });

}
// ==========================================
// ATTENDANCE OVERVIEW
// ==========================================

function renderAttendanceChart(attendanceData) {

    const chart =
        document.getElementById(
            "attendanceChart"
        );

    const labels =
        document.getElementById(
            "attendanceChartLabels"
        );


    if (!chart || !labels) {
        return;
    }


    if (!Array.isArray(attendanceData)) {

        chart.innerHTML = `
            <div class="loading">
                No attendance data available.
            </div>
        `;

        labels.innerHTML = "";

        return;
    }


    if (!attendanceData.length) {

        chart.innerHTML = `
            <div class="loading">
                No attendance data available.
            </div>
        `;

        labels.innerHTML = "";

        return;
    }


    chart.innerHTML =
        attendanceData.map(day => {

            const percentage =
                Math.max(
                    0,
                    Math.min(
                        Number(
                            day.attendance_percentage || 0
                        ),
                        100
                    )
                );


            return `

                <div
                    class="bar"
                    style="height:${percentage}%"
                    title="${percentage.toFixed(1)}% attendance"
                ></div>

            `;

        }).join("");


    labels.innerHTML =
        attendanceData.map(day => {

            return `

                <span>
                    ${escapeHtml(
                        day.label || "-"
                    )}
                </span>

            `;

        }).join("");

}

    }
    catch (error) {

        console.error(
            "HR DASHBOARD ERROR:",
            error
        );


        showDashboardError(
            error.message
        );

    }

}


// ==========================================
// UPDATE STATISTICS
// ==========================================

function updateStatistics(stats) {

    if (!stats) {
        return;
    }


    // ----------------------------------
    // TOTAL EMPLOYEES
    // ----------------------------------

    setText(
        [
            "totalEmployees",
            "totalEmployee",
            "employeeCount"
        ],
        stats.totalEmployees
    );


    // ----------------------------------
    // DEPARTMENTS
    // ----------------------------------

    setText(
        [
            "totalDepartments",
            "departmentCount"
        ],
        stats.totalDepartments
    );


    // ----------------------------------
    // ON LEAVE TODAY
    // ----------------------------------

    setText(
        [
            "onLeaveToday",
            "leaveToday",
            "onLeave"
        ],
        stats.onLeaveToday
    );


    // ----------------------------------
    // ATTENDANCE TODAY
    // ----------------------------------

    setText(
        [
            "attendanceToday",
            "attendancePercentage"
        ],
        `${stats.attendanceToday}%`
    );


    // ----------------------------------
    // PRESENT TODAY
    // ----------------------------------

    setText(
        [
            "presentToday"
        ],
        stats.presentToday
    );


    // ----------------------------------
    // MARKED ATTENDANCE
    // ----------------------------------

    setText(
        [
            "markedAttendance"
        ],
        stats.markedAttendance
    );

}


// ==========================================
// SET TEXT HELPER
// ==========================================

function setText(ids, value) {

    for (const id of ids) {

        const element =
            document.getElementById(id);


        if (element) {

            element.textContent =
                value;

            return;

        }

    }

}


// ==========================================
// RECENT EMPLOYEES
// ==========================================

function renderRecentEmployees(
    employees
) {

    const container =
        document.getElementById(
            "recentEmployees"
        );


    const tableBody =
        document.getElementById(
            "recentEmployeesTableBody"
        );


    if (
        !container &&
        !tableBody
    ) {

        return;

    }


    if (!employees.length) {

        const emptyHTML = `
            <div class="empty-message">
                No employees found.
            </div>
        `;


        if (container) {
            container.innerHTML =
                emptyHTML;
        }


        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        No employees found.
                    </td>
                </tr>
            `;

        }


        return;

    }


    // ==================================
    // CARD CONTAINER
    // ==================================

    if (container) {

        container.innerHTML =
            employees.map(employee => {

                const name =
                    getEmployeeName(employee);


                return `
                    <div class="recent-employee-item">

                        <div class="employee-avatar">
                            ${getInitials(name)}
                        </div>

                        <div class="employee-info">

                            <strong>
                                ${escapeHtml(name)}
                            </strong>

                            <small>
                                ${escapeHtml(
                                    employee.designation || ""
                                )}
                            </small>

                            <small>
                                ${escapeHtml(
                                    employee.department || ""
                                )}
                            </small>

                        </div>

                    </div>
                `;

            }).join("");

    }


    // ==================================
    // TABLE
    // ==================================

    if (tableBody) {

        tableBody.innerHTML =
            employees.map(employee => {

                const name =
                    getEmployeeName(employee);


                return `
                    <tr>

                        <td>
                            <strong>
                                ${escapeHtml(name)}
                            </strong>
                        </td>

                        <td>
                            ${escapeHtml(
                                employee.employee_code || "-"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                employee.department || "-"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                employee.designation || "-"
                            )}
                        </td>

                        <td>
                            ${formatDate(
                                employee.joining_date
                            )}
                        </td>

                        <td>
                            <span class="status-badge">
                                ${escapeHtml(
                                    employee.status || "-"
                                )}
                            </span>
                        </td>

                    </tr>
                `;

            }).join("");

    }

}


// ==========================================
// DEPARTMENT PERFORMANCE
// ==========================================

function renderDepartmentPerformance(
    departments
) {

    const container =
        document.getElementById(
            "departmentPerformance"
        );


    const tableBody =
        document.getElementById(
            "departmentPerformanceTableBody"
        );


    if (
        !container &&
        !tableBody
    ) {

        return;

    }


    if (!departments.length) {

        if (container) {

            container.innerHTML = `
                <div class="empty-message">
                    No department data available.
                </div>
            `;

        }


        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        No department data available.
                    </td>
                </tr>
            `;

        }


        return;

    }


    // ==================================
    // CARD VIEW
    // ==================================

    if (container) {

        container.innerHTML =
            departments.map(department => {

                const percentage =
                    Number(
                        department.performance
                    ) || 0;


                return `
                    <div class="department-performance-item">

                        <div class="department-header">

                            <strong>
                                ${escapeHtml(
                                    department.department
                                )}
                            </strong>

                            <span>
                                ${percentage}%
                            </span>

                        </div>

                        <div class="progress-bar">

                            <div
                                class="progress-fill"
                                style="width:${Math.min(
                                    percentage,
                                    100
                                )}%"
                            ></div>

                        </div>

                        <small>
                            ${
                                department.presentEmployees
                            }
                            /
                            ${
                                department.totalEmployees
                            }
                            employees present
                        </small>

                    </div>
                `;

            }).join("");

    }


    // ==================================
    // TABLE VIEW
    // ==================================

    if (tableBody) {

        tableBody.innerHTML =
            departments.map(department => {

                return `
                    <tr>

                        <td>
                            ${escapeHtml(
                                department.department
                            )}
                        </td>

                        <td>
                            ${department.totalEmployees}
                        </td>

                        <td>
                            ${department.presentEmployees}
                        </td>

                        <td>
                            ${department.performance}%
                        </td>

                    </tr>
                `;

            }).join("");

    }

}


// ==========================================
// RECENT ACTIVITY
// ==========================================

function renderRecentActivity(
    leaves,
    payroll
) {

    const container =
        document.getElementById(
            "recentActivity"
        );


    if (!container) {
        return;
    }


    const activities = [];


    // ==================================
    // LEAVE ACTIVITY
    // ==================================

    leaves.forEach(leave => {

        const name =
            getEmployeeName(leave);


        activities.push({

            id:
                Number(leave.id) || 0,

            html: `
                <div class="activity-item">

                    <div class="activity-icon">
                        <i class="fa-solid fa-calendar-days"></i>
                    </div>

                    <div class="activity-content">

                        <strong>
                            ${escapeHtml(name)}
                        </strong>

                        <span>
                            Leave request
                            ${escapeHtml(
                                leave.status || ""
                            )}
                        </span>

                        <small>
                            ${formatDate(
                                leave.start_date
                            )}
                            -
                            ${formatDate(
                                leave.end_date
                            )}
                        </small>

                    </div>

                </div>
            `

        });

    });


    // ==================================
    // PAYROLL ACTIVITY
    // ==================================

    payroll.forEach(record => {

        const name =
            getEmployeeName(record);


        activities.push({

            id:
                Number(record.id) || 0,

            html: `
                <div class="activity-item">

                    <div class="activity-icon">
                        <i class="fa-solid fa-money-bill-wave"></i>
                    </div>

                    <div class="activity-content">

                        <strong>
                            ${escapeHtml(name)}
                        </strong>

                        <span>
                            Payroll
                            ${escapeHtml(
                                record.payment_status || ""
                            )}
                        </span>

                        <small>
                            Net Salary:
                            ${formatCurrency(
                                record.net_salary
                            )}
                        </small>

                    </div>

                </div>
            `

        });

    });


    // ==================================
    // SORT
    // ==================================

    activities.sort(
        (a, b) => b.id - a.id
    );


    // ==================================
    // LIMIT
    // ==================================

    const latestActivities =
        activities.slice(0, 8);


    if (!latestActivities.length) {

        container.innerHTML = `
            <div class="empty-message">
                No recent activity.
            </div>
        `;

        return;

    }


    container.innerHTML =
        latestActivities
            .map(item => item.html)
            .join("");

}


// ==========================================
// QUICK ACTIONS
// ==========================================

function setupNavigation() {

    const links =
        document.querySelectorAll(
            "[data-page]"
        );


    links.forEach(link => {

        link.addEventListener(
            "click",
            function(event) {

                const page =
                    this.dataset.page;


                if (!page) {
                    return;
                }


                event.preventDefault();


                navigateToPage(
                    page
                );

            }
        );

    });

}


// ==========================================
// NAVIGATION
// ==========================================

// ==========================================
// HR DASHBOARD NAVIGATION
// ==========================================

function navigateToPage(page) {

    const pages = {

        // Main Menu
        dashboard: "hr.html",

        employees: "employees.html",

        attendance: "admin-attendance.html",

        leave: "leave-management.html",

        payroll: "payroll.html",

        // These pages will be created next
        performance: "performance.html",

        growth: "growth.html",

        recognition: "recognition.html",

        suggestions: "suggestions.html",

        settings: "settings.html"

    };


    if (pages[page]) {

        window.location.href = pages[page];

    } else {

        console.error(
            "Unknown dashboard page:",
            page
        );

    }

}


// ==========================================
// LOGOUT
// ==========================================

function setupLogout() {

    const logoutButtons =
        document.querySelectorAll(
            "#logoutBtn, .logout-btn, [data-action='logout']"
        );


    logoutButtons.forEach(button => {

        button.addEventListener(
            "click",
            function(event) {

                event.preventDefault();


                const confirmed =
                    confirm(
                        "Are you sure you want to logout?"
                    );


                if (!confirmed) {
                    return;
                }


                localStorage.removeItem(
                    "user"
                );

                localStorage.removeItem(
                    "userId"
                );

                localStorage.removeItem(
                    "loggedInUser"
                );

                localStorage.removeItem(
                    "token"
                );


                sessionStorage.clear();


                window.location.href =
                    "../login.html";

            }
        );

    });

}


// ==========================================
// ERROR
// ==========================================

function showDashboardError(
    message
) {

    console.error(
        message
    );


    const errorElements =
        document.querySelectorAll(
            ".dashboard-error"
        );


    errorElements.forEach(element => {

        element.textContent =
            message;

    });

}


// ==========================================
// EMPLOYEE NAME
// ==========================================

function getEmployeeName(
    employee
) {

    return (
        `${employee.first_name || ""} ${
            employee.last_name || ""
        }`
    ).trim() ||
    "Unknown Employee";

}


// ==========================================
// INITIALS
// ==========================================

function getInitials(
    name
) {

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(
            word =>
                word.charAt(0).toUpperCase()
        )
        .join("");

}


// ==========================================
// DATE FORMAT
// ==========================================

function formatDate(
    dateValue
) {

    if (!dateValue) {
        return "-";
    }


    const date =
        new Date(dateValue);


    if (isNaN(date.getTime())) {
        return String(dateValue);
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


// ==========================================
// CURRENCY
// ==========================================

function formatCurrency(
    amount
) {

    return "₹" +
        Number(
            amount || 0
        ).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

}


// ==========================================
// HTML ESCAPE
// ==========================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}