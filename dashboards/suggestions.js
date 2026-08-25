// ==========================================
// SmartHR - SUGGESTIONS
// ==========================================

const API_URL = "http://localhost:5000/api";


// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadCurrentEmployee();

        loadSuggestions();

        setupSuggestionForm();

    }
);


// ==========================================
// GET LOGGED-IN USER ID
// ==========================================

function getLoggedInUserId() {

    const storages = [
        localStorage,
        sessionStorage
    ];


    // --------------------------------------
    // DIRECT ID
    // --------------------------------------

    const directKeys = [
        "user_id",
        "userId",
        "loggedInUserId",
        "logged_in_user_id"
    ];


    for (const storage of storages) {

        for (const key of directKeys) {

            const value =
                storage.getItem(key);

            if (
                value &&
                !isNaN(Number(value))
            ) {

                return Number(value);

            }

        }

    }


    // --------------------------------------
    // USER OBJECT
    // --------------------------------------

    for (const storage of storages) {

        for (
            let i = 0;
            i < storage.length;
            i++
        ) {

            const key =
                storage.key(i);

            const value =
                storage.getItem(key);


            if (!value) continue;


            try {

                const parsed =
                    JSON.parse(value);


                if (
                    parsed?.user?.id
                ) {

                    return Number(
                        parsed.user.id
                    );

                }


                if (
                    parsed?.id &&
                    (
                        parsed?.email ||
                        parsed?.username ||
                        parsed?.role
                    )
                ) {

                    return Number(
                        parsed.id
                    );

                }

            }
            catch (error) {

                // Ignore non JSON values

            }

        }

    }


    // --------------------------------------
    // JWT
    // --------------------------------------

    for (const storage of storages) {

        for (
            let i = 0;
            i < storage.length;
            i++
        ) {

            const key =
                storage.key(i);

            const value =
                storage.getItem(key);


            if (!value) continue;


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


                if (payload?.id) {

                    return Number(
                        payload.id
                    );

                }

            }
            catch (error) {

                // Not JWT

            }

        }

    }


    return null;

}


// ==========================================
// LOAD CURRENT EMPLOYEE
// ==========================================

