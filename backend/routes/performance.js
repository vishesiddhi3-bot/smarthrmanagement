// ==========================================
// SmartHR - PERFORMANCE ROUTES
// ==========================================

const express = require("express");
const db = require("../config/db");

const router = express.Router();


// ==========================================
// GET ALL PERFORMANCE RECORDS
// ==========================================

router.get("/", (req, res) => {

    const sql = `
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

        ORDER BY p.id DESC
    `;

    db.query(sql, (error, results) => {

        if (error) {

            console.error(
                "GET PERFORMANCE ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load performance records",
                error: error.sqlMessage
            });
        }

        res.json({
            success: true,
            performance: results
        });

    });

});


// ==========================================
// GET EMPLOYEES FOR DROPDOWN
// ==========================================

router.get("/employees", (req, res) => {

    const sql = `
        SELECT
            id,
            employee_code,
            first_name,
            last_name,
            department,
            designation

        FROM employees

        WHERE LOWER(status) = 'active'

        ORDER BY first_name ASC, last_name ASC
    `;

    db.query(sql, (error, results) => {

        if (error) {

            console.error(
                "PERFORMANCE EMPLOYEES ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load employees",
                error: error.sqlMessage
            });
        }

        res.json({
            success: true,
            employees: results
        });

    });

});


// ==========================================
// ADD PERFORMANCE RECORD
// ==========================================

router.post("/", (req, res) => {

    const {
        employee_id,
        review_period,
        goals_score,
        productivity_score,
        quality_score,
        teamwork_score,
        manager_comment
    } = req.body;


    if (!employee_id) {

        return res.status(400).json({
            success: false,
            message: "Employee is required"
        });

    }


    if (!review_period || !review_period.trim()) {

        return res.status(400).json({
            success: false,
            message: "Review period is required"
        });

    }


    const goals = Number(goals_score) || 0;
    const productivity = Number(productivity_score) || 0;
    const quality = Number(quality_score) || 0;
    const teamwork = Number(teamwork_score) || 0;


    // Average of four scores
    const overall = Math.round(
        (
            goals +
            productivity +
            quality +
            teamwork
        ) / 4
    );


    const sql = `
        INSERT INTO performance
        (
            employee_id,
            review_period,
            goals_score,
            productivity_score,
            quality_score,
            teamwork_score,
            overall_score,
            manager_comment
        )

        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;


    const values = [
        employee_id,
        review_period.trim(),
        goals,
        productivity,
        quality,
        teamwork,
        overall,
        manager_comment || null
    ];


    db.query(
        sql,
        values,
        (error, result) => {

            if (error) {

                console.error(
                    "ADD PERFORMANCE ERROR:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to save performance record",
                    error: error.sqlMessage
                });

            }


            res.status(201).json({

                success: true,

                message:
                    "Performance record saved successfully",

                performanceId:
                    result.insertId,

                overall_score:
                    overall

            });

        }
    );

});


// ==========================================
// UPDATE PERFORMANCE RECORD
// ==========================================

router.put("/:id", (req, res) => {

    const performanceId =
        Number(req.params.id);


    if (!performanceId) {

        return res.status(400).json({
            success: false,
            message: "Invalid performance ID"
        });

    }


    const {
        review_period,
        goals_score,
        productivity_score,
        quality_score,
        teamwork_score,
        manager_comment
    } = req.body;


    const goals =
        Number(goals_score) || 0;

    const productivity =
        Number(productivity_score) || 0;

    const quality =
        Number(quality_score) || 0;

    const teamwork =
        Number(teamwork_score) || 0;


    const overall =
        Math.round(
            (
                goals +
                productivity +
                quality +
                teamwork
            ) / 4
        );


    const sql = `
        UPDATE performance

        SET
            review_period = ?,
            goals_score = ?,
            productivity_score = ?,
            quality_score = ?,
            teamwork_score = ?,
            overall_score = ?,
            manager_comment = ?

        WHERE id = ?
    `;


    const values = [
        review_period || null,
        goals,
        productivity,
        quality,
        teamwork,
        overall,
        manager_comment || null,
        performanceId
    ];


    db.query(
        sql,
        values,
        (error, result) => {

            if (error) {

                console.error(
                    "UPDATE PERFORMANCE ERROR:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to update performance",
                    error: error.sqlMessage
                });

            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Performance record not found"
                });

            }


            res.json({

                success: true,

                message:
                    "Performance updated successfully",

                overall_score:
                    overall

            });

        }
    );

});


// ==========================================
// DELETE PERFORMANCE RECORD
// ==========================================

router.delete("/:id", (req, res) => {

    const performanceId =
        Number(req.params.id);


    if (!performanceId) {

        return res.status(400).json({
            success: false,
            message: "Invalid performance ID"
        });

    }


    const sql = `
        DELETE FROM performance
        WHERE id = ?
    `;


    db.query(
        sql,
        [performanceId],
        (error, result) => {

            if (error) {

                console.error(
                    "DELETE PERFORMANCE ERROR:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to delete performance record",
                    error: error.sqlMessage
                });

            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Performance record not found"
                });

            }


            res.json({

                success: true,

                message:
                    "Performance record deleted successfully"

            });

        }
    );

});


module.exports = router;