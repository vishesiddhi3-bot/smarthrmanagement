// =====================================================
// SmartHR - HR ASSIGN TASK
// =====================================================

const WORK_API =
    "https://smarthrmanagement-backend.onrender.com
/api/work";


// =====================================================
// ELEMENTS
// =====================================================

const employeeSelect =
    document.getElementById("employee");

const employeeInfo =
    document.getElementById("employeeInfo");

const employeePreview =
    document.getElementById("employeePreview");

const taskForm =
    document.getElementById("taskForm");

const assignBtn =
    document.getElementById("assignBtn");

const taskList =
    document.getElementById("taskList");

const refreshBtn =
    document.getElementById("refreshBtn");


// =====================================================
// MESSAGE
// =====================================================

function showMessage(
    text,
    type = "info"
) {

    const message =
        document.getElementById("message");

    if (!message) {
        return;
    }

    message.textContent =
        text;

    message.className =
        "message " + type;


    setTimeout(
        () => {

            message.textContent = "";

            message.className =
                "message";

        },
        4000
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
// FORMAT DATE
// =====================================================

function formatDate(value) {

    if (!value) {
        return "No due date";
    }

    const date =
        new Date(value + "T00:00:00");

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


// =====================================================
// FORMAT DATETIME
// =====================================================

function formatDateTime(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(
            value
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

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
// LOAD EMPLOYEES
// =====================================================

async function loadEmployees() {

    try {

        employeeSelect.innerHTML =
            `
            <option value="">
                Loading employees...
            </option>
            `;


        const response =
            await fetch(
                WORK_API +
                "/employees"
            );


        const data =
            await response.json();


        console.log(
            "TASK EMPLOYEES:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load employees."
            );

        }


        employeeSelect.innerHTML =
            `
            <option value="">
                Select Employee
            </option>
            `;


        if (
            !data.employees ||
            data.employees.length === 0
        ) {

            employeeSelect.innerHTML =
                `
                <option value="">
                    No active employees found
                </option>
                `;

            return;

        }


        data.employees.forEach(
            function (employee) {

                const option =
                    document.createElement(
                        "option"
                    );

option.value =
    String(Number(employee.id));


                option.textContent =
                    (
                        employee.first_name +
                        " " +
                        (
                            employee.last_name || ""
                        )
                    ).trim() +
                    " — " +
                    (
                        employee.employee_code ||
                        "No ID"
                    );


                option.dataset.name =
                    (
                        employee.first_name +
                        " " +
                        (
                            employee.last_name || ""
                        )
                    ).trim();


                option.dataset.code =
                    employee.employee_code ||
                    "-";


                option.dataset.department =
                    employee.department ||
                    "-";


                option.dataset.designation =
                    employee.designation ||
                    "-";


                employeeSelect.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "LOAD EMPLOYEES ERROR:",
            error
        );


        employeeSelect.innerHTML =
            `
            <option value="">
                Unable to load employees
            </option>
            `;


        showMessage(
            error.message ||
            "Unable to load employees.",
            "error"
        );

    }

}


// =====================================================
// EMPLOYEE SELECT CHANGE
// =====================================================

employeeSelect.addEventListener(
    "change",
    function () {

        const option =
            employeeSelect.options[
                employeeSelect.selectedIndex
            ];


        if (
            !employeeSelect.value ||
            !option
        ) {

            employeeInfo.textContent =
                "Select an employee to view details.";


            employeePreview.className =
                "employee-preview empty";


            employeePreview.innerHTML =
                `
                <div class="preview-icon">
                    <i class="fa-solid fa-user"></i>
                </div>

                <h3>
                    No Employee Selected
                </h3>

                <p>
                    Select an employee from the form
                    to see their details here.
                </p>
                `;

            return;

        }


        const name =
            option.dataset.name ||
            "Employee";

        const code =
            option.dataset.code ||
            "-";

        const department =
            option.dataset.department ||
            "-";

        const designation =
            option.dataset.designation ||
            "-";


        employeeInfo.textContent =
            name +
            " • " +
            department;


        employeePreview.className =
            "employee-preview selected";


        employeePreview.innerHTML =
            `
            <div class="preview-profile">

                <div class="preview-icon">
                    <i class="fa-solid fa-user"></i>
                </div>

                <div>

                    <div class="preview-name">
                        ${escapeHtml(name)}
                    </div>

                    <div class="preview-code">
                        ${escapeHtml(code)}
                    </div>

                </div>

            </div>


            <div class="preview-details">

                <div class="preview-detail">

                    <span>Department</span>

                    <strong>
                        ${escapeHtml(department)}
                    </strong>

                </div>


                <div class="preview-detail">

                    <span>Designation</span>

                    <strong>
                        ${escapeHtml(designation)}
                    </strong>

                </div>


                <div class="preview-detail">

                    <span>Employee ID</span>

                    <strong>
                        ${escapeHtml(code)}
                    </strong>

                </div>

            </div>
            `;

    }
);


// =====================================================
// ASSIGN TASK
// =====================================================

taskForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const employeeId =
            employeeSelect.value;

        const title =
            document.getElementById(
                "title"
            ).value.trim();

        const description =
            document.getElementById(
                "description"
            ).value.trim();

        const priority =
            document.getElementById(
                "priority"
            ).value;

        const dueDate =
            document.getElementById(
                "dueDate"
            ).value;


        if (!employeeId) {

            showMessage(
                "Please select an employee.",
                "error"
            );

            employeeSelect.focus();

            return;

        }


        if (!title) {

            showMessage(
                "Please enter a task title.",
                "error"
            );

            document
                .getElementById("title")
                .focus();

            return;

        }


        try {

            assignBtn.disabled =
                true;


            assignBtn.innerHTML =
                `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Assigning...
                `;


            const response =
                await fetch(
                    WORK_API +
                    "/assign",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                employee_id:
                                    Number(
                                        employeeId
                                    ),

                                title:
                                    title,

                                description:
                                    description,

                                priority:
                                    priority,

                                due_date:
                                    dueDate ||
                                    null

                            })

                    }
                );


            const data =
                await response.json();


            console.log(
                "ASSIGN TASK RESPONSE:",
                data
            );


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Unable to assign task."
                );

            }


            showMessage(
                "Task assigned successfully!",
                "success"
            );


            // Reset form

            taskForm.reset();


            employeeInfo.textContent =
                "Select an employee to view details.";


            employeePreview.className =
                "employee-preview empty";


            employeePreview.innerHTML =
                `
                <div class="preview-icon">
                    <i class="fa-solid fa-user"></i>
                </div>

                <h3>
                    No Employee Selected
                </h3>

                <p>
                    Select an employee from the form
                    to see their details here.
                </p>
                `;


            // Reload task list

            await loadTasks();


        } catch (error) {

            console.error(
                "ASSIGN TASK ERROR:",
                error
            );


            showMessage(
                error.message ||
                "Unable to assign task.",
                "error"
            );

        } finally {

            assignBtn.disabled =
                false;

            assignBtn.innerHTML =
                `
                <i class="fa-solid fa-paper-plane"></i>
                Assign Task
                `;

        }

    }
);


