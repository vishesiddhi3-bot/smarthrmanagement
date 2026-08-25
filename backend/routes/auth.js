// =====================================================
// SmartHR - AUTH ROUTES
// =====================================================

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const {
    createAuditLog
} = require("../utils/auditLogger");

const router = express.Router();

const JWT_SECRET =
    "smarthr_secret_key_2026";


// =====================================================
// REGISTER
// =====================================================

router.post("/register", async (req, res) => {

    try {

        const {
            username,
            email,
            password,
            role
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
                    "All fields are required"
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
                message: "Invalid role"
            });

        }

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

                    console.error(
                        "CHECK EMAIL ERROR:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Database error"
                    });

                }

                if (results.length > 0) {

                    return res.status(409).json({
                        success: false,
                        message:
                            "Email already registered"
                    });

                }

                if (
                    role === "admin" ||
                    role === "hr"
                ) {

                    db.query(
                        `
                        SELECT id
                        FROM users
                        WHERE role = ?
                        AND status = 'active'
                        LIMIT 1
                        `,
                        [role],
                        async (
                            roleErr,
                            roleResults
                        ) => {

                            if (roleErr) {

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Database error"
                                });

                            }

                            if (
                                roleResults.length > 0
                            ) {

                                return res.status(409).json({
                                    success: false,
                                    message:
                                        role === "admin"
                                            ? "Admin account already exists."
                                            : "HR Manager account already exists."
                                });

                            }

                            await createUser();

                        }
                    );

                } else {

                    await createUser();

                }


                async function createUser() {

                    try {

                        const hashedPassword =
                            await bcrypt.hash(
                                password,
                                10
                            );

                        const userSql = `
                            INSERT INTO users
                            (
                                username,
                                email,
                                password,
                                role,
                                status
                            )
                            VALUES (?, ?, ?, ?, 'active')
                        `;

                        db.query(
                            userSql,
                            [
                                username.trim(),
                                email.trim(),
                                hashedPassword,
                                role
                            ],
                            (insertErr, result) => {

                                if (insertErr) {

                                    console.error(
                                        "USER INSERT ERROR:",
                                        insertErr
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            insertErr.sqlMessage ||
                                            "Account creation failed"
                                    });

                                }

                                const userId =
                                    result.insertId;


                                // =====================================
                                // CREATE EMPLOYEE PROFILE
                                // =====================================

                                if (
                                    role === "employee"
                                ) {

                                    const employeeCode =
                                        "EMP" +
                                        String(userId)
                                            .padStart(
                                                3,
                                                "0"
                                            );

                                    const employeeSql = `
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
                                            ?,
                                            ?,
                                            ?,
                                            ?,
                                            ?,
                                            CURDATE(),
                                            ?,
                                            ?,
                                            ?
                                        )
                                    `;

                                    const values = [
                                        employeeCode,
                                        username.trim(),
                                        "",
                                        "",
                                        "General",
                                        "Employee",
                                        null,
                                        0,
                                        "active",
                                        userId
                                    ];

                                    db.query(
                                        employeeSql,
                                        values,
                                        async (
                                            employeeErr
                                        ) => {

                                            if (
                                                employeeErr
                                            ) {

                                                console.error(
                                                    "EMPLOYEE INSERT ERROR:",
                                                    employeeErr
                                                );

                                                return res.status(500).json({
                                                    success: false,
                                                    message:
                                                        employeeErr.sqlMessage ||
                                                        "Employee profile creation failed"
                                                });

                                            }

                                            await createAuditLog({
                                                user_id:
                                                    userId,
                                                action:
                                                    "USER_CREATED",
                                                description:
                                                    `Employee account ${username.trim()} was created`,
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
                                                    "Employee account created successfully",
                                                userId:
                                                    userId,
                                                employeeCode:
                                                    employeeCode
                                            });

                                        }
                                    );

                                    return;
                                }


                                createAuditLog({
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
                                }).then(() => {

                                    return res.status(201).json({
                                        success: true,
                                        message:
                                            "Account created successfully",
                                        userId:
                                            userId
                                    });

                                });

                            }
                        );

                    } catch (error) {

                        console.error(
                            "CREATE USER ERROR:",
                            error
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Password processing failed"
                        });

                    }

                }

            }
        );

    } catch (error) {

        console.error(
            "REGISTER ERROR:",
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
// LOGIN
// =====================================================

router.post("/login", (req, res) => {

    const {
        email,
        password
    } = req.body;

    if (!email || !password) {

        return res.status(400).json({
            success: false,
            message:
                "Email and password are required"
        });

    }

    const sql = `
        SELECT
            id,
            username,
            email,
            password,
            role,
            status
        FROM users
        WHERE email = ?
        LIMIT 1
    `;

    db.query(
        sql,
        [email.trim()],
        async (err, results) => {

            if (err) {

                console.error(
                    "LOGIN DATABASE ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Database error"
                });

            }

            if (!results.length) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid email or password"
                });

            }

            const user =
                results[0];

            if (
                user.status === "inactive"
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Your account is inactive. Please contact administrator."
                });

            }


            // =================================================
            // FIRST LOGIN
            // =================================================

            if (!user.password) {

                try {

                    const hashedPassword =
                        await bcrypt.hash(
                            password,
                            10
                        );

                    db.query(
                        `
                        UPDATE users
                        SET password = ?
                        WHERE id = ?
                        `,
                        [
                            hashedPassword,
                            user.id
                        ],
                        async (
                            updateErr
                        ) => {

                            if (updateErr) {

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Unable to save password"
                                });

                            }

                            const token =
                                jwt.sign(
                                    {
                                        id:
                                            user.id,
                                        email:
                                            user.email,
                                        role:
                                            user.role
                                    },
                                    JWT_SECRET,
                                    {
                                        expiresIn:
                                            "2h"
                                    }
                                );


                            await createAuditLog({
                                user_id:
                                    user.id,
                                action:
                                    "LOGIN",
                                description:
                                    `${user.username} logged in`,
                                entity_type:
                                    "user",
                                entity_id:
                                    user.id,
                                ip_address:
                                    req.ip
                            });


                            return res.json({
                                success: true,
                                message:
                                    "Password created and login successful",
                                token,
                                user: {
                                    id:
                                        user.id,
                                    username:
                                        user.username,
                                    email:
                                        user.email,
                                    role:
                                        user.role
                                }
                            });

                        }
                    );

                } catch (error) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Password processing failed"
                    });

                }

                return;
            }


            // =================================================
            // NORMAL LOGIN
            // =================================================

            try {

                const passwordMatch =
                    await bcrypt.compare(
                        password,
                        user.password
                    );

                if (!passwordMatch) {

                    return res.status(401).json({
                        success: false,
                        message:
                            "Invalid email or password"
                    });

                }

            } catch (error) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Password verification failed"
                });

            }


            const token =
                jwt.sign(
                    {
                        id:
                            user.id,
                        email:
                            user.email,
                        role:
                            user.role
                    },
                    JWT_SECRET,
                    {
                        expiresIn:
                            "2h"
                    }
                );


            await createAuditLog({
                user_id:
                    user.id,
                action:
                    "LOGIN",
                description:
                    `${user.username} logged in`,
                entity_type:
                    "user",
                entity_id:
                    user.id,
                ip_address:
                    req.ip
            });


            return res.json({
                success: true,
                message:
                    "Login successful",
                token,
                user: {
                    id:
                        user.id,
                    username:
                        user.username,
                    email:
                        user.email,
                    role:
                        user.role
                }
            });

        }
    );

});


module.exports = router;