// =====================================================
// SmartHR - EMPLOYEE LEAVE MANAGEMENT
// =====================================================

const LEAVE_API = "https://smarthrmanagement-backend.onrender.com/api/leave";


// =====================================================
// GET LOGGED-IN USER
// =====================================================

const storedUser = localStorage.getItem("smartHRUser");

let currentUser = null;

try {
    currentUser = storedUser
        ? JSON.parse(storedUser)
        : null;
} catch (error) {
    console.error("USER DATA ERROR:", error);
    currentUser = null;
}


// =====================================================
// LOGIN CHECK
// =====================================================

if (!currentUser || !currentUser.id) {
    window.location.href = "../index.html";
}


// =====================================================
// ELEMENTS
// =====================================================

const leaveForm = document.getElementById("leaveForm");
const leaveType = document.getElementById("leaveType");
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");
const reason = document.getElementById("reason");
const submitBtn = document.getElementById("submitBtn");
const leaveTableBody = document.getElementById("leaveTableBody");
const message = document.getElementById("message");
const daysInfo = document.getElementById("daysInfo");
const leaveDays = document.getElementById("leaveDays");
const backBtn = document.getElementById("backBtn");


// =====================================================
// MESSAGE
// =====================================================

function showMessage(text, type = "info") {

    if (!message) return;

    message.textContent = text;
    message.className = "message show " + type;

    setTimeout(() => {
        message.textContent = "";
        message.className = "message";
    }, 4000);
}


// =====================================================
// DATE NORMALIZER
// =====================================================

function cleanDate(value) {

    if (!value) return "";

    // HTML date input already gives YYYY-MM-DD
    if (typeof value === "string") {

        // YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return value;
        }

        // YYYY-MM-DD HH:mm:ss
        if (/^\d{4}-\d{2}-\d{2}\s/.test(value)) {
            return value.substring(0, 10);
        }

        // ISO date
        if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
            return value.substring(0, 10);
        }
    }

    return "";
}


// =====================================================
// FORMAT DATE FOR DISPLAY
// =====================================================

function formatDate(value) {

    const date = cleanDate(value);

    if (!date) {
        return "-";
    }

    const parts = date.split("-");

    if (parts.length !== 3) {
        return "-";
    }

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}


// =====================================================
// CALCULATE DAYS
// =====================================================

function calculateLeaveDays(startValue, endValue) {

    const startString = cleanDate(startValue);
    const endString = cleanDate(endValue);

    if (!startString || !endString) {
        return 0;
    }

    // IMPORTANT:
    // YYYY-MM-DD ko local date ke roop mein parse karna
    const startParts = startString.split("-");
    const endParts = endString.split("-");

    if (
        startParts.length !== 3 ||
        endParts.length !== 3
    ) {
        return 0;
    }

    const start = new Date(
        Number(startParts[0]),
        Number(startParts[1]) - 1,
        Number(startParts[2])
    );

    const end = new Date(
        Number(endParts[0]),
        Number(endParts[1]) - 1,
        Number(endParts[2])
    );

    if (
        isNaN(start.getTime()) ||
        isNaN(end.getTime())
    ) {
        return 0;
    }

    if (end < start) {
        return 0;
    }

    const difference =
        end.getTime() - start.getTime();

    return Math.round(
        difference /
        (1000 * 60 * 60 * 24)
    ) + 1;
}


// =====================================================
// UPDATE DAYS ON FORM
// =====================================================

function updateDaysPreview() {

    if (!startDate || !endDate) {
        return 0;
    }

    const days = calculateLeaveDays(
        startDate.value,
        endDate.value
    );

    if (
        startDate.value &&
        endDate.value &&
        days > 0
    ) {

        if (daysInfo) {
            daysInfo.style.display = "block";
        }

        if (leaveDays) {
            leaveDays.textContent = days;
        }

    } else {

        if (daysInfo) {
            daysInfo.style.display = "none";
        }

        if (leaveDays) {
            leaveDays.textContent = "0";
        }
    }

    return days;
}


