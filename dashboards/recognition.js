// ==========================================
// SmartHR - RECOGNITION
// ==========================================

const API_URL = "http://localhost:5000/api";


// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    loadEmployees();

    loadRecognitions();

    setupRecognitionForm();

});


// ==========================================
// LOAD EMPLOYEES
// ==========================================

async function loadEmployees() {

    try {

        const response = await fetch(
            `${API_URL}/employees`
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load employees"
            );

        }

        const employees =
            data.employees ||
            data.data ||
            [];

        const select =
            document.getElementById(
                "to_employee_id"
            );

        if (!select) return;

        select.innerHTML = `
            <option value="">
                Select Employee
            </option>
        `;

        employees.forEach(employee => {

            const option =
                document.createElement("option");

            option.value =
                employee.id;

            option.textContent =
                `${employee.first_name || ""} ${
                    employee.last_name || ""
                }`.trim();

            select.appendChild(option);

        });

    }
    catch (error) {

        console.error(
            "EMPLOYEE LOAD ERROR:",
            error
        );

    }

}


// ==========================================
// LOAD RECOGNITIONS
// ==========================================

async function loadRecognitions() {

    const container =
        document.getElementById(
            "recognitionList"
        );

    try {

        const response =
            await fetch(
                `${API_URL}/recognition`
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load recognitions"
            );

        }

        const records =
            data.recognitions ||
            data.records ||
            data.data ||
            [];

        updateStatistics(records);

        renderRecognitions(records);

    }
    catch (error) {

        console.error(
            "RECOGNITION LOAD ERROR:",
            error
        );

        if (container) {

            container.innerHTML = `
                <div class="empty">
                    ${escapeHtml(error.message)}
                </div>
            `;

        }

    }

}


// ==========================================
// RENDER
// ==========================================

function renderRecognitions(records) {

    const container =
        document.getElementById(
            "recognitionList"
        );

    if (!container) return;


    if (!records.length) {

        container.innerHTML = `
            <div class="empty">
                No recognition records found.
            </div>
        `;

        return;

    }


    container.innerHTML =
        records.map(record => {

            const employee =
                getEmployeeName(record);


            return `
                <div class="recognition-item">

                    <div class="recognition-icon">
                        <i class="fa-solid fa-trophy"></i>
                    </div>

                    <div class="recognition-content">

                        <h3>
                            ${escapeHtml(
                                record.title || "Recognition"
                            )}
                        </h3>

                        <div class="employee-name">
                            ${escapeHtml(employee)}
                        </div>

                        <p>
                            ${escapeHtml(
                                record.message || ""
                            )}
                        </p>

                        <div class="recognition-date">
                            ${formatDate(
                                record.created_at
                            )}
                        </div>

                    </div>

                </div>
            `;

        }).join("");

}


// ==========================================
// STATISTICS
// ==========================================

function updateStatistics(records) {

    document.getElementById(
        "totalRecognitions"
    ).textContent =
        records.length;


    const employees =
        new Set(
            records
                .map(
                    record =>
                        record.to_employee_id
                )
                .filter(Boolean)
        );


    document.getElementById(
        "employeesRecognized"
    ).textContent =
        employees.size;


    if (records.length) {

        document.getElementById(
            "latestRecognition"
        ).textContent =
            formatDate(
                records[0].created_at
            );

    }
    else {

        document.getElementById(
            "latestRecognition"
        ).textContent =
            "-";

    }

}


// ==========================================
// GET LOGGED-IN USER ID
// ==========================================

function getLoggedInUserId() {

    // --------------------------------------
    // 1. Direct user ID keys
    // --------------------------------------

    const directKeys = [
        "user_id",
        "userId",
        "loggedInUserId",
        "logged_in_user_id"
    ];

    for (const key of directKeys) {

        const value =
            localStorage.getItem(key) ||
            sessionStorage.getItem(key);

        if (value && !isNaN(Number(value))) {

            return Number(value);

        }

    }


    // --------------------------------------
    // 2. Search stored JSON user objects
    // --------------------------------------

    const storageTypes = [
        localStorage,
        sessionStorage
    ];


    for (const storage of storageTypes) {

        for (let i = 0; i < storage.length; i++) {

            const key =
                storage.key(i);

            if (!key) continue;


            const value =
                storage.getItem(key);

            if (!value) continue;


            try {

                const parsed =
                    JSON.parse(value);


                if (
                    parsed &&
                    parsed.user &&
                    parsed.user.id
                ) {

                    return Number(
                        parsed.user.id
                    );

                }


                if (
                    parsed &&
                    parsed.id &&
                    (
                        parsed.username ||
                        parsed.email ||
                        parsed.role
                    )
                ) {

                    return Number(
                        parsed.id
                    );

                }

            }
            catch (error) {

                // Not JSON, continue searching

            }

        }

    }


    // --------------------------------------
    // 3. Search JWT token
    // --------------------------------------

    for (const storage of storageTypes) {

        for (let i = 0; i < storage.length; i++) {

            const key =
                storage.key(i);

            if (!key) continue;


            const value =
                storage.getItem(key);

            if (!value) continue;


            // JWT has 3 parts
            const parts =
                value.split(".");


            if (parts.length !== 3) {
                continue;
            }


            try {

                const payload =
                    JSON.parse(
                        atob(
                            parts[1]
                                .replace(/-/g, "+")
                                .replace(/_/g, "/")
                        )
                    );


                if (
                    payload &&
                    payload.id
                ) {

                    return Number(
                        payload.id
                    );

                }

            }
            catch (error) {

                // Not a JWT, continue

            }

        }

    }


    return null;

}
// ==========================================
// FORM
// ==========================================

