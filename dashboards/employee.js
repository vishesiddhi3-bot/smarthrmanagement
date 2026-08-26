// =====================================================
// SmartHR - EMPLOYEE DASHBOARD
// =====================================================


// =====================================================
// API URLS
// =====================================================

const DASHBOARD_API =
    "https://smarthrmanagement-backend.onrender.com/api/employee-dashboard";

const ATTENDANCE_API =
    "https://smarthrmanagement-backend.onrender.com/api/attendance";

const WORK_API =
    "https://smarthrmanagement-backend.onrender.com/api/work";


// =====================================================
// GET LOGGED-IN USER
// =====================================================

const storedUser =
    localStorage.getItem("smartHRUser");

let currentUser = null;

if (storedUser) {

    try {

        currentUser =
            JSON.parse(storedUser);

    } catch (error) {

        console.error(
            "USER DATA ERROR:",
            error
        );

    }

}


// =====================================================
// LOGIN CHECK
// =====================================================

if (
    !currentUser ||
    !currentUser.id
) {

    window.location.href =
        "../index.html";

}


// =====================================================
// SAFE TEXT SETTER
// =====================================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value ?? "-";

    }

}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }

    const date =
        new Date(dateValue);

    if (
        isNaN(
            date.getTime()
        )
    ) {

        return dateValue;

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
// MESSAGE
// =====================================================

function showMessage(
    text,
    type = "info"
) {

    const message =
        document.getElementById(
            "dashboardMessage"
        );

    if (!message) {
        return;
    }

    message.textContent =
        text;

    message.className =
        "dashboard-message " +
        type;

    setTimeout(
        function () {

            message.textContent =
                "";

            message.className =
                "dashboard-message";

        },
        3500
    );

}


// =====================================================
// LOAD EMPLOYEE DASHBOARD
// =====================================================

async function loadEmployeeDashboard() {

    const message =
        document.getElementById(
            "dashboardMessage"
        );

    try {

        if (message) {

            message.textContent =
                "Loading your information...";

        }


        const response =
            await fetch(
                DASHBOARD_API +
                "/" +
                currentUser.id
            );


        const data =
            await response.json();


        console.log(
            "EMPLOYEE DASHBOARD:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load employee information."
            );

        }


        // DISPLAY EMPLOYEE

displayEmployee(
    data.employee
);


// ==========================================
// USE DATABASE USER ID
// ==========================================

if (
    data.employee &&
    data.employee.user_id
) {

    currentUser.id =
        data.employee.user_id;

    localStorage.setItem(
        "smartHRUser",
        JSON.stringify(currentUser)
    );

}


console.log(
    "FINAL EMPLOYEE USER:",
    currentUser
);


// LOAD ATTENDANCE

await loadTodayAttendance();

        // LOAD WORK

        await loadMyWork();


        if (message) {

            message.textContent =
                "";

            message.className =
                "dashboard-message";

        }


    } catch (error) {

        console.error(
            "EMPLOYEE DASHBOARD ERROR:",
            error
        );


        if (message) {

            message.textContent =
                "Unable to load employee information.";

            message.className =
                "dashboard-message error";

        }

    }

}


// =====================================================
// DISPLAY EMPLOYEE INFORMATION
// =====================================================

function displayEmployee(employee) {

    if (!employee) {
        return;
    }


    const firstName =
        employee.first_name || "";


    const lastName =
        employee.last_name || "";


    const fullName =
        (
            firstName +
            " " +
            lastName
        ).trim() ||
        employee.username ||
        "Employee";


    // NAME

    setText(
        "welcomeName",
        firstName ||
        employee.username ||
        "Employee"
    );


    setText(
        "employeeFullName",
        fullName
    );


    setText(
        "topUsername",
        employee.username ||
        fullName
    );


    setText(
        "topRole",
        "Employee"
    );


    // EMPLOYEE ID

    setText(
        "employeeCode",
        employee.employee_code ||
        "-"
    );


    setText(
        "profileEmployeeCode",
        employee.employee_code ||
        "-"
    );


    // DEPARTMENT

    setText(
        "employeeDepartment",
        employee.department ||
        "-"
    );


    setText(
        "profileDepartment",
        employee.department ||
        "-"
    );


    // DESIGNATION

    setText(
        "employeeDesignation",
        employee.designation ||
        "-"
    );


    setText(
        "profileDesignation",
        employee.designation ||
        "-"
    );


    // JOINING DATE

    const formattedJoiningDate =
        formatDate(
            employee.joining_date
        );


    setText(
        "joiningDate",
        formattedJoiningDate
    );


    setText(
        "profileJoiningDate",
        formattedJoiningDate
    );


    // ACCOUNT STATUS

    const accountStatus =
        String(
            employee.status ||
            "inactive"
        ).toLowerCase();


    setText(
        "employeeStatus",
        capitalize(
            accountStatus
        )
    );


    // PERSONAL DETAILS

    setText(
        "firstName",
        employee.first_name ||
        "-"
    );


    setText(
        "lastName",
        employee.last_name ||
        "-"
    );


    setText(
        "employeeEmail",
        employee.email ||
        "-"
    );


    setText(
        "employeePhone",
        employee.phone ||
        "-"
    );

}


