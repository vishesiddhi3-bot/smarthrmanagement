// ==========================================
// SmartHR - PERFORMANCE FRONTEND
// ==========================================

const API_URL =
    "http://localhost:5000/api";


// ==========================================
// DOM READY
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadEmployees();

        loadPerformance();

        setupForm();

        setupScorePreview();

    }
);


// ==========================================
// LOAD EMPLOYEES
// ==========================================

async function loadEmployees() {

    try {

        const response =
            await fetch(
                `${API_URL}/performance/employees`
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load employees"
            );

        }


        const select =
            document.getElementById(
                "employee_id"
            );


        data.employees.forEach(
            employee => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    employee.id;


                const name =
                    `${employee.first_name || ""} ${
                        employee.last_name || ""
                    }`.trim();


                option.textContent =
                    `${name} (${employee.employee_code || "-"})`;


                select.appendChild(
                    option
                );

            }
        );

    }
    catch (error) {

        console.error(
            "LOAD EMPLOYEES ERROR:",
            error
        );

        showMessage(
            error.message,
            "error"
        );

    }

}


// ==========================================
// LOAD PERFORMANCE
// ==========================================

async function loadPerformance() {

    const tableBody =
        document.getElementById(
            "performanceTableBody"
        );


    try {

        const response =
            await fetch(
                `${API_URL}/performance`
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load performance"
            );

        }


        renderPerformance(
            data.performance || []
        );

    }
    catch (error) {

        console.error(
            "LOAD PERFORMANCE ERROR:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="10"
                    style="text-align:center;color:#dc2626;"
                >
                    ${escapeHtml(error.message)}
                </td>
            </tr>
        `;

    }

}


// ==========================================
// RENDER PERFORMANCE
// ==========================================

function renderPerformance(
    records
) {

    const tableBody =
        document.getElementById(
            "performanceTableBody"
        );


    if (!records.length) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="10"
                    style="text-align:center;"
                >
                    No performance records found.
                </td>
            </tr>
        `;

        return;

    }


    tableBody.innerHTML =
        records.map(
            record => {

                const name =
                    `${record.first_name || ""} ${
                        record.last_name || ""
                    }`.trim();


                const overall =
                    Number(
                        record.overall_score
                    ) || 0;


                return `

                    <tr>

                        <td>

                            <strong>
                                ${escapeHtml(
                                    name ||
                                    "Unknown Employee"
                                )}
                            </strong>

                            <br>

                            <small>
                                ${escapeHtml(
                                    record.employee_code ||
                                    "-"
                                )}
                            </small>

                        </td>


                        <td>
                            ${escapeHtml(
                                record.department ||
                                "-"
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                record.review_period ||
                                "-"
                            )}
                        </td>


                        <td>
                            ${record.goals_score || 0}
                        </td>


                        <td>
                            ${record.productivity_score || 0}
                        </td>


                        <td>
                            ${record.quality_score || 0}
                        </td>


                        <td>
                            ${record.teamwork_score || 0}
                        </td>


                        <td>

                            <span
                                class="score ${
                                    getScoreClass(
                                        overall
                                    )
                                }"
                            >
                                ${overall}
                            </span>

                        </td>


                        <td>
                            ${escapeHtml(
                                record.manager_comment ||
                                "-"
                            )}
                        </td>


                        <td>

                            <button
                                class="delete-btn"
                                onclick="deletePerformance(${record.id})"
                            >

                                <i class="fa-solid fa-trash"></i>

                            </button>

                        </td>

                    </tr>

                `;

            }
        ).join("");

}


// ==========================================
// FORM
// ==========================================

function setupForm() {

    const form =
        document.getElementById(
            "performanceForm"
        );


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const payload = {

                employee_id:
                    document.getElementById(
                        "employee_id"
                    ).value,

                review_period:
                    document.getElementById(
                        "review_period"
                    ).value.trim(),

                goals_score:
                    document.getElementById(
                        "goals_score"
                    ).value,

                productivity_score:
                    document.getElementById(
                        "productivity_score"
                    ).value,

                quality_score:
                    document.getElementById(
                        "quality_score"
                    ).value,

                teamwork_score:
                    document.getElementById(
                        "teamwork_score"
                    ).value,

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


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "Unable to save performance"
                    );

                }


                showMessage(
                    "Performance record saved successfully.",
                    "success"
                );


                form.reset();


                document.getElementById(
                    "overallPreview"
                ).textContent = "0";


                loadPerformance();

            }
            catch (error) {

                console.error(
                    "SAVE PERFORMANCE ERROR:",
                    error
                );


                showMessage(
                    error.message,
                    "error"
                );

            }

        }
    );

}


// ==========================================
// SCORE PREVIEW
// ==========================================

function setupScorePreview() {

    const scoreIds = [

        "goals_score",
        "productivity_score",
        "quality_score",
        "teamwork_score"

    ];


    scoreIds.forEach(
        id => {

            document.getElementById(
                id
            ).addEventListener(
                "input",
                updateOverallPreview
            );

        }
    );

}


// ==========================================
// UPDATE OVERALL PREVIEW
// ==========================================

function updateOverallPreview() {

    const goals =
        Number(
            document.getElementById(
                "goals_score"
            ).value
        ) || 0;


    const productivity =
        Number(
            document.getElementById(
                "productivity_score"
            ).value
        ) || 0;


    const quality =
        Number(
            document.getElementById(
                "quality_score"
            ).value
        ) || 0;


    const teamwork =
        Number(
            document.getElementById(
                "teamwork_score"
            ).value
        ) || 0;


    const overall =
        Math.round(
            (
                goals +
                productivity +
                quality +
                teamwork
            ) / 4
        );


    document.getElementById(
        "overallPreview"
    ).textContent =
        overall;

}


// ==========================================
// DELETE
// ==========================================

async function deletePerformance(
    id
) {

    const confirmed =
        confirm(
            "Delete this performance record?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/performance/${id}`,
                {
                    method: "DELETE"
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
                "Unable to delete record"
            );

        }


        showMessage(
            "Performance record deleted.",
            "success"
        );


        loadPerformance();

    }
    catch (error) {

        console.error(
            "DELETE PERFORMANCE ERROR:",
            error
        );


        showMessage(
            error.message,
            "error"
        );

    }

}


// ==========================================
// SCORE CLASS
// ==========================================

function getScoreClass(
    score
) {

    if (score >= 75) {
        return "good";
    }

    if (score >= 50) {
        return "average";
    }

    return "low";

}


// ==========================================
// MESSAGE
// ==========================================

function showMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "message"
        );


    element.textContent =
        message;


    element.className =
        `message ${type}`;


    setTimeout(
        () => {

            element.className =
                "message";

        },
        4000
    );

}


// ==========================================
// HTML ESCAPE
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