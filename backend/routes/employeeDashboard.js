// ==========================================
// SmartHR - EMPLOYEE DASHBOARD ROUTES
// ==========================================

const express = require("express");
const db = require("../config/db");

const router = express.Router();


// ==========================================
// GET EMPLOYEE DASHBOARD
// ==========================================

router.get("/:userId", (req, res) => {

    const userId = req.params.userId;

    if (!userId) {

        return res.status(400).json({
            success: false,
            message: "User ID is required"
        });

    }

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

        WHERE e.user_id = ?

        LIMIT 1
    `;


    db.query(
        sql,
        [userId],
        (err, results) => {

            if (err) {

                console.error(
                    "EMPLOYEE DASHBOARD ERROR:",
                    err
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Database error",

                    error:
                        err.sqlMessage ||
                        err.message

                });

            }


            if (!results.length) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Employee profile not found"

                });

            }


            return res.json({

                success: true,

                message:
                    "Employee dashboard loaded successfully",

                employee:
                    results[0]

            });

        }
    );

});



// ==========================================
// GET EMPLOYEE SALARY / PAYROLL HISTORY
// ==========================================
//
// GET:
// /api/employeeDashboard/:userId/salary
//
// Returns:
// - Latest payroll
// - Previous payroll history
// - Net salary
// - Gross salary
// - Basic salary
// - Allowances
// - Deductions
// - Payment status
//
// ==========================================

// ==========================================
// GET EMPLOYEE SALARY / PAYROLL HISTORY
// ==========================================

router.get("/:userId/salary", (req, res) => {

    const requestedId = Number(req.params.userId);

    if (!requestedId) {

        return res.status(400).json({
            success: false,
            message: "Employee/User ID is required"
        });

    }


    // ==========================================
    // FIND EMPLOYEE
    // Accept BOTH:
    // 1. users.id
    // 2. employees.id
    // ==========================================

    const employeeSql = `
        SELECT
            e.id,
            e.user_id,
            e.employee_code,
            e.first_name,
            e.last_name
        FROM employees e
        WHERE
            e.user_id = ?
            OR e.id = ?
        LIMIT 1
    `;


    db.query(
        employeeSql,
        [
            requestedId,
            requestedId
        ],
        (employeeErr, employeeRows) => {

            if (employeeErr) {

                console.error(
                    "EMPLOYEE SALARY FIND ERROR:",
                    employeeErr
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to find employee",
                    error:
                        employeeErr.sqlMessage ||
                        employeeErr.message
                });

            }


            if (!employeeRows.length) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Employee profile not found"
                });

            }


            const employee =
                employeeRows[0];


            // ==========================================
            // LOAD PAYROLL USING EMPLOYEES.ID
            // ==========================================

            const payrollSql = `
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
                    p.gross_salary,
                    p.net_salary,
                    p.payment_status,
                    p.created_at

                FROM payroll p

                WHERE p.employee_id = ?

                ORDER BY
                    p.year DESC,
                    p.month DESC,
                    p.id DESC

                LIMIT 12
            `;


            db.query(
                payrollSql,
                [employee.id],
                (payrollErr, payrollRows) => {

                    if (payrollErr) {

                        console.error(
                            "EMPLOYEE PAYROLL ERROR:",
                            payrollErr
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Unable to load salary",
                            error:
                                payrollErr.sqlMessage ||
                                payrollErr.message
                        });

                    }


                    // ==========================================
                    // RETURN EMPTY ARRAY IF NO PAYROLL
                    // ==========================================

                    return res.json({

                        success: true,

                        employee: {
                            id:
                                employee.id,

                            user_id:
                                employee.user_id,

                            employee_code:
                                employee.employee_code,

                            first_name:
                                employee.first_name,

                            last_name:
                                employee.last_name
                        },

                        salary:
                            payrollRows

                    });

                }
            );

        }
    );

});



// ==========================================
// GET EMPLOYEE SUGGESTIONS
// ==========================================
// Returns suggestions submitted by employee
//
// GET /api/employeeDashboard/:userId/suggestions
// ==========================================

router.get("/:userId/suggestions", (req, res) => {

    const userId = req.params.userId;


    if (!userId) {

        return res.status(400).json({

            success: false,

            message:
                "User ID is required"

        });

    }


    const suggestionSql = `
        SELECT

            s.id,
            s.employee_id,

            s.title,
            s.description,

            s.status,
            s.admin_comment,

            s.created_at,

            e.employee_code,
            e.first_name,
            e.last_name

        FROM suggestions s

        INNER JOIN employees e
            ON s.employee_id = e.id

        WHERE e.user_id = ?

        ORDER BY
            s.id DESC
    `;


    db.query(
        suggestionSql,
        [userId],
        (suggestionErr, suggestions) => {

            if (suggestionErr) {

                console.error(
                    "SUGGESTIONS LOAD ERROR:",
                    suggestionErr
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to load suggestions",

                    error:
                        suggestionErr.sqlMessage ||
                        suggestionErr.message

                });

            }


            return res.json({

                success: true,

                suggestions:
                    suggestions

            });

        }
    );

});



// ==========================================
// SUBMIT EMPLOYEE SUGGESTION
// ==========================================
//
// POST /api/employeeDashboard/:userId/suggestions
//
// Body:
//
// {
//     "title": "...",
//     "description": "..."
// }
//
// ==========================================

router.post("/:userId/suggestions", (req, res) => {

    const userId =
        req.params.userId;


    const title =
        String(
            req.body.title || ""
        ).trim();


    const description =
        String(
            req.body.description || ""
        ).trim();


    if (!userId) {

        return res.status(400).json({

            success: false,

            message:
                "User ID is required"

        });

    }


    if (!title) {

        return res.status(400).json({

            success: false,

            message:
                "Suggestion title is required"

        });

    }


    if (!description) {

        return res.status(400).json({

            success: false,

            message:
                "Suggestion description is required"

        });

    }


    const employeeSql = `
        SELECT
            id

        FROM employees

        WHERE user_id = ?

        LIMIT 1
    `;


    db.query(
        employeeSql,
        [userId],
        (employeeErr, employeeRows) => {

            if (employeeErr) {

                console.error(
                    "SUGGESTION EMPLOYEE ERROR:",
                    employeeErr
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to find employee",

                    error:
                        employeeErr.sqlMessage ||
                        employeeErr.message

                });

            }


            if (!employeeRows.length) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Employee profile not found"

                });

            }


            const employeeId =
                employeeRows[0].id;


            const insertSql = `
                INSERT INTO suggestions
                (
                    employee_id,
                    title,
                    description,
                    status
                )

                VALUES
                (
                    ?,
                    ?,
                    ?,
                    'submitted'
                )
            `;


            db.query(
                insertSql,
                [
                    employeeId,
                    title,
                    description
                ],
                (insertErr, result) => {

                    if (insertErr) {

                        console.error(
                            "SUGGESTION INSERT ERROR:",
                            insertErr
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Unable to submit suggestion",

                            error:
                                insertErr.sqlMessage ||
                                insertErr.message

                        });

                    }


                    return res.status(201).json({

                        success: true,

                        message:
                            "Suggestion submitted successfully",

                        suggestion: {

                            id:
                                result.insertId,

                            employee_id:
                                employeeId,

                            title:
                                title,

                            description:
                                description,

                            status:
                                "submitted",

                            admin_comment:
                                null

                        }

                    });

                }
            );

        }
    );

});



// ==========================================
// TEST ROUTE
// ==========================================

router.get("/test/check", (req, res) => {

    res.json({

        success: true,

        message:
            "Employee dashboard route is working"

    });

});



// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;