const express = require("express");
const db = require("../config/db");

const router = express.Router();


// ==========================================
// GET ALL RECOGNITIONS
// ==========================================

router.get("/", (req, res) => {

    const sql = `
        SELECT
            r.id,
            r.from_user_id,
            r.to_employee_id,
            r.title,
            r.message,
            r.created_at,

            e.first_name,
            e.last_name,
            e.employee_code,
            e.department,
            e.designation

        FROM recognition r

        LEFT JOIN employees e
            ON r.to_employee_id = e.id

        ORDER BY r.id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "GET RECOGNITIONS ERROR:",
                err
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load recognitions",
                error: err.sqlMessage || err.message
            });

        }

        res.json({
            success: true,
            recognitions: results
        });

    });

});


// ==========================================
// ADD RECOGNITION
// ==========================================

router.post("/", (req, res) => {

    const {
        from_user_id,
        to_employee_id,
        title,
        message
    } = req.body;


    // ======================================
    // VALIDATION
    // ======================================

    if (!from_user_id) {

        return res.status(400).json({
            success: false,
            message: "User ID is required"
        });

    }


    if (!to_employee_id) {

        return res.status(400).json({
            success: false,
            message: "Employee is required"
        });

    }


    if (!title || !title.trim()) {

        return res.status(400).json({
            success: false,
            message: "Recognition title is required"
        });

    }


    if (!message || !message.trim()) {

        return res.status(400).json({
            success: false,
            message: "Recognition message is required"
        });

    }


    // ======================================
    // CHECK USER
    // ======================================

    const userSql = `
        SELECT id
        FROM users
        WHERE id = ?
        LIMIT 1
    `;


    db.query(
        userSql,
        [Number(from_user_id)],
        (userError, userResult) => {

            if (userError) {

                console.error(
                    "CHECK USER ERROR:",
                    userError
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to verify user",
                    error:
                        userError.sqlMessage ||
                        userError.message
                });

            }


            if (!userResult.length) {

                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });

            }


            // ==================================
            // CHECK EMPLOYEE
            // ==================================

            const employeeSql = `
                SELECT id
                FROM employees
                WHERE id = ?
                LIMIT 1
            `;


            db.query(
                employeeSql,
                [Number(to_employee_id)],
                (employeeError, employeeResult) => {

                    if (employeeError) {

                        console.error(
                            "CHECK EMPLOYEE ERROR:",
                            employeeError
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Unable to verify employee",
                            error:
                                employeeError.sqlMessage ||
                                employeeError.message
                        });

                    }


                    if (!employeeResult.length) {

                        return res.status(404).json({
                            success: false,
                            message:
                                "Employee not found"
                        });

                    }


                    // ==================================
                    // INSERT RECOGNITION
                    // ==================================

                    const insertSql = `
                        INSERT INTO recognition
                        (
                            from_user_id,
                            to_employee_id,
                            title,
                            message
                        )
                        VALUES
                        (
                            ?,
                            ?,
                            ?,
                            ?
                        )
                    `;


                    db.query(
                        insertSql,
                        [
                            Number(from_user_id),
                            Number(to_employee_id),
                            title.trim(),
                            message.trim()
                        ],
                        (insertError, insertResult) => {

                            if (insertError) {

                                console.error(
                                    "INSERT RECOGNITION ERROR:",
                                    insertError
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Unable to save recognition",
                                    error:
                                        insertError.sqlMessage ||
                                        insertError.message
                                });

                            }


                            // ==================================
                            // SUCCESS
                            // ==================================

                            res.status(201).json({

                                success: true,

                                message:
                                    "Recognition added successfully",

                                recognition: {

                                    id:
                                        insertResult.insertId,

                                    from_user_id:
                                        Number(from_user_id),

                                    to_employee_id:
                                        Number(to_employee_id),

                                    title:
                                        title.trim(),

                                    message:
                                        message.trim()

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
// TEST ROUTE
// ==========================================

router.get("/test", (req, res) => {

    res.json({
        success: true,
        message:
            "Recognition TEST route is working"
    });

});


module.exports = router;