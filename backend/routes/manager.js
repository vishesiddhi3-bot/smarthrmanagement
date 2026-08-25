// =====================================================
// SmartHR - MANAGER ROUTES
// =====================================================

const express = require("express");
const db = require("../config/db");

const router = express.Router();


// =====================================================
// GET DEPARTMENTS
// GET /api/manager/departments
// =====================================================

router.get("/departments", (req, res) => {

    const sql = `
        SELECT DISTINCT department
        FROM employees
        WHERE department IS NOT NULL
          AND TRIM(department) <> ''
        ORDER BY department ASC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error("MANAGER DEPARTMENTS ERROR:", err);

            return res.status(500).json({
                success: false,
                message: "Unable to load departments.",
                error: err.sqlMessage || err.message
            });
        }

        res.json({
            success: true,
            departments: results.map(row => ({
                id: row.department,
                name: row.department
            }))
        });
    });
});


// =====================================================
// GET MANAGER INFORMATION
// GET /api/manager/:managerId
// =====================================================

router.get("/:managerId", (req, res) => {

    const managerId = Number(req.params.managerId);

    if (!managerId) {
        return res.status(400).json({
            success: false,
            message: "Invalid manager ID."
        });
    }

    const sql = `
        SELECT
            u.id,
            u.username,
            u.email,
            u.role,

            e.id AS employee_id,
            e.employee_code,
            e.first_name,
            e.last_name,
            e.department,
            e.designation,
            e.phone,
            e.joining_date,
            e.status

        FROM users u

        LEFT JOIN employees e
            ON e.user_id = u.id

        WHERE u.id = ?

        LIMIT 1
    `;

    db.query(sql, [managerId], (err, results) => {

        if (err) {
            console.error("MANAGER INFO ERROR:", err);

            return res.status(500).json({
                success: false,
                message: "Unable to load manager information.",
                error: err.sqlMessage || err.message
            });
        }

        if (!results.length) {
            return res.status(404).json({
                success: false,
                message: "Manager not found."
            });
        }

        res.json({
            success: true,
            manager: results[0]
        });
    });
});


// =====================================================
// COMPLETE MANAGER DEPARTMENT DASHBOARD
// GET /api/manager/department/:department
// =====================================================

router.get("/department/:department", (req, res) => {

    const department = decodeURIComponent(
        req.params.department
    ).trim();

    if (!department) {
        return res.status(400).json({
            success: false,
            message: "Department is required."
        });
    }


    // =================================================
    // 1. EMPLOYEES
    // =================================================

    const employeeSql = `
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
            e.status,
            e.user_id,

            u.username,
            u.email

        FROM employees e

        LEFT JOIN users u
            ON e.user_id = u.id

        WHERE LOWER(TRIM(e.department))
            = LOWER(TRIM(?))

        ORDER BY
            e.first_name ASC,
            e.last_name ASC
    `;


    db.query(
        employeeSql,
        [department],
        (employeeError, employees) => {

            if (employeeError) {

                console.error(
                    "MANAGER EMPLOYEES ERROR:",
                    employeeError
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to load department employees.",
                    error:
                        employeeError.sqlMessage ||
                        employeeError.message
                });
            }


            const employeeIds = employees.map(
                employee => Number(employee.id)
            );


            // =================================================
            // NO EMPLOYEES
            // =================================================

            if (!employeeIds.length) {

                return res.json({

                    success: true,

                    department,

                    employees: [],
                    employee_details: [],

                    team: [],
                    attendance: [],

                    leaves: [],
                    leave_requests: [],

                    performance: [],
                    recognition: [],

                    progress: [],

                    stats: {
                        team_members: 0,
                        present_today: 0,
                        on_leave: 0,
                        pending_leaves: 0,
                        total_performance: 0,
                        total_recognition: 0,
                        total_tasks: 0,
                        completed_tasks: 0
                    }

                });
            }


            const placeholders =
                employeeIds.map(() => "?").join(",");


            // =================================================
            // 2. ATTENDANCE
            // =================================================

            const attendanceSql = `
                SELECT
                    a.*
                FROM attendance a
                WHERE a.employee_id IN (${placeholders})
                ORDER BY a.id DESC
            `;


            db.query(
                attendanceSql,
                employeeIds,
                (attendanceError, attendanceRows) => {

                    if (attendanceError) {

                        console.warn(
                            "ATTENDANCE WARNING:",
                            attendanceError.sqlMessage ||
                            attendanceError.message
                        );

                        attendanceRows = [];
                    }


                    // =================================================
                    // 3. LEAVES
                    //
                    // IMPORTANT:
                    // leave_requests uses employee_id
                    // NOT user_id
                    // =================================================

                    const leaveSql = `
                        SELECT

                            l.id,
                            l.employee_id,
                            l.leave_type_id,

                            lt.name AS leave_type,
                            lt.total_days,

                            DATE_FORMAT(
                                l.start_date,
                                '%Y-%m-%d'
                            ) AS start_date,

                            DATE_FORMAT(
                                l.end_date,
                                '%Y-%m-%d'
                            ) AS end_date,

                            DATEDIFF(
                                l.end_date,
                                l.start_date
                            ) + 1 AS days,

                            l.reason,
                            l.status,
                            l.approved_by,
                            l.created_at,

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

                        FROM leave_requests l

                        INNER JOIN employees e
                            ON l.employee_id = e.id

                        LEFT JOIN leave_types lt
                            ON l.leave_type_id = lt.id

                        WHERE l.employee_id IN (${placeholders})

                        ORDER BY
                            CASE
                                WHEN l.status = 'pending'
                                    THEN 0
                                WHEN l.status = 'approved'
                                    THEN 1
                                ELSE 2
                            END,

                            l.created_at DESC
                    `;


                    db.query(
                        leaveSql,
                        employeeIds,
                        (leaveError, leaveRows) => {

                            if (leaveError) {

                                console.error(
                                    "LEAVE ERROR:",
                                    leaveError
                                );

                                leaveRows = [];
                            }


                            // =================================================
                            // 4. PERFORMANCE
                            // =================================================

                            const performanceSql = `
                                SELECT

                                    p.id,
                                    p.employee_id,
                                    p.review_period,

                                    p.goals_score,
                                    p.productivity_score,
                                    p.quality_score,
                                    p.teamwork_score,
                                    p.overall_score,

                                    p.manager_comment,
                                    p.created_at,

                                    e.employee_code,
                                    e.first_name,
                                    e.last_name,
                                    e.department,
                                    e.designation

                                FROM performance p

                                INNER JOIN employees e
                                    ON p.employee_id = e.id

                                WHERE p.employee_id
                                    IN (${placeholders})

                                ORDER BY p.id DESC
                            `;


                            db.query(
                                performanceSql,
                                employeeIds,
                                (performanceError, performanceRows) => {

                                    if (performanceError) {

                                        console.warn(
                                            "PERFORMANCE WARNING:",
                                            performanceError.sqlMessage ||
                                            performanceError.message
                                        );

                                        performanceRows = [];
                                    }


                                    // =================================================
                                    // 5. RECOGNITION
                                    // =================================================

                                    const recognitionSql = `
                                        SELECT

                                            r.id,
                                            r.from_user_id,
                                            r.to_employee_id,
                                            r.title,
                                            r.message,
                                            r.created_at,

                                            e.employee_code,
                                            e.first_name,
                                            e.last_name,
                                            e.department,
                                            e.designation

                                        FROM recognition r

                                        INNER JOIN employees e
                                            ON r.to_employee_id = e.id

                                        WHERE r.to_employee_id
                                            IN (${placeholders})

                                        ORDER BY r.id DESC
                                    `;


                                    db.query(
                                        recognitionSql,
                                        employeeIds,
                                        (recognitionError, recognitionRows) => {

                                            if (recognitionError) {

                                                console.warn(
                                                    "RECOGNITION WARNING:",
                                                    recognitionError.sqlMessage ||
                                                    recognitionError.message
                                                );

                                                recognitionRows = [];
                                            }


                                            // =================================================
                                            // 6. TEAM PROGRESS / TASKS
                                            // =================================================

                                            const workSql = `
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

                                                WHERE t.employee_id
                                                    IN (${placeholders})

                                                ORDER BY t.id DESC
                                            `;


                                            db.query(
                                                workSql,
                                                employeeIds,
                                                (workError, workRows) => {

                                                    if (workError) {

                                                        console.warn(
                                                            "WORK WARNING:",
                                                            workError.sqlMessage ||
                                                            workError.message
                                                        );

                                                        workRows = [];
                                                    }


                                                    // =================================================
                                                    // EMPLOYEE MAP
                                                    // =================================================

                                                    const employeeMap = {};

                                                    employees.forEach(employee => {

                                                        employeeMap[
                                                            Number(employee.id)
                                                        ] = employee;

                                                    });


                                                    // =================================================
                                                    // ATTENDANCE NORMALIZATION
                                                    // =================================================

                                                    const attendance =
                                                        attendanceRows.map(row => {

                                                            const employee =
                                                                employeeMap[
                                                                    Number(
                                                                        row.employee_id
                                                                    )
                                                                ] || {};

                                                            return {

                                                                ...row,

                                                                employee_id:
                                                                    row.employee_id,

                                                                employee_name:
                                                                    `${employee.first_name || ""} ${employee.last_name || ""}`
                                                                        .trim(),

                                                                first_name:
                                                                    employee.first_name || "",

                                                                last_name:
                                                                    employee.last_name || "",

                                                                status:
                                                                    row.status ||
                                                                    "present"
                                                            };
                                                        });


                                                    // =================================================
                                                    // LEAVE NORMALIZATION
                                                    // =================================================

                                                    const leaves =
                                                        (leaveRows || []).map(
                                                            leave => {

                                                                const employee =
                                                                    employeeMap[
                                                                        Number(
                                                                            leave.employee_id
                                                                        )
                                                                    ] || {};

                                                                let days =
                                                                    Number(
                                                                        leave.days
                                                                    ) || 0;


                                                                // Fallback calculation
                                                                if (
                                                                    !days &&
                                                                    leave.start_date &&
                                                                    leave.end_date
                                                                ) {

                                                                    const start =
                                                                        new Date(
                                                                            `${String(
                                                                                leave.start_date
                                                                            ).substring(
                                                                                0,
                                                                                10
                                                                            )}T00:00:00`
                                                                        );

                                                                    const end =
                                                                        new Date(
                                                                            `${String(
                                                                                leave.end_date
                                                                            ).substring(
                                                                                0,
                                                                                10
                                                                            )}T00:00:00`
                                                                        );


                                                                    if (
                                                                        !isNaN(
                                                                            start.getTime()
                                                                        ) &&
                                                                        !isNaN(
                                                                            end.getTime()
                                                                        )
                                                                    ) {

                                                                        days =
                                                                            Math.floor(
                                                                                (
                                                                                    end.getTime() -
                                                                                    start.getTime()
                                                                                ) /
                                                                                (
                                                                                    1000 *
                                                                                    60 *
                                                                                    60 *
                                                                                    24
                                                                                )
                                                                            ) + 1;
                                                                    }
                                                                }


                                                                return {

                                                                    ...leave,

                                                                    employee_id:
                                                                        Number(
                                                                            leave.employee_id
                                                                        ),

                                                                    employee_name:
                                                                        leave.employee_name ||
                                                                        `${employee.first_name || ""} ${employee.last_name || ""}`
                                                                            .trim() ||
                                                                        "Employee",

                                                                    first_name:
                                                                        leave.first_name ||
                                                                        employee.first_name ||
                                                                        "",

                                                                    last_name:
                                                                        leave.last_name ||
                                                                        employee.last_name ||
                                                                        "",

                                                                    department:
                                                                        leave.department ||
                                                                        employee.department ||
                                                                        department,

                                                                    designation:
                                                                        leave.designation ||
                                                                        employee.designation ||
                                                                        "",

                                                                    days:
                                                                        days
                                                                };
                                                            }
                                                        );


                                                    // =================================================
                                                    // PENDING LEAVES
                                                    // =================================================

                                                    const pendingLeaves =
                                                        leaves.filter(
                                                            leave =>
                                                                String(
                                                                    leave.status ||
                                                                    ""
                                                                ).toLowerCase() ===
                                                                "pending"
                                                        );


                                                    // =================================================
                                                    // TODAY
                                                    // =================================================

                                                    const now =
                                                        new Date();

                                                    const today =
                                                        `${now.getFullYear()}-${String(
                                                            now.getMonth() + 1
                                                        ).padStart(2, "0")}-${String(
                                                            now.getDate()
                                                        ).padStart(2, "0")}`;


                                                    // =================================================
                                                    // PRESENT TODAY
                                                    // =================================================

                                                    const todayAttendance =
                                                        attendance.filter(
                                                            record => {

                                                                const recordDate =
                                                                    String(
                                                                        record.date ||
                                                                        record.attendance_date ||
                                                                        record.created_at ||
                                                                        ""
                                                                    ).substring(
                                                                        0,
                                                                        10
                                                                    );

                                                                return (
                                                                    recordDate ===
                                                                    today
                                                                );
                                                            }
                                                        );


                                                    const presentCount =
                                                        todayAttendance.filter(
                                                            record => {

                                                                const status =
                                                                    String(
                                                                        record.status ||
                                                                        ""
                                                                    ).toLowerCase();

                                                                return (
                                                                    status === "present" ||
                                                                    status === "late" ||
                                                                    status === "late_present"
                                                                );
                                                            }
                                                        ).length;


                                                    // =================================================
                                                    // CURRENT APPROVED LEAVES
                                                    // =================================================

                                                    const onLeaveCount =
                                                        leaves.filter(
                                                            leave => {

                                                                const status =
                                                                    String(
                                                                        leave.status ||
                                                                        ""
                                                                    ).toLowerCase();

                                                                const start =
                                                                    String(
                                                                        leave.start_date ||
                                                                        ""
                                                                    ).substring(
                                                                        0,
                                                                        10
                                                                    );

                                                                const end =
                                                                    String(
                                                                        leave.end_date ||
                                                                        ""
                                                                    ).substring(
                                                                        0,
                                                                        10
                                                                    );

                                                                return (
                                                                    status ===
                                                                        "approved" &&
                                                                    start <=
                                                                        today &&
                                                                    end >=
                                                                        today
                                                                );
                                                            }
                                                        ).length;


                                                    // =================================================
                                                    // FINAL RESPONSE
                                                    // =================================================

                                                    return res.json({

                                                        success: true,

                                                        department,

                                                        // Employee details
                                                        employees:
                                                            employees,

                                                        employee_details:
                                                            employees,

                                                        // Team
                                                        team:
                                                            employees,

                                                        // Attendance
                                                        attendance:
                                                            attendance,

                                                        // Leaves
                                                        leaves:
                                                            leaves,

                                                        leave_requests:
                                                            pendingLeaves,

                                                        // Performance
                                                        performance:
                                                            performanceRows || [],

                                                        // Recognition
                                                        recognition:
                                                            recognitionRows || [],

                                                        // Team progress
                                                        progress:
                                                            workRows || [],

                                                        // Statistics
                                                        stats: {

                                                            team_members:
                                                                employees.length,

                                                            present_today:
                                                                presentCount,

                                                            on_leave:
                                                                onLeaveCount,

                                                            pending_leaves:
                                                                pendingLeaves.length,

                                                            total_performance:
                                                                performanceRows.length,

                                                            total_recognition:
                                                                recognitionRows.length,

                                                            total_tasks:
                                                                workRows.length,

                                                            completed_tasks:
                                                                workRows.filter(
                                                                    task =>
                                                                        String(
                                                                            task.status ||
                                                                            ""
                                                                        ).toLowerCase() ===
                                                                        "completed"
                                                                ).length
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

                }
            );

        }
    );
});


// =====================================================
// SAVE MANAGER DEPARTMENT
// POST /api/manager/:managerId/department
// =====================================================

router.post(
    "/:managerId/department",
    (req, res) => {

        const managerId = Number(req.params.managerId);

        const department = String(
            req.body.department || ""
        ).trim();

        if (!managerId || !department) {
            return res.status(400).json({
                success: false,
                message: "Manager ID and department are required."
            });
        }


        // =====================================================
        // 1. CHECK MANAGER USER
        // =====================================================

        const userSql = `
            SELECT
                id,
                username,
                email,
                role,
                status
            FROM users
            WHERE id = ?
              AND role = 'manager'
            LIMIT 1
        `;

        db.query(
            userSql,
            [managerId],
            (userError, userRows) => {

                if (userError) {

                    console.error(
                        "MANAGER USER CHECK ERROR:",
                        userError
                    );

                    return res.status(500).json({
                        success: false,
                        message: "Unable to verify manager."
                    });
                }


                if (!userRows.length) {

                    return res.status(404).json({
                        success: false,
                        message: "Manager account not found."
                    });
                }


                const manager = userRows[0];


                // =====================================================
                // 2. CHECK EMPLOYEE RECORD
                // =====================================================

                const employeeCheckSql = `
                    SELECT id
                    FROM employees
                    WHERE user_id = ?
                    LIMIT 1
                `;

                db.query(
                    employeeCheckSql,
                    [managerId],
                    (employeeCheckError, employeeRows) => {

                        if (employeeCheckError) {

                            console.error(
                                "MANAGER EMPLOYEE CHECK ERROR:",
                                employeeCheckError
                            );

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Unable to check manager employee record."
                            });
                        }


                        // =====================================================
                        // 3. RECORD DOES NOT EXIST
                        // CREATE IT AUTOMATICALLY
                        // =====================================================

                        if (!employeeRows.length) {

                            const employeeCode =
                                "MGR" +
                                String(managerId).padStart(3, "0");


                            const createEmployeeSql = `
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
                                (
                                    ?,
                                    ?,
                                    '',
                                    '',
                                    ?,
                                    'Manager',
                                    NULL,
                                    CURDATE(),
                                    0,
                                    'active',
                                    ?
                                )
                            `;


                            db.query(
                                createEmployeeSql,
                                [
                                    employeeCode,
                                    manager.username,
                                    department,
                                    managerId
                                ],
                                (createError, createResult) => {

                                    if (createError) {

                                        console.error(
                                            "CREATE MANAGER EMPLOYEE ERROR:",
                                            createError
                                        );

                                        return res.status(500).json({
                                            success: false,
                                            message:
                                                "Unable to create manager employee record.",
                                            error:
                                                createError.sqlMessage ||
                                                createError.message
                                        });
                                    }


                                    console.log(
                                        "MANAGER EMPLOYEE RECORD CREATED:",
                                        createResult.insertId
                                    );


                                    return res.json({

                                        success: true,

                                        message:
                                            "Department saved successfully.",

                                        department,

                                        employee_id:
                                            createResult.insertId

                                    });

                                }
                            );

                            return;
                        }


                        // =====================================================
                        // 4. RECORD ALREADY EXISTS
                        // JUST UPDATE DEPARTMENT
                        // =====================================================

                        const employeeId =
                            employeeRows[0].id;


                        const updateSql = `
                            UPDATE employees
                            SET department = ?
                            WHERE id = ?
                        `;


                        db.query(
                            updateSql,
                            [
                                department,
                                employeeId
                            ],
                            (updateError) => {

                                if (updateError) {

                                    console.error(
                                        "SAVE MANAGER DEPARTMENT ERROR:",
                                        updateError
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            "Unable to save manager department.",
                                        error:
                                            updateError.sqlMessage ||
                                            updateError.message
                                    });
                                }


                                return res.json({

                                    success: true,

                                    message:
                                        "Department saved successfully.",

                                    department,

                                    employee_id:
                                        employeeId

                                });

                            }
                        );

                    }
                );

            }
        );

    }
);


module.exports = router;