// ==========================================
// SmartHR - GROWTH TRACKER
// ==========================================

const API_URL = "https://smarthrmanagement-backend.onrender.com/api";


// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    loadEmployees();

    loadGrowthRecords();

    setupGrowthForm();

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
                data.message || "Unable to load employees"
            );
        }

        const employees =
            data.employees ||
            data.data ||
            [];

        const select =
            document.getElementById("employee_id");

        if (!select) return;

        select.innerHTML = `
            <option value="">
                Select Employee
            </option>
        `;

        employees.forEach(employee => {

            const option =
                document.createElement("option");

            option.value = employee.id;

            option.textContent =
                `${employee.first_name || ""} ${employee.last_name || ""}`
                .trim();

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
// LOAD GROWTH RECORDS
// ==========================================

async function loadGrowthRecords() {

    const tbody =
        document.getElementById(
            "growthTableBody"
        );

    try {

        const response = await fetch(
            `${API_URL}/performance`
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load performance records"
            );

        }

        const records =
            data.performance ||
            data.records ||
            data.data ||
            [];

        updateStatistics(records);

        renderRecords(records);

    }
    catch (error) {

        console.error(
            "GROWTH LOAD ERROR:",
            error
        );

        if (tbody) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty">
                        ${escapeHtml(error.message)}
                    </td>
                </tr>
            `;

        }

    }

}


// ==========================================
// RENDER RECORDS
// ==========================================

function renderRecords(records) {

    const tbody =
        document.getElementById(
            "growthTableBody"
        );

    if (!tbody) return;


    if (!records.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty">
                    No growth records found.
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        records.map(record => {

            const name =
                getEmployeeName(record);

            const overall =
                Number(
                    record.overall_score
                ) || 0;


            return `
                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(name)}
                        </strong>
                    </td>

                    <td>
                        ${escapeHtml(
                            record.review_period || "-"
                        )}
                    </td>

                    <td>
                        ${record.goals_score ?? 0}
                    </td>

                    <td>
                        ${record.productivity_score ?? 0}
                    </td>

                    <td>
                        ${record.quality_score ?? 0}
                    </td>

                    <td>
                        ${record.teamwork_score ?? 0}
                    </td>

                    <td>
                        <span class="score ${getScoreClass(overall)}">
                            ${overall}
                        </span>
                    </td>

                    <td>
                        ${escapeHtml(
                            record.manager_comment || "-"
                        )}
                    </td>

                </tr>
            `;

        }).join("");

}


// ==========================================
// STATISTICS
// ==========================================

function updateStatistics(records) {

    const total =
        records.length;


    const average =
        total
            ? records.reduce(
                (sum, record) =>
                    sum +
                    Number(
                        record.overall_score
                    ),
                0
            ) / total
            : 0;


    const top =
        records.filter(
            record =>
                Number(
                    record.overall_score
                ) >= 80
        ).length;


    document.getElementById(
        "totalReviews"
    ).textContent = total;


    document.getElementById(
        "averageScore"
    ).textContent =
        average.toFixed(1);


    document.getElementById(
        "topPerformers"
    ).textContent = top;

}


// ==========================================
// FORM
// ==========================================

function setupGrowthForm() {

    const form =
        document.getElementById(
            "growthForm"
        );

    if (!form) return;


    form.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const employeeId =
                document.getElementById(
                    "employee_id"
                ).value;


            const reviewPeriod =
                document.getElementById(
                    "review_period"
                ).value.trim();


            if (!employeeId) {

                showMessage(
                    "Please select an employee.",
                    true
                );

                return;

            }


            const goals =
                getScore("goals_score");

            const productivity =
                getScore("productivity_score");

            const quality =
                getScore("quality_score");

            const teamwork =
                getScore("teamwork_score");


            const overall =
                Math.round(
                    (
                        goals +
                        productivity +
                        quality +
                        teamwork
                    ) / 4
                );


            const payload = {

                employee_id:
                    Number(employeeId),

                review_period:
                    reviewPeriod,

                goals_score:
                    goals,

                productivity_score:
                    productivity,

                quality_score:
                    quality,

                teamwork_score:
                    teamwork,

                overall_score:
                    overall,

                manager_comment:
                    document.getElementById(
                        "manager_comment"
                    ).value.trim()

            };


            try {

                const response =
                    await fetch(
                        `${API_URL}/performance`,
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


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to save record"
                    );

                }


                showMessage(
                    "Growth record added successfully."
                );


                form.reset();


                loadGrowthRecords();

            }
            catch (error) {

                console.error(
                    "SAVE PERFORMANCE ERROR:",
                    error
                );


                showMessage(
                    error.message,
                    true
                );

            }

        }
    );

}


// ==========================================
// SCORE
// ==========================================

function getScore(id) {

    const value =
        Number(
            document.getElementById(id).value
        );

    if (isNaN(value)) {
        return 0;
    }

    return Math.max(
        0,
        Math.min(
            100,
            value
        )
    );

}


// ==========================================
// SCORE CLASS
// ==========================================

function getScoreClass(score) {

    if (score >= 80) {
        return "high";
    }

    if (score >= 60) {
        return "medium";
    }

    return "low";

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
// EMPLOYEE NAME
// ==========================================

function getEmployeeName(
    employee
) {

    return (
        `${employee.first_name || ""} ${
            employee.last_name || ""
        }`
    ).trim() ||
    "Unknown Employee";

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