// =====================================================
// SET MINIMUM DATE
// =====================================================

function setMinimumDate() {

    const today = new Date();

    const year = today.getFullYear();

    const month =
        String(today.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(today.getDate())
            .padStart(2, "0");

    const todayString =
        `${year}-${month}-${day}`;

    if (startDate) {
        startDate.min = todayString;
    }

    if (endDate) {
        endDate.min = todayString;
    }
}


// =====================================================
// LOAD LEAVE TYPES
// =====================================================

async function loadLeaveTypes() {

    if (!leaveType) return;

    try {

        leaveType.innerHTML = `
            <option value="">
                Loading leave types...
            </option>
        `;

        const response =
            await fetch(`${LEAVE_API}/types`);

        const data =
            await response.json();

        console.log("LEAVE TYPES:", data);

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Unable to load leave types."
            );
        }

        leaveType.innerHTML = `
            <option value="">
                Select Leave Type
            </option>
        `;

        const types = data.leaveTypes || [];

        if (types.length === 0) {

            leaveType.innerHTML = `
                <option value="">
                    No leave types available
                </option>
            `;

            return;
        }

        types.forEach(type => {

            const option =
                document.createElement("option");

            option.value = type.id;

            option.textContent =
                `${type.name} (${type.total_days} days)`;

            leaveType.appendChild(option);
        });

    } catch (error) {

        console.error(
            "LOAD LEAVE TYPES ERROR:",
            error
        );

        leaveType.innerHTML = `
            <option value="">
                Unable to load leave types
            </option>
        `;

        showMessage(
            error.message ||
            "Unable to load leave types.",
            "error"
        );
    }
}


// =====================================================
// LOAD MY LEAVE REQUESTS
// =====================================================

