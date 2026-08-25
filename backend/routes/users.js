// =====================================================
// SmartHR - USERS ROUTES
// =====================================================

const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

const {
    createAuditLog
} = require("../utils/auditLogger");

const router = express.Router();


// =====================================================
// GET ALL USERS
// =====================================================

router.get("/", (req, res) => {

    const sql = `
        SELECT
            id,
            username,
            email,
            role,
            status,
            created_at
        FROM users
        ORDER BY id DESC
    `;

    db.query(
        sql,
        (err, results) => {

            if (err) {

                console.error(
                    "GET USERS ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to fetch users",
                    error:
                        err.sqlMessage ||
                        err.message
                });

            }

            return res.json({
                success: true,
                users: results
            });

        }
    );

});


// =====================================================
// GET SINGLE USER
// =====================================================

router.get("/:id", (req, res) => {

    const userId =
        Number(req.params.id);

    if (!userId) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid user ID"
        });

    }

    db.query(
        `
        SELECT
            id,
            username,
            email,
            role,
            status,
            created_at
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [userId],
        (err, results) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to fetch user"
                });

            }

            if (!results.length) {

                return res.status(404).json({
                    success: false,
                    message:
                        "User not found"
                });

            }

            return res.json({
                success: true,
                user: results[0]
            });

        }
    );

});


// =====================================================
// ADD USER
// =====================================================

router.post("/", async (req, res) => {

    try {

        const {
            username,
            email,
            password,
            role,
            status
        } = req.body;

        if (
            !username ||
            !email ||
            !password ||
            !role
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Username, email, password and role are required"
            });

        }

        const allowedRoles = [
            "admin",
            "hr",
            "manager",
            "employee"
        ];

        if (!allowedRoles.includes(role)) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid role"
            });

        }

        const userStatus =
            status === "inactive"
                ? "inactive"
                : "active";

        db.query(
            `
            SELECT id
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email.trim()],
            async (err, results) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Database error"
                    });

                }

                if (results.length) {

                    return res.status(409).json({
                        success: false,
                        message:
                            "Email already exists"
                    });

                }

                const hashedPassword =
                    await bcrypt.hash(
                        password,
                        10
                    );

                const sql = `
                    INSERT INTO users
                    (
                        username,
                        password,
                        role,
                        status,
                        email
                    )
                    VALUES (?, ?, ?, ?, ?)
                `;

                db.query(
                    sql,
                    [
                        username.trim(),
                        hashedPassword,
                        role,
                        userStatus,
                        email.trim()
                    ],
                    async (
                        insertErr,
                        result
                    ) => {

                        if (insertErr) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    insertErr.sqlMessage ||
                                    "Unable to add user"
                            });

                        }

                        const userId =
                            result.insertId;


                        await createAuditLog({
                            user_id:
                                userId,
                            action:
                                "USER_CREATED",
                            description:
                                `User ${username.trim()} was created`,
                            entity_type:
                                "user",
                            entity_id:
                                userId,
                            ip_address:
                                req.ip
                        });


                        return res.status(201).json({

                            success: true,

                            message:
                                "User added successfully",

                            user: {
                                id:
                                    userId,
                                username:
                                    username.trim(),
                                email:
                                    email.trim(),
                                role,
                                status:
                                    userStatus
                            }

                        });

                    }
                );

            }
        );

    } catch (error) {

        console.error(
            "ADD USER ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error"
        });

    }

});


// =====================================================
// EDIT USER
// =====================================================