// =====================================================
// LOAD TODAY'S ATTENDANCE
// =====================================================

async function loadTodayAttendance() {

    const statusElement =
        document.getElementById(
            "attendanceStatus"
        );


    if (!statusElement) {
        return;
    }


    try {

        statusElement.textContent =
            "Checking...";


        const response =
            await fetch(
                ATTENDANCE_API +
                "/today/" +
                currentUser.id
            );


        const data =
            await response.json();


        console.log(
            "TODAY ATTENDANCE:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load attendance."
            );

        }


        // NO ATTENDANCE

        if (!data.attendance) {

            statusElement.textContent =
                "Not Marked";


            setText(
                "checkInTime",
                "-"
            );


            setText(
                "checkOutTime",
                "-"
            );


            updateAttendanceButton(
                false,
                false
            );


            return;

        }


        const attendance =
            data.attendance;


        const status =
            String(
                attendance.status ||
                "absent"
            ).toLowerCase();


        // STATUS

        if (
            status === "leave"
        ) {

            statusElement.textContent =
                "Leave";

        }

        else if (
            status === "absent"
        ) {

            statusElement.textContent =
                "Absent";

        }

        else if (
            status === "present"
        ) {

            if (
                attendance.check_out
            ) {

                statusElement.textContent =
                    "Present • Completed";

            } else {

                statusElement.textContent =
                    "Present";

            }

        }

        else if (
            status === "half_day"
        ) {

            statusElement.textContent =
                "Half Day";

        }

        else {

            statusElement.textContent =
                capitalize(status);

        }


        // TIMES

        setText(
            "checkInTime",
            formatTime(
                attendance.check_in
            )
        );


        setText(
            "checkOutTime",
            formatTime(
                attendance.check_out
            )
        );


        // BUTTON

        updateAttendanceButton(
            true,
            Boolean(
                attendance.check_out
            )
        );


    } catch (error) {

        console.error(
            "TODAY ATTENDANCE ERROR:",
            error
        );


        statusElement.textContent =
            "Unable to load";

    }

}


// =====================================================
// FORMAT TIME
// =====================================================

function formatTime(timeValue) {

    if (!timeValue) {
        return "-";
    }


    const date =
        new Date(
            timeValue
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return timeValue;

    }


    return date.toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// =====================================================
// UPDATE ATTENDANCE BUTTON
// =====================================================

function updateAttendanceButton(
    attendanceMarked,
    checkedOut
) {

    const button =
        document.getElementById(
            "presentBtn"
        );


    if (!button) {
        return;
    }


    if (!attendanceMarked) {

        button.disabled =
            false;

        button.innerHTML =
            '<i class="fa-solid fa-check"></i> Mark Present';

        return;

    }


    if (
        attendanceMarked &&
        !checkedOut
    ) {

        button.disabled =
            false;

        button.innerHTML =
            '<i class="fa-solid fa-right-from-bracket"></i> Check Out';

        return;

    }


    button.disabled =
        true;

    button.innerHTML =
        '<i class="fa-solid fa-circle-check"></i> Completed';

}


// =====================================================
// CHECK-IN / CHECK-OUT
// =====================================================

const presentBtn =
    document.getElementById(
        "presentBtn"
    );


if (presentBtn) {

    presentBtn.addEventListener(
        "click",
        async function () {

            try {

                presentBtn.disabled =
                    true;


                presentBtn.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';


                const todayResponse =
                    await fetch(
                        ATTENDANCE_API +
                        "/today/" +
                        currentUser.id
                    );


                const todayData =
                    await todayResponse.json();


                let endpoint =
                    "/check-in";


                if (
                    todayData.success &&
                    todayData.attendance &&
                    todayData.attendance.check_in &&
                    !todayData.attendance.check_out
                ) {

                    endpoint =
                        "/check-out";

                }


                const response =
                    await fetch(
                        ATTENDANCE_API +
                        endpoint,
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    {
                                        userId:
                                            currentUser.id
                                    }
                                )

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
                        "Attendance operation failed."
                    );

                }


                showMessage(
                    data.message ||
                    "Attendance updated successfully.",
                    "success"
                );


                await loadTodayAttendance();


            } catch (error) {

                console.error(
                    "ATTENDANCE ERROR:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to update attendance.",
                    "error"
                );


                await loadTodayAttendance();

            }

        }
    );

}


