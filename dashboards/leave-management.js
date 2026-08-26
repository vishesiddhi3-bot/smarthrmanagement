// =====================================================
// SmartHR - HR LEAVE MANAGEMENT
// =====================================================

const LEAVE_API =
    "https://smarthrmanagement-backend.onrender.com/api/leave";


let allLeaves = [];


// =====================================================
// ELEMENTS
// =====================================================

const tableBody =
    document.getElementById(
        "leaveTableBody"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const statusFilter =
    document.getElementById(
        "statusFilter"
    );

const resetBtn =
    document.getElementById(
        "resetBtn"
    );

const refreshBtn =
    document.getElementById(
        "refreshBtn"
    );

const message =
    document.getElementById(
        "message"
    );


// =====================================================
// MESSAGE
// =====================================================

function showMessage(
    text,
    type = "success"
) {

    message.textContent = text;

    message.className =
        "message show " + type;

    setTimeout(() => {

        message.className =
            "message";

        message.textContent = "";

    }, 4000);

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =====================================================
// DATE FORMAT
// =====================================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }

    const parts =
        String(dateValue).split("-");

    if (parts.length === 3) {

        return (
            parts[2] +
            "-" +
            parts[1] +
            "-" +
            parts[0]
        );

    }

    return dateValue;

}


// =====================================================
// CALCULATE DAYS
// =====================================================

function calculateDays(
    startDate,
    endDate
) {

    const start =
        new Date(
            startDate + "T00:00:00"
        );

    const end =
        new Date(
            endDate + "T00:00:00"
        );


    if (
        isNaN(start.getTime()) ||
        isNaN(end.getTime())
    ) {

        return 0;

    }


    return (
        Math.floor(
            (
                end.getTime() -
                start.getTime()
            ) /
            (1000 * 60 * 60 * 24)
        ) + 1
    );

}


// =====================================================
// LOAD ALL LEAVES
// =====================================================

async function loadLeaves() {

    tableBody.innerHTML = `
        <tr>
            <td
                colspan="8"
                class="empty"
            >
                <i class="fa-solid fa-spinner fa-spin"></i>
                Loading leave requests...
            </td>
        </tr>
    `;


    try {

        const response =
            await fetch(
                LEAVE_API + "/all"
            );


        const data =
            await response.json();


        console.log(
            "ALL LEAVES:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load leave requests."
            );

        }


        allLeaves =
            data.leaves || [];


        updateStats();

        renderLeaves();


    } catch (error) {

        console.error(
            "LOAD LEAVES ERROR:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="empty"
                >
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    ${escapeHTML(
                        error.message ||
                        "Unable to load leave requests."
                    )}
                </td>
            </tr>
        `;

        showMessage(
            error.message ||
            "Unable to load leave requests.",
            "error"
        );

    }

}


// =====================================================
// UPDATE STATS
// =====================================================

function updateStats() {

    const total =
        allLeaves.length;


    const pending =
        allLeaves.filter(
            leave =>
                String(
                    leave.status
                ).toLowerCase() ===
                "pending"
        ).length;


    const approved =
        allLeaves.filter(
            leave =>
                String(
                    leave.status
                ).toLowerCase() ===
                "approved"
        ).length;


    const rejected =
        allLeaves.filter(
            leave =>
                String(
                    leave.status
                ).toLowerCase() ===
                "rejected"
        ).length;


    document.getElementById(
        "totalCount"
    ).textContent = total;


    document.getElementById(
        "pendingCount"
    ).textContent = pending;


    document.getElementById(
        "approvedCount"
    ).textContent = approved;


    document.getElementById(
        "rejectedCount"
    ).textContent = rejected;

}


// =====================================================
// RENDER
// =====================================================

function renderLeaves() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const selectedStatus =
        statusFilter.value
            .toLowerCase();


    const filtered =
        allLeaves.filter(
            function (leave) {

                const fullName =
                    (
                        (leave.first_name || "") +
                        " " +
                        (leave.last_name || "")
                    )
                    .trim()
                    .toLowerCase();


                const employeeCode =
                    String(
                        leave.employee_code || ""
                    ).toLowerCase();


                const status =
                    String(
                        leave.status || ""
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    fullName.includes(search) ||
                    employeeCode.includes(search);


                const matchesStatus =
                    !selectedStatus ||
                    status === selectedStatus;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    if (filtered.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="empty"
                >
                    <i class="fa-solid fa-calendar-xmark"></i>
                    No leave requests found.
                </td>
            </tr>
        `;

        return;

    }


    tableBody.innerHTML = "";


    filtered.forEach(
        function (leave) {

            const row =
                document.createElement(
                    "tr"
                );


            const name =
                (
                    (leave.first_name || "") +
                    " " +
                    (leave.last_name || "")
                ).trim();


            const days =
                calculateDays(
                    leave.start_date,
                    leave.end_date
                );


            const status =
                String(
                    leave.status ||
                    "pending"
                ).toLowerCase();


            row.innerHTML = `

                <td>

                    <div class="employee-name">
                        ${escapeHTML(
                            name || "Unknown Employee"
                        )}
                    </div>

                    <div class="employee-code">
                        ${escapeHTML(
                            leave.employee_code || "-"
                        )}
                    </div>

                </td>


                <td>
                    ${escapeHTML(
                        leave.leave_type || "-"
                    )}
                </td>


                <td>
                    ${formatDate(
                        leave.start_date
                    )}
                </td>


                <td>
                    ${formatDate(
                        leave.end_date
                    )}
                </td>


                <td>

                    <span class="days">
                        ${days}
                    </span>

                    day${days === 1 ? "" : "s"}

                </td>


                <td>

                    <div class="reason">
                        ${escapeHTML(
                            leave.reason || "-"
                        )}
                    </div>

                </td>


                <td>

                    <span
                        class="status ${escapeHTML(status)}"
                    >
                        ${escapeHTML(
                            capitalize(status)
                        )}
                    </span>

                </td>


                <td>

                    ${
                        status === "pending"

                        ?

                        `
                        <div class="actions">

                            <button
                                class="approve-btn"
                                onclick="approveLeave(${leave.id})"
                            >
                                <i class="fa-solid fa-check"></i>
                                Approve
                            </button>


                            <button
                                class="reject-btn"
                                onclick="rejectLeave(${leave.id})"
                            >
                                <i class="fa-solid fa-xmark"></i>
                                Reject
                            </button>

                        </div>
                        `

                        :

                        `
                        <span class="processed">
                            Already processed
                        </span>
                        `

                    }

                </td>

            `;


            tableBody.appendChild(
                row
            );

        }
    );

}


// =====================================================
// CAPITALIZE
// =====================================================

function capitalize(value) {

    if (!value) {
        return "";
    }

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}


// =====================================================
// APPROVE
// =====================================================

async function approveLeave(
    leaveId
) {

    const confirmed =
        confirm(
            "Are you sure you want to approve this leave?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                LEAVE_API +
                "/" +
                leaveId +
                "/approve",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        approved_by: null
                    })

                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to approve leave."
            );

        }


        showMessage(
            "Leave approved successfully.",
            "success"
        );


        await loadLeaves();

    } catch (error) {

        console.error(
            "APPROVE ERROR:",
            error
        );

        showMessage(
            error.message ||
            "Unable to approve leave.",
            "error"
        );

    }

}


// =====================================================
// REJECT
// =====================================================

async function rejectLeave(
    leaveId
) {

    const confirmed =
        confirm(
            "Are you sure you want to reject this leave?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                LEAVE_API +
                "/" +
                leaveId +
                "/reject",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        approved_by: null
                    })

                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to reject leave."
            );

        }


        showMessage(
            "Leave rejected successfully.",
            "success"
        );


        await loadLeaves();

    } catch (error) {

        console.error(
            "REJECT ERROR:",
            error
        );

        showMessage(
            error.message ||
            "Unable to reject leave.",
            "error"
        );

    }

}


// =====================================================
// FILTER EVENTS
// =====================================================

searchInput.addEventListener(
    "input",
    renderLeaves
);


statusFilter.addEventListener(
    "change",
    renderLeaves
);


resetBtn.addEventListener(
    "click",
    function () {

        searchInput.value = "";

        statusFilter.value = "";

        renderLeaves();

    }
);


refreshBtn.addEventListener(
    "click",
    loadLeaves
);


// =====================================================
// BACK
// =====================================================

function goBack() {

    window.location.href =
        "hr.html";

}


// =====================================================
// START
// =====================================================

loadLeaves();