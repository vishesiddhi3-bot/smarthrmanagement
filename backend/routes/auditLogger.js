const express = require("express");
const db = require("../config/db");

const router = express.Router();


// =====================================================
// GET AUDIT LOGS
// =====================================================

router.get("/", (req, res) => {

    const {
        action = "all",
        search = ""
    } = req.query;

    let sql = `
        SELECT
            a.id,
            a.user_id,
            COALESCE(u.username, 'System') AS username,
            u.email,
            a.action,
            a.description,
            a.entity_type,
            a.entity_id,
            a.ip_address,
            a.created_at
        FROM audit_logs a
        LEFT JOIN users u
            ON u.id = a.user_id
        WHERE 1 = 1
    `;

    const params = [];

    if (action && action !== "all") {
        sql += ` AND a.action = ? `;
        params.push(action);
    }

    if (search.trim() !== "") {

        sql += `
            AND (
                u.username LIKE ?
                OR u.email LIKE ?
                OR a.description LIKE ?
                OR a.action LIKE ?
            )
        `;

        const keyword = `%${search.trim()}%`;

        params.push(
            keyword,
            keyword,
            keyword,
            keyword
        );
    }

    sql += ` ORDER BY a.created_at DESC `;

    db.query(sql, params, (err, results) => {

        if (err) {

            console.error(
                "GET AUDIT LOGS ERROR:",
                err
            );

            return res.status(500).json({
                success: false,
                message: "Unable to fetch audit logs",
                error: err.sqlMessage || err.message
            });
        }

        return res.json({
            success: true,
            logs: results
        });
    });
});


// =====================================================
// AUDIT LOG STATISTICS
// =====================================================

router.get("/stats", (req, res) => {

    const sql = `
        SELECT
            COUNT(*) AS total,

            SUM(
                CASE
                    WHEN action IN ('LOGIN', 'LOGOUT')
                    THEN 1
                    ELSE 0
                END
            ) AS login_activity,

            SUM(
                CASE
                    WHEN action IN (
                        'USER_CREATED',
                        'USER_UPDATED',
                        'USER_DELETED',
                        'USER_ACTIVATED',
                        'USER_DEACTIVATED'
                    )
                    THEN 1
                    ELSE 0
                END
            ) AS user_changes,

            SUM(
                CASE
                    WHEN action IN (
                        'LEAVE_SUBMITTED',
                        'LEAVE_APPROVED',
                        'LEAVE_REJECTED'
                    )
                    THEN 1
                    ELSE 0
                END
            ) AS leave_actions,

            SUM(
                CASE
                    WHEN action = 'ADMIN_ACTION'
                    THEN 1
                    ELSE 0
                END
            ) AS admin_actions

        FROM audit_logs
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "AUDIT STATS ERROR:",
                err
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load audit statistics"
            });
        }

        const stats = results[0] || {};

        return res.json({
            success: true,
            stats: {
                total: Number(stats.total || 0),
                login_activity:
                    Number(stats.login_activity || 0),
                user_changes:
                    Number(stats.user_changes || 0),
                leave_actions:
                    Number(stats.leave_actions || 0),
                admin_actions:
                    Number(stats.admin_actions || 0)
            }
        });
    });
});


// =====================================================
// CLEAR AUDIT LOGS
// =====================================================

router.delete("/", (req, res) => {

    db.query(
        "DELETE FROM audit_logs",
        (err) => {

            if (err) {

                console.error(
                    "CLEAR AUDIT LOGS ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to clear audit logs"
                });
            }

            return res.json({
                success: true,
                message: "Audit logs cleared successfully"
            });
        }
    );
});


// =====================================================
// TEST
// =====================================================

router.get("/test", (req, res) => {

    return res.json({
        success: true,
        message: "Audit logs route is working"
    });

});


module.exports = router;