// =====================================================
// LOAD MY WORK / TASKS
// =====================================================

async function loadMyWork() {

    const loadingElement =
        document.getElementById(
            "workLoading"
        );

    const taskList =
        document.getElementById(
            "workTaskList"
        );


    if (!loadingElement) {

        console.error(
            "workLoading element not found."
        );

        return;

    }


    if (!taskList) {

        console.error(
            "workTaskList element not found."
        );

        loadingElement.innerHTML =
            '<i class="fa-solid fa-circle-exclamation"></i> Work section is not configured.';

        return;

    }


    // SHOW LOADING

    loadingElement.style.display =
        "flex";


    taskList.innerHTML =
        "";


    try {

        console.log(
            "LOADING WORK FOR USER:",
            currentUser.id
        );


        const response =
            await fetch(
                WORK_API +
                "/my/" +
                currentUser.id
            );


        const data =
            await response.json();


        console.log(
            "MY WORK API RESPONSE:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load assigned work."
            );

        }


        const tasks =
            Array.isArray(data.tasks)
                ? data.tasks
                : [];


        // UPDATE COUNTS

        updateWorkCounts(
            tasks
        );


        // HIDE LOADING

        loadingElement.style.display =
            "none";


        // NO TASKS

        if (
            tasks.length === 0
        ) {

            taskList.innerHTML = `

                <div class="no-work">

                    <div class="no-work-icon">
                        <i class="fa-solid fa-clipboard-check"></i>
                    </div>

                    <h3>
                        No tasks assigned
                    </h3>

                    <p>
                        You currently have no work assigned to you.
                    </p>

                </div>

            `;

            return;

        }


        // RENDER TASKS

        tasks.forEach(
            function (task) {

                taskList.appendChild(
                    createTaskCard(task)
                );

            }
        );


    } catch (error) {

        console.error(
            "MY WORK ERROR:",
            error
        );


        loadingElement.style.display =
            "none";


        updateWorkCounts(
            []
        );


        taskList.innerHTML = `

            <div class="work-error">

                <div class="work-error-icon">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>

                <h3>
                    Unable to load your work
                </h3>

                <p>
                    ${escapeHtml(
                        error.message ||
                        "Something went wrong."
                    )}
                </p>

                <button
                    type="button"
                    class="secondary-btn"
                    onclick="loadMyWork()">

                    <i class="fa-solid fa-rotate"></i>
                    Try Again

                </button>

            </div>

        `;

    }

}


// =====================================================
// UPDATE WORK COUNTS
// =====================================================

function updateWorkCounts(tasks) {

    const total =
        tasks.length;


    const pending =
        tasks.filter(
            function (task) {

                return String(
                    task.status || ""
                ).toLowerCase() === "pending";

            }
        ).length;


    const inProgress =
        tasks.filter(
            function (task) {

                return String(
                    task.status || ""
                ).toLowerCase() === "in_progress";

            }
        ).length;


    const completed =
        tasks.filter(
            function (task) {

                return String(
                    task.status || ""
                ).toLowerCase() === "completed";

            }
        ).length;


    setText(
        "workTotal",
        total
    );


    setText(
        "workPending",
        pending
    );


    setText(
        "workProgress",
        inProgress
    );


    setText(
        "workCompleted",
        completed
    );

}


// =====================================================
// CREATE TASK CARD
// =====================================================

