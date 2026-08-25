// ==========================================
// SmartHR - HR DASHBOARD FRONTEND
// ==========================================

const API_URL = "http://localhost:5000/api";


// ==========================================
// LOAD DASHBOARD
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    loadDashboard();

});


// ==========================================
// LOAD DASHBOARD DATA
// ==========================================

async function loadDashboard() {

    try {

        const response = await fetch(
            `${API_URL}/dashboard/summary`
        );

        const data = await response.json();

        console.log(
            "DASHBOARD RESPONSE:",
            data
        );


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load dashboard"
            );

        }


        // ==========================================
        // SUMMARY
        // ==========================================

        const totalEmployees =
            document.querySelector(
                ".stats-grid .stat-card:nth-child(1) .stat-number"
            );


        const totalDepartments =
            document.querySelector(
                ".stats-grid .stat-card:nth-child(2) .stat-number"
            );


        if (totalEmployees) {

            totalEmployees.textContent =
                data.summary.totalEmployees;

        }


        if (totalDepartments) {

            totalDepartments.textContent =
                data.summary.totalDepartments;

        }


        // ==========================================
        // RECENT EMPLOYEES
        // ==========================================

        loadRecentEmployees(
            data.recentEmployees || []
        );


    }
    catch (error) {

        console.error(
            "DASHBOARD LOAD ERROR:",
            error
        );

    }

}


// ==========================================
// RECENT EMPLOYEES
// ==========================================

function loadRecentEmployees(
    employees
) {

    const tableBody =
        document.querySelector(
            ".table-panel table tbody"
        );


    if (!tableBody) {

        return;

    }


    if (!employees.length) {

        tableBody.innerHTML = `
            <tr>

                <td colspan="5">

                    No employees found.

                </td>

            </tr>
        `;

        return;

    }


    tableBody.innerHTML =
        employees.map(employee => {

            const firstName =
                employee.first_name || "";


            const lastName =
                employee.last_name || "";


            const fullName =
                `${firstName} ${lastName}`.trim();


            const initials =
                `${firstName.charAt(0)}${lastName.charAt(0)}`
                    .toUpperCase();


            return `

                <tr>

                    <td>

                        <div class="employee-cell">

                            <div class="employee-avatar">
                                ${escapeHtml(initials)}
                            </div>

                            <div class="employee-name">

                                <strong>
                                    ${escapeHtml(
                                        fullName ||
                                        "Unknown Employee"
                                    )}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        employee.employee_code ||
                                        ""
                                    )}
                                </span>

                            </div>

                        </div>

                    </td>


                    <td>
                        ${escapeHtml(
                            employee.department ||
                            "-"
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            employee.designation ||
                            "-"
                        )}
                    </td>


                    <td>
                        ${formatDate(
                            employee.joining_date
                        )}
                    </td>


                    <td>

                        <span class="status active">
                            Active
                        </span>

                    </td>

                </tr>

            `;

        }).join("");

}


// ==========================================
// FORMAT DATE
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

        return "-";

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
// HTML ESCAPE
// ==========================================

function escapeHtml(
    value
) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}