
// =====================================================
// SmartHR - EMPLOYEE MY WORK
// =====================================================


// =====================================================
// API
// =====================================================

const WORK_API =
    "https://smarthrmanagement-backend.onrender.com/api/work";

const DASHBOARD_API =
    "https://smarthrmanagement-backend.onrender.com/api/employee-dashboard";


// =====================================================
// GET LOGGED-IN USER
// =====================================================

function getLoggedInUser() {

    const storedUser =
        localStorage.getItem("smartHRUser");

    console.log(
        "SMART HR STORED USER:",
        storedUser
    );


    if (!storedUser) {

        return null;

    }


    try {

        return JSON.parse(
            storedUser
        );

    } catch (error) {

        console.error(
            "SMART HR USER PARSE ERROR:",
            error
        );

        return null;

    }

}


const currentUser =
    getLoggedInUser();


// =====================================================
// GET USER ID
// =====================================================

function getUserId() {

    if (!currentUser) {

        return null;

    }


    /*
       Different login systems sometimes store
       the ID using different property names.
    */

    const possibleIds = [

        currentUser.id,

        currentUser.user_id,

        currentUser.userId,

        currentUser.userid

    ];


    for (
        const id of possibleIds
    ) {

        if (
            id !== undefined &&
            id !== null &&
            String(id).trim() !== ""
        ) {

            return Number(id);

        }

    }


    return null;

}


const userId =
    getUserId();


console.log(
    "MY WORK USER ID:",
    userId
);


// =====================================================
// BASIC ELEMENTS
// =====================================================

const employeeName =
    document.getElementById(
        "employeeName"
    );

const employeeCode =
    document.getElementById(
        "employeeCode"
    );

const taskList =
    document.getElementById(
        "taskList"
    );

const loadingBox =
    document.getElementById(
        "loadingBox"
    );

const emptyBox =
    document.getElementById(
        "emptyBox"
    );

const workMessage =
    document.getElementById(
        "workMessage"
    );


// =====================================================
// MESSAGE
// =====================================================

function showMessage(
    message,
    type = "info"
) {

    if (!workMessage) {

        return;

    }


    workMessage.textContent =
        message;

    workMessage.className =
        "work-message " +
        type;

}


// =====================================================
// SET TEXT
// =====================================================