async function loadMyLeaves() {

    if (!leaveTableBody) return;

    try {

        leaveTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Loading requests...
                </td>
            </tr>
        `;

        const response =
            await fetch(
                `${LEAVE_API}/my/${currentUser.id}`
            );

        const data =
            await response.json();

        console.log("MY LEAVES:", data);

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Unable to load leave requests."
            );
        }

        const leaves = data.leaves || [];

        if (leaves.length === 0) {

            leaveTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty">
                        <i class="fa-solid fa-calendar-xmark"></i>
                        No leave requests found.
                    </td>
                </tr>
            `;

            return;
        }

        leaveTableBody.innerHTML = "";

        leaves.forEach(leave => {

            // -----------------------------------------
            // IMPORTANT:
            // Database se ACTUAL selected dates
            // -----------------------------------------
const actualStart = cleanDate(
    leave.start_date
);

const actualEnd = cleanDate(
    leave.end_date
);

console.log("TABLE DATE:", {
    id: leave.id,
    start: leave.start_date,
    end: leave.end_date,
    cleanedStart: actualStart,
    cleanedEnd: actualEnd
});


            // -----------------------------------------
            // Days calculate from actual DB dates
            // -----------------------------------------

            let days =
                calculateLeaveDays(
                    actualStart,
                    actualEnd
                );


            // Agar backend days bhej raha hai
            // to valid value use kar sakte hain,
            // otherwise calculate above.
            if (
                days <= 0 &&
                Number(leave.days) > 0
            ) {
                days = Number(leave.days);
            }


            const status =
                String(
                    leave.status || "unknown"
                ).toLowerCase();


            const safeStatus =
                [
                    "pending",
                    "approved",
                    "rejected"
                ].includes(status)
                    ? status
                    : "unknown";


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        leave.leave_type || "-"
                    )}
                </td>

                <td>
                    ${formatDate(actualStart)}
                </td>

                <td>
                    ${formatDate(actualEnd)}
                </td>

                <td>
                    ${days}
                </td>

                <td>
                    <span class="status ${safeStatus}">
                        ${escapeHTML(
                            capitalize(safeStatus)
                        )}
                    </span>
                </td>

            `;


            leaveTableBody.appendChild(row);

        });

    } catch (error) {

        console.error(
            "LOAD MY LEAVES ERROR:",
            error
        );

        leaveTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    Unable to load leave requests.
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
// APPLY LEAVE
// =====================================================

if (leaveForm) {

    leaveForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const selectedLeaveType =
                leaveType.value;

            const selectedStartDate =
                cleanDate(startDate.value);

            const selectedEndDate =
                cleanDate(endDate.value);

            const selectedReason =
                reason.value.trim();


            // -----------------------------------------
            // VALIDATION
            // -----------------------------------------

            if (
                !selectedLeaveType ||
                !selectedStartDate ||
                !selectedEndDate
            ) {

                showMessage(
                    "Please fill all required fields.",
                    "error"
                );

                return;
            }


            const days =
                calculateLeaveDays(
                    selectedStartDate,
                    selectedEndDate
                );


            if (days <= 0) {

                showMessage(
                    "End date cannot be before start date.",
                    "error"
                );

                return;
            }


            console.log(
                "SELECTED START:",
                selectedStartDate
            );

            console.log(
                "SELECTED END:",
                selectedEndDate
            );

            console.log(
                "CALCULATED DAYS:",
                days
            );


            try {

                submitBtn.disabled = true;

                submitBtn.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Submitting...
                `;


                const response =
                    await fetch(
                        `${LEAVE_API}/apply`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                userId:
                                    currentUser.id,

                                leave_type_id:
                                    Number(
                                        selectedLeaveType
                                    ),

                                // EXACT selected date
                                start_date:
                                    selectedStartDate,

                                // EXACT selected date
                                end_date:
                                    selectedEndDate,

                                reason:
                                    selectedReason

                            })
                        }
                    );


                const data =
                    await response.json();

                console.log(
                    "APPLY LEAVE RESPONSE:",
                    data
                );


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "Unable to submit leave request."
                    );
                }


                showMessage(
                    `Leave submitted successfully. ${days} day(s).`,
                    "success"
                );


                // -----------------------------------------
                // IMPORTANT:
                // Form reset ke baad table DB se reload hoga
                // -----------------------------------------

                leaveForm.reset();

                if (daysInfo) {
                    daysInfo.style.display = "none";
                }

                if (leaveDays) {
                    leaveDays.textContent = "0";
                }

                setMinimumDate();

                if (endDate) {
                    endDate.min =
                        startDate.value ||
                        endDate.min;
                }


                await loadMyLeaves();


            } catch (error) {

                console.error(
                    "APPLY LEAVE ERROR:",
                    error
                );

                showMessage(
                    error.message ||
                    "Unable to submit leave request.",
                    "error"
                );

            } finally {

                submitBtn.disabled = false;

                submitBtn.innerHTML = `
                    <i class="fa-solid fa-paper-plane"></i>
                    Apply Leave
                `;
            }
        }
    );
}


// =====================================================
// START DATE CHANGE
// =====================================================

if (startDate) {

    startDate.addEventListener(
        "change",
        function() {

            if (endDate) {

                endDate.min =
                    startDate.value ||
                    "";
            }

            updateDaysPreview();
        }
    );
}


// =====================================================
// END DATE CHANGE
// =====================================================

if (endDate) {

    endDate.addEventListener(
        "change",
        function() {

            updateDaysPreview();
        }
    );
}


// =====================================================
// BACK BUTTON
// =====================================================

if (backBtn) {

    backBtn.addEventListener(
        "click",
        function() {

            window.location.href =
                "employee.html";
        }
    );
}


// =====================================================
// CAPITALIZE
// =====================================================

function capitalize(value) {

    if (!value) return "";

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        if (
            !currentUser ||
            !currentUser.id
        ) {
            return;
        }

        setMinimumDate();

        await loadLeaveTypes();

        await loadMyLeaves();
    }
);