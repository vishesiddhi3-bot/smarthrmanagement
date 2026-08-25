// =====================================================
// SmartHR - ADMIN ATTENDANCE MANAGEMENT
// =====================================================

const ATTENDANCE_API =
    "http://localhost:5000/api/attendance";


// =====================================================
// GLOBAL DATA
// =====================================================

let allAttendance = [];


// =====================================================
// DOM ELEMENTS
// =====================================================

const attendanceTableBody =
    document.getElementById("attendanceTableBody");

const searchInput =
    document.getElementById("searchInput");

const dateFilter =
    document.getElementById("dateFilter");

const statusFilter =
    document.getElementById("statusFilter");

const resetBtn =
    document.getElementById("resetBtn");

const refreshBtn =
    document.getElementById("refreshBtn");

const message =
    document.getElementById("message");


// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(text, type = "info") {

    if (!message) {
        return;
    }

    message.textContent = text;

    message.className =
        "message show " + type;

}


// =====================================================
// HIDE MESSAGE
// =====================================================

function hideMessage() {

    if (!message) {
        return;
    }

    message.textContent = "";

    message.className = "message";

}


// =====================================================
// SAFE TEXT
// =====================================================

function safeText(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }

    return String(value);

}


// =====================================================
// FORMAT DATE - NO TIMEZONE SHIFT
// =====================================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }

    // MySQL DATE format: YYYY-MM-DD
    if (
        typeof dateValue === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ) {

        const [year, month, day] =
            dateValue.split("-");

        const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec"
        ];

        return (
            day +
            " " +
            monthNames[
                Number(month) - 1
            ] +
            " " +
            year
        );
    }

    // If backend sends ISO date
    // such as 2026-08-18T00:00:00.000Z
    if (
        typeof dateValue === "string" &&
        /^\d{4}-\d{2}-\d{2}T/.test(dateValue)
    ) {

        const dateOnly =
            dateValue.substring(0, 10);

        const [year, month, day] =
            dateOnly.split("-");

        const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec"
        ];

        return (
            day +
            " " +
            monthNames[
                Number(month) - 1
            ] +
            " " +
            year
        );
    }

    return String(dateValue);
}


// =====================================================
// FORMAT TIME
// =====================================================

function formatTime(timeValue) {

    if (!timeValue) {
        return "-";
    }

    // MySQL TIME can arrive as:
    // 09:30:00

    if (
        typeof timeValue === "string" &&
        /^\d{2}:\d{2}/.test(timeValue)
    ) {

        const parts =
            timeValue.split(":");

        let hours =
            parseInt(parts[0], 10);

        const minutes =
            parts[1];

        const ampm =
            hours >= 12
                ? "PM"
                : "AM";

        hours =
            hours % 12 || 12;

        return (
            hours +
            ":" +
            minutes +
            " " +
            ampm
        );

    }

    return safeText(timeValue);

}


// =====================================================
// LOAD ATTENDANCE
// =====================================================

async function loadAttendance() {

    try {

        showMessage(
            "Loading attendance...",
            "info"
        );

        if (attendanceTableBody) {

            attendanceTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Loading attendance...
                    </td>
                </tr>
            `;

        }


        const response =
            await fetch(
                ATTENDANCE_API
            );


        const data =
            await response.json();


        console.log(
            "ADMIN ATTENDANCE RESPONSE:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to fetch attendance"
            );

        }


        if (!data.success) {

            throw new Error(
                data.message ||
                "Unable to fetch attendance"
            );

        }


        // =================================================
        // GET ATTENDANCE ARRAY
        // =================================================

        allAttendance =
            Array.isArray(data.attendance)
                ? data.attendance
                : [];


        console.log(
            "ATTENDANCE RECORDS:",
            allAttendance
        );


        // =================================================
        // UPDATE STATS
        // =================================================

        updateStats(
            allAttendance
        );


        // =================================================
        // DISPLAY TABLE
        // =================================================

        applyFilters();


        hideMessage();


    } catch (error) {

        console.error(
            "LOAD ATTENDANCE ERROR:",
            error
        );


        allAttendance = [];


        updateStats([]);


        if (attendanceTableBody) {

            attendanceTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        Unable to load attendance.
                        <br><br>
                        ${safeText(error.message)}
                    </td>
                </tr>
            `;

        }


        showMessage(
            error.message ||
            "Cannot connect to SmartHR.",
            "error"
        );

    }

}


