// =====================================================
// SmartHR - LEAVE ROUTES
// Uses: leave_requests table
// =====================================================

const express = require("express");
const db = require("../config/db");

const router = express.Router();


// =====================================================
// HELPER - CALCULATE DAYS
// =====================================================

function calculateDays(startDate, endDate) {

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {
        return 0;
    }

    const difference =
        end.getTime() - start.getTime();

    return (
        Math.floor(
            difference / (1000 * 60 * 60 * 24)
        ) + 1
    );
}


// =====================================================
// GET LEAVE TYPES
// GET /api/leave/types
// =====================================================

router.get("/types", (req, res) => {

    const sql = `
        SELECT
            id,
            name,
            total_days
        FROM leave_types
        ORDER BY id ASC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.error("LEAVE TYPES ERROR:", err);

            return res.status(500).json({
                success: false,
                message: "Unable to fetch leave types.",
                error: err.sqlMessage || err.message
            });
        }

        return res.json({
            success: true,
            leaveTypes: results
        });
    });
});


// =====================================================
// EMPLOYEE - APPLY LEAVE
// POST /api/leave/apply
// =====================================================

router.post("/apply", (req, res) => {

    const userId = Number(req.body.userId);
    const leaveTypeId = Number(req.body.leave_type_id);
    const startDate = req.body.start_date;
    const endDate = req.body.end_date;
    const reason = req.body.reason
        ? String(req.body.reason).trim()
        : null;


    // =================================================
    // VALIDATION
    // =================================================

    if (
        !userId ||
        !leaveTypeId ||
        !startDate ||
        !endDate
    ) {

        return res.status(400).json({
            success: false,
            message: "Please fill all required fields."
        });
    }


    // =================================================
    // DATE FORMAT
    // =================================================

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (
        !datePattern.test(startDate) ||
        !datePattern.test(endDate)
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid date format."
        });
    }


    // =================================================
    // CALCULATE DAYS
    // =================================================

    const days = calculateDays(
        startDate,
        endDate
    );


    if (days <= 0) {

        return res.status(400).json({
            success: false,
            message: "End date cannot be before start date."
        });
    }


    // =================================================
    // FIND EMPLOYEE
    //
    // users.id
    //     ↓
    // employees.user_id
    //     ↓
    // employees.id
    //     ↓
    // leave_requests.employee_id
    // =================================================

    const employeeSql = `
        SELECT
            id,
            user_id,
            employee_code,
            first_name,
            last_name,
            department,
            designation,
            status
        FROM employees
        WHERE user_id = ?
        LIMIT 1
    `;

    db.query(
        employeeSql,
        [userId],
        (employeeErr, employeeResults) => {

            if (employeeErr) {

                console.error(
                    "FIND EMPLOYEE ERROR:",
                    employeeErr
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to find employee.",
                    error:
                        employeeErr.sqlMessage ||
                        employeeErr.message
                });
            }


            if (!employeeResults.length) {

                return res.status(404).json({
                    success: false,
                    message: "Employee profile not found."
                });
            }


            const employee = employeeResults[0];


            // =================================================
            // CHECK ACTIVE EMPLOYEE
            // =================================================

            if (
                employee.status &&
                employee.status !== "active"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Inactive employees cannot apply for leave."
                });
            }


            // =================================================
            // GET LEAVE TYPE
            // =================================================

            const leaveTypeSql = `
                SELECT
                    id,
                    name,
                    total_days
                FROM leave_types
                WHERE id = ?
                LIMIT 1
            `;

            db.query(
                leaveTypeSql,
                [leaveTypeId],
                (typeErr, typeResults) => {

                    if (typeErr) {

                        console.error(
                            "LEAVE TYPE ERROR:",
                            typeErr
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Unable to verify leave type.",
                            error:
                                typeErr.sqlMessage ||
                                typeErr.message
                        });
                    }


                    if (!typeResults.length) {

                        return res.status(404).json({
                            success: false,
                            message:
                                "Selected leave type does not exist."
                        });
                    }


                    const leaveType =
                        typeResults[0];


                    // =================================================
                    // CHECK OVERLAPPING LEAVE
                    // =================================================

                    const overlapSql = `
                        SELECT id
                        FROM leave_requests
                        WHERE employee_id = ?
                        AND status IN ('pending', 'approved')
                        AND start_date <= ?
                        AND end_date >= ?
                        LIMIT 1
                    `;

                    db.query(
                        overlapSql,
                        [
                            employee.id,
                            endDate,
                            startDate
                        ],
                        (overlapErr, overlapResults) => {

                            if (overlapErr) {

                                console.error(
                                    "LEAVE OVERLAP ERROR:",
                                    overlapErr
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Unable to check existing leaves.",
                                    error:
                                        overlapErr.sqlMessage ||
                                        overlapErr.message
                                });
                            }


                            if (overlapResults.length) {

                                return res.status(409).json({
                                    success: false,
                                    message:
                                        "You already have a pending or approved leave for these dates."
                                });
                            }


                            // =================================================
                            // INSERT INTO ACTUAL TABLE
                            // =================================================

                            const insertSql = `
                                INSERT INTO leave_requests
                                (
                                    employee_id,
                                    leave_type_id,
                                    start_date,
                                    end_date,
                                    reason,
                                    status
                                )
                                VALUES
                                (?, ?, ?, ?, ?, 'pending')
                            `;

                            db.query(
                                insertSql,
                                [
                                    employee.id,
                                    leaveTypeId,
                                    startDate,
                                    endDate,
                                    reason
                                ],
                                (insertErr, result) => {

                                    if (insertErr) {

                                        console.error(
                                            "INSERT LEAVE ERROR:",
                                            insertErr
                                        );

                                        return res.status(500).json({
                                            success: false,
                                            message:
                                                "Unable to submit leave request.",
                                            error:
                                                insertErr.sqlMessage ||
                                                insertErr.message
                                        });
                                    }


                                    // =================================================
                                    // SUCCESS
                                    // =================================================

                                    return res.status(201).json({

                                        success: true,

                                        message:
                                            "Leave request submitted successfully.",

                                        leaveRequestId:
                                            result.insertId,

                                        days: days,

                                        start_date:
                                            startDate,

                                        end_date:
                                            endDate,

                                        status:
                                            "pending",

                                        employee: {

                                            id:
                                                employee.id,

                                            user_id:
                                                employee.user_id,

                                            employee_code:
                                                employee.employee_code,

                                            name:
                                                `${employee.first_name} ${employee.last_name || ""}`
                                                    .trim(),

                                            department:
                                                employee.department,

                                            designation:
                                                employee.designation
                                        },

                                        leaveType: {

                                            id:
                                                leaveType.id,

                                            name:
                                                leaveType.name,

                                            total_days:
                                                leaveType.total_days
                                        }
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});


// =====================================================
// EMPLOYEE - MY LEAVES
// GET /api/leave/my/:userId
// =====================================================

router.get("/my/:userId", (req, res) => {

    const userId =
        Number(req.params.userId);


    if (!userId) {

        return res.status(400).json({
            success: false,
            message: "Invalid user ID."
        });
    }


    const sql = `
        SELECT

            lr.id,

            lr.employee_id,

            lr.leave_type_id,

            lt.name AS leave_type,

            lt.total_days,

            DATE_FORMAT(
                lr.start_date,
                '%Y-%m-%d'
            ) AS start_date,

            DATE_FORMAT(
                lr.end_date,
                '%Y-%m-%d'
            ) AS end_date,

            DATEDIFF(
                lr.end_date,
                lr.start_date
            ) + 1 AS days,

            lr.reason,

            lr.status,

            lr.approved_by,

            lr.created_at,

            e.user_id,

            e.employee_code,

            e.first_name,

            e.last_name,

            e.department,

            e.designation,

            CONCAT(
                e.first_name,
                ' ',
                COALESCE(e.last_name, '')
            ) AS employee_name

        FROM leave_requests lr

        INNER JOIN employees e
            ON lr.employee_id = e.id

        INNER JOIN leave_types lt
            ON lr.leave_type_id = lt.id

        WHERE e.user_id = ?

        ORDER BY
            lr.created_at DESC
    `;


    db.query(
        sql,
        [userId],
        (err, results) => {

            if (err) {

                console.error(
                    "MY LEAVES ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to fetch your leaves.",
                    error:
                        err.sqlMessage ||
                        err.message
                });
            }


            return res.json({

                success: true,

                leaves: results

            });
        }
    );
});


// =====================================================
// HR - ALL LEAVES
// GET /api/leave/all
// =====================================================

router.get("/all", (req, res) => {

    const sql = `
        SELECT

            lr.id,

            lr.employee_id,

            lr.leave_type_id,

            lt.name AS leave_type,

            lt.total_days,

            DATE_FORMAT(
                lr.start_date,
                '%Y-%m-%d'
            ) AS start_date,

            DATE_FORMAT(
                lr.end_date,
                '%Y-%m-%d'
            ) AS end_date,

            DATEDIFF(
                lr.end_date,
                lr.start_date
            ) + 1 AS days,

            lr.reason,

            lr.status,

            lr.approved_by,

            lr.created_at,

            e.user_id,

            e.employee_code,

            e.first_name,

            e.last_name,

            CONCAT(
                e.first_name,
                ' ',
                COALESCE(e.last_name, '')
            ) AS employee_name,

            e.department,

            e.designation

        FROM leave_requests lr

        INNER JOIN employees e
            ON lr.employee_id = e.id

        INNER JOIN leave_types lt
            ON lr.leave_type_id = lt.id

        ORDER BY

            CASE

                WHEN lr.status = 'pending'
                    THEN 0

                WHEN lr.status = 'approved'
                    THEN 1

                ELSE 2

            END,

            lr.created_at DESC
    `;


    db.query(
        sql,
        (err, results) => {

            if (err) {

                console.error(
                    "ALL LEAVES ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to fetch leave requests.",
                    error:
                        err.sqlMessage ||
                        err.message
                });
            }


            return res.json({

                success: true,

                leaves: results

            });
        }
    );
});


// =====================================================
// MANAGER - DEPARTMENT LEAVES
// GET /api/leave/department/:department
// =====================================================

router.get(
    "/department/:department",
    (req, res) => {

        const department =
            decodeURIComponent(
                req.params.department
            ).trim();


        if (!department) {

            return res.status(400).json({
                success: false,
                message:
                    "Department is required."
            });
        }


        const sql = `
            SELECT

                lr.id,

                lr.employee_id,

                lr.leave_type_id,

                lt.name AS leave_type,

                lt.total_days,

                DATE_FORMAT(
                    lr.start_date,
                    '%Y-%m-%d'
                ) AS start_date,

                DATE_FORMAT(
                    lr.end_date,
                    '%Y-%m-%d'
                ) AS end_date,

                DATEDIFF(
                    lr.end_date,
                    lr.start_date
                ) + 1 AS days,

                lr.reason,

                lr.status,

                lr.approved_by,

                lr.created_at,

                e.user_id,

                e.employee_code,

                e.first_name,

                e.last_name,

                e.department,

                e.designation,

                CONCAT(
                    e.first_name,
                    ' ',
                    COALESCE(e.last_name, '')
                ) AS employee_name

            FROM leave_requests lr

            INNER JOIN employees e
                ON lr.employee_id = e.id

            INNER JOIN leave_types lt
                ON lr.leave_type_id = lt.id

            WHERE e.department = ?

            ORDER BY

                CASE

                    WHEN lr.status = 'pending'
                        THEN 0

                    WHEN lr.status = 'approved'
                        THEN 1

                    ELSE 2

                END,

                lr.created_at DESC
        `;


        db.query(
            sql,
            [department],
            (err, results) => {

                if (err) {

                    console.error(
                        "DEPARTMENT LEAVES ERROR:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to fetch department leaves.",
                        error:
                            err.sqlMessage ||
                            err.message
                    });
                }


                return res.json({

                    success: true,

                    department:
                        department,

                    leaves:
                        results

                });
            }
        );
    }
);


// =====================================================
// APPROVE LEAVE
// PUT /api/leave/:leaveId/approve
// =====================================================

router.put(
    "/:leaveId/approve",
    (req, res) => {

        const leaveId =
            Number(req.params.leaveId);

        const approvedBy =
            req.body.approved_by
                ? Number(req.body.approved_by)
                : null;


        if (!leaveId) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid leave ID."
            });
        }


        const sql = `
            UPDATE leave_requests

            SET
                status = 'approved',
                approved_by = ?

            WHERE id = ?
            AND status = 'pending'
        `;


        db.query(
            sql,
            [
                approvedBy,
                leaveId
            ],
            (err, result) => {

                if (err) {

                    console.error(
                        "APPROVE LEAVE ERROR:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to approve leave.",
                        error:
                            err.sqlMessage ||
                            err.message
                    });
                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Leave request is already processed or not found."
                    });
                }


                return res.json({

                    success: true,

                    message:
                        "Leave request approved successfully."

                });
            }
        );
    }
);


// =====================================================
// REJECT LEAVE
// PUT /api/leave/:leaveId/reject
// =====================================================

router.put(
    "/:leaveId/reject",
    (req, res) => {

        const leaveId =
            Number(req.params.leaveId);

        const approvedBy =
            req.body.approved_by
                ? Number(req.body.approved_by)
                : null;


        if (!leaveId) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid leave ID."
            });
        }


        const sql = `
            UPDATE leave_requests

            SET
                status = 'rejected',
                approved_by = ?

            WHERE id = ?
            AND status = 'pending'
        `;


        db.query(
            sql,
            [
                approvedBy,
                leaveId
            ],
            (err, result) => {

                if (err) {

                    console.error(
                        "REJECT LEAVE ERROR:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to reject leave.",
                        error:
                            err.sqlMessage ||
                            err.message
                    });
                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Leave request is already processed or not found."
                    });
                }


                return res.json({

                    success: true,

                    message:
                        "Leave request rejected successfully."

                });
            }
        );
    }
);


// =====================================================
// TEST
// GET /api/leave/test
// =====================================================

router.get("/test", (req, res) => {

    return res.json({

        success: true,

        message:
            "Leave route is working correctly."

    });
});


// =====================================================
// EXPORT
// =====================================================

module.exports = router;