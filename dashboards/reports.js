// =====================================================
// SmartHR SYSTEM REPORTS
// =====================================================

const API_BASE = "http://localhost:5000/api/reports";


// =====================================================
// STATE
// =====================================================

let currentReport = "employees";

let reportData = [];


// =====================================================
// REPORT CONFIGURATION
// =====================================================

const reportConfig = {

    employees: {

        title: "Employee Report",

        subtitle: "Live employee information",

        endpoint: "/employees"

    },


    attendance: {

        title: "Attendance Report",

        subtitle: "Live employee attendance records",

        endpoint: "/attendance"

    },


    leaves: {

        title: "Leave Report",

        subtitle: "Live employee leave requests",

        endpoint: "/leaves"

    },


    payroll: {

        title: "Payroll Report",

        subtitle: "Live employee payroll information",

        endpoint: "/payroll"

    }

};


// =====================================================
// DOM
// =====================================================

const reportCards =
    document.querySelectorAll(".report-card");

const reportTitle =
    document.getElementById("reportTitle");

const reportSubtitle =
    document.getElementById("reportSubtitle");

const reportHead =
    document.getElementById("reportHead");

const reportBody =
    document.getElementById("reportBody");

const searchInput =
    document.getElementById("searchInput");

const statusFilter =
    document.getElementById("statusFilter");

const refreshBtn =
    document.getElementById("refreshBtn");

const printBtn =
    document.getElementById("printBtn");

const exportBtn =
    document.getElementById("exportBtn");

const resultText =
    document.getElementById("resultText");

const lastUpdated =
    document.getElementById("lastUpdated");


// =====================================================
// LOAD REPORT
// =====================================================

async function loadReport(reportName) {

    currentReport = reportName;

    const config =
        reportConfig[reportName];


    if (!config) {
        return;
    }


    reportTitle.textContent =
        config.title;

    reportSubtitle.textContent =
        config.subtitle;


    reportBody.innerHTML = `

        <tr>

            <td colspan="12" class="loading">

                <i class="fa-solid fa-spinner fa-spin"></i>

                Loading ${config.title}...

            </td>

        </tr>

    `;


    try {

        const response =
            await fetch(
                API_BASE + config.endpoint
            );


        if (!response.ok) {

            throw new Error(
                "HTTP Error " + response.status
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Unable to load report"
            );

        }


        // -----------------------------------------
        // GET CORRECT ARRAY
        // -----------------------------------------

        if (reportName === "employees") {

            reportData =
                Array.isArray(data.employees)
                    ? data.employees
                    : [];

        }


        else if (reportName === "attendance") {

            reportData =
                Array.isArray(data.attendance)
                    ? data.attendance
                    : [];

        }


        else if (reportName === "leaves") {

            reportData =
                Array.isArray(data.leaves)
                    ? data.leaves
                    : [];

        }


        else if (reportName === "payroll") {

            reportData =
                Array.isArray(data.payroll)
                    ? data.payroll
                    : [];

        }


        updateCount(reportName);


        renderReport();


        lastUpdated.textContent =
            "Updated " +
            new Date().toLocaleTimeString();


    }
    catch (error) {

        console.error(
            "REPORT LOAD ERROR:",
            error
        );


        reportData = [];


        reportBody.innerHTML = `

            <tr>

                <td colspan="12" class="empty">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    Unable to load report.

                    <br><br>

                    <small>
                        ${escapeHtml(error.message)}
                    </small>

                </td>

            </tr>

        `;


        resultText.textContent =
            "Report could not be loaded.";

    }

}


// =====================================================
// UPDATE CARD COUNT
// =====================================================

function updateCount(reportName) {

    const count =
        reportData.length;


    if (reportName === "employees") {

        setText(
            "employeeCount",
            count
        );

    }


    if (reportName === "attendance") {

        setText(
            "attendanceCount",
            count
        );

    }


    if (reportName === "leaves") {

        setText(
            "leaveCount",
            count
        );

    }


    if (reportName === "payroll") {

        setText(
            "payrollCount",
            count
        );

    }

}


// =====================================================
// RENDER REPORT
// =====================================================