function createTaskCard(task) {

    const card =
        document.createElement("div");


    card.className =
        "work-task-card";


    const status =
        String(
            task.status ||
            "pending"
        ).toLowerCase();


    const priority =
        String(
            task.priority ||
            "medium"
        ).toLowerCase();


    let statusText =
        "Pending";


    if (
        status === "in_progress"
    ) {

        statusText =
            "In Progress";

    }

    else if (
        status === "completed"
    ) {

        statusText =
            "Completed";

    }


    const priorityText =
        capitalize(priority);


    const dueDate =
        task.due_date
            ? formatDate(task.due_date)
            : "No due date";


    const description =
        task.description ||
        "No description provided.";


    card.innerHTML = `

        <div class="task-top">

            <div class="task-title-area">

                <h3>
                    ${escapeHtml(
                        task.title ||
                        "Untitled Task"
                    )}
                </h3>

                <span class="task-employee-code">

                    ${escapeHtml(
                        task.employee_code ||
                        ""
                    )}

                </span>

            </div>


            <span
                class="task-status ${getStatusClass(status)}">

                ${escapeHtml(
                    statusText
                )}

            </span>

        </div>


        <p class="task-description">

            ${escapeHtml(
                description
            )}

        </p>


        <div class="task-info">

            <div class="task-info-item">

                <i class="fa-solid fa-flag"></i>

                <span>
                    Priority
                </span>

                <strong class="priority-${priority}">

                    ${escapeHtml(
                        priorityText
                    )}

                </strong>

            </div>


            <div class="task-info-item">

                <i class="fa-solid fa-calendar-days"></i>

                <span>
                    Due Date
                </span>

                <strong>
                    ${escapeHtml(
                        dueDate
                    )}
                </strong>

            </div>


            <div class="task-info-item">

                <i class="fa-solid fa-clock"></i>

                <span>
                    Assigned
                </span>

                <strong>
                    ${escapeHtml(
                        formatDateTime(
                            task.assigned_at
                        )
                    )}
                </strong>

            </div>

        </div>


        <div class="task-bottom">

            <button
                type="button"
                class="task-details-btn"
                onclick="openTaskDetails(${Number(task.id)})">

                <i class="fa-solid fa-eye"></i>

                View Details

            </button>


            ${
                status !== "completed"
                    ? `
                        <button
                            type="button"
                            class="task-update-btn"
                            onclick="updateTaskStatus(${Number(task.id)}, '${status === "pending" ? "in_progress" : "completed"}')">

                            <i class="fa-solid fa-check"></i>

                            ${
                                status === "pending"
                                    ? "Start Task"
                                    : "Complete Task"
                            }

                        </button>
                    `
                    : `
                        <span class="task-completed-label">

                            <i class="fa-solid fa-circle-check"></i>

                            Completed

                        </span>
                    `
            }

        </div>

    `;


    return card;

}


// =====================================================
// STATUS CLASS
// =====================================================

function getStatusClass(status) {

    if (
        status === "completed"
    ) {

        return "status-completed";

    }


    if (
        status === "in_progress"
    ) {

        return "status-progress";

    }


    return "status-pending";

}


// =====================================================
// FORMAT DATE + TIME
// =====================================================

function formatDateTime(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return value;

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
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

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
// OPEN TASK DETAILS
// =====================================================

async function openTaskDetails(taskId) {

    if (!taskId) {
        return;
    }


    try {

        const response =
            await fetch(
                WORK_API +
                "/" +
                taskId
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load task details."
            );

        }


        const task =
            data.task;


        alert(
            "Task: " +
            (task.title || "-") +
            "\n\n" +

            "Description: " +
            (task.description || "-") +
            "\n\n" +

            "Priority: " +
            (task.priority || "-") +
            "\n\n" +

            "Status: " +
            (task.status || "-") +
            "\n\n" +

            "Due Date: " +
            (task.due_date || "-")
        );


    } catch (error) {

        console.error(
            "TASK DETAILS ERROR:",
            error
        );


        showMessage(
            error.message ||
            "Unable to load task details.",
            "error"
        );

    }

}


// =====================================================
// UPDATE TASK STATUS
// =====================================================

async function updateTaskStatus(
    taskId,
    newStatus
) {

    if (
        !taskId ||
        !newStatus
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                WORK_API +
                "/" +
                taskId +
                "/status",
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            userId:
                                currentUser.id,

                            status:
                                newStatus

                        })

                }
            );


        const data =
            await response.json();


        console.log(
            "TASK STATUS UPDATE:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to update task."
            );

        }


        showMessage(
            data.message ||
            "Task status updated successfully.",
            "success"
        );


        // RELOAD TASKS

        await loadMyWork();


    } catch (error) {

        console.error(
            "TASK STATUS ERROR:",
            error
        );


        showMessage(
            error.message ||
            "Unable to update task.",
            "error"
        );

    }

}


// =====================================================
// LEAVE BUTTON
// =====================================================

const leaveBtn =
    document.getElementById(
        "leaveBtn"
    );


if (leaveBtn) {

    leaveBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "employee-leave.html";

        }
    );

}


// =====================================================
// MY WORK BUTTON
// =====================================================

const workBtn =
    document.getElementById(
        "workBtn"
    );


if (workBtn) {

    workBtn.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            window.location.href =
                "work.html";

        }
    );

}


// =====================================================
// SIDEBAR ACTIVE LINK
// =====================================================

const navLinks =
    document.querySelectorAll(
        ".sidebar-nav a"
    );


navLinks.forEach(
    function (link) {

        link.addEventListener(
            "click",
            function () {

                navLinks.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                link.classList.add(
                    "active"
                );

            }
        );

    }
);


// =====================================================
// LOGOUT
// =====================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            localStorage.removeItem(
                "smartHRUser"
            );


            localStorage.removeItem(
                "smartHRToken"
            );


            window.location.href =
                "../index.html";

        }
    );

}


