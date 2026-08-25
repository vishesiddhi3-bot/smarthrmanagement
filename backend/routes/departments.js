// ==========================================
// SmartHR - DEPARTMENTS ROUTE
// ==========================================

const express = require("express");
const db = require("../config/db");

const router = express.Router();


// ==========================================
// GET ALL DEPARTMENTS
// ==========================================

router.get("/", (req, res) => {

    const sql = `
        SELECT
            d.id,
            d.name,
            d.description,
            d.manager_id,
            d.status,

            COUNT(
                CASE
                    WHEN e.status = 'active'
                    THEN e.id
                END
            ) AS employee_count

        FROM departments d

        LEFT JOIN employees e
            ON TRIM(LOWER(e.department)) = TRIM(LOWER(d.name))

        WHERE d.status = 'active'

        GROUP BY
            d.id,
            d.name,
            d.description,
            d.manager_id,
            d.status

        ORDER BY d.name ASC
    `;


    db.query(sql, (err, departments) => {

        if (err) {

            console.error(
                "DEPARTMENTS LOAD ERROR:",
                err
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load departments",
                error: err.sqlMessage || err.message
            });

        }


        if (!departments.length) {

            return res.json({
                success: true,
                departments: []
            });

        }


        // ------------------------------------------
        // GET MANAGERS
        // ------------------------------------------

        const managerIds = departments
            .map(department => department.manager_id)
            .filter(id => id !== null && id !== undefined);


        if (!managerIds.length) {

            departments.forEach(department => {
                department.manager = null;
            });

            return res.json({
                success: true,
                departments
            });

        }


        const managerSql = `
            SELECT
                id,
                employee_code,
                first_name,
                last_name,
                designation,
                department,
                status
            FROM employees
            WHERE id IN (?)
        `;


        db.query(
            managerSql,
            [managerIds],
            (managerErr, managers) => {

                if (managerErr) {

                    console.error(
                        "MANAGER LOAD ERROR:",
                        managerErr
                    );

                    return res.status(500).json({
                        success: false,
                        message: "Unable to load managers",
                        error:
                            managerErr.sqlMessage ||
                            managerErr.message
                    });

                }


                departments.forEach(department => {

                    const manager = managers.find(
                        employee =>
                            Number(employee.id) ===
                            Number(department.manager_id)
                    );


                    department.manager =
                        manager || null;

                });


                return res.json({
                    success: true,
                    departments
                });

            }
        );

    });

});


// ==========================================
// GET SINGLE DEPARTMENT
// ==========================================

router.get("/:id", (req, res) => {

    const departmentId =
        Number(req.params.id);


    if (!departmentId) {

        return res.status(400).json({
            success: false,
            message: "Invalid department ID"
        });

    }


    const sql = `
        SELECT
            d.id,
            d.name,
            d.description,
            d.manager_id,

            e.id AS employee_id,
            e.employee_code,
            e.first_name,
            e.last_name,
            e.phone,
            e.designation,
            e.joining_date,
            e.salary,
            e.status

        FROM departments d

        LEFT JOIN employees e
            ON TRIM(LOWER(e.department)) =
               TRIM(LOWER(d.name))

        WHERE d.id = ?

        ORDER BY
            e.first_name ASC,
            e.last_name ASC
    `;


    db.query(
        sql,
        [departmentId],
        (err, rows) => {

            if (err) {

                console.error(
                    "SINGLE DEPARTMENT ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to load department",
                    error:
                        err.sqlMessage ||
                        err.message
                });

            }


            if (!rows.length) {

                return res.status(404).json({
                    success: false,
                    message: "Department not found"
                });

            }


            const department = {

                id: rows[0].id,

                name: rows[0].name,

                description:
                    rows[0].description,

                manager_id:
                    rows[0].manager_id,

                manager: null,

                employees: []

            };


            rows.forEach(row => {

                if (row.employee_id) {

                    department.employees.push({

                        id:
                            row.employee_id,

                        employee_code:
                            row.employee_code,

                        first_name:
                            row.first_name,

                        last_name:
                            row.last_name,

                        phone:
                            row.phone,

                        designation:
                            row.designation,

                        joining_date:
                            row.joining_date,

                        salary:
                            row.salary,

                        status:
                            row.status

                    });

                }

            });


            // ------------------------------------------
            // GET CURRENT MANAGER
            // ------------------------------------------

            if (department.manager_id) {

                const managerSql = `
                    SELECT
                        id,
                        employee_code,
                        first_name,
                        last_name,
                        designation,
                        department,
                        status
                    FROM employees
                    WHERE id = ?
                    LIMIT 1
                `;


                db.query(
                    managerSql,
                    [department.manager_id],
                    (managerErr, managerRows) => {

                        if (managerErr) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Unable to load manager"
                            });

                        }


                        department.manager =
                            managerRows.length
                                ? managerRows[0]
                                : null;


                        return res.json({
                            success: true,
                            department
                        });

                    }
                );

                return;

            }


            return res.json({
                success: true,
                department
            });

        }
    );

});