function setupRecognitionForm() {

    const form = document.getElementById("recognitionForm");

    if (!form) {
        console.error("Recognition form not found");
        return;
    }

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const employeeSelect =
            document.getElementById("to_employee_id");

        const titleInput =
            document.getElementById("title");

        const messageInput =
            document.getElementById("message");


        const employeeId =
            employeeSelect.value;

        const title =
            titleInput.value.trim();

        const message =
            messageInput.value.trim();


        // ======================================
        // VALIDATION
        // ======================================

        if (!employeeId) {

            showMessage(
                "Please select an employee.",
                true
            );

            employeeSelect.focus();

            return;
        }


        if (!title) {

            showMessage(
                "Please enter recognition title.",
                true
            );

            titleInput.focus();

            return;
        }


        if (!message) {

            showMessage(
                "Please enter recognition message.",
                true
            );

            messageInput.focus();

            return;
        }


        // ======================================
        // GET LOGGED-IN USER
        // ======================================

        const loggedInUserId =
    getLoggedInUserId();


        /*
            If your login system stores the complete
            user object, try reading its id.
        */

        if (!loggedInUserId) {

            const storedUser =
                localStorage.getItem("user") ||
                sessionStorage.getItem("user");

            if (storedUser) {

                try {

                    const user =
                        JSON.parse(storedUser);

                    loggedInUserId =
                        user.id ||
                        user.user_id ||
                        user.userId;

                }
                catch (error) {

                    console.error(
                        "USER DATA PARSE ERROR:",
                        error
                    );

                }

            }

        }


        // ======================================
        // USER ID CHECK
        // ======================================

        if (!loggedInUserId) {

            showMessage(
                "Login information not found. Please login again.",
                true
            );

            console.error(
                "No logged-in user ID found in localStorage/sessionStorage."
            );

            return;
        }


        // ======================================
        // PAYLOAD
        // ======================================

        const payload = {

            from_user_id:
                Number(loggedInUserId),

            to_employee_id:
                Number(employeeId),

            title:
                title,

            message:
                message

        };


        console.log(
            "RECOGNITION PAYLOAD:",
            payload
        );


        // ======================================
        // BUTTON
        // ======================================

        const submitButton =
            form.querySelector(
                'button[type="submit"]'
            );


        const originalButtonText =
            submitButton
                ? submitButton.innerHTML
                : "";


        if (submitButton) {

            submitButton.disabled = true;

            submitButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Saving...
            `;

        }


        // ======================================
        // SAVE
        // ======================================

        try {

            const response =
                await fetch(
                    `${API_URL}/recognition`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(payload)
                    }
                );


            const data =
                await response.json();


            console.log(
                "RECOGNITION RESPONSE:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    data.message ||
                    "Unable to save recognition"
                );

            }


            // ==================================
            // SUCCESS
            // ==================================

            showMessage(
                "Recognition added successfully."
            );


            form.reset();


            await loadRecognitions();


        }
        catch (error) {

            console.error(
                "RECOGNITION SAVE ERROR:",
                error
            );


            showMessage(
                error.message ||
                "Unable to save recognition",
                true
            );

        }
        finally {

            if (submitButton) {

                submitButton.disabled = false;

                submitButton.innerHTML =
                    originalButtonText;

            }

        }

    });

}


// ==========================================
// EMPLOYEE NAME
// ==========================================

function getEmployeeName(record) {

    return (
        `${record.first_name || ""} ${
            record.last_name || ""
        }`
    ).trim() ||
    "Unknown Employee";

}


// ==========================================
// DATE
// ==========================================

function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (isNaN(date.getTime())) {
        return String(value);
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
// MESSAGE
// ==========================================

function showMessage(
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
            : "#15803d";


    setTimeout(() => {

        element.textContent = "";

    }, 4000);

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(value) {

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
// BACK
// ==========================================

function goBack() {

    window.location.href =
        "hr.html";

}