// =====================================================
// START DASHBOARD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        if (
            currentUser &&
            currentUser.id
        ) {

            loadEmployeeDashboard();

        }

    }
);

// ==========================================
// SmartHR - EMPLOYEE SALARY + SUGGESTIONS
// ==========================================


// ==========================================
// API URLS
// ==========================================

const PAYROLL_API_URL =
    "https://smarthrmanagement-backend.onrender.com/api/employee-dashboard";

const SUGGESTIONS_API_URL =
    "https://smarthrmanagement-backend.onrender.com/api/suggestions";


// ==========================================
// GET LOGGED-IN USER ID
// ==========================================

function getLoggedInUserId() {

    if (
        currentUser &&
        currentUser.id
    ) {

        return currentUser.id;

    }


    const storedUser =
        localStorage.getItem("smartHRUser");


    if (storedUser) {

        try {

            const user =
                JSON.parse(storedUser);


            if (
                user &&
                user.id
            ) {

                return user.id;

            }

        }
        catch (error) {

            console.error(
                "SMART HR USER PARSE ERROR:",
                error
            );

        }

    }


    return null;

}


// ==========================================
// LOAD EMPLOYEE SALARY
// ==========================================

// ==========================================
// LOAD EMPLOYEE SALARY
// ==========================================

async function loadEmployeeSalary() {

    const history =
        document.getElementById("salaryHistory");


    // ==========================================
    // CHECK USER
    // ==========================================

    if (!currentUser) {

        console.error(
            "CURRENT USER NOT FOUND:",
            currentUser
        );

        renderSalaryError(
            "Employee session not found."
        );

        return;

    }


    // ==========================================
    // GET USER ID
    // ==========================================

    const userId =
        currentUser.id;


    console.log(
        "SALARY USER ID:",
        userId
    );


    if (
        userId === undefined ||
        userId === null ||
        userId === "" ||
        isNaN(Number(userId))
    ) {

        console.error(
            "INVALID USER ID:",
            userId,
            currentUser
        );

        renderSalaryError(
            "Invalid employee/user ID."
        );

        return;

    }


    // ==========================================
    // LOADING
    // ==========================================

    if (history) {

        history.innerHTML = `
            <div class="work-loading">

                <i class="fa-solid fa-spinner fa-spin"></i>

                Loading salary history...

            </div>
        `;

    }


    try {

        const numericUserId =
            Number(userId);


        const salaryUrl =
            `${PAYROLL_API_URL}/${numericUserId}/salary`;


        console.log(
            "SALARY API URL:",
            salaryUrl
        );


        // ==========================================
        // FETCH SALARY
        // ==========================================

        const response =
            await fetch(
                salaryUrl
            );


        const data =
            await response.json();


        console.log(
            "SALARY API RESPONSE:",
            data
        );


        // ==========================================
        // CHECK RESPONSE
        // ==========================================

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load salary details."
            );

        }


        // ==========================================
        // IMPORTANT
        // BACKEND RETURNS "salary"
        // NOT "payroll"
        // ==========================================

        const salaries =
            Array.isArray(data.salary)
                ? data.salary
                : [];


        console.log(
            "SALARY RECORDS:",
            salaries
        );


        // ==========================================
        // RENDER
        // ==========================================

        renderSalary(
            salaries
        );

    }
    catch (error) {

        console.error(
            "SALARY LOAD ERROR:",
            error
        );


        renderSalaryError(
            error.message ||
            "Unable to load salary details."
        );

    }

}


// ==========================================
// RENDER SALARY
// ==========================================

// ==========================================
// RENDER SALARY
// ==========================================

