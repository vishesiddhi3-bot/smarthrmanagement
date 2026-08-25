// ==========================================
// SmartHR - DEPARTMENTS FRONTEND
// ==========================================

const API_URL =
    "http://localhost:5000/api/departments";


// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadDepartments();

        setupDepartmentForm();

    }
);


// ==========================================
// LOAD DEPARTMENTS
// ==========================================

async function loadDepartments() {

    const container =
        document.getElementById(
            "departmentList"
        );


    if (!container) return;


    container.innerHTML = `
        <div class="loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading departments...
        </div>
    `;


    try {

        const response =
            await fetch(API_URL);


        const text =
            await response.text();


        let data;


        try {

            data = JSON.parse(text);

        }
        catch (jsonError) {

            throw new Error(
                "Backend did not return JSON. Please make sure SmartHR server is running on port 5000."
            );

        }


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load departments"
            );

        }


        const departments =
            Array.isArray(
                data.departments
            )
                ? data.departments
                : [];


        updateStatistics(
            departments
        );


        renderDepartments(
            departments
        );


        // Load employees after cards are created
        await loadDepartmentEmployees();


    }
    catch (error) {

        console.error(
            "DEPARTMENT LOAD ERROR:",
            error
        );


        container.innerHTML = `

            <div class="loading">

                <i class="fa-solid fa-circle-exclamation"></i>

                <br><br>

                ${escapeHtml(
                    error.message
                )}

            </div>

        `;

    }

}


// ==========================================
// STATISTICS
// ==========================================

function updateStatistics(
    departments
) {

    setText(
        "totalDepartments",
        departments.length
    );


    let totalEmployees = 0;

    let totalManagers = 0;


    departments.forEach(
        department => {

            totalEmployees +=
                Number(
                    department.employee_count || 0
                );


            if (
                department.manager
            ) {

                totalManagers++;

            }

        }
    );


    setText(
        "totalEmployees",
        totalEmployees
    );


    setText(
        "totalManagers",
        totalManagers
    );

}


// ==========================================
// RENDER DEPARTMENTS
// ==========================================

function renderDepartments(
    departments
) {

    const container =
        document.getElementById(
            "departmentList"
        );


    if (!departments.length) {

        container.innerHTML = `

            <div class="loading">

                <i class="fa-solid fa-building"></i>

                <br><br>

                No departments found.

            </div>

        `;

        return;

    }


    container.innerHTML =
        departments
            .map(
                department =>
                    createDepartmentCard(
                        department
                    )
            )
            .join("");

}


// ==========================================
// DEPARTMENT CARD
// ==========================================

function createDepartmentCard(
    department
) {

    const manager =
        department.manager;


    const managerName =
        manager
            ? `${manager.first_name || ""} ${
                manager.last_name || ""
              }`.trim()
            : "Manager not assigned";


    const managerInitials =
        manager
            ? getInitials(
                manager.first_name,
                manager.last_name
            )
            : "NA";


    return `

        <div class="department-card">

            <div class="department-top">

                <div class="department-title">

                    <div class="department-icon">

                        <i class="fa-solid fa-building"></i>

                    </div>

                    <div>

                        <h3>
                            ${escapeHtml(
                                department.name
                            )}
                        </h3>

                        <p>
                            ${escapeHtml(
                                department.description ||
                                "No description"
                            )}
                        </p>

                    </div>

                </div>


                <div class="employee-count">

                    ${Number(
                        department.employee_count || 0
                    )}

                    Employees

                </div>

            </div>


            <!-- MANAGER -->

            <div class="manager-box">

                <div class="manager-label">

                    Department Manager

                </div>


                <div class="manager-info">

                    <div class="manager-avatar">

                        ${escapeHtml(
                            managerInitials
                        )}

                    </div>


                    <div class="manager-details">

                        <div class="manager-name">

                            ${escapeHtml(
                                managerName
                            )}

                        </div>

                        <span class="manager-role">

                            ${
                                manager
                                    ? escapeHtml(
                                        manager.designation ||
                                        "Manager"
                                    )
                                    : "No manager assigned"
                            }

                        </span>

                    </div>

                </div>


                <div class="manager-actions">

                    <button
                        class="assign-manager-btn"
                        onclick="openManagerSelector(${department.id})"
                    >

                        <i class="fa-solid fa-user-tie"></i>

                        ${
                            manager
                                ? "Change Manager"
                                : "Assign Manager"
                        }

                    </button>


                    ${
                        manager
                            ? `
                                <button
                                    class="remove-manager-btn"
                                    onclick="removeManager(${department.id})"
                                >

                                    <i class="fa-solid fa-user-minus"></i>

                                    Remove

                                </button>
                              `
                            : ""
                    }

                </div>


                <div
                    id="managerSelector-${department.id}"
                    class="manager-selector"
                    style="display:none;"
                >

                    <select
                        id="managerSelect-${department.id}"
                    >

                        <option value="">
                            Select employee as manager
                        </option>

                    </select>


                    <div class="selector-actions">

                        <button
                            type="button"
                            onclick="saveManager(${department.id})"
                            class="save-manager-btn"
                        >
                            Save
                        </button>

                        <button
                            type="button"
                            onclick="closeManagerSelector(${department.id})"
                            class="cancel-manager-btn"
                        >
                            Cancel
                        </button>

                    </div>

                </div>

            </div>


            <!-- EMPLOYEES -->

            <div
                class="employee-section"
                data-department-id="${department.id}"
            >

                <h4>

                    Employees

                </h4>


                <div class="employee-list">

                    <div class="empty-employees">

                        Loading employees...

                    </div>

                </div>

            </div>


        </div>

    `;

}


