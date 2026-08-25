const express = require("express");
const db = require("../config/db");

const router = express.Router();


// =====================================================
// GET ALL ANNOUNCEMENTS
// =====================================================

router.get("/", (req, res) => {

    const sql = `
        SELECT
            a.id,
            a.title,
            a.message,
            a.created_by,
            a.created_at,
            u.username AS created_by_name
        FROM announcements a
        LEFT JOIN users u
            ON a.created_by = u.id
        ORDER BY a.id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "ANNOUNCEMENTS LOAD ERROR:",
                err
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load announcements",
                error: err.sqlMessage
            });

        }

        res.json({
            success: true,
            announcements: results
        });

    });

});


// =====================================================
// CREATE ANNOUNCEMENT
// =====================================================

router.post("/", (req, res) => {

    const {
        title,
        message,
        created_by
    } = req.body;


    if (!title || !message) {

        return res.status(400).json({
            success: false,
            message: "Title and message are required"
        });

    }


    if (!created_by) {

        return res.status(400).json({
            success: false,
            message: "Login information not found"
        });

    }


    const sql = `
        INSERT INTO announcements
        (
            title,
            message,
            created_by
        )
        VALUES
        (?, ?, ?)
    `;


    db.query(
        sql,
        [
            title.trim(),
            message.trim(),
            Number(created_by)
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "ANNOUNCEMENT SAVE ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to save announcement",
                    error: err.sqlMessage
                });

            }


            res.status(201).json({

                success: true,

                message:
                    "Announcement published successfully",

                announcementId:
                    result.insertId

            });

        }
    );

});


// =====================================================
// DELETE ANNOUNCEMENT
// =====================================================

router.delete("/:id", (req, res) => {

    const id =
        Number(req.params.id);


    if (!id || id <= 0) {

        return res.status(400).json({
            success: false,
            message: "Invalid announcement ID"
        });

    }


    const sql = `
        DELETE FROM announcements
        WHERE id = ?
    `;


    db.query(
        sql,
        [id],
        (err, result) => {

            if (err) {

                console.error(
                    "ANNOUNCEMENT DELETE ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to delete announcement",
                    error: err.sqlMessage
                });

            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Announcement not found"
                });

            }


            res.json({

                success: true,

                message:
                    "Announcement deleted successfully"

            });

        }
    );

});


// =====================================================
// TEST ROUTE
// =====================================================

router.get("/test", (req, res) => {

    res.json({

        success: true,

        message:
            "Announcements route is working"

    });

});


// =====================================================
// EXPORT
// =====================================================

module.exports = router;