function renderReport() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const status =
        statusFilter.value
            .toLowerCase();


    let filtered =
        reportData.filter(row => {

            // ---------------------------------------
            // SEARCH
            // ---------------------------------------

            const searchable =
                Object.values(row)
                    .join(" ")
                    .toLowerCase();


            const matchesSearch =
                !search ||
                searchable.includes(search);


            // ---------------------------------------
            // STATUS
            // ---------------------------------------

            let matchesStatus = true;


            if (
                status !== "all"
            ) {

                matchesStatus =
                    String(row.status || "")
                        .toLowerCase() === status;

            }


            return (
                matchesSearch &&
                matchesStatus
            );

        });


    renderTable(
        filtered
    );


    resultText.textContent =
        `Showing ${filtered.length} of ${reportData.length} records`;

}


// =====================================================
// RENDER TABLE
// =====================================================

function renderTable(rows) {

    reportHead.innerHTML = "";

    reportBody.innerHTML = "";


    if (currentReport === "employees") {

        renderEmployeeTable(rows);

        return;

    }


    if (currentReport === "attendance") {

        renderAttendanceTable(rows);

        return;

    }


    if (currentReport === "leaves") {

        renderLeaveTable(rows);

        return;

    }


    if (currentReport === "payroll") {

        renderPayrollTable(rows);

        return;

    }

}


// =====================================================
// EMPLOYEE TABLE
// =====================================================

function renderEmployeeTable(rows) {

    reportHead.innerHTML = `

        <tr>

            <th>Employee</th>

            <th>Department</th>

            <th>Designation</th>

            <th>Phone</th>

            <th>Joining Date</th>

            <th>Salary</th>

            <th>Status</th>

        </tr>

    `;


    if (rows.length === 0) {

        showEmpty();

        return;

    }


    rows.forEach(row => {

        const tr =
            document.createElement("tr");


        const name =
            `${row.first_name || ""} ${row.last_name || ""}`
                .trim();


        tr.innerHTML = `

            <td>

                <div class="employee-name">

                    ${escapeHtml(name || "Unknown")}

                </div>

                <div class="employee-code">

                    ${escapeHtml(row.employee_code || "-")}

                </div>

            </td>


            <td>
                ${escapeHtml(row.department || "-")}
            </td>


            <td>
                ${escapeHtml(row.designation || "-")}
            </td>


            <td>
                ${escapeHtml(row.phone || "-")}
            </td>


            <td>
                ${formatDate(row.joining_date)}
            </td>


            <td>
                ${formatMoney(row.salary)}
            </td>


            <td>
                ${statusBadge(row.status)}
            </td>

        `;


        reportBody.appendChild(tr);

    });

}


// =====================================================
// ATTENDANCE TABLE
// =====================================================

function renderAttendanceTable(rows) {

    reportHead.innerHTML = `

        <tr>

            <th>Employee</th>

            <th>Department</th>

            <th>Date</th>

            <th>Check In</th>

            <th>Check Out</th>

            <th>Status</th>

        </tr>

    `;


    if (rows.length === 0) {

        showEmpty();

        return;

    }


    rows.forEach(row => {

        const tr =
            document.createElement("tr");


        tr.innerHTML = `

            <td>

                <div class="employee-name">

                    ${escapeHtml(
                        row.employee_name ||
                        "Unknown"
                    )}

                </div>

                <div class="employee-code">

                    ${escapeHtml(
                        row.employee_code ||
                        "-"
                    )}

                </div>

            </td>


            <td>
                ${escapeHtml(row.department || "-")}
            </td>


            <td>
                ${formatDate(row.attendance_date)}
            </td>


            <td>
                ${formatTime(row.check_in)}
            </td>


            <td>
                ${formatTime(row.check_out)}
            </td>


            <td>
                ${statusBadge(row.status)}
            </td>

        `;


        reportBody.appendChild(tr);

    });

}


// =====================================================
// LEAVE TABLE
// =====================================================