async function loadCurrentEmployee() {

    const userId =
        getLoggedInUserId();


    if (!userId) {

        console.warn(
            "Logged-in user ID not found"
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/employees`
            );


        const data =
            await response.json();


        if (!response.ok) {

            return;

        }


        const employees =
            data.employees ||
            data.data ||
            [];


        const employee =
            employees.find(
                emp =>
                    Number(emp.user_id) ===
                    Number(userId)
            );


        if (!employee) {

            return;

        }


        const name =
            `${employee.first_name || ""} ${
                employee.last_name || ""
            }`.trim();


        const nameInput =
            document.getElementById(
                "employeeName"
            );


        if (nameInput) {

            nameInput.value =
                name ||
                employee.employee_code ||
                "Current Employee";

        }

    }
    catch (error) {

        console.error(
            "CURRENT EMPLOYEE ERROR:",
            error
        );

    }

}


// ==========================================
// LOAD SUGGESTIONS
// ==========================================

async function loadSuggestions() {

    const container =
        document.getElementById(
            "suggestionList"
        );


    if (container) {

        container.innerHTML = `
            <div class="loading">
                Loading suggestions...
            </div>
        `;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/suggestions`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load suggestions"
            );

        }


        const suggestions =
            data.suggestions ||
            data.records ||
            data.data ||
            [];


        updateStatistics(
            suggestions
        );


        renderSuggestions(
            suggestions
        );

    }
    catch (error) {

        console.error(
            "SUGGESTIONS LOAD ERROR:",
            error
        );


        if (container) {

            container.innerHTML = `
                <div class="empty">
                    ${escapeHtml(
                        error.message
                    )}
                </div>
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

    const container =
        document.getElementById(
            "suggestionList"
        );


    if (!container) return;


    if (!suggestions.length) {

        container.innerHTML = `
            <div class="empty">
                No suggestions submitted yet.
            </div>
        `;

        return;

    }


    container.innerHTML =
        suggestions
            .map(
                suggestion => {

                    const employeeName =
                        `${suggestion.first_name || ""} ${
                            suggestion.last_name || ""
                        }`.trim() ||
                        "Unknown Employee";


                    const status =
                        (
                            suggestion.status ||
                            "submitted"
                        ).toLowerCase();


                    const statusClass =
                        `status-${status}`;


                    const statusText =
                        status.charAt(0).toUpperCase() +
                        status.slice(1);


                    return `

                        <div class="suggestion-item">


                            <div class="suggestion-icon">

                                <i class="fa-solid fa-lightbulb"></i>

                            </div>


                            <div class="suggestion-content">


                                <div class="suggestion-top">

                                    <div>

                                        <h3>
                                            ${escapeHtml(
                                                suggestion.title ||
                                                "Suggestion"
                                            )}
                                        </h3>

                                        <div class="employee-name">

                                            <i class="fa-solid fa-user"></i>

                                            ${escapeHtml(
                                                employeeName
                                            )}

                                            ${
                                                suggestion.employee_code
                                                    ? `(${escapeHtml(
                                                        suggestion.employee_code
                                                    )})`
                                                    : ""
                                            }

                                        </div>

                                    </div>


                                    <span
                                        class="status ${statusClass}"
                                    >

                                        ${escapeHtml(
                                            statusText
                                        )}

                                    </span>

                                </div>


                                <p>
                                    ${escapeHtml(
                                        suggestion.description ||
                                        ""
                                    )}
                                </p>


                                <div class="suggestion-meta">

                                    <span>

                                        <i class="fa-solid fa-calendar"></i>

                                        ${formatDate(
                                            suggestion.created_at
                                        )}

                                    </span>

                                </div>


                                ${
                                    suggestion.admin_comment
                                        ? `
                                            <div class="admin-comment">

                                                <strong>
                                                    <i class="fa-solid fa-comment"></i>
                                                    HR/Admin Comment
                                                </strong>

                                                ${escapeHtml(
                                                    suggestion.admin_comment
                                                )}

                                            </div>
                                        `
                                        : ""
                                }


                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


// ==========================================
// STATISTICS
// ==========================================

function updateStatistics(
    suggestions
) {

    const total =
        suggestions.length;


    const reviewed =
        suggestions.filter(
            suggestion =>
                (
                    suggestion.status || ""
                ).toLowerCase() ===
                "reviewed"
        ).length;


    const implemented =
        suggestions.filter(
            suggestion =>
                (
                    suggestion.status || ""
                ).toLowerCase() ===
                "implemented"
        ).length;


    const totalElement =
        document.getElementById(
            "totalSuggestions"
        );


    const reviewedElement =
        document.getElementById(
            "reviewedSuggestions"
        );


    const implementedElement =
        document.getElementById(
            "implementedSuggestions"
        );


    if (totalElement) {

        totalElement.textContent =
            total;

    }


    if (reviewedElement) {

        reviewedElement.textContent =
            reviewed;

    }


    if (implementedElement) {

        implementedElement.textContent =
            implemented;

    }

}


// ==========================================
// FORM
// ==========================================

function setupSuggestionForm() {

    const form =
        document.getElementById(
            "suggestionForm"
        );


    if (!form) return;


    form.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const employeeId =
                getLoggedInUserId();


            const title =
                document
                    .getElementById("title")
                    .value
                    .trim();


            const description =
                document
                    .getElementById("description")
                    .value
                    .trim();


            // ----------------------------------
            // USER CHECK
            // ----------------------------------

            if (!employeeId) {

                showMessage(
                    "Login information not found. Please login again.",
                    true
                );

                return;

            }


            // ----------------------------------
            // VALIDATION
            // ----------------------------------

            if (!title) {

                showMessage(
                    "Please enter suggestion title.",
                    true
                );

                return;

            }


            if (!description) {

                showMessage(
                    "Please enter suggestion description.",
                    true
                );

                return;

            }


            // ----------------------------------
            // PAYLOAD
            // ----------------------------------

            const payload = {

                employee_id:
                    Number(employeeId),

                title:
                    title,

                description:
                    description

            };


            console.log(
                "SUGGESTION PAYLOAD:",
                payload
            );


            const button =
                form.querySelector(
                    'button[type="submit"]'
                );


            const originalText =
                button
                    ? button.innerHTML
                    : "";


            if (button) {

                button.disabled = true;

                button.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Submitting...
                `;

            }


            try {

                const response =
                    await fetch(
                        `${API_URL}/suggestions`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "SUGGESTION RESPONSE:",
                    data
                );


                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        data.message ||
                        "Unable to submit suggestion"
                    );

                }


                showMessage(
                    "Suggestion submitted successfully."
                );


                form.reset();


                const employeeName =
                    document.getElementById(
                        "employeeName"
                    );


                if (employeeName) {

                    employeeName.value =
                        "Current Employee";

                    loadCurrentEmployee();

                }


                await loadSuggestions();

            }
            catch (error) {

                console.error(
                    "SUGGESTION SAVE ERROR:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to submit suggestion",
                    true
                );

            }
            finally {

                if (button) {

                    button.disabled = false;

                    button.innerHTML =
                        originalText;

                }

            }

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


    setTimeout(
        () => {

            element.textContent = "";

        },
        4000
    );

}


// ==========================================
// DATE
// ==========================================

function formatDate(
    value
) {

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


// ==========================================
// BACK
// ==========================================

function goBack() {

    window.location.href =
        "hr.html";

}