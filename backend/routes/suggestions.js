// ==========================================
// SmartHR - SUGGESTIONS ROUTES
// ==========================================

const express = require("express");
const db = require("../config/db");

const router = express.Router();


// ==========================================
// GET ALL SUGGESTIONS
// ==========================================

router.get("/", (req, res) => {

    const sql = `
        SELECT
            s.id,
            s.employee_id,
            s.title,
            s.description,
            s.status,
            s.admin_comment,
            s.created_at,

            e.first_name,
            e.last_name,
            e.employee_code

        FROM suggestions s

        LEFT JOIN employees e
            ON s.employee_id = e.id

        ORDER BY s.id DESC
    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "GET SUGGESTIONS ERROR:",
                err
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load suggestions",
                error: err.sqlMessage
            });

        }


        res.json({

            success: true,

            suggestions: results

        });

    });

});

router.get("/test", (req, res) => {

    res.json({

        success: true,

        message:
            "Suggestions route is working"

    });

});

// ==========================================
// GET SINGLE SUGGESTION
// ==========================================

router.get("/:id", (req, res) => {

    const id =
        Number(req.params.id);


    if (!id) {

        return res.status(400).json({
            success: false,
            message: "Invalid suggestion ID"
        });

    }


    const sql = `
        SELECT
            s.id,
            s.employee_id,
            s.title,
            s.description,
            s.status,
            s.admin_comment,
            s.created_at,

            e.first_name,
            e.last_name,
            e.employee_code

        FROM suggestions s

        LEFT JOIN employees e
            ON s.employee_id = e.id

        WHERE s.id = ?

        LIMIT 1
    `;


    db.query(
        sql,
        [id],
        (err, results) => {

            if (err) {

                console.error(
                    "GET SINGLE SUGGESTION ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to load suggestion",
                    error: err.sqlMessage
                });

            }


            if (!results.length) {

                return res.status(404).json({
                    success: false,
                    message: "Suggestion not found"
                });

            }


            res.json({

                success: true,

                suggestion:
                    results[0]

            });

        }
    );

});


// ==========================================
// CREATE SUGGESTION
// ==========================================

router.post("/", (req, res) => {

    const {
        employee_id,
        title,
        description
    } = req.body;


    // ======================================
    // VALIDATION
    // ======================================

    if (!employee_id) {

        return res.status(400).json({
            success: false,
            message: "Employee ID is required"
        });

    }


    if (!title || !title.trim()) {

        return res.status(400).json({
            success: false,
            message: "Suggestion title is required"
        });

    }


    if (!description || !description.trim()) {

        return res.status(400).json({
            success: false,
            message: "Suggestion description is required"
        });

    }


    // ======================================
    // INSERT
    // ======================================

    const sql = `
        INSERT INTO suggestions
        (
            employee_id,
            title,
            description,
            status
        )
        VALUES
        (
            ?,
            ?,
            ?,
            'submitted'
        )
    `;


    db.query(
        sql,
        [
            Number(employee_id),
            title.trim(),
            description.trim()
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "CREATE SUGGESTION ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to save suggestion",
                    error: err.sqlMessage
                });

            }


            res.status(201).json({

                success: true,

                message:
                    "Suggestion submitted successfully",

                suggestionId:
                    result.insertId

            });

        }
    );

});


// ==========================================
// UPDATE SUGGESTION STATUS
// ==========================================

router.put("/:id", (req, res) => {

    const id =
        Number(req.params.id);


    const {
        status,
        admin_comment
    } = req.body;


    if (!id) {

        return res.status(400).json({
            success: false,
            message: "Invalid suggestion ID"
        });

    }


    const allowedStatuses = [
        "submitted",
        "reviewed",
        "implemented",
        "rejected"
    ];


    if (
        !status ||
        !allowedStatuses.includes(
            status
        )
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid suggestion status"
        });

    }


    const sql = `
        UPDATE suggestions

        SET
            status = ?,
            admin_comment = ?

        WHERE id = ?
    `;


    db.query(
        sql,
        [
            status,
            admin_comment || null,
            id
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "UPDATE SUGGESTION ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to update suggestion",
                    error: err.sqlMessage
                });

            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Suggestion not found"
                });

            }


            res.json({

                success: true,

                message:
                    "Suggestion updated successfully"

            });

        }
    );

});


// ==========================================
// DELETE SUGGESTION
// ==========================================

router.delete("/:id", (req, res) => {

    const id =
        Number(req.params.id);


    if (!id) {

        return res.status(400).json({
            success: false,
            message: "Invalid suggestion ID"
        });

    }


    db.query(
        "DELETE FROM suggestions WHERE id = ?",
        [id],
        (err, result) => {

            if (err) {

                console.error(
                    "DELETE SUGGESTION ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to delete suggestion",
                    error: err.sqlMessage
                });

            }


            res.json({

                success: true,

                message:
                    "Suggestion deleted successfully"

            });

        }
    );

});


// ==========================================
// TEST
// ==========================================

router.get("/test", (req, res) => {

    res.json({

        success: true,

        message:
            "Suggestions route is working"

    });

});


// ==========================================
// EXPORT
// ==========================================

module.exports = router;