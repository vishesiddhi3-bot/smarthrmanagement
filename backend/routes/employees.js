// ==========================================
// SmartHR - EMPLOYEE ROUTES
// ==========================================

const express = require("express");
const db = require("../config/db");

const router = express.Router();


// ==========================================
// GET ALL EMPLOYEES
// ==========================================

router.get("/", (req, res) => {

    const sql = `
        SELECT
            e.id,
            e.employee_code,
            e.first_name,
            e.last_name,
            e.phone,
            e.department,
            e.designation,
            e.manager_id,
            e.joining_date,
            e.salary,
            e.status,
            e.user_id,
            u.username,
            u.email
        FROM employees e
        LEFT JOIN users u
            ON e.user_id = u.id
        ORDER BY e.id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "GET EMPLOYEES ERROR:",
                err
            );

            return res.status(500).json({
                success: false,
                message: "Unable to fetch employees"
            });
        }

        return res.json({
            success: true,
            employees: results
        });

    });

});


// ==========================================
// ADD NEW EMPLOYEE
// PASSWORD IS NOT CREATED HERE
// ==========================================

router.post("/", (req, res) => {

    const {
        firstName,
        lastName,
        email,
        phone,
        department,
        designation,
        joiningDate,
        salary,
        status
    } = req.body;


    // ======================================
    // VALIDATION
    // ======================================

    if (
        !firstName ||
        !lastName ||
        !email ||
        !phone ||
        !department ||
        !designation ||
        !joiningDate ||
        salary === undefined ||
        salary === null
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Please fill all required employee details."
        });

    }


    // ======================================
    // CHECK EMAIL
    // ======================================

    db.query(
        "SELECT id FROM users WHERE email = ? LIMIT 1",
        [email],
        (checkError, existingUsers) => {

            if (checkError) {

                console.error(
                    "EMAIL CHECK ERROR:",
                    checkError
                );

                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });

            }


            if (existingUsers.length > 0) {

                return res.status(409).json({
                    success: false,
                    message:
                        "An account with this email already exists."
                });

            }


            // ==================================
            // CREATE USERNAME
            // ==================================

            const username =
                email
                    .split("@")[0]
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, "") +
                Date.now().toString().slice(-4);


            // ==================================
            // CREATE USER
            // PASSWORD = NULL
            // ==================================

            const userSql = `
                INSERT INTO users
                (
                    username,
                    email,
                    password,
                    role,
                    status
                )
                VALUES
                (?, ?, NULL, 'employee', ?)
            `;


            db.query(
                userSql,
                [
                    username,
                    email,
                    status || "active"
                ],
                (userError, userResult) => {

                    if (userError) {

                        console.error(
                            "CREATE USER ERROR:",
                            userError
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                userError.sqlMessage ||
                                "Unable to create employee account."
                        });

                    }


                    const userId =
                        userResult.insertId;


                    // ==================================
                    // EMPLOYEE CODE
                    // ==================================

                    const employeeCode =
                        "EMP" +
                        String(userId).padStart(3, "0");


                    // ==================================
                    // INSERT EMPLOYEE PROFILE
                    // ==================================

                    const employeeSql = `
                        INSERT INTO employees
                        (
                            employee_code,
                            first_name,
                            last_name,
                            phone,
                            department,
                            designation,
                            manager_id,
                            joining_date,
                            salary,
                            status,
                            user_id
                        )
                        VALUES
                        (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)
                    `;


                    db.query(
                        employeeSql,
                        [
                            employeeCode,
                            firstName,
                            lastName,
                            phone,
                            department,
                            designation,
                            joiningDate,
                            Number(salary),
                            status || "active",
                            userId
                        ],
                        (employeeError, employeeResult) => {

                            if (employeeError) {

                                console.error(
                                    "CREATE EMPLOYEE ERROR:",
                                    employeeError
                                );


                                // Delete user if employee
                                // profile creation fails
                                db.query(
                                    "DELETE FROM users WHERE id = ?",
                                    [userId]
                                );


                                return res.status(500).json({
                                    success: false,
                                    message:
                                        employeeError.sqlMessage ||
                                        "Unable to create employee profile."
                                });

                            }


                            return res.status(201).json({

                                success: true,

                                message:
                                    "Employee created successfully.",

                                employee: {

                                    id:
                                        employeeResult.insertId,

                                    employee_code:
                                        employeeCode,

                                    first_name:
                                        firstName,

                                    last_name:
                                        lastName,

                                    email:
                                        email,

                                    phone:
                                        phone,

                                    department:
                                        department,

                                    designation:
                                        designation,

                                    joining_date:
                                        joiningDate,

                                    salary:
                                        Number(salary),

                                    status:
                                        status || "active",

                                    user_id:
                                        userId,

                                    username:
                                        username

                                }

                            });

                        }
                    );

                }
            );

        }
    );

});


// ==========================================
// GET EMPLOYEE SALARY / PAYROLL HISTORY
// ==========================================
// GET /api/employees/:userId/salary
//
// Returns:
// Basic Salary
// Allowances
// Deductions
// Net Salary
// Pay Month
// Payment Status
// ==========================================

router.get("/:userId/salary", (req, res) => {

    const userId = Number(req.params.userId);

    if (!userId) {

        return res.status(400).json({
            success: false,
            message: "User ID is required."
        });

    }


    const sql = `
        SELECT

            p.id,
            p.employee_id,

            p.month,
            p.year,

            CONCAT(
                p.year,
                '-',
                LPAD(p.month, 2, '0')
            ) AS pay_month,

            p.basic_salary,
            p.allowances,
            p.deductions,

            p.net_salary,

            p.payment_status

        FROM payroll p

        INNER JOIN employees e
            ON p.employee_id = e.id

        WHERE e.user_id = ?

        ORDER BY
            p.year DESC,
            p.month DESC,
            p.id DESC

        LIMIT 12
    `;


    db.query(
        sql,
        [userId],
        (err, results) => {

            if (err) {

                console.error(
                    "EMPLOYEE SALARY ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        err.sqlMessage ||
                        "Unable to load salary details."
                });

            }


            return res.json({

                success: true,

                salary: results

            });

        }
    );

});


// ==========================================
// GET SINGLE EMPLOYEE
// ==========================================

router.get("/:id", (req, res) => {

    const employeeId =
        req.params.id;


    const sql = `
        SELECT
            e.id,
            e.employee_code,
            e.first_name,
            e.last_name,
            e.phone,
            e.department,
            e.designation,
            e.manager_id,
            e.joining_date,
            e.salary,
            e.status,
            e.user_id,
            u.username,
            u.email
        FROM employees e
        LEFT JOIN users u
            ON e.user_id = u.id
        WHERE e.id = ?
    `;


    db.query(
        sql,
        [employeeId],
        (err, results) => {

            if (err) {

                console.error(
                    "GET EMPLOYEE ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to fetch employee"
                });

            }


            if (results.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Employee not found"
                });

            }


            return res.json({
                success: true,
                employee: results[0]
            });

        }
    );

});


// ==========================================
// UPDATE / EDIT EMPLOYEE
// ==========================================

router.put("/:id", (req, res) => {

    const employeeId =
        req.params.id;


    const {
        firstName,
        lastName,
        phone,
        department,
        designation,
        joiningDate,
        salary,
        status
    } = req.body;


    // ======================================
    // VALIDATION
    // ======================================

    if (
        !firstName ||
        !lastName ||
        !phone ||
        !department ||
        !designation ||
        !joiningDate ||
        salary === undefined ||
        salary === null ||
        !status
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Please fill all required employee details."
        });

    }


    // ======================================
    // CHECK EMPLOYEE
    // ======================================

    db.query(
        `
        SELECT
            id,
            user_id
        FROM employees
        WHERE id = ?
        LIMIT 1
        `,
        [employeeId],
        (findError, employeeResults) => {

            if (findError) {

                console.error(
                    "FIND EMPLOYEE ERROR:",
                    findError
                );

                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });

            }


            if (employeeResults.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Employee not found"
                });

            }


            const employee =
                employeeResults[0];


            // ==================================
            // UPDATE EMPLOYEE PROFILE
            // ==================================

            const updateSql = `
                UPDATE employees
                SET
                    first_name = ?,
                    last_name = ?,
                    phone = ?,
                    department = ?,
                    designation = ?,
                    joining_date = ?,
                    salary = ?,
                    status = ?
                WHERE id = ?
            `;


            db.query(
                updateSql,
                [
                    firstName,
                    lastName,
                    phone,
                    department,
                    designation,
                    joiningDate,
                    Number(salary),
                    status,
                    employeeId
                ],
                (updateError) => {

                    if (updateError) {

                        console.error(
                            "UPDATE EMPLOYEE ERROR:",
                            updateError
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                updateError.sqlMessage ||
                                "Unable to update employee."
                        });

                    }


                    // ==================================
                    // KEEP USER ACCOUNT STATUS IN SYNC
                    // ==================================

                    if (employee.user_id) {

                        db.query(
                            `
                            UPDATE users
                            SET status = ?
                            WHERE id = ?
                            `,
                            [
                                status,
                                employee.user_id
                            ],
                            (userUpdateError) => {

                                if (userUpdateError) {

                                    console.error(
                                        "UPDATE USER STATUS ERROR:",
                                        userUpdateError
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            "Employee updated but account status could not be updated."
                                    });

                                }


                                return res.json({

                                    success: true,

                                    message:
                                        "Employee updated successfully."

                                });

                            }
                        );

                    } else {

                        return res.json({

                            success: true,

                            message:
                                "Employee updated successfully."

                        });

                    }

                }
            );

        }
    );

});


// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;