function renderLeaveTable(rows) {

    reportHead.innerHTML = `

        <tr>

            <th>Employee</th>

            <th>Department</th>

            <th>Leave Type</th>

            <th>Start Date</th>

            <th>End Date</th>

            <th>Days</th>

            <th>Reason</th>

            <th>Status</th>

        </tr>

    `;


    if (rows.length === 0) {

        showEmpty();

        return;

    }


    rows.forEach(row => {

        const tr =
            document.createElement("tr");


        tr.innerHTML = `

            <td>

                <div class="employee-name">

                    ${escapeHtml(
                        row.employee_name ||
                        "Unknown"
                    )}

                </div>

                <div class="employee-code">

                    ${escapeHtml(
                        row.employee_code ||
                        "-"
                    )}

                </div>

            </td>


            <td>
                ${escapeHtml(row.department || "-")}
            </td>


            <td>
                ${escapeHtml(row.leave_type || "-")}
            </td>


            <td>
                ${formatDate(row.start_date)}
            </td>


            <td>
                ${formatDate(row.end_date)}
            </td>


            <td>
                ${escapeHtml(
                    String(row.days ?? 0)
                )}
            </td>


            <td class="reason-cell">

                ${escapeHtml(
                    row.reason || "-"
                )}

            </td>


            <td>
                ${statusBadge(row.status)}
            </td>

        `;


        reportBody.appendChild(tr);

    });

}


// =====================================================
// PAYROLL TABLE
// =====================================================

function renderPayrollTable(rows) {

    reportHead.innerHTML = `

        <tr>

            <th>Employee</th>

            <th>Department</th>

            <th>Month</th>

            <th>Year</th>

            <th>Basic Salary</th>

            <th>Allowances</th>

            <th>Deductions</th>

            <th>Gross Salary</th>

            <th>Net Salary</th>

            <th>Payment</th>

        </tr>

    `;


    if (rows.length === 0) {

        showEmpty();

        return;

    }


    rows.forEach(row => {

        const tr =
            document.createElement("tr");


        tr.innerHTML = `

            <td>

                <div class="employee-name">

                    ${escapeHtml(
                        row.employee_name ||
                        "Unknown"
                    )}

                </div>

                <div class="employee-code">

                    ${escapeHtml(
                        row.employee_code ||
                        "-"
                    )}

                </div>

            </td>


            <td>
                ${escapeHtml(row.department || "-")}
            </td>


            <td>
                ${monthName(row.month)}
            </td>


            <td>
                ${escapeHtml(String(row.year || "-"))}
            </td>


            <td>
                ${formatMoney(row.basic_salary)}
            </td>


            <td>
                ${formatMoney(row.allowances)}
            </td>


            <td>
                ${formatMoney(row.deductions)}
            </td>


            <td>
                ${formatMoney(row.gross_salary)}
            </td>


            <td>

                <strong>
                    ${formatMoney(row.net_salary)}
                </strong>

            </td>


            <td>
                ${statusBadge(row.payment_status)}
            </td>

        `;


        reportBody.appendChild(tr);

    });

}


// =====================================================
// EMPTY TABLE
// =====================================================

function showEmpty() {

    reportBody.innerHTML = `

        <tr>

            <td colspan="12" class="empty">

                <i class="fa-solid fa-folder-open"></i>

                <br><br>

                No records found.

            </td>

        </tr>

    `;

}


// =====================================================
// STATUS BADGE
// =====================================================