function renderSalary(salaries) {

    console.log(
        "RENDERING SALARY:",
        salaries
    );


    const latest =
        Array.isArray(salaries) &&
        salaries.length > 0
            ? salaries[0]
            : null;


    // ==========================================
    // NO PAYROLL
    // ==========================================

    if (!latest) {

        setSalaryText(
            "latestNetSalary",
            "₹0"
        );

        setSalaryText(
            "latestPaymentStatus",
            "No Payroll"
        );

        setSalaryText(
            "salaryPayMonth",
            "-"
        );

        setSalaryText(
            "salaryBasic",
            "₹0"
        );

        setSalaryText(
            "salaryAllowances",
            "₹0"
        );

        setSalaryText(
            "salaryDeductions",
            "₹0"
        );

        setSalaryText(
            "salaryNet",
            "₹0"
        );

        setSalaryText(
            "salaryStatus",
            "-"
        );

        renderSalaryHistory([]);

        return;
    }


    // ==========================================
    // BASIC
    // ==========================================

    const basic =
        Number(
            latest.basic_salary
        ) || 0;


    // ==========================================
    // ALLOWANCES
    // ==========================================

    const allowances =
        Number(
            latest.allowances
        ) || 0;


    // ==========================================
    // DEDUCTIONS
    // ==========================================

    const deductions =
        Number(
            latest.deductions
        ) || 0;


    // ==========================================
    // NET SALARY
    // ==========================================

    const databaseNet =
        Number(
            latest.net_salary
        );


    const calculatedNet =
        basic +
        allowances -
        deductions;


    const netSalary =
        Number.isFinite(databaseNet)
            ? databaseNet
            : calculatedNet;


    // ==========================================
    // LATEST SALARY
    // ==========================================

    setSalaryText(
        "latestNetSalary",
        formatCurrency(netSalary)
    );


    // ==========================================
    // PAYMENT STATUS
    // ==========================================

    setSalaryText(
        "latestPaymentStatus",
        formatPaymentStatus(
            latest.payment_status
        )
    );


    // ==========================================
    // PAY MONTH
    // ==========================================

    setSalaryText(
        "salaryPayMonth",
        formatPayMonth(
            latest.month,
            latest.year
        )
    );


    // ==========================================
    // BASIC SALARY
    // ==========================================

    setSalaryText(
        "salaryBasic",
        formatCurrency(basic)
    );


    // ==========================================
    // ALLOWANCES
    // ==========================================

    setSalaryText(
        "salaryAllowances",
        formatCurrency(allowances)
    );


    // ==========================================
    // DEDUCTIONS
    // ==========================================

    setSalaryText(
        "salaryDeductions",
        formatCurrency(deductions)
    );


    // ==========================================
    // NET SALARY
    // ==========================================

    setSalaryText(
        "salaryNet",
        formatCurrency(netSalary)
    );


    // ==========================================
    // STATUS
    // ==========================================

    setSalaryText(
        "salaryStatus",
        formatPaymentStatus(
            latest.payment_status
        )
    );


    // ==========================================
    // HISTORY
    // ==========================================

    renderSalaryHistory(
        salaries
    );

}


// ==========================================
// RENDER SALARY HISTORY
// ==========================================

function renderSalaryHistory(
    salaries
) {

    const container =
        document.getElementById(
            "salaryHistory"
        );


    if (!container) {
        return;
    }


    if (
        !Array.isArray(salaries) ||
        salaries.length === 0
    ) {

        container.innerHTML = `
            <div class="work-loading">
                No payroll records available.
            </div>
        `;

        return;

    }


    container.innerHTML =
        salaries.map(
            function (salary) {

                const basic =
                    Number(
                        salary.basic_salary
                    ) || 0;


                const allowances =
                    Number(
                        salary.allowances
                    ) || 0;


                const deductions =
                    Number(
                        salary.deductions
                    ) || 0;


                const net =
                    Number(
                        salary.net_salary
                    ) || 0;


                const paymentStatus =
                    String(
                        salary.payment_status ||
                        "pending"
                    )
                    .trim()
                    .toLowerCase();


                const statusClass =
                    paymentStatus === "paid"
                        ? "paid"
                        : "pending";


                return `

                    <div class="salary-history-item">

                        <div>

                            <strong>
                                ${escapeEmployeeHtml(
                                    formatPayMonth(
                                        salary.month,
                                        salary.year
                                    )
                                )}
                            </strong>

                            <span>

                                Basic:
                                ${formatCurrency(
                                    basic
                                )}

                                &nbsp; | &nbsp;

                                Allowances:
                                ${formatCurrency(
                                    allowances
                                )}

                                &nbsp; | &nbsp;

                                Deductions:
                                ${formatCurrency(
                                    deductions
                                )}

                            </span>

                        </div>


                        <div class="salary-history-right">

                            <strong>
                                ${formatCurrency(
                                    net
                                )}
                            </strong>


                            <span class="
                                salary-payment-status
                                ${statusClass}
                            ">

                                ${escapeEmployeeHtml(
                                    formatPaymentStatus(
                                        salary.payment_status
                                    )
                                )}

                            </span>

                        </div>

                    </div>

                `;

            }
        ).join("");

}


// ==========================================
// SALARY ERROR
// ==========================================

function renderSalaryError(
    message
) {

    setSalaryText(
        "latestNetSalary",
        "₹0"
    );


    setSalaryText(
        "latestPaymentStatus",
        "Unable to load"
    );


    setSalaryText(
        "salaryPayMonth",
        "-"
    );


    setSalaryText(
        "salaryBasic",
        "₹0"
    );


    setSalaryText(
        "salaryAllowances",
        "₹0"
    );


    setSalaryText(
        "salaryDeductions",
        "₹0"
    );


    setSalaryText(
        "salaryNet",
        "₹0"
    );


    setSalaryText(
        "salaryStatus",
        "Unable to load"
    );


    showSalaryError(
        message
    );

}


