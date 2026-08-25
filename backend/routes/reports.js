// ==========================================
// SmartHR REPORTS ROUTES
// ==========================================

const express = require("express");
const db = require("../config/db");

const router = express.Router();


// ==========================================
// EMPLOYEE REPORT
// GET /api/reports/employees
// ==========================================

router.get("/employees", (req, res) => {

    const sql = `
        SELECT
            e.id,
            e.employee_code,
            e.first_name,
            e.last_name,
            e.phone,
            e.department,
            e.designation,
            e.joining_date,
            e.salary,
            e.status,
            e.manager_id,

            CONCAT(
                e.first_name,
                ' ',
                COALESCE(e.last_name, '')
            ) AS employee_name

        FROM employees e

        ORDER BY e.id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "EMPLOYEE REPORT ERROR:",
                err
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load employee report",
                error: err.sqlMessage || err.message
            });

        }


        return res.json({

            success: true,

            count: results.length,

            employees: results

        });

    });

});


// ==========================================
// ATTENDANCE REPORT
// GET /api/reports/attendance
// ==========================================

router.get("/attendance", (req, res) => {

    const sql = `
        SELECT
            a.id,
            a.employee_id,
            CONCAT(
                e.first_name,
                ' ',
                COALESCE(e.last_name, '')
            ) AS employee_name,
            e.employee_code,
            e.department,
            a.attendance_date,
            a.check_in,
            a.check_out,
            a.status

        FROM attendance a

        LEFT JOIN employees e
            ON e.id = a.employee_id

        ORDER BY a.attendance_date DESC, a.id DESC
    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "ATTENDANCE REPORT ERROR:",
                err
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load attendance report",
                error: err.sqlMessage || err.message
            });

        }


        return res.json({

            success: true,

            count: results.length,

            attendance: results

        });

    });

});


// ==========================================
// LEAVE REPORT
// GET /api/reports/leaves
// ==========================================

router.get("/leaves", (req, res) => {

    const sql = `
        SELECT
            lr.id,
            lr.employee_id,

            CONCAT(
                e.first_name,
                ' ',
                COALESCE(e.last_name, '')
            ) AS employee_name,

            e.employee_code,
            e.department,

            lt.name AS leave_type,

            lr.start_date,
            lr.end_date,
            DATEDIFF(
                lr.end_date,
                lr.start_date
            ) + 1 AS days,

            lr.reason,
            lr.status,
            lr.approved_by,
            lr.created_at

        FROM leave_requests lr

        LEFT JOIN employees e
            ON e.id = lr.employee_id

        LEFT JOIN leave_types lt
            ON lt.id = lr.leave_type_id

        ORDER BY lr.created_at DESC
    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "LEAVE REPORT ERROR:",
                err
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load leave report",
                error: err.sqlMessage || err.message
            });

        }


        return res.json({

            success: true,

            count: results.length,

            leaves: results

        });

    });

});


// ==========================================
// PAYROLL REPORT
// GET /api/reports/payroll
// ==========================================

router.get("/payroll", (req, res) => {

    const sql = `
        SELECT
            p.id,
            p.employee_id,

            CONCAT(
                e.first_name,
                ' ',
                COALESCE(e.last_name, '')
            ) AS employee_name,

            e.employee_code,
            e.department,

            p.month,
            p.year,
            p.basic_salary,
            p.allowances,
            p.deductions,
            p.gross_salary,
            p.net_salary,
            p.payment_status,
            p.created_at

        FROM payroll p

        LEFT JOIN employees e
            ON e.id = p.employee_id

        ORDER BY p.year DESC, p.month DESC, p.id DESC
    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "PAYROLL REPORT ERROR:",
                err
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load payroll report",
                error: err.sqlMessage || err.message
            });

        }


        return res.json({

            success: true,

            count: results.length,

            payroll: results

        });

    });

});


// ==========================================
// EXPORT
// ==========================================

module.exports = router;