function setText(
    id,
    value
) {

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

function formatDate(
    dateValue
) {

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
// FORMAT DATE TIME
// =====================================================

function formatDateTime(
    dateValue
) {

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


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// =====================================================
// CAPITALIZE
// =====================================================

function capitalize(
    value
) {

    if (!value) {

        return "";

    }


    return value
        .replace(
            /_/g,
            " "
        )
        .replace(
            /\b\w/g,
            function (letter) {

                return letter.toUpperCase();

            }
        );

}


// =====================================================
// LOAD EMPLOYEE DETAILS
// =====================================================

async function loadEmployeeDetails() {

    if (!userId) {

        return;

    }


    try {

        const response =
            await fetch(
                DASHBOARD_API +
                "/" +
                userId
            );


        const data =
            await response.json();


        console.log(
            "EMPLOYEE DATA:",
            data
        );


        if (
            !response.ok ||
            !data.success ||
            !data.employee
        ) {

            return;

        }


        const employee =
            data.employee;


        const fullName =
            (
                employee.first_name ||
                ""
            ) +
            " " +
            (
                employee.last_name ||
                ""
            );


        setText(
            "employeeName",
            fullName.trim() ||
            employee.username ||
            "Employee"
        );


        setText(
            "employeeCode",
            employee.employee_code ||
            "Employee"
        );


    } catch (error) {

        console.error(
            "EMPLOYEE DETAILS ERROR:",
            error
        );

    }

}


// =====================================================
// RESET TASK AREA
// =====================================================

function showLoading() {

    if (loadingBox) {

        loadingBox.style.display =
            "flex";

    }


    if (emptyBox) {

        emptyBox.style.display =
            "none";

    }


    if (taskList) {

        taskList.innerHTML =
            "";

    }

}


function showEmpty() {

    if (loadingBox) {

        loadingBox.style.display =
            "none";

    }


    if (emptyBox) {

        emptyBox.style.display =
            "flex";

    }


    if (taskList) {

        taskList.innerHTML =
            "";

    }

}


function hideLoading() {

    if (loadingBox) {

        loadingBox.style.display =
            "none";

    }


    if (emptyBox) {

        emptyBox.style.display =
            "none";

    }

}


// =====================================================
// LOAD MY WORK
// =====================================================

async function loadMyWork() {

    showLoading();

    showMessage(
        "",
        "info"
    );


    if (!userId) {

        hideLoading();


        showMessage(
            "User ID not found. Please login again.",
            "error"
        );


        showEmpty();


        console.error(
            "LOGIN DATA:",
            currentUser
        );


        return;

    }


    try {

        const response =
            await fetch(
                WORK_API +
                "/my/" +
                userId
            );


        const data =
            await response.json();


        console.log(
            "MY WORK RESPONSE:",
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


        updateStats(
            tasks
        );


        hideLoading();


        if (
            tasks.length === 0
        ) {

            showEmpty();

            return;

        }


        renderTasks(
            tasks
        );


    } catch (error) {

        console.error(
            "MY WORK ERROR:",
            error
        );


        hideLoading();


        showMessage(
            error.message ||
            "Unable to load your tasks.",
            "error"
        );


        showEmpty();

    }

}


// =====================================================
// UPDATE STATS
// =====================================================

function updateStats(
    tasks
) {

    const total =
        tasks.length;


    const pending =
        tasks.filter(
            function (task) {

                return (
                    String(
                        task.status
                    ).toLowerCase() ===
                    "pending"
                );

            }
        ).length;


    const inProgress =
        tasks.filter(
            function (task) {

                return (
                    String(
                        task.status
                    ).toLowerCase() ===
                    "in_progress"
                );

            }
        ).length;


    const completed =
        tasks.filter(
            function (task) {

                return (
                    String(
                        task.status
                    ).toLowerCase() ===
                    "completed"
                );

            }
        ).length;


    setText(
        "totalTasks",
        total
    );


    setText(
        "pendingTasks",
        pending
    );


    setText(
        "progressTasks",
        inProgress
    );


    setText(
        "completedTasks",
        completed
    );

}


// =====================================================
// RENDER TASKS
// =====================================================

function renderTasks(
    tasks
) {

    if (!taskList) {

        return;

    }


    taskList.innerHTML =
        "";


    tasks.forEach(
        function (task) {

            const taskElement =
                createTaskElement(
                    task
                );


            taskList.appendChild(
                taskElement
            );

        }
    );

}


// =====================================================
// CREATE TASK ELEMENT
// =====================================================

function createTaskElement(
    task
) {

    const item =
        document.createElement(
            "div"
        );


    item.className =
        "task-item";


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


    const statusClass =
        status === "in_progress"
            ? "in-progress"
            : status;


    item.innerHTML = `

        <div class="task-top">

            <div>

                <div class="task-title">
                    ${escapeHtml(
                        task.title ||
                        "Untitled Task"
                    )}
                </div>

                <div class="task-description">

                    ${escapeHtml(
                        task.description ||
                        "No description provided."
                    )}

                </div>

            </div>


            <div class="task-badges">

                <span class="badge ${statusClass}">

                    <i class="fa-solid fa-circle"></i>

                    ${escapeHtml(
                        capitalize(status)
                    )}

                </span>


                <span class="badge ${priority}">

                    <i class="fa-solid fa-flag"></i>

                    ${escapeHtml(
                        capitalize(priority)
                    )}

                </span>

            </div>

        </div>


        <div class="task-details">

            <div class="task-detail">

                <span>
                    Due Date
                </span>

                <strong>
                    ${escapeHtml(
                        formatDate(
                            task.due_date
                        )
                    )}
                </strong>

            </div>


            <div class="task-detail">

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


            <div class="task-detail">

                <span>
                    Completed
                </span>

                <strong>
                    ${escapeHtml(
                        formatDateTime(
                            task.completed_at
                        )
                    )}
                </strong>

            </div>

        </div>


        <div class="task-action">

            <select
                class="status-select"
                data-task-id="${task.id}">

                <option
                    value="pending"
                    ${
                        status === "pending"
                            ? "selected"
                            : ""
                    }>
                    Pending
                </option>

                <option
                    value="in_progress"
                    ${
                        status === "in_progress"
                            ? "selected"
                            : ""
                    }>
                    In Progress
                </option>

                <option
                    value="completed"
                    ${
                        status === "completed"
                            ? "selected"
                            : ""
                    }>
                    Completed
                </option>

            </select>


            <button
                type="button"
                class="update-btn"
                data-task-id="${task.id}">

                Update Status

            </button>

        </div>

    `;


    const updateButton =
        item.querySelector(
            ".update-btn"
        );


    const select =
        item.querySelector(
            ".status-select"
        );


    if (updateButton) {

        updateButton.addEventListener(
            "click",
            function () {

                
               const taskId =
    Number(task.id);

if (
    !Number.isInteger(taskId) ||
    taskId <= 0
) {

    showMessage(
        "Invalid task ID. Please refresh the page.",
        "error"
    );

    return;

}

updateTaskStatus(
    taskId,
    select.value,
    updateButton
);

            }
        );

    }


    return item;

}


// =====================================================
// UPDATE TASK STATUS
// =====================================================

async function updateTaskStatus(
    taskId,
    status,
    button
) {

    if (!userId) {

        showMessage(
            "User ID not found. Please login again.",
            "error"
        );

        return;

    }


    try {

        button.disabled =
            true;

        button.textContent =
            "Updating...";


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
                                userId,

                            status:
                                status

                        })

                }
            );


        const data =
            await response.json();


        console.log(
            "TASK UPDATE RESPONSE:",
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
            "Task status updated successfully.",
            "success"
        );


        await loadMyWork();


    } catch (error) {

        console.error(
            "TASK UPDATE ERROR:",
            error
        );


        showMessage(
            error.message ||
            "Unable to update task.",
            "error"
        );


        button.disabled =
            false;

        button.textContent =
            "Update Status";

    }

}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}


// =====================================================
// BACK TO DASHBOARD
// =====================================================

const backDashboard =
    document.getElementById(
        "backDashboard"
    );


if (backDashboard) {

    backDashboard.addEventListener(
        "click",
        function () {

            window.location.href =
                "employee.html";

        }
    );

}


// =====================================================
// REFRESH
// =====================================================

const refreshTasks =
    document.getElementById(
        "refreshTasks"
    );


if (refreshTasks) {

    refreshTasks.addEventListener(
        "click",
        async function () {

            refreshTasks.disabled =
                true;


            refreshTasks.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';


            await loadMyWork();


            refreshTasks.disabled =
                false;


            refreshTasks.innerHTML =
                '<i class="fa-solid fa-rotate"></i> Refresh';

        }
    );

}


// =====================================================
// START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "SMART HR USER:",
            currentUser
        );


        console.log(
            "SMART HR USER ID:",
            userId
        );


        if (!currentUser || !userId) {

            hideLoading();


            showMessage(
                "User ID not found. Please login again.",
                "error"
            );


            showEmpty();


            return;

        }


        await loadEmployeeDetails();

        await loadMyWork();

    }
);

