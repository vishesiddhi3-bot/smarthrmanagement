// ==========================================
// SmartHR - PAYROLL FRONTEND
// ==========================================

const API_URL = "https://smarthrmanagement-backend.onrender.com/api";


// ==========================================
// DOM ELEMENTS
// ==========================================

const payrollForm = document.getElementById("payrollForm");

const employeeSelect =
    document.getElementById("employeeId");

const payMonth =
    document.getElementById("payMonth");

const basicSalary =
    document.getElementById("basicSalary");

const allowances =
    document.getElementById("allowances");

const deductions =
    document.getElementById("deductions");

const grossSalary =
    document.getElementById("grossSalary");

const deductionDisplay =
    document.getElementById("deductionDisplay");

const netSalary =
    document.getElementById("netSalary");

const payrollTableBody =
    document.getElementById("payrollTableBody");

const formMessage =
    document.getElementById("formMessage");

const mobileMenuBtn =
    document.getElementById("mobileMenuBtn");

const sidebar =
    document.getElementById("sidebar");


// ==========================================
// MOBILE SIDEBAR
// ==========================================

if (mobileMenuBtn && sidebar) {

    mobileMenuBtn.addEventListener("click", () => {

        sidebar.classList.toggle("open");

    });

}


// ==========================================
// LOAD PAGE
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    loadEmployees();

    loadPayroll();

    calculateSalary();

});


// ==========================================
// LOAD EMPLOYEES
// ==========================================

async function loadEmployees() {

    try {

        const response =
            await fetch(`${API_URL}/employees`);

        const data =
            await response.json();


        console.log("Employees response:", data);


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load employees"
            );

        }


        let employees = [];


        // Support different response formats

        if (Array.isArray(data)) {

            employees = data;

        }
        else if (Array.isArray(data.employees)) {

            employees = data.employees;

        }
        else if (
            data.data &&
            Array.isArray(data.data)
        ) {

            employees = data.data;

        }


        employeeSelect.innerHTML = `
            <option value="">
                Select Employee
            </option>
        `;


        employees.forEach(employee => {

            const option =
                document.createElement("option");


            option.value = employee.id;


            const firstName =
                employee.first_name ||
                employee.firstName ||
                "";


            const lastName =
                employee.last_name ||
                employee.lastName ||
                "";


            const employeeCode =
                employee.employee_code ||
                employee.employeeCode ||
                "";


            option.textContent =
                `${firstName} ${lastName}` +
                (
                    employeeCode
                        ? ` (${employeeCode})`
                        : ""
                );


            employeeSelect.appendChild(option);

        });


    }
    catch (error) {

        console.error(
            "LOAD EMPLOYEES ERROR:",
            error
        );


        employeeSelect.innerHTML = `
            <option value="">
                Unable to load employees
            </option>
        `;

    }

}


// ==========================================
// SALARY CALCULATION
// ==========================================

function calculateSalary() {

    const basic =
        Number(basicSalary.value) || 0;


    const allowance =
        Number(allowances.value) || 0;


    const deduction =
        Number(deductions.value) || 0;


    const gross =
        basic + allowance;


    const net =
        gross - deduction;


    grossSalary.textContent =
        formatCurrency(gross);


    deductionDisplay.textContent =
        formatCurrency(deduction);


    netSalary.textContent =
        formatCurrency(net);

}


// ==========================================
// SALARY INPUT EVENTS
// ==========================================

basicSalary.addEventListener(
    "input",
    calculateSalary
);


allowances.addEventListener(
    "input",
    calculateSalary
);


deductions.addEventListener(
    "input",
    calculateSalary
);


// ==========================================
// FORMAT CURRENCY
// ==========================================