// ==========================================
// GET EMPLOYEES OF ONE DEPARTMENT
// ==========================================

router.get("/:id/employees", (req, res) => {

    const departmentId =
        Number(req.params.id);


    if (!departmentId) {

        return res.status(400).json({
            success: false,
            message: "Invalid department ID"
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
            e.joining_date,
            e.salary,
            e.status

        FROM employees e

        INNER JOIN departments d
            ON TRIM(LOWER(e.department)) =
               TRIM(LOWER(d.name))

        WHERE
            d.id = ?
            AND e.status = 'active'

        ORDER BY
            e.first_name ASC,
            e.last_name ASC
    `;


    db.query(
        sql,
        [departmentId],
        (err, employees) => {

            if (err) {

                console.error(
                    "DEPARTMENT EMPLOYEES ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to load department employees",
                    error:
                        err.sqlMessage ||
                        err.message
                });

            }


            return res.json({

                success: true,

                employees

            });

        }
    );

});


// ==========================================
// GET AVAILABLE MANAGERS FOR DEPARTMENT
// ==========================================


router.get("/:id/manager-options", (req, res) => {

    const departmentId =
        Number(req.params.id);

    if (!departmentId) {

        return res.status(400).json({
            success: false,
            message: "Invalid department ID"
        });

    }

    // Check department exists
    const departmentSql = `
        SELECT
            id,
            name
        FROM departments
        WHERE id = ?
        LIMIT 1
    `;

    db.query(
        departmentSql,
        [departmentId],
        (departmentErr, departmentRows) => {

            if (departmentErr) {

                console.error(
                    "DEPARTMENT CHECK ERROR:",
                    departmentErr
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to load department",
                    error:
                        departmentErr.sqlMessage ||
                        departmentErr.message
                });

            }

            if (!departmentRows.length) {

                return res.status(404).json({
                    success: false,
                    message: "Department not found"
                });

            }

            // ==========================================
            // GET ONLY ACTIVE MANAGERS
            // ==========================================
            //
            // Manager is identified from designation.
            // This searches ALL departments, not just
            // the selected department.
            //

            const managerSql = `
                SELECT
                    id,
                    employee_code,
                    first_name,
                    last_name,
                    designation,
                    department,
                    status
                FROM employees
                WHERE
                    status = 'active'
                    AND (
                        LOWER(TRIM(designation)) = 'manager'
                        OR LOWER(TRIM(designation)) LIKE '%manager%'
                    )
                ORDER BY
                    first_name ASC,
                    last_name ASC
            `;

            db.query(
                managerSql,
                (managerErr, managers) => {

                    if (managerErr) {

                        console.error(
                            "MANAGER OPTIONS ERROR:",
                            managerErr
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Unable to load managers",
                            error:
                                managerErr.sqlMessage ||
                                managerErr.message
                        });

                    }

                    return res.json({

                        success: true,

                        managers: managers

                    });

                }
            );

        }
    );

});


// ==========================================
// ASSIGN MANAGER
// ==========================================

router.put("/:id/manager", (req, res) => {

    const departmentId =
        Number(req.params.id);

    const managerId =
        Number(req.body.manager_id);


    if (!departmentId) {

        return res.status(400).json({
            success: false,
            message: "Invalid department ID"
        });

    }


    if (!managerId) {

        return res.status(400).json({
            success: false,
            message: "Manager is required"
        });

    }


    // ------------------------------------------
    // CHECK DEPARTMENT
    // ------------------------------------------

    const departmentSql = `
        SELECT
            id,
            name
        FROM departments
        WHERE id = ?
        LIMIT 1
    `;


    db.query(
        departmentSql,
        [departmentId],
        (departmentErr, departmentRows) => {

            if (departmentErr) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to check department"
                });

            }


            if (!departmentRows.length) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Department not found"
                });

            }


            const departmentName =
                departmentRows[0].name;


            // ------------------------------------------
            // CHECK MANAGER
            // ------------------------------------------

            const managerSql = `
                SELECT
                    id,
                    employee_code,
                    first_name,
                    last_name,
                    designation,
                    department,
                    status
                FROM employees
                WHERE
                    id = ?
                    AND status = 'active'
                    AND TRIM(LOWER(department)) =
                        TRIM(LOWER(?))
                LIMIT 1
            `;


            db.query(
                managerSql,
                [
                    managerId,
                    departmentName
                ],
                (managerErr, managerRows) => {

                    if (managerErr) {

                        return res.status(500).json({
                            success: false,
                            message:
                                "Unable to check manager"
                        });

                    }


                    if (!managerRows.length) {

                        return res.status(400).json({
                            success: false,
                            message:
                                "Selected employee does not belong to this department"
                        });

                    }


                    // ------------------------------------------
                    // ASSIGN MANAGER
                    // ------------------------------------------

                    const updateSql = `
                        UPDATE departments
                        SET manager_id = ?
                        WHERE id = ?
                    `;


                    db.query(
                        updateSql,
                        [
                            managerId,
                            departmentId
                        ],
                        updateErr => {

                            if (updateErr) {

                                console.error(
                                    "ASSIGN MANAGER ERROR:",
                                    updateErr
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Unable to assign manager",
                                    error:
                                        updateErr.sqlMessage ||
                                        updateErr.message
                                });

                            }


                            return res.json({

                                success: true,

                                message:
                                    "Manager assigned successfully"

                            });

                        }
                    );

                }
            );

        }
    );

});


// ==========================================
// REMOVE MANAGER
// ==========================================

router.delete("/:id/manager", (req, res) => {

    const departmentId =
        Number(req.params.id);


    if (!departmentId) {

        return res.status(400).json({
            success: false,
            message: "Invalid department ID"
        });

    }


    const sql = `
        UPDATE departments
        SET manager_id = NULL
        WHERE id = ?
    `;


    db.query(
        sql,
        [departmentId],
        err => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to remove manager",
                    error:
                        err.sqlMessage ||
                        err.message
                });

            }


            return res.json({

                success: true,

                message:
                    "Manager removed successfully"

            });

        }
    );

});


// ==========================================
// CREATE DEPARTMENT
// ==========================================

router.post("/", (req, res) => {

    const name =
        String(req.body.name || "").trim();

    const description =
        String(
            req.body.description || ""
        ).trim();


    if (!name) {

        return res.status(400).json({
            success: false,
            message:
                "Department name is required"
        });

    }


    const sql = `
        INSERT INTO departments
        (
            name,
            description,
            status
        )
        VALUES
        (?, ?, 'active')
    `;


    db.query(
        sql,
        [
            name,
            description || null
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "CREATE DEPARTMENT ERROR:",
                    err
                );


                if (
                    err.code ===
                    "ER_DUP_ENTRY"
                ) {

                    return res.status(409).json({
                        success: false,
                        message:
                            "Department already exists"
                    });

                }


                return res.status(500).json({
                    success: false,
                    message:
                        err.sqlMessage ||
                        "Unable to create department"
                });

            }


            return res.status(201).json({

                success: true,

                message:
                    "Department created successfully",

                departmentId:
                    result.insertId

            });

        }
    );

});


// ==========================================
// DELETE DEPARTMENT
// ==========================================

router.delete("/:id", (req, res) => {

    const departmentId =
        Number(req.params.id);


    if (!departmentId) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid department ID"
        });

    }


    const checkSql = `
        SELECT
            d.name,
            COUNT(e.id) AS employee_count
        FROM departments d

        LEFT JOIN employees e
            ON TRIM(LOWER(e.department)) =
               TRIM(LOWER(d.name))

        WHERE d.id = ?

        GROUP BY
            d.id,
            d.name
    `;


    db.query(
        checkSql,
        [departmentId],
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Database error"
                });

            }


            if (!rows.length) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Department not found"
                });

            }


            if (
                Number(rows[0].employee_count) > 0
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Cannot delete department because employees are assigned to it."

                });

            }


            db.query(
                `
                    DELETE FROM departments
                    WHERE id = ?
                `,
                [departmentId],
                deleteErr => {

                    if (deleteErr) {

                        return res.status(500).json({
                            success: false,
                            message:
                                "Unable to delete department"
                        });

                    }


                    return res.json({

                        success: true,

                        message:
                            "Department deleted successfully"

                    });

                }
            );

        }
    );

});


module.exports = router;