function showSalaryError(
    message
) {

    const history =
        document.getElementById(
            "salaryHistory"
        );


    if (!history) {
        return;
    }


    history.innerHTML = `

        <div class="dashboard-message error">

            ${escapeEmployeeHtml(
                message ||
                "Unable to load salary details."
            )}

        </div>

    `;

}


// ==========================================
// LOAD EMPLOYEE SUGGESTIONS
// ==========================================

async function loadEmployeeSuggestions() {

    const userId =
        getLoggedInUserId();


    if (!userId) {

        console.error(
            "Employee user ID not found."
        );

        showSuggestionMessage(
            "Employee session not found.",
            "error"
        );

        return;

    }


    const list =
        document.getElementById(
            "suggestionList"
        );


    if (list) {

        list.innerHTML = `
            <div class="work-loading">

                <i class="fa-solid fa-spinner fa-spin"></i>

                Loading suggestions...

            </div>
        `;

    }


    try {

        console.log(
            "LOADING ALL SUGGESTIONS..."
        );


        const response =
            await fetch(
                SUGGESTIONS_API_URL
            );


        const data =
            await response.json();


        console.log(
            "ALL SUGGESTIONS RESPONSE:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load suggestions."
            );

        }


        const allSuggestions =
            Array.isArray(
                data.suggestions
            )
                ? data.suggestions
                : [];


        /*
         * Backend /api/suggestions returns
         * all suggestions.
         *
         * Employee dashboard should show
         * only the logged-in employee's
         * suggestions.
         */

        const employeeSuggestions =
            allSuggestions.filter(
                function (item) {

                    return Number(
                        item.employee_id
                    ) === Number(
                        userId
                    );

                }
            );


        console.log(
            "EMPLOYEE SUGGESTIONS:",
            employeeSuggestions
        );


        renderSuggestions(
            employeeSuggestions
        );

    }
    catch (error) {

        console.error(
            "SUGGESTIONS LOAD ERROR:",
            error
        );


        const list =
            document.getElementById(
                "suggestionList"
            );


        if (list) {

            list.innerHTML = `

                <div class="dashboard-message error">

                    Unable to load suggestions.

                </div>

            `;

        }

    }

}


// ==========================================
// SUBMIT SUGGESTION
// ==========================================

