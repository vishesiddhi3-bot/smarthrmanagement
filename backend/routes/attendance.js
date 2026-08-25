// ==========================================
// SmartHR - ATTENDANCE ROUTES
// ==========================================

const express = require("express");
const db = require("../config/db");

const router = express.Router();


// ==========================================
// GET TODAY'S ATTENDANCE
// ==========================================

router.get("/today/:userId", (req, res) => {

    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "User ID is required"
        });
    }

    const sql = `
        SELECT
            a.id,
            a.employee_id,
            a.attendance_date,
            a.check_in,
            a.check_out,
            a.status
        FROM attendance a

        INNER JOIN employees e
            ON a.employee_id = e.id

        WHERE e.user_id = ?
        AND a.attendance_date = CURDATE()

        LIMIT 1
    `;

    db.query(
        sql,
        [userId],
        (err, results) => {

            if (err) {

                console.error(
                    "TODAY ATTENDANCE ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Database error",
                    error: err.sqlMessage
                });
            }

            if (results.length === 0) {

                return res.json({
                    success: true,
                    attendance: null
                });
            }

            return res.json({
                success: true,
                attendance: results[0]
            });

        }
    );

});


// ==========================================
// CHECK IN
// ==========================================

router.post("/check-in", (req, res) => {

    const {
        userId
    } = req.body;

    if (!userId) {

        return res.status(400).json({
            success: false,
            message: "User ID is required"
        });
    }


    // FIND EMPLOYEE
    const employeeSql = `
        SELECT id
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
                    "EMPLOYEE CHECK ERROR:",
                    employeeErr
                );

                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }


            if (employeeResults.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Employee profile not found"
                });
            }


            const employeeId =
                employeeResults[0].id;


            // CHECK TODAY'S ATTENDANCE

            const checkSql = `
                SELECT
                    id,
                    check_in,
                    check_out,
                    status
                FROM attendance
                WHERE employee_id = ?
                AND attendance_date = CURDATE()
                LIMIT 1
            `;

            db.query(
                checkSql,
                [employeeId],
                (checkErr, checkResults) => {

                    if (checkErr) {

                        console.error(
                            "ATTENDANCE CHECK ERROR:",
                            checkErr
                        );

                        return res.status(500).json({
                            success: false,
                            message: "Database error"
                        });
                    }


                    if (checkResults.length > 0) {

                        return res.status(409).json({

                            success: false,

                            message:
                                "Attendance is already marked for today.",

                            attendance:
                                checkResults[0]

                        });
                    }


                    // INSERT ATTENDANCE

                    const insertSql = `
                        INSERT INTO attendance
                        (
                            employee_id,
                            attendance_date,
                            check_in,
                            status
                        )
                        VALUES
                        (
                            ?,
                            CURDATE(),
                            CURTIME(),
                            'present'
                        )
                    `;

                    db.query(
                        insertSql,
                        [employeeId],
                        (insertErr, result) => {

                            if (insertErr) {

                                console.error(
                                    "CHECK IN INSERT ERROR:",
                                    insertErr
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        insertErr.sqlMessage ||
                                        "Unable to mark attendance"
                                });
                            }


                            return res.status(201).json({

                                success: true,

                                message:
                                    "Attendance marked successfully.",

                                attendanceId:
                                    result.insertId

                            });

                        }
                    );

                }
            );

        }
    );

});


// ==========================================
// CHECK OUT
// ==========================================

// ==========================================
// CHECK OUT
// ==========================================

router.post("/check-out", (req, res) => {

    const {
        userId
    } = req.body;

    if (!userId) {

        return res.status(400).json({
            success: false,
            message: "User ID is required"
        });

    }


    // ==========================================
    // FIND TODAY'S ACTIVE ATTENDANCE
    // ==========================================

    const findSql = `
        SELECT
            a.id,
            a.employee_id,
            a.check_in,
            a.check_out,
            a.status
        FROM attendance a

        INNER JOIN employees e
            ON a.employee_id = e.id

        WHERE e.user_id = ?
        AND a.attendance_date = CURDATE()
        AND a.check_out IS NULL

        LIMIT 1
    `;


    db.query(
        findSql,
        [userId],
        (findErr, findResults) => {

            if (findErr) {

                console.error(
                    "CHECK OUT FIND ERROR:",
                    findErr
                );

                return res.status(500).json({
                    success: false,
                    message: "Database error",
                    error: findErr.sqlMessage
                });

            }


            if (findResults.length === 0) {

                return res.status(400).json({

                    success: false,

                    message:
                        "No active attendance found for today."

                });

            }


            const attendance =
                findResults[0];


            // ==========================================
            // CALCULATE WORKING HOURS
            // ==========================================

            const updateSql = `

                UPDATE attendance

                SET

                    check_out = CURTIME(),

                    status =

                        CASE

                            WHEN
                                TIMESTAMPDIFF(
                                    MINUTE,
                                    check_in,
                                    CURTIME()
                                ) < 240

                            THEN 'half_day'

                            ELSE 'present'

                        END

                WHERE id = ?

            `;


            db.query(
                updateSql,
                [attendance.id],
                (updateErr, updateResult) => {

                    if (updateErr) {

                        console.error(
                            "CHECK OUT UPDATE ERROR:",
                            updateErr
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Unable to complete check-out",

                            error:
                                updateErr.sqlMessage

                        });

                    }


                    if (
                        updateResult.affectedRows === 0
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Unable to update attendance."

                        });

                    }


                    // ==========================================
                    // GET UPDATED ATTENDANCE
                    // ==========================================

                    const getSql = `

                        SELECT
                            id,
                            employee_id,
                            attendance_date,
                            check_in,
                            check_out,
                            status

                        FROM attendance

                        WHERE id = ?

                        LIMIT 1

                    `;


                    db.query(
                        getSql,
                        [attendance.id],
                        (getErr, getResults) => {

                            if (getErr) {

                                console.error(
                                    "UPDATED ATTENDANCE ERROR:",
                                    getErr
                                );

                                return res.status(500).json({

                                    success: false,

                                    message:
                                        "Check-out completed but attendance could not be fetched."

                                });

                            }


                            return res.json({

                                success: true,

                                message:
                                    "Check-out successful.",

                                attendance:
                                    getResults[0]

                            });

                        }
                    );

                }
            );

        }
    );

});


// ==========================================
// GET EMPLOYEE ATTENDANCE HISTORY
// ==========================================

router.get("/employee/:employeeId", (req, res) => {

    const employeeId =
        req.params.employeeId;

    const sql = `
        SELECT
            id,
            employee_id,
            attendance_date,
            check_in,
            check_out,
            status
        FROM attendance
        WHERE employee_id = ?
        ORDER BY attendance_date DESC
    `;

    db.query(
        sql,
        [employeeId],
        (err, results) => {

            if (err) {

                console.error(
                    "EMPLOYEE ATTENDANCE ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }


            return res.json({

                success: true,

                attendance:
                    results

            });

        }
    );

});


// ==========================================
// GET ALL ATTENDANCE - ADMIN
// ==========================================

router.get("/", (req, res) => {

    const sql = `
        SELECT
            a.id,
            a.employee_id,
            a.attendance_date,
            a.check_in,
            a.check_out,
            a.status,

            e.employee_code,
            e.first_name,
            e.last_name,
            e.department,
            e.designation

        FROM attendance a

        INNER JOIN employees e
            ON a.employee_id = e.id

        ORDER BY
            a.attendance_date DESC,
            a.id DESC
    `;


    db.query(
        sql,
        (err, results) => {

            if (err) {

                console.error(
                    "ALL ATTENDANCE ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to fetch attendance",
                    error:
                        err.sqlMessage
                });

            }


            return res.json({

                success: true,

                attendance:
                    results

            });

        }
    );

});


// ==========================================
// TEST ROUTE
// ==========================================

router.get("/test", (req, res) => {

    res.json({

        success: true,

        message:
            "Attendance route is working."

    });

});


// ==========================================
// EXPORT
// ==========================================

module.exports = router;