router.put("/:id", async (req, res) => {

    try {

        const userId =
            Number(req.params.id);

        if (!userId) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid user ID"
            });

        }

        const {
            username,
            email,
            password,
            role,
            status
        } = req.body;


        db.query(
            `
            SELECT
                id,
                username,
                email,
                role,
                status
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [userId],
            async (findErr, users) => {

                if (findErr) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Database error"
                    });

                }

                if (!users.length) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "User not found"
                    });

                }

                const current =
                    users[0];

                const newUsername =
                    username &&
                    username.trim()
                        ? username.trim()
                        : current.username;

                const newEmail =
                    email &&
                    email.trim()
                        ? email.trim()
                        : current.email;

                const newRole =
                    role || current.role;

                const newStatus =
                    status === "active" ||
                    status === "inactive"
                        ? status
                        : current.status;

                const allowedRoles = [
                    "admin",
                    "hr",
                    "manager",
                    "employee"
                ];

                if (
                    !allowedRoles.includes(
                        newRole
                    )
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid role"
                    });

                }


                db.query(
                    `
                    SELECT id
                    FROM users
                    WHERE email = ?
                    AND id != ?
                    LIMIT 1
                    `,
                    [
                        newEmail,
                        userId
                    ],
                    async (
                        emailErr,
                        emailRows
                    ) => {

                        if (emailErr) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Database error"
                            });

                        }

                        if (emailRows.length) {

                            return res.status(409).json({
                                success: false,
                                message:
                                    "Email already exists"
                            });

                        }


                        let passwordSql = "";
                        let values = [];

                        if (
                            password &&
                            password.trim()
                        ) {

                            const hashedPassword =
                                await bcrypt.hash(
                                    password,
                                    10
                                );

                            passwordSql =
                                ", password = ?";

                            values.push(
                                hashedPassword
                            );

                        }


                        const updateSql = `
                            UPDATE users
                            SET
                                username = ?,
                                email = ?,
                                role = ?,
                                status = ?
                                ${passwordSql}
                            WHERE id = ?
                        `;

                        values = [
                            newUsername,
                            newEmail,
                            newRole,
                            newStatus,
                            ...values,
                            userId
                        ];


                        db.query(
                            updateSql,
                            values,
                            async (
                                updateErr
                            ) => {

                                if (updateErr) {

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            updateErr.sqlMessage ||
                                            "Unable to update user"
                                    });

                                }


                                await createAuditLog({
                                    user_id:
                                        userId,
                                    action:
                                        "USER_UPDATED",
                                    description:
                                        `User ${userId} was updated`,
                                    entity_type:
                                        "user",
                                    entity_id:
                                        userId,
                                    ip_address:
                                        req.ip
                                });


                                return res.json({

                                    success: true,

                                    message:
                                        "User updated successfully",

                                    user: {
                                        id:
                                            userId,
                                        username:
                                            newUsername,
                                        email:
                                            newEmail,
                                        role:
                                            newRole,
                                        status:
                                            newStatus
                                    }

                                });

                            }
                        );

                    }
                );

            }
        );

    } catch (error) {

        console.error(
            "EDIT USER ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error"
        });

    }

});


// =====================================================
// ACTIVATE / DEACTIVATE USER
// =====================================================

router.put("/:id/status", (req, res) => {

    const userId =
        Number(req.params.id);

    const {
        status
    } = req.body;

    if (!userId) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid user ID"
        });

    }

    if (
        status !== "active" &&
        status !== "inactive"
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid status"
        });

    }


    db.query(
        `
        SELECT
            id,
            username,
            role,
            status
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [userId],
        (err, results) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Database error"
                });

            }

            if (!results.length) {

                return res.status(404).json({
                    success: false,
                    message:
                        "User not found"
                });

            }

            const user =
                results[0];


            db.query(
                `
                UPDATE users
                SET status = ?
                WHERE id = ?
                `,
                [
                    status,
                    userId
                ],
                async (updateErr) => {

                    if (updateErr) {

                        return res.status(500).json({
                            success: false,
                            message:
                                "Unable to update user status"
                        });

                    }


                    const action =
                        status === "active"
                            ? "USER_ACTIVATED"
                            : "USER_DEACTIVATED";


                    await createAuditLog({

                        user_id:
                            userId,

                        action:
                            action,

                        description:
                            status === "active"
                                ? `User ${user.username} was activated`
                                : `User ${user.username} was deactivated`,

                        entity_type:
                            "user",

                        entity_id:
                            userId,

                        ip_address:
                            req.ip

                    });


                    return res.json({

                        success: true,

                        message:
                            status === "active"
                                ? "User activated successfully"
                                : "User deactivated successfully",

                        user: {
                            id:
                                userId,
                            role:
                                user.role,
                            status:
                                status
                        }

                    });

                }
            );

        }
    );

});


// =====================================================
// DELETE USER
// =====================================================

router.delete("/:id", (req, res) => {

    const userId =
        Number(req.params.id);

    if (!userId) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid user ID"
        });

    }


    db.query(
        `
        SELECT
            id,
            username,
            role
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [userId],
        (err, results) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Database error"
                });

            }

            if (!results.length) {

                return res.status(404).json({
                    success: false,
                    message:
                        "User not found"
                });

            }

            const user =
                results[0];


            db.query(
                `
                DELETE FROM employees
                WHERE user_id = ?
                `,
                [userId],
                (employeeErr) => {

                    if (employeeErr) {

                        console.error(
                            "DELETE EMPLOYEE ERROR:",
                            employeeErr
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Unable to delete employee profile"
                        });

                    }


                    db.query(
                        `
                        DELETE FROM users
                        WHERE id = ?
                        `,
                        [userId],
                        async (deleteErr) => {

                            if (deleteErr) {

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        deleteErr.sqlMessage ||
                                        "Unable to delete user"
                                });

                            }


                            await createAuditLog({

                                user_id:
                                    userId,

                                action:
                                    "USER_DELETED",

                                description:
                                    `User ${user.username} was deleted`,

                                entity_type:
                                    "user",

                                entity_id:
                                    userId,

                                ip_address:
                                    req.ip

                            });


                            return res.json({

                                success: true,

                                message:
                                    "User deleted successfully",

                                deletedUserId:
                                    userId

                            });

                        }
                    );

                }
            );

        }
    );

});


module.exports = router;