// =====================================================
// UPDATE STATS
// =====================================================

function updateStats(records) {

    const totalRecords =
        document.getElementById(
            "totalRecords"
        );

    const presentCount =
        document.getElementById(
            "presentCount"
        );

    const halfDayCount =
        document.getElementById(
            "halfDayCount"
        );

    const leaveCount =
        document.getElementById(
            "leaveCount"
        );


    let total = records.length;

    let present = 0;

    let halfDay = 0;

    let leave = 0;


    records.forEach(
        function (record) {

            const status =
                String(
                    record.status || ""
                )
                .trim()
                .toLowerCase();


            if (status === "present") {
                present++;
            }


            if (
                status === "half_day" ||
                status === "half day"
            ) {
                halfDay++;
            }


            if (status === "leave") {
                leave++;
            }

        }
    );


    if (totalRecords) {
        totalRecords.textContent =
            total;
    }


    if (presentCount) {
        presentCount.textContent =
            present;
    }


    if (halfDayCount) {
        halfDayCount.textContent =
            halfDay;
    }


    if (leaveCount) {
        leaveCount.textContent =
            leave;
    }

}


// =====================================================
// APPLY FILTERS
// =====================================================

function applyFilters() {

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedDate =
        dateFilter
            ? dateFilter.value
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
                .trim()
                .toLowerCase()
            : "";


    let filtered =
        allAttendance.filter(
            function (record) {

                // =========================================
                // SEARCH
                // =========================================

                const employeeCode =
                    String(
                        record.employee_code || ""
                    ).toLowerCase();


                const firstName =
                    String(
                        record.first_name || ""
                    ).toLowerCase();


                const lastName =
                    String(
                        record.last_name || ""
                    ).toLowerCase();


                const fullName =
                    (
                        firstName +
                        " " +
                        lastName
                    ).trim();


                const employeeId =
                    String(
                        record.employee_id || ""
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    employeeCode.includes(search) ||
                    employeeId.includes(search) ||
                    firstName.includes(search) ||
                    lastName.includes(search) ||
                    fullName.includes(search);


                // =========================================
                // DATE FILTER
                // =========================================

                let matchesDate = true;


                if (selectedDate) {

                    let recordDate = "";


                    if (
                        typeof record.attendance_date ===
                        "string"
                    ) {

                        recordDate =
                            record.attendance_date
                                .substring(0, 10);

                    } else {

                        const d =
                            new Date(
                                record.attendance_date
                            );

                        if (
                            !isNaN(
                                d.getTime()
                            )
                        ) {

                            recordDate =
                                d.toISOString()
                                    .substring(0, 10);

                        }

                    }


                    matchesDate =
                        recordDate ===
                        selectedDate;

                }


                // =========================================
                // STATUS FILTER
                // =========================================

                const recordStatus =
                    String(
                        record.status || ""
                    )
                    .trim()
                    .toLowerCase();


                const matchesStatus =
                    !selectedStatus ||
                    recordStatus ===
                    selectedStatus;


                return (
                    matchesSearch &&
                    matchesDate &&
                    matchesStatus
                );

            }
        );


    renderAttendance(
        filtered
    );

}


// =====================================================
// RENDER TABLE
// =====================================================

function renderAttendance(records) {

    if (!attendanceTableBody) {
        return;
    }


    if (
        !records ||
        records.length === 0
    ) {

        attendanceTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty">

                    <i class="fa-solid fa-calendar-xmark"></i>

                    No attendance records found.

                </td>
            </tr>
        `;

        return;

    }


    attendanceTableBody.innerHTML =
        records.map(
            function (record) {

                const employeeCode =
                    record.employee_code ||
                    record.employee_id ||
                    "-";


                const firstName =
                    record.first_name || "";


                const lastName =
                    record.last_name || "";


                const employeeName =
                    (
                        firstName +
                        " " +
                        lastName
                    ).trim() ||
                    "Employee";


                const department =
                    record.department ||
                    "-";


                const designation =
                    record.designation ||
                    "-";


                const date =
                    formatDate(
                        record.attendance_date
                    );


                const checkIn =
                    formatTime(
                        record.check_in
                    );


                const checkOut =
                    formatTime(
                        record.check_out
                    );


                const status =
                    String(
                        record.status ||
                        "unknown"
                    )
                    .trim()
                    .toLowerCase();


                let statusClass =
                    "unknown";


                let statusText =
                    "Unknown";


                if (
                    status ===
                    "present"
                ) {

                    statusClass =
                        "present";

                    statusText =
                        "Present";

                }

                else if (
                    status ===
                    "absent"
                ) {

                    statusClass =
                        "absent";

                    statusText =
                        "Absent";

                }

                else if (
                    status ===
                    "half_day" ||
                    status ===
                    "half day"
                ) {

                    statusClass =
                        "half_day";

                    statusText =
                        "Half Day";

                }

                else if (
                    status ===
                    "leave"
                ) {

                    statusClass =
                        "leave";

                    statusText =
                        "Leave";

                }


                return `

                    <tr>

                        <td>

                            <span class="employee-code">

                                ${escapeHTML(
                                    employeeCode
                                )}

                            </span>

                        </td>


                        <td>

                            <span class="employee-name">

                                ${escapeHTML(
                                    employeeName
                                )}

                            </span>

                        </td>


                        <td>

                            ${escapeHTML(
                                department
                            )}

                        </td>


                        <td>

                            ${escapeHTML(
                                designation
                            )}

                        </td>


                        <td>

                            ${escapeHTML(
                                date
                            )}

                        </td>


                        <td>

                            ${escapeHTML(
                                checkIn
                            )}

                        </td>


                        <td>

                            ${escapeHTML(
                                checkOut
                            )}

                        </td>


                        <td>

                            <span
                                class="status ${statusClass}"
                            >

                                ${statusText}

                            </span>

                        </td>

                    </tr>

                `;

            }
        )
        .join("");

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    return String(value)
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


// =====================================================
// SEARCH EVENT
// =====================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            applyFilters();

        }
    );

}


// =====================================================
// DATE FILTER
// =====================================================

if (dateFilter) {

    dateFilter.addEventListener(
        "change",
        function () {

            applyFilters();

        }
    );

}


// =====================================================
// STATUS FILTER
// =====================================================

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        function () {

            applyFilters();

        }
    );

}


// =====================================================
// RESET FILTERS
// =====================================================

if (resetBtn) {

    resetBtn.addEventListener(
        "click",
        function () {

            if (searchInput) {
                searchInput.value = "";
            }


            if (dateFilter) {
                dateFilter.value = "";
            }


            if (statusFilter) {
                statusFilter.value = "";
            }


            applyFilters();

        }
    );

}


// =====================================================
// REFRESH
// =====================================================

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        async function () {

            refreshBtn.disabled = true;


            refreshBtn.innerHTML =
                `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Loading...
                `;


            await loadAttendance();


            refreshBtn.disabled = false;


            refreshBtn.innerHTML =
                `
                <i class="fa-solid fa-rotate"></i>
                Refresh
                `;

        }
    );

}


// =====================================================
// GO BACK
// =====================================================

function goBack() {

    window.history.back();

}


// =====================================================
// INITIAL LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadAttendance();

    }
);