async function submitEmployeeSuggestion() {

    const userId =
        getLoggedInUserId();


    const textarea =
        document.getElementById(
            "suggestionText"
        );


    const button =
        document.getElementById(
            "submitSuggestionBtn"
        );


    if (!userId) {

        showSuggestionMessage(
            "Employee session not found.",
            "error"
        );

        return;

    }


    const suggestion =
        textarea
            ? textarea.value.trim()
            : "";


    // ======================================
    // VALIDATION
    // ======================================

    if (!suggestion) {

        showSuggestionMessage(
            "Please enter your suggestion.",
            "error"
        );

        return;

    }


    try {

        // ==================================
        // BUTTON LOADING
        // ==================================

        if (button) {

            button.disabled = true;

            button.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Submitting...
            `;

        }


        /*
         * Backend expects:
         *
         * employee_id
         * title
         * description
         *
         * We use a fixed title because the
         * current HTML only has one textarea.
         */

        const response =
            await fetch(
                SUGGESTIONS_API_URL,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            employee_id:
                                Number(userId),

                            title:
                                "Employee Suggestion",

                            description:
                                suggestion

                        })

                }
            );


        const data =
            await response.json();


        console.log(
            "SUBMIT SUGGESTION RESPONSE:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to submit suggestion."
            );

        }


        // ==================================
        // CLEAR TEXTAREA
        // ==================================

        if (textarea) {

            textarea.value = "";

        }


        // ==================================
        // SUCCESS MESSAGE
        // ==================================

        showSuggestionMessage(
            data.message ||
            "Suggestion submitted successfully.",
            "success"
        );


        // ==================================
        // RELOAD SUGGESTIONS
        // ==================================

        await loadEmployeeSuggestions();

    }
    catch (error) {

        console.error(
            "SUGGESTION SUBMIT ERROR:",
            error
        );


        showSuggestionMessage(
            error.message ||
            "Unable to submit suggestion.",
            "error"
        );

    }
    finally {

        if (button) {

            button.disabled = false;

            button.innerHTML = `
                <i class="fa-solid fa-paper-plane"></i>
                Submit Suggestion
            `;

        }

    }

}


// ==========================================
// RENDER SUGGESTIONS
// ==========================================

function renderSuggestions(
    suggestions
) {

    const list =
        document.getElementById(
            "suggestionList"
        );


    if (!list) {
        return;
    }


    if (
        !Array.isArray(suggestions) ||
        suggestions.length === 0
    ) {

        list.innerHTML = `

            <div class="work-loading">

                No suggestions submitted yet.

            </div>

        `;

        return;

    }


    list.innerHTML =
        suggestions.map(
            function (item) {

                const status =
                    String(
                        item.status ||
                        "submitted"
                    )
                    .trim()
                    .toLowerCase();


                const statusText =
                    formatSuggestionStatus(
                        status
                    );


                return `

                    <div class="suggestion-item">

                        <div class="suggestion-content">

                            <strong>
                                ${escapeEmployeeHtml(
                                    item.title ||
                                    "Employee Suggestion"
                                )}
                            </strong>

                            <p>
                                ${escapeEmployeeHtml(
                                    item.description ||
                                    ""
                                )}
                            </p>

                            <small>

                                ${formatSuggestionDate(
                                    item.created_at
                                )}

                            </small>

                        </div>


                        <span class="
                            suggestion-status
                            ${escapeEmployeeHtml(
                                status
                            )}
                        ">

                            ${escapeEmployeeHtml(
                                statusText
                            )}

                        </span>

                    </div>

                `;

            }
        ).join("");

}


// ==========================================
// FORMAT SUGGESTION STATUS
// ==========================================

function formatSuggestionStatus(
    status
) {

    const value =
        String(
            status ||
            "submitted"
        )
        .trim()
        .toLowerCase();


    const statusMap = {

        submitted:
            "Submitted",

        reviewed:
            "Reviewed",

        implemented:
            "Implemented",

        rejected:
            "Rejected"

    };


    return (
        statusMap[value] ||
        capitalizeFirst(value)
    );

}


// ==========================================
// SUGGESTION MESSAGE
// ==========================================

function showSuggestionMessage(
    text,
    type = "info"
) {

    const message =
        document.getElementById(
            "suggestionMessage"
        );


    if (!message) {
        return;
    }


    message.textContent =
        text;


    message.className =
        `dashboard-message ${type}`;


    /*
     * Automatically clear normal
     * success/error messages.
     */

    setTimeout(
        function () {

            if (
                message.textContent === text
            ) {

                message.textContent =
                    "";

                message.className =
                    "dashboard-message";

            }

        },
        4000
    );

}


// ==========================================
// SET SALARY TEXT
// ==========================================

function setSalaryText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value ?? "-";

    }

}


// ==========================================
// CURRENCY
// ==========================================

function formatCurrency(
    value
) {

    const amount =
        Number(value) || 0;


    return amount.toLocaleString(
        "en-IN",
        {

            style: "currency",

            currency: "INR",

            maximumFractionDigits: 2

        }
    );

}


// ==========================================
// PAYMENT STATUS
// ==========================================

function formatPaymentStatus(
    status
) {

    const value =
        String(
            status ||
            "pending"
        )
        .trim()
        .toLowerCase();


    if (value === "paid") {

        return "Paid";

    }


    if (value === "pending") {

        return "Pending";

    }


    return capitalizeFirst(
        value
    );

}


// ==========================================
// PAY MONTH
// ==========================================

function formatPayMonth(
    month,
    year
) {

    const m =
        Number(month);


    const y =
        Number(year);


    if (
        !m ||
        !y ||
        m < 1 ||
        m > 12
    ) {

        return "-";

    }


    const date =
        new Date(
            y,
            m - 1,
            1
        );


    return date.toLocaleDateString(
        "en-IN",
        {

            month: "long",

            year: "numeric"

        }
    );

}


// ==========================================
// SUGGESTION DATE
// ==========================================

function formatSuggestionDate(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

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
// CAPITALIZE
// ==========================================

function capitalizeFirst(
    value
) {

    const text =
        String(
            value || ""
        );


    if (!text) {
        return "";
    }


    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );

}


// ==========================================
// HTML ESCAPE
// ==========================================

function escapeEmployeeHtml(
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


// ==========================================
// INITIALIZE SALARY + SUGGESTIONS
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "SALARY + SUGGESTIONS INITIALIZATION"
        );


        console.log(
            "CURRENT USER:",
            currentUser
        );


        if (
            !currentUser ||
            !currentUser.id
        ) {

            console.error(
                "Employee user ID not available."
            );

            return;

        }


        // ==================================
        // LOAD SALARY
        // ==================================

        loadEmployeeSalary();


        // ==================================
        // LOAD SUGGESTIONS
        // ==================================

        loadEmployeeSuggestions();


        // ==================================
        // SUBMIT BUTTON
        // ==================================

        const submitButton =
            document.getElementById(
                "submitSuggestionBtn"
            );


        if (submitButton) {

            submitButton.addEventListener(
                "click",
                submitEmployeeSuggestion
            );

        }

    }
);