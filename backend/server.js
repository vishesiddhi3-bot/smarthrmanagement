const express = require("express");
const cors = require("cors");

const db = require("./config/db");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const employeesRoutes = require("./routes/employees");
const employeeDashboardRoutes = require("./routes/employeeDashboard");
const attendanceRoutes = require("./routes/attendance");
const leaveRoutes = require("./routes/leave");
const payrollRoutes = require("./routes/payroll");
const dashboardRoutes = require("./routes/dashboard");
const performanceRoutes = require("./routes/performance");
const recognitionRoutes = require("./routes/recognition");
const suggestionsRoutes = require("./routes/suggestions");
const announcementsRoutes = require("./routes/announcements");
const departmentsRoutes = require("./routes/departments");
const managerRoutes = require("./routes/manager");
const reportsRoutes = require("./routes/reports");
const auditLogsRoutes = require("./routes/auditLogs");
const workRoutes = require("./routes/work");


const app = express();


app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(
    express.json()
);


app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/users",
    userRoutes
);

app.use(
    "/api/employees",
    employeesRoutes
);

app.use(
    "/api/employee-dashboard",
    employeeDashboardRoutes
);

app.use(
    "/api/attendance",
    attendanceRoutes
);

app.use(
    "/api/leave",
    leaveRoutes
);

app.use(
    "/api/payroll",
    payrollRoutes
);

app.use(
    "/api/dashboard",
    dashboardRoutes
);

app.use(
    "/api/performance",
    performanceRoutes
);

app.use(
    "/api/recognition",
    recognitionRoutes
);

app.use(
    "/api/suggestions",
    suggestionsRoutes
);

app.use(
    "/api/announcements",
    announcementsRoutes
);

app.use(
    "/api/departments",
    departmentsRoutes
);
app.use("/api/audit-logs", auditLogsRoutes);

// =====================================================
// MANAGER ROUTE
// =====================================================

app.use(
    "/api/manager",
    managerRoutes
);


app.use(
    "/api/reports",
    reportsRoutes
);

app.use(
    "/api/audit-logs",
    auditLogsRoutes
);

app.use(
    "/api/work",
    workRoutes
);


// =====================================================
// HOME
// =====================================================

app.get(
    "/",
    (req, res) => {

        res.json({
            success: true,
            message:
                "SmartHR Backend is running 🚀"
        });

    }
);


// =====================================================
// DATABASE TEST
// =====================================================

app.get(
    "/api/db-test",
    (req, res) => {

        db.query(
            "SELECT 1 AS test",
            (err, result) => {

                if (err) {

                    console.error(
                        "DATABASE ERROR:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Database query failed",
                        error:
                            err.sqlMessage ||
                            err.message
                    });

                }


                res.json({
                    success: true,
                    message:
                        "Database is working perfectly ✅",
                    result:
                        result
                });

            }
        );

    }
);

const PORT = process.env.PORT || 5000;

app.listen(
    PORT,
    () => {

        console.log(
            `SmartHR Server running at http://localhost:${PORT}`
        );

    }
);
