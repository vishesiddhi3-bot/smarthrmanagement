// =====================================================
// SmartHR - AUDIT LOGGER
// =====================================================

const db = require("../config/db");


// =====================================================
// CREATE AUDIT LOG
// =====================================================

function createAuditLog({
    user_id = null,
    action,
    description = null,
    entity_type = null,
    entity_id = null,
    ip_address = null
}) {

    return new Promise((resolve, reject) => {

        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (!action) {
            return reject(
                new Error("Audit action is required")
            );
        }


        // ---------------------------------------------
        // INSERT AUDIT LOG
        // ---------------------------------------------

        const sql = `
            INSERT INTO audit_logs
            (
                user_id,
                action,
                description,
                entity_type,
                entity_id,
                ip_address
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `;


        db.query(
            sql,
            [
                user_id,
                action,
                description,
                entity_type,
                entity_id,
                ip_address
            ],
            (err, result) => {

                if (err) {

                    console.error(
                        "AUDIT LOG INSERT ERROR:",
                        err
                    );

                    return reject(err);
                }


                console.log(
                    `AUDIT LOG CREATED: ${action}`
                );


                resolve(result);

            }
        );

    });

}


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    createAuditLog
};