// ==========================================
// LOAD EMPLOYEES
// ==========================================

async function loadDepartmentEmployees() {

    const sections =
        document.querySelectorAll(
            ".employee-section"
        );


    for (
        const section of sections
    ) {

        const departmentId =
            section.dataset.departmentId;


        const employeeList =
            section.querySelector(
                ".employee-list"
            );


        try {

            const response =
                await fetch(
                    `${API_URL}/${departmentId}/employees`
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load employees"
                );

            }


           const employees =
    Array.isArray(data.employees)
        ? data.employees
        : [];

renderEmployeeList(
    employeeList,
    employees
);
        }
        catch (error) {

            console.error(
                "EMPLOYEE LOAD ERROR:",
                error
            );


            employeeList.innerHTML = `

                <div class="empty-employees">

                    Unable to load employees.

                </div>

            `;

        }

    }

}


// ==========================================
// EMPLOYEE LIST
// ==========================================

function renderEmployeeList(
    container,
    employees
) {

    if (!employees.length) {

        container.innerHTML = `

            <div class="empty-employees">

                No employees assigned.

            </div>

        `;

        return;

    }


    container.innerHTML =
        employees
            .map(
                employee => {

                    const name =
                        `${employee.first_name || ""} ${
                            employee.last_name || ""
                        }`.trim();


                    return `

                        <div class="employee-row">

                            <div class="employee-person">

                                <div class="employee-avatar">

                                    ${escapeHtml(
                                        getInitials(
                                            employee.first_name,
                                            employee.last_name
                                        )
                                    )}

                                </div>


                                <div>

                                    <div class="employee-name">

                                        ${escapeHtml(
                                            name ||
                                            "Unknown Employee"
                                        )}

                                    </div>


                                    <span class="employee-code">

                                        ${escapeHtml(
                                            employee.employee_code ||
                                            ""
                                        )}

                                    </span>

                                </div>

                            </div>


                            <div class="employee-position">

                                ${escapeHtml(
                                    employee.designation ||
                                    "Employee"
                                )}

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


// ==========================================
// OPEN MANAGER SELECTOR
// ==========================================


async function openManagerSelector(departmentId) {

    const box = document.getElementById(
        `managerSelector-${departmentId}`
    );

    const select = document.getElementById(
        `managerSelect-${departmentId}`
    );

    if (!box || !select) return;

    box.style.display = "block";

    select.innerHTML = `
        <option value="">
            Loading managers...
        </option>
    `;

    try {

        const response = await fetch(
            `${API_URL}/${departmentId}/manager-options`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to load managers"
            );
        }

        // Backend se ONLY managers lene hain
        const managers = Array.isArray(data.managers)
            ? data.managers
            : [];

        if (!managers.length) {

            select.innerHTML = `
                <option value="">
                    No managers available
                </option>
            `;

            return;
        }

        select.innerHTML = `
            <option value="">
                Select Manager
            </option>

            ${
                managers.map(manager => {

                    const fullName =
                        `${manager.first_name || ""} ${
                            manager.last_name || ""
                        }`.trim();

                    return `
                        <option value="${manager.id}">
                            ${escapeHtml(
                                fullName || "Unknown Manager"
                            )}
                            -
                            ${escapeHtml(
                                manager.designation ||
                                manager.role ||
                                "Manager"
                            )}
                        </option>
                    `;

                }).join("")
            }
        `;

    }
    catch (error) {

        console.error(
            "MANAGER OPTIONS ERROR:",
            error
        );

        select.innerHTML = `
            <option value="">
                Unable to load managers
            </option>
        `;

    }

}


// ==========================================
// SAVE MANAGER
// ==========================================

async function saveManager(
    departmentId
) {

    const select =
        document.getElementById(
            `managerSelect-${departmentId}`
        );


    if (!select) return;


    const managerId =
        Number(select.value);


    if (!managerId) {

        alert(
            "Please select an employee as manager."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/${departmentId}/manager`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            manager_id:
                                managerId
                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to assign manager"
            );

        }


        alert(
            "Manager assigned successfully."
        );


        closeManagerSelector(
            departmentId
        );


        await loadDepartments();

    }
    catch (error) {

        console.error(
            "SAVE MANAGER ERROR:",
            error
        );


        alert(
            error.message
        );

    }

}