// =====================================================
// LOAD ALL TASKS
// =====================================================

async function loadTasks() {

    taskList.innerHTML =
        `
        <div class="loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            Loading tasks...

        </div>
        `;


    try {

        const response =
            await fetch(
                WORK_API
            );


        const data =
            await response.json();


        console.log(
            "ALL TASKS:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load tasks."
            );

        }


        const tasks =
            data.tasks || [];


        updateTaskStats(
            tasks
        );


        renderTasks(
            tasks
        );


    } catch (error) {

        console.error(
            "LOAD TASKS ERROR:",
            error
        );


        taskList.innerHTML =
            `
            <div class="empty-state">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <br><br>

                ${escapeHtml(
                    error.message ||
                    "Unable to load tasks."
                )}

            </div>
            `;

    }

}


// =====================================================
// TASK STATS
// =====================================================

function updateTaskStats(tasks) {

    const total =
        tasks.length;


    const pending =
        tasks.filter(
            task =>
                task.status === "pending"
        ).length;


    const progress =
        tasks.filter(
            task =>
                task.status === "in_progress"
        ).length;


    const completed =
        tasks.filter(
            task =>
                task.status === "completed"
        ).length;


    document.getElementById(
        "totalCount"
    ).textContent =
        total;


    document.getElementById(
        "pendingCount"
    ).textContent =
        pending;


    document.getElementById(
        "progressCount"
    ).textContent =
        progress;


    document.getElementById(
        "completedCount"
    ).textContent =
        completed;

}


// =====================================================
// RENDER TASKS
// =====================================================

function renderTasks(tasks) {

    if (
        !tasks ||
        tasks.length === 0
    ) {

        taskList.innerHTML =
            `
            <div class="empty-state">

                <i class="fa-solid fa-clipboard-check"></i>

                <br><br>

                No tasks assigned yet.

            </div>
            `;

        return;

    }


    taskList.innerHTML =
        tasks.map(
            function (task) {

                const employeeName =
                    (
                        task.first_name +
                        " " +
                        (
                            task.last_name || ""
                        )
                    ).trim();


                const statusText =
                    task.status === "in_progress"
                        ? "In Progress"
                        : capitalize(
                            task.status
                        );


                return `

                <div class="task-item">

                    <div class="task-top">

                        <div class="task-title">

                            ${escapeHtml(
                                task.title
                            )}

                        </div>

                    </div>


                    <div class="task-employee">

                        <i class="fa-solid fa-user"></i>

                        ${escapeHtml(
                            employeeName
                        )}

                        ${
                            task.employee_code
                                ? " • " +
                                  escapeHtml(
                                      task.employee_code
                                  )
                                : ""
                        }

                    </div>


                    ${
                        task.description
                            ? `
                            <div class="task-description">

                                ${escapeHtml(
                                    task.description
                                )}

                            </div>
                            `
                            : ""
                    }


                    <div class="task-meta">

                        <span
                            class="
                                badge
                                priority-${escapeHtml(
                                    task.priority
                                )}
                            ">

                            ${escapeHtml(
                                task.priority
                            )}

                        </span>


                        <span
                            class="
                                badge
                                status-${escapeHtml(
                                    task.status
                                )}
                            ">

                            ${escapeHtml(
                                statusText
                            )}

                        </span>

                    </div>


                    <div class="task-date">

                        <i class="fa-solid fa-calendar"></i>

                        Due:
                        ${escapeHtml(
                            formatDate(
                                task.due_date
                            )
                        )}

                        &nbsp;&nbsp;

                        <i class="fa-solid fa-clock"></i>

                        Assigned:
                        ${escapeHtml(
                            formatDateTime(
                                task.assigned_at
                            )
                        )}

                    </div>

                </div>

                `;

            }
        ).join("");

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
// REFRESH
// =====================================================

refreshBtn.addEventListener(
    "click",
    async function () {

        refreshBtn.disabled =
            true;

        refreshBtn.innerHTML =
            `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading
            `;


        await loadTasks();


        refreshBtn.disabled =
            false;

        refreshBtn.innerHTML =
            `
            <i class="fa-solid fa-rotate"></i>
            Refresh
            `;

    }
);


// =====================================================
// BACK
// =====================================================

function goBack() {

    window.history.back();

}


// =====================================================
// START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        await loadEmployees();

        await loadTasks();

    }
);