function formatCurrency(amount) {

    return "₹" +
        Number(amount || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

}


// ==========================================
// CREATE PAYROLL
// ==========================================

payrollForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        formMessage.textContent = "";
        formMessage.style.color = "";


        const employeeId =
            employeeSelect.value;


        const month =
            payMonth.value;


        const basic =
            Number(basicSalary.value) || 0;


        const allowance =
            Number(allowances.value) || 0;


        const deduction =
            Number(deductions.value) || 0;


        // ==================================
        // VALIDATION
        // ==================================

        if (!employeeId) {

            showMessage(
                "Please select an employee.",
                "red"
            );

            return;

        }


        if (!month) {

            showMessage(
                "Please select pay month.",
                "red"
            );

            return;

        }


        if (basic < 0) {

            showMessage(
                "Basic salary cannot be negative.",
                "red"
            );

            return;

        }


        if (allowance < 0) {

            showMessage(
                "Allowances cannot be negative.",
                "red"
            );

            return;

        }


        if (deduction < 0) {

            showMessage(
                "Deductions cannot be negative.",
                "red"
            );

            return;

        }


        const gross =
            basic + allowance;


        const net =
            gross - deduction;


        if (net < 0) {

            showMessage(
                "Net salary cannot be negative.",
                "red"
            );

            return;

        }


        // ==================================
        // BUTTON
        // ==================================

        const submitButton =
            payrollForm.querySelector(
                "button[type='submit']"
            );


        const originalText =
            submitButton.innerHTML;


        submitButton.disabled = true;

        submitButton.innerHTML =
            `<i class="fa-solid fa-spinner fa-spin"></i>
             Creating...`;


        try {

            const response =
                await fetch(
                    `${API_URL}/payroll`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            employeeId:
                                employeeId,

                            payMonth:
                                month,

                            basicSalary:
                                basic,

                            allowances:
                                allowance,

                            deductions:
                                deduction

                        })

                    }
                );


            const data =
                await response.json();


            console.log(
                "CREATE PAYROLL RESPONSE:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to create payroll"
                );

            }


            showMessage(
                "Payroll created successfully!",
                "green"
            );


            // Reset form

            payrollForm.reset();


            // Reset default values

            allowances.value = 0;

            deductions.value = 0;


            calculateSalary();


            // Reload records

            loadPayroll();


        }
        catch (error) {

            console.error(
                "CREATE PAYROLL ERROR:",
                error
            );


            showMessage(
                error.message ||
                "Something went wrong.",
                "red"
            );

        }
        finally {

            submitButton.disabled = false;

            submitButton.innerHTML =
                originalText;

        }

    }
);


// ==========================================
// MESSAGE
// ==========================================

function showMessage(
    message,
    color
) {

    formMessage.textContent =
        message;


    if (color === "green") {

        formMessage.style.color =
            "#15803d";

    }
    else {

        formMessage.style.color =
            "#dc2626";

    }

}


// ==========================================
// LOAD PAYROLL RECORDS
// ==========================================

async function loadPayroll() {

    try {

        payrollTableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="empty-message"
                >
                    Loading payroll records...
                </td>
            </tr>
        `;


        const response =
            await fetch(
                `${API_URL}/payroll`
            );


        const data =
            await response.json();


        console.log(
            "PAYROLL RESPONSE:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load payroll"
            );

        }


        const payroll =
            Array.isArray(data.payroll)
                ? data.payroll
                : [];


        renderPayroll(
            payroll
        );


    }
    catch (error) {

        console.error(
            "LOAD PAYROLL ERROR:",
            error
        );


        payrollTableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="empty-message"
                >
                    Unable to load payroll records.
                </td>
            </tr>
        `;

    }

}


// ==========================================
// RENDER PAYROLL
// ==========================================

