// ==========================================
// SmartHR - PAYROLL ROUTES
// ==========================================

const express = require("express");
const db = require("../config/db");

const router = express.Router();


// ==========================================
// GET ALL PAYROLL RECORDS - HR / ADMIN
// ==========================================

router.get("/", (req, res) => {

    const sql = `
        SELECT
            p.id,
            p.employee_id,

            p.month,
            p.year,

            p.basic_salary,
            p.allowances,
            p.deductions,
            p.gross_salary,
            p.net_salary,
            p.payment_status,
            p.created_at,

            e.employee_code,
            e.first_name,
            e.last_name,
            e.department,
            e.designation

        FROM payroll p

        INNER JOIN employees e
            ON p.employee_id = e.id

        ORDER BY
            p.created_at DESC,
            p.id DESC
    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "GET PAYROLL ERROR:",
                err
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to fetch payroll records",

                error:
                    err.sqlMessage || err.message

            });

        }


        // Add pay_month for frontend compatibility

        const payroll = results.map(record => ({

            ...record,

            pay_month:
                `${record.year}-${String(record.month).padStart(2, "0")}`

        }));


        return res.json({

            success: true,

            payroll: payroll

        });

    });

});


// ==========================================
// GET EMPLOYEE PAYROLL
// EMPLOYEE DASHBOARD
// ==========================================
//
// IMPORTANT:
// Frontend sends users.id.
// Payroll uses employees.id.
//
// Relationship:
//
// users.id
//    ↓
// employees.user_id
//    ↓
// employees.id
//    ↓
// payroll.employee_id
//
// ==========================================

router.get(
    "/employee/:userId",
    (req, res) => {

        const userId =
            Number(req.params.userId);


        // ==========================================
        // VALIDATE USER ID
        // ==========================================

        if (!userId || userId <= 0) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid employee user ID"

            });

        }


        // ==========================================
        // GET PAYROLL USING users.id
        // ==========================================

        const sql = `

            SELECT

                p.id,
                p.employee_id,

                p.month,
                p.year,

                p.basic_salary,
                p.allowances,
                p.deductions,
                p.gross_salary,
                p.net_salary,

                p.payment_status,
                p.created_at,

                e.employee_code,
                e.first_name,
                e.last_name,
                e.department,
                e.designation,

                e.user_id

            FROM payroll p

            INNER JOIN employees e
                ON p.employee_id = e.id

            WHERE e.user_id = ?

            ORDER BY

                p.year DESC,
                p.month DESC,
                p.created_at DESC,
                p.id DESC

        `;


        db.query(
            sql,
            [userId],
            (err, results) => {

                // ======================================
                // DATABASE ERROR
                // ======================================

                if (err) {

                    console.error(
                        "EMPLOYEE PAYROLL ERROR:",
                        err
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Unable to fetch employee payroll",

                        error:
                            err.sqlMessage ||
                            err.message

                    });

                }


                // ======================================
                // ADD PAY MONTH
                // ======================================

                const payroll =
                    results.map(
                        (record) => ({

                            ...record,

                            pay_month:
                                `${record.year}-${String(
                                    record.month
                                ).padStart(2, "0")}`

                        })
                    );


                // ======================================
                // DEBUG LOG
                // ======================================

                console.log(
                    "------------------------------------------"
                );

                console.log(
                    "EMPLOYEE PAYROLL REQUEST"
                );

                console.log(
                    "Logged-in User ID:",
                    userId
                );

                console.log(
                    "Payroll Records Found:",
                    payroll.length
                );

                console.log(
                    "Payroll Data:",
                    payroll
                );

                console.log(
                    "------------------------------------------"
                );


                // ======================================
                // RESPONSE
                // ======================================

                return res.json({

                    success: true,

                    payroll:
                        payroll

                });

            }
        );

    }
);

// ==========================================
// CREATE PAYROLL
// ==========================================

router.post("/", (req, res) => {

    const {

        employeeId,

        // Frontend sends this
        payMonth,

        basicSalary,
        allowances,
        deductions

    } = req.body;


    // ==========================================
    // BASIC VALIDATION
    // ==========================================

    if (!employeeId) {

        return res.status(400).json({

            success: false,

            message:
                "Employee is required"

        });

    }


    if (!payMonth) {

        return res.status(400).json({

            success: false,

            message:
                "Pay month is required"

        });

    }


    // ==========================================
    // CONVERT YYYY-MM
    // INTO MONTH + YEAR
    // ==========================================

    const payMonthString =
        String(payMonth).trim();


    const parts =
        payMonthString.split("-");


    if (
        parts.length !== 2 ||
        !/^\d{4}$/.test(parts[0]) ||
        !/^\d{2}$/.test(parts[1])
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Invalid pay month. Use YYYY-MM format."

        });

    }


    const year =
        Number(parts[0]);


    const month =
        Number(parts[1]);


    if (
        month < 1 ||
        month > 12
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Invalid month"

        });

    }


    if (
        year < 2000 ||
        year > 2100
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Invalid year"

        });

    }


    // ==========================================
    // SALARY VALUES
    // ==========================================

    const basic =
        Number(basicSalary) || 0;


    const allowance =
        Number(allowances) || 0;


    const deduction =
        Number(deductions) || 0;


    // ==========================================
    // NEGATIVE VALUE VALIDATION
    // ==========================================

    if (basic < 0) {

        return res.status(400).json({

            success: false,

            message:
                "Basic salary cannot be negative"

        });

    }


    if (allowance < 0) {

        return res.status(400).json({

            success: false,

            message:
                "Allowances cannot be negative"

        });

    }


    if (deduction < 0) {

        return res.status(400).json({

            success: false,

            message:
                "Deductions cannot be negative"

        });

    }


    // ==========================================
    // CALCULATE SALARY
    // ==========================================

    const grossSalary =
        basic + allowance;


    const netSalary =
        grossSalary - deduction;


    if (netSalary < 0) {

        return res.status(400).json({

            success: false,

            message:
                "Net salary cannot be negative"

        });

    }


    // ==========================================
    // CHECK EMPLOYEE
    // ==========================================

    const employeeSql = `
        SELECT
            id,
            employee_code,
            first_name,
            last_name,
            department,
            designation

        FROM employees

        WHERE id = ?

        LIMIT 1
    `;


    db.query(
        employeeSql,
        [employeeId],
        (employeeErr, employeeResults) => {

            if (employeeErr) {

                console.error(
                    "PAYROLL EMPLOYEE CHECK ERROR:",
                    employeeErr
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Database error while checking employee",

                    error:
                        employeeErr.sqlMessage ||
                        employeeErr.message

                });

            }


            if (
                employeeResults.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Employee not found"

                });

            }


            // ==========================================
            // CHECK DUPLICATE PAYROLL
            // ==========================================

            const duplicateSql = `
                SELECT
                    id

                FROM payroll

                WHERE employee_id = ?
                AND month = ?
                AND year = ?

                LIMIT 1
            `;


            db.query(
                duplicateSql,
                [
                    employeeId,
                    month,
                    year
                ],
                (duplicateErr, duplicateResults) => {

                    if (duplicateErr) {

                        console.error(
                            "PAYROLL DUPLICATE CHECK ERROR:",
                            duplicateErr
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Unable to check existing payroll",

                            error:
                                duplicateErr.sqlMessage ||
                                duplicateErr.message

                        });

                    }


                    if (
                        duplicateResults.length > 0
                    ) {

                        return res.status(409).json({

                            success: false,

                            message:
                                "Payroll already exists for this employee and month"

                        });

                    }


                    // ==========================================
                    // INSERT PAYROLL
                    // ==========================================

                    const insertSql = `
                        INSERT INTO payroll
                        (
                            employee_id,
                            month,
                            year,
                            basic_salary,
                            allowances,
                            deductions,
                            gross_salary,
                            net_salary,
                            payment_status
                        )

                        VALUES
                        (
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            'pending'
                        )
                    `;


                    db.query(
                        insertSql,

                        [
                            employeeId,
                            month,
                            year,
                            basic,
                            allowance,
                            deduction,
                            grossSalary,
                            netSalary
                        ],

                        (insertErr, result) => {

                            if (insertErr) {

                                console.error(
                                    "CREATE PAYROLL ERROR:",
                                    insertErr
                                );

                                return res.status(500).json({

                                    success: false,

                                    message:
                                        insertErr.sqlMessage ||
                                        "Unable to create payroll",

                                    error:
                                        insertErr.message

                                });

                            }


                            return res.status(201).json({

                                success: true,

                                message:
                                    "Payroll created successfully",

                                payrollId:
                                    result.insertId,

                                payroll: {

                                    id:
                                        result.insertId,

                                    employeeId:
                                        employeeId,

                                    month:
                                        month,

                                    year:
                                        year,

                                    payMonth:
                                        payMonthString,

                                    basicSalary:
                                        basic,

                                    allowances:
                                        allowance,

                                    deductions:
                                        deduction,

                                    grossSalary:
                                        grossSalary,

                                    netSalary:
                                        netSalary,

                                    paymentStatus:
                                        "pending"

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
// UPDATE PAYMENT STATUS
// ==========================================

router.put(
    "/:id/status",
    (req, res) => {

        const payrollId =
            req.params.id;


        const {
            paymentStatus
        } = req.body;


        // Accept both frontend values
        // "Paid" / "Pending"
        // and database values
        // "paid" / "pending"

        const status =
            String(paymentStatus || "")
                .trim()
                .toLowerCase();


        if (
            status !== "pending" &&
            status !== "paid"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Payment status must be Pending or Paid"

            });

        }


        const sql = `
            UPDATE payroll

            SET payment_status = ?

            WHERE id = ?
        `;


        db.query(
            sql,
            [
                status,
                payrollId
            ],
            (err, result) => {

                if (err) {

                    console.error(
                        "UPDATE PAYROLL STATUS ERROR:",
                        err
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Unable to update payment status",

                        error:
                            err.sqlMessage ||
                            err.message

                    });

                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({

                        success: false,

                        message:
                            "Payroll record not found"

                    });

                }


                return res.json({

                    success: true,

                    message:
                        "Payment status updated successfully",

                    paymentStatus:
                        status

                });

            }
        );

    }
);


// ==========================================
// DELETE PAYROLL
// ==========================================

router.delete(
    "/:id",
    (req, res) => {

        const payrollId =
            req.params.id;


        const sql = `
            DELETE FROM payroll

            WHERE id = ?
        `;


        db.query(
            sql,
            [payrollId],
            (err, result) => {

                if (err) {

                    console.error(
                        "DELETE PAYROLL ERROR:",
                        err
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Unable to delete payroll",

                        error:
                            err.sqlMessage ||
                            err.message

                    });

                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({

                        success: false,

                        message:
                            "Payroll record not found"

                    });

                }


                return res.json({

                    success: true,

                    message:
                        "Payroll deleted successfully"

                });

            }
        );

    }
);


// ==========================================
// TEST ROUTE
// ==========================================

router.get(
    "/test",
    (req, res) => {

        res.json({

            success: true,

            message:
                "Payroll route is working."

        });

    }
);


// ==========================================
// EXPORT
// ==========================================

module.exports = router;