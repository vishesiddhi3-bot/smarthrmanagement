// ==========================================
// SmartHR - AUDIT LOGS ROUTES
// ==========================================

const express = require("express");
const db = require("../config/db");

const router = express.Router();


// ==========================================
// GET ALL AUDIT LOGS
// ==========================================

router.get("/", (req, res) => {

    const sql = `
        SELECT
            id,
            user_id,
            user_role,
            action,
            module,
            description,
            ip_address,
            created_at
        FROM audit_logs
        ORDER BY id DESC
        LIMIT 200
    `;


    db.query(sql, (error, results) => {

        if (error) {

            console.error(
                "AUDIT LOGS ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load audit logs",

                error:
                    error.sqlMessage

            });

        }


        return res.json({

            success: true,

            logs: results

        });

    });

});


// ==========================================
// CREATE AUDIT LOG
// ==========================================

router.post("/", (req, res) => {

    const {

        user_id,
        user_role,
        action,
        module,
        description,
        ip_address

    } = req.body;


    if (!action || !module || !description) {

        return res.status(400).json({

            success: false,

            message:
                "Action, module and description are required."

        });

    }


    const sql = `

        INSERT INTO audit_logs (

            user_id,
            user_role,
            action,
            module,
            description,
            ip_address

        )

        VALUES (?, ?, ?, ?, ?, ?)

    `;


    const values = [

        user_id || null,

        user_role || null,

        action,

        module,

        description,

        ip_address || null

    ];


    db.query(
        sql,
        values,
        (error, result) => {

            if (error) {

                console.error(
                    "CREATE AUDIT LOG ERROR:",
                    error
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to create audit log",

                    error:
                        error.sqlMessage

                });

            }


            return res.status(201).json({

                success: true,

                message:
                    "Audit log created successfully",

                id:
                    result.insertId

            });

        }
    );

});


module.exports = router;