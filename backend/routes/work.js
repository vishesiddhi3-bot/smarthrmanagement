// =====================================================
// SmartHR - WORK / TASK ROUTES
// Employee + HR/Admin Task Management
// =====================================================

const express = require("express");
const db = require("../config/db");

const router = express.Router();


// =====================================================
// TEST ROUTE
// IMPORTANT: KEEP BEFORE /:taskId
// =====================================================

router.get("/test/check", (req, res) => {

    return res.json({
        success: true,
        message: "Work route is working."
    });

});


// =====================================================
// GET ALL EMPLOYEES FOR HR ASSIGN TASK
// employee.id = employee_tasks.employee_id
// =====================================================

router.get("/employees", (req, res) => {

    const sql = `
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
        WHERE LOWER(TRIM(status)) = 'active'
        ORDER BY first_name ASC, last_name ASC
    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "TASK EMPLOYEES ERROR:",
                err
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load employees",

                error:
                    err.sqlMessage ||
                    err.message

            });

        }


        console.log(
            "ACTIVE EMPLOYEES FOR TASK:",
            results
        );


        return res.json({

            success: true,

            employees:
                results || []

        });

    });

});


// =====================================================
// HR / ADMIN - ASSIGN NEW TASK
// =====================================================

router.post("/assign", (req, res) => {

    const employeeId =
        Number(req.body.employee_id);

    const title =
        String(
            req.body.title || ""
        ).trim();

    const description =
        String(
            req.body.description || ""
        ).trim();

    const priority =
        String(
            req.body.priority || "medium"
        ).toLowerCase();

    const dueDate =
        req.body.due_date || null;


    // =================================================
    // VALIDATION
    // =================================================

    if (
        !Number.isInteger(employeeId) ||
        employeeId <= 0
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Invalid employee ID."

        });

    }


    if (!title) {

        return res.status(400).json({

            success: false,

            message:
                "Task title is required."

        });

    }


    const allowedPriorities = [

        "low",
        "medium",
        "high",
        "urgent"

    ];


    if (
        !allowedPriorities.includes(
            priority
        )
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Invalid task priority."

        });

    }


    // =================================================
    // CHECK EMPLOYEE
    // =================================================

    const employeeSql = `

        SELECT

            id,
            user_id,
            employee_code,
            first_name,
            last_name,
            department,
            designation

        FROM employees

        WHERE id = ?

        AND LOWER(TRIM(status)) = 'active'

        LIMIT 1

    `;


    db.query(
        employeeSql,
        [employeeId],
        (employeeErr, employeeResults) => {

            if (employeeErr) {

                console.error(
                    "CHECK EMPLOYEE ERROR:",
                    employeeErr
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Database error",

                    error:
                        employeeErr.sqlMessage ||
                        employeeErr.message

                });

            }


            if (
                !employeeResults ||
                employeeResults.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Employee not found or inactive."

                });

            }


            const employee =
                employeeResults[0];


            // =================================================
            // INSERT TASK
            // =================================================

            const insertSql = `

                INSERT INTO employee_tasks
                (
                    employee_id,
                    title,
                    description,
                    priority,
                    status,
                    due_date,
                    assigned_at
                )

                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    'pending',
                    ?,
                    NOW()
                )

            `;


            db.query(
                insertSql,
                [
                    employeeId,
                    title,
                    description || null,
                    priority,
                    dueDate
                ],
                (insertErr, result) => {

                    if (insertErr) {

                        console.error(
                            "ASSIGN TASK ERROR:",
                            insertErr
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Unable to assign task",

                            error:
                                insertErr.sqlMessage ||
                                insertErr.message

                        });

                    }


                    return res.status(201).json({

                        success: true,

                        message:
                            "Task assigned successfully.",

                        task: {

                            id:
                                result.insertId,

                            employee_id:
                                employeeId,

                            employee_name:
                                (
                                    employee.first_name +
                                    " " +
                                    (
                                        employee.last_name ||
                                        ""
                                    )
                                ).trim(),

                            employee_code:
                                employee.employee_code,

                            title:
                                title,

                            description:
                                description,

                            priority:
                                priority,

                            status:
                                "pending",

                            due_date:
                                dueDate

                        }

                    });

                }
            );

        }
    );

});


// =====================================================
// HR / ADMIN - GET ALL TASKS
// =====================================================

router.get("/", (req, res) => {

    const sql = `

        SELECT

            t.id,
            t.employee_id,
            t.title,
            t.description,
            t.priority,
            t.status,

            DATE_FORMAT(
                t.due_date,
                '%Y-%m-%d'
            ) AS due_date,

            DATE_FORMAT(
                t.assigned_at,
                '%Y-%m-%d %H:%i:%s'
            ) AS assigned_at,

            t.completed_at,

            e.employee_code,
            e.first_name,
            e.last_name,
            e.department,
            e.designation

        FROM employee_tasks t

        INNER JOIN employees e
            ON t.employee_id = e.id

        ORDER BY
            t.id DESC

    `;


    db.query(
        sql,
        (err, results) => {

            if (err) {

                console.error(
                    "ALL TASKS ERROR:",
                    err
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to fetch tasks",

                    error:
                        err.sqlMessage ||
                        err.message

                });

            }


            return res.json({

                success: true,

                tasks:
                    results || []

            });

        }
    );

});


// =====================================================
// EMPLOYEE - GET MY WORK
// IMPORTANT:
// URL userId = users.id
// employees.user_id = users.id
// =====================================================

router.get("/my/:userId", (req, res) => {

    const userId =
        Number(req.params.userId);


    if (
        !Number.isInteger(userId) ||
        userId <= 0
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Invalid user ID."

        });

    }


    const sql = `

        SELECT

            t.id,
            t.employee_id,
            t.title,
            t.description,
            t.priority,
            t.status,

            DATE_FORMAT(
                t.due_date,
                '%Y-%m-%d'
            ) AS due_date,

            DATE_FORMAT(
                t.assigned_at,
                '%Y-%m-%d %H:%i:%s'
            ) AS assigned_at,

            t.completed_at,

            e.employee_code,
            e.first_name,
            e.last_name,
            e.department,
            e.designation

        FROM employee_tasks t

        INNER JOIN employees e
            ON t.employee_id = e.id

        WHERE e.user_id = ?

        ORDER BY

            CASE
                WHEN t.status = 'in_progress'
                    THEN 0
                WHEN t.status = 'pending'
                    THEN 1
                WHEN t.status = 'completed'
                    THEN 2
                ELSE 3
            END,

            CASE
                WHEN t.priority = 'urgent'
                    THEN 0
                WHEN t.priority = 'high'
                    THEN 1
                WHEN t.priority = 'medium'
                    THEN 2
                ELSE 3
            END,

            t.due_date ASC,

            t.id DESC

    `;


    db.query(
        sql,
        [userId],
        (err, results) => {

            if (err) {

                console.error(
                    "MY WORK ERROR:",
                    err
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to fetch assigned work",

                    error:
                        err.sqlMessage ||
                        err.message

                });

            }


            console.log(
                "MY WORK USER:",
                userId,
                "TASKS:",
                results
            );


            return res.json({

                success: true,

                message:
                    "Employee work loaded successfully",

                tasks:
                    results || []

            });

        }
    );

});


// =====================================================
// EMPLOYEE - UPDATE TASK STATUS
// IMPORTANT: KEEP BEFORE /:taskId
// =====================================================

router.put(
    "/:taskId/status",
    (req, res) => {

        const taskId =
            Number(req.params.taskId);

        const userId =
            Number(req.body.userId);

        const status =
            String(
                req.body.status || ""
            ).toLowerCase().trim();


        console.log(
            "UPDATE TASK REQUEST:",
            {
                taskId,
                userId,
                status
            }
        );


        // =================================================
        // VALIDATE TASK ID
        // =================================================

        if (
            !Number.isInteger(taskId) ||
            taskId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid task ID."

            });

        }


        // =================================================
        // VALIDATE USER ID
        // =================================================

        if (
            !Number.isInteger(userId) ||
            userId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid user ID."

            });

        }


        // =================================================
        // VALIDATE STATUS
        // =================================================

        const allowedStatuses = [

            "pending",
            "in_progress",
            "completed"

        ];


        if (
            !allowedStatuses.includes(
                status
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid task status."

            });

        }


        // =================================================
        // CHECK TASK + EMPLOYEE OWNERSHIP
        // =================================================

        const checkSql = `

            SELECT

                t.id,
                t.employee_id,
                e.user_id

            FROM employee_tasks t

            INNER JOIN employees e
                ON t.employee_id = e.id

            WHERE
                t.id = ?
                AND e.user_id = ?

            LIMIT 1

        `;


        db.query(
            checkSql,
            [
                taskId,
                userId
            ],
            (checkErr, checkResults) => {

                if (checkErr) {

                    console.error(
                        "TASK OWNERSHIP ERROR:",
                        checkErr
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Database error",

                        error:
                            checkErr.sqlMessage ||
                            checkErr.message

                    });

                }


                if (
                    !checkResults ||
                    checkResults.length === 0
                ) {

                    return res.status(404).json({

                        success: false,

                        message:
                            "Task not found for this employee."

                    });

                }


                // =================================================
                // UPDATE TASK
                // =================================================

                const updateSql = `

                    UPDATE employee_tasks

                    SET

                        status = ?,

                        completed_at =
                            CASE

                                WHEN ? = 'completed'
                                    THEN NOW()

                                ELSE NULL

                            END

                    WHERE id = ?

                `;


                db.query(
                    updateSql,
                    [
                        status,
                        status,
                        taskId
                    ],
                    (updateErr, result) => {

                        if (updateErr) {

                            console.error(
                                "TASK STATUS UPDATE ERROR:",
                                updateErr
                            );

                            return res.status(500).json({

                                success: false,

                                message:
                                    "Unable to update task status",

                                error:
                                    updateErr.sqlMessage ||
                                    updateErr.message

                            });

                        }


                        return res.json({

                            success: true,

                            message:
                                "Task status updated successfully",

                            taskId:
                                taskId,

                            status:
                                status

                        });

                    }
                );

            }
        );

    }
);


// =====================================================
// GET SINGLE TASK
// KEEP THIS LAST
// =====================================================

router.get("/:taskId", (req, res) => {

    const taskId =
        Number(req.params.taskId);


    if (
        !Number.isInteger(taskId) ||
        taskId <= 0
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Invalid task ID."

        });

    }


    const sql = `

        SELECT

            t.id,
            t.employee_id,
            t.title,
            t.description,
            t.priority,
            t.status,

            DATE_FORMAT(
                t.due_date,
                '%Y-%m-%d'
            ) AS due_date,

            DATE_FORMAT(
                t.assigned_at,
                '%Y-%m-%d %H:%i:%s'
            ) AS assigned_at,

            t.completed_at,

            e.employee_code,
            e.first_name,
            e.last_name,
            e.department,
            e.designation

        FROM employee_tasks t

        INNER JOIN employees e
            ON t.employee_id = e.id

        WHERE t.id = ?

        LIMIT 1

    `;


    db.query(
        sql,
        [taskId],
        (err, results) => {

            if (err) {

                console.error(
                    "TASK DETAILS ERROR:",
                    err
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to fetch task",

                    error:
                        err.sqlMessage ||
                        err.message

                });

            }


            if (
                !results ||
                results.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Task not found."

                });

            }


            return res.json({

                success: true,

                task:
                    results[0]

            });

        }
    );

});


// =====================================================
// EXPORT
// =====================================================

module.exports = router;