function renderPayroll(
    payroll
) {

    if (!payroll.length) {

        payrollTableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="empty-message"
                >
                    No payroll records found.
                </td>
            </tr>
        `;

        return;

    }


    payrollTableBody.innerHTML =
        payroll.map(record => {


            const employeeName =
                `${record.first_name || ""} ${
                    record.last_name || ""
                }`.trim();


             const rawStatus =
    record.payment_status || "pending";

const status =
    rawStatus.toLowerCase() === "paid"
        ? "Paid"
        : "Pending";


            const statusClass =
                status.toLowerCase() === "paid"
                    ? "status-paid"
                    : "status-pending";


            return `

                <tr>

                    <td>

                        <strong>
                            ${escapeHtml(
                                employeeName ||
                                "Unknown Employee"
                            )}
                        </strong>

                        <br>

                        <small>
                            ${escapeHtml(
                                record.employee_code ||
                                ""
                            )}
                        </small>

                    </td>


                    <td>
                        ${formatMonth(
                            record.pay_month
                        )}
                    </td>


                    <td>
                        ${formatCurrency(
                            record.basic_salary
                        )}
                    </td>


                    <td>
                        ${formatCurrency(
                            record.allowances
                        )}
                    </td>


                    <td>
                        ${formatCurrency(
                            record.deductions
                        )}
                    </td>


                    <td>
                        ${formatCurrency(
                            record.gross_salary
                        )}
                    </td>


                    <td>
                        <strong>
                            ${formatCurrency(
                                record.net_salary
                            )}
                        </strong>
                    </td>


                    <td>

                        <span
                            class="status-badge ${statusClass}"
                        >
                            ${escapeHtml(status)}
                        </span>

                    </td>


                    <td>

                        ${
                            status.toLowerCase() !== "paid"

                            ?

                            `
                            <button
                                class="action-btn paid-btn"
                                onclick="markAsPaid(${record.id})"
                            >
                                <i class="fa-solid fa-check"></i>
                                Paid
                            </button>
                            `

                            :

                            ""
                        }


                        <button
                            class="action-btn delete-btn"
                            onclick="deletePayroll(${record.id})"
                        >

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </td>

                </tr>

            `;

        }).join("");

}


// ==========================================
// MARK PAYROLL AS PAID
// ==========================================

async function markAsPaid(
    payrollId
) {

    const confirmPayment =
        confirm(
            "Mark this payroll as Paid?"
        );


    if (!confirmPayment) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/payroll/${payrollId}/status`,
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        paymentStatus:
                            "Paid"

                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to update payment status"
            );

        }


        alert(
            "Payment status updated successfully."
        );


        loadPayroll();


    }
    catch (error) {

        console.error(
            "PAYMENT STATUS ERROR:",
            error
        );


        alert(
            error.message ||
            "Unable to update payment status."
        );

    }

}


// ==========================================
// DELETE PAYROLL
// ==========================================

async function deletePayroll(
    payrollId
) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this payroll record?"
        );


    if (!confirmDelete) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/payroll/${payrollId}`,
                {

                    method: "DELETE"

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to delete payroll"
            );

        }


        alert(
            "Payroll deleted successfully."
        );


        loadPayroll();


    }
    catch (error) {

        console.error(
            "DELETE PAYROLL ERROR:",
            error
        );


        alert(
            error.message ||
            "Unable to delete payroll."
        );

    }

}


// ==========================================
// FORMAT MONTH
// ==========================================

function formatMonth(
    month
) {

    if (!month) {

        return "-";

    }


    const value =
        String(month).substring(0, 7);


    const parts =
        value.split("-");


    if (
        parts.length !== 2
    ) {

        return month;

    }


    const year =
        Number(parts[0]);


    const monthNumber =
        Number(parts[1]);


    if (
        !year ||
        !monthNumber
    ) {

        return month;

    }


    const date =
        new Date(
            year,
            monthNumber - 1,
            1
        );


    return date.toLocaleDateString(
        "en-IN",
        {
            month: "short",
            year: "numeric"
        }
    );

}


// ==========================================
// HTML ESCAPE
// ==========================================

function escapeHtml(
    value
) {

    return String(value ?? "")
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