function statusBadge(status) {

    if (!status) {

        return `<span class="badge">-</span>`;

    }


    const value =
        String(status)
            .toLowerCase();


    return `

        <span class="badge ${escapeHtml(value)}">

            ${escapeHtml(
                String(status)
                    .replace("_", " ")
            )}

        </span>

    `;

}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (isNaN(date.getTime())) {

        return escapeHtml(
            String(value)
        );

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
// FORMAT TIME
// =====================================================

function formatTime(value) {

    if (!value) {
        return "-";
    }


    return escapeHtml(
        String(value)
    );

}


// =====================================================
// FORMAT MONEY
// =====================================================

function formatMoney(value) {

    const number =
        Number(value || 0);


    return "₹" +
        number.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

}


// =====================================================
// MONTH
// =====================================================

function monthName(month) {

    const months = [

        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"

    ];


    const index =
        Number(month) - 1;


    return months[index] || "-";

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =====================================================
// SET TEXT
// =====================================================

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


// =====================================================
// EXPORT CSV
// =====================================================

function exportCSV() {

    if (!reportData.length) {

        alert(
            "There is no data to export."
        );

        return;

    }


    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const status =
        statusFilter.value
            .toLowerCase();


    const rows =
        reportData.filter(row => {

            const searchable =
                Object.values(row)
                    .join(" ")
                    .toLowerCase();


            const matchesSearch =
                !search ||
                searchable.includes(search);


            const matchesStatus =
                status === "all" ||
                String(row.status || "")
                    .toLowerCase() === status;


            return (
                matchesSearch &&
                matchesStatus
            );

        });


    let headers = [];

    let data = [];


    if (currentReport === "employees") {

        headers = [
            "Employee Code",
            "Employee Name",
            "Phone",
            "Department",
            "Designation",
            "Joining Date",
            "Salary",
            "Status"
        ];


        data = rows.map(row => [

            row.employee_code,
            `${row.first_name || ""} ${row.last_name || ""}`.trim(),
            row.phone,
            row.department,
            row.designation,
            row.joining_date,
            row.salary,
            row.status

        ]);

    }


    else if (currentReport === "attendance") {

        headers = [
            "Employee Code",
            "Employee Name",
            "Department",
            "Date",
            "Check In",
            "Check Out",
            "Status"
        ];


        data = rows.map(row => [

            row.employee_code,
            row.employee_name,
            row.department,
            row.attendance_date,
            row.check_in,
            row.check_out,
            row.status

        ]);

    }


    else if (currentReport === "leaves") {

        headers = [
            "Employee Code",
            "Employee Name",
            "Department",
            "Leave Type",
            "Start Date",
            "End Date",
            "Days",
            "Reason",
            "Status"
        ];


        data = rows.map(row => [

            row.employee_code,
            row.employee_name,
            row.department,
            row.leave_type,
            row.start_date,
            row.end_date,
            row.days,
            row.reason,
            row.status

        ]);

    }


    else if (currentReport === "payroll") {

        headers = [
            "Employee Code",
            "Employee Name",
            "Department",
            "Month",
            "Year",
            "Basic Salary",
            "Allowances",
            "Deductions",
            "Gross Salary",
            "Net Salary",
            "Payment Status"
        ];


        data = rows.map(row => [

            row.employee_code,
            row.employee_name,
            row.department,
            monthName(row.month),
            row.year,
            row.basic_salary,
            row.allowances,
            row.deductions,
            row.gross_salary,
            row.net_salary,
            row.payment_status

        ]);

    }


    const csvRows = [];


    csvRows.push(
        headers.map(csvEscape).join(",")
    );


    data.forEach(row => {

        csvRows.push(
            row.map(csvEscape).join(",")
        );

    });


    const csv =
        "\uFEFF" +
        csvRows.join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type: "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        `smarthr-${currentReport}-report.csv`;


    document.body.appendChild(link);

    link.click();

    link.remove();


    URL.revokeObjectURL(url);

}


// =====================================================
// CSV ESCAPE
// =====================================================

function csvEscape(value) {

    const text =
        String(value ?? "");


    return `"${text.replace(
        /"/g,
        '""'
    )}"`;

}


// =====================================================
// COMING SOON
// =====================================================

function comingSoon(section) {

    alert(
        section +
        " will be available in the next module."
    );

}


// =====================================================
// MOBILE MENU
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
                "show"
            );

        }
    );

}


// =====================================================
// REPORT CARD CLICK
// =====================================================

function setupReportCards() {

    reportCards.forEach(card => {

        card.addEventListener(
            "click",
            function () {

                reportCards.forEach(item => {

                    item.classList.remove(
                        "active"
                    );

                });


                this.classList.add(
                    "active"
                );


                const report =
                    this.dataset.report;


                // Reset filters

                searchInput.value = "";

                statusFilter.value = "all";


                // Load

                loadReport(report);

            }
        );

    });

}


// =====================================================
// SEARCH
// =====================================================

function setupFilters() {

    searchInput.addEventListener(
        "input",
        renderReport
    );


    statusFilter.addEventListener(
        "change",
        renderReport
    );

}


// =====================================================
// REFRESH
// =====================================================

function setupRefresh() {

    refreshBtn.addEventListener(
        "click",
        function () {

            loadReport(
                currentReport
            );

        }
    );

}


// =====================================================
// PRINT
// =====================================================

function setupPrint() {

    printBtn.addEventListener(
        "click",
        function () {

            window.print();

        }
    );

}


// =====================================================
// EXPORT
// =====================================================

function setupExport() {

    exportBtn.addEventListener(
        "click",
        function () {

            exportCSV();

        }
    );

}


// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupMobileMenu();

        setupReportCards();

        setupFilters();

        setupRefresh();

        setupPrint();

        setupExport();


        // Default report

        loadReport(
            "employees"
        );

    }
);