// ==========================================
// REMOVE MANAGER
// ==========================================

async function removeManager(
    departmentId
) {

    const confirmed =
        confirm(
            "Are you sure you want to remove this department manager?"
        );


    if (!confirmed) return;


    try {

        const response =
            await fetch(
                `${API_URL}/${departmentId}/manager`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to remove manager"
            );

        }


        alert(
            "Manager removed successfully."
        );


        await loadDepartments();

    }
    catch (error) {

        console.error(
            "REMOVE MANAGER ERROR:",
            error
        );


        alert(
            error.message
        );

    }

}


// ==========================================
// CLOSE MANAGER SELECTOR
// ==========================================

function closeManagerSelector(
    departmentId
) {

    const box =
        document.getElementById(
            `managerSelector-${departmentId}`
        );


    if (box) {

        box.style.display =
            "none";

    }

}


// ==========================================
// FORM
// ==========================================

function setupDepartmentForm() {

    const form =
        document.getElementById(
            "departmentForm"
        );


    if (!form) return;


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const name =
                document
                    .getElementById(
                        "departmentName"
                    )
                    .value
                    .trim();


            const description =
                document
                    .getElementById(
                        "departmentDescription"
                    )
                    .value
                    .trim();


            if (!name) {

                showFormMessage(
                    "Department name is required.",
                    true
                );

                return;

            }


            try {

                const response =
                    await fetch(
                        API_URL,
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    name,
                                    description
                                })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to create department"
                    );

                }


                showFormMessage(
                    "Department created successfully."
                );


                form.reset();


                setTimeout(
                    async () => {

                        closeDepartmentForm();

                        await loadDepartments();

                    },
                    500
                );

            }
            catch (error) {

                console.error(
                    "CREATE DEPARTMENT ERROR:",
                    error
                );


                showFormMessage(
                    error.message,
                    true
                );

            }

        }
    );

}


// ==========================================
// OPEN FORM
// ==========================================

function openDepartmentForm() {

    const card =
        document.getElementById(
            "departmentFormCard"
        );


    if (card) {

        card.style.display =
            "block";


        card.scrollIntoView({
            behavior: "smooth"
        });

    }

}


// ==========================================
// CLOSE FORM
// ==========================================

function closeDepartmentForm() {

    const card =
        document.getElementById(
            "departmentFormCard"
        );


    if (card) {

        card.style.display =
            "none";

    }

}


// ==========================================
// FORM MESSAGE
// ==========================================

function showFormMessage(
    message,
    error = false
) {

    const element =
        document.getElementById(
            "formMessage"
        );


    if (!element) return;


    element.textContent =
        message;


    element.style.color =
        error
            ? "#dc2626"
            : "#16a34a";

}


// ==========================================
// BACK
// ==========================================

function goBack() {

    window.location.href =
        "admin.html";

}


// ==========================================
// SET TEXT
// ==========================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


// ==========================================
// INITIALS
// ==========================================

function getInitials(
    firstName,
    lastName
) {

    const first =
        String(
            firstName || ""
        )
        .trim()
        .charAt(0);


    const last =
        String(
            lastName || ""
        )
        .trim()
        .charAt(0);


    return (
        first +
        last
    ).toUpperCase() || "NA";

}


// ==========================================
// ESCAPE HTML
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