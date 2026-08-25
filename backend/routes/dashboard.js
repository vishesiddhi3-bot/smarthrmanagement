// ==========================================
// SmartHR - HR DASHBOARD ROUTES
// ==========================================

const express = require("express");
const db = require("../config/db");

const router = express.Router();


// ==========================================
// GET HR DASHBOARD DATA
// ==========================================

router.get("/", (req, res) => {

    const totalEmployeesSql = `
        SELECT COUNT(*) AS totalEmployees
        FROM employees
        WHERE LOWER(status) = 'active'
    `;


    const departmentsSql = `
        SELECT COUNT(DISTINCT department) AS totalDepartments
        FROM employees
        WHERE department IS NOT NULL
        AND TRIM(department) <> ''
        AND LOWER(status) = 'active'
    `;


    const onLeaveTodaySql = `
        SELECT COUNT(DISTINCT l.employee_id) AS onLeaveToday
        FROM leave_requests l
        WHERE LOWER(l.status) = 'approved'
        AND CURDATE() BETWEEN l.start_date AND l.end_date
    `;


    // ======================================
    // ATTENDANCE TODAY
    // ======================================

    const attendanceTodaySql = `
        SELECT

            COUNT(DISTINCT employee_id) AS markedAttendance,

            COUNT(
                DISTINCT CASE
                    WHEN LOWER(status)
                    IN ('present', 'half_day')
                    THEN employee_id
                END
            ) AS presentCount

        FROM attendance

        WHERE attendance_date = CURDATE()
    `;


    // ======================================
    // ATTENDANCE LAST 7 DAYS
    // ======================================

    const attendanceWeeklySql = `
        SELECT

            attendance_date,

            COUNT(DISTINCT employee_id) AS totalMarked,

            COUNT(
                DISTINCT CASE
                    WHEN LOWER(status)
                    IN ('present', 'half_day')
                    THEN employee_id
                END
            ) AS presentCount

        FROM attendance

        WHERE attendance_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        AND attendance_date <= CURDATE()

        GROUP BY attendance_date

        ORDER BY attendance_date ASC
    `;


    // ======================================
    // RECENT EMPLOYEES
    // ======================================

    const recentEmployeesSql = `
        SELECT
            id,
            employee_code,
            first_name,
            last_name,
            department,
            designation,
            joining_date,
            status
        FROM employees
        ORDER BY id DESC
        LIMIT 5
    `;


    // ======================================
    // DEPARTMENT PERFORMANCE
    // ======================================

    const departmentPerformanceSql = `
        SELECT

            e.department,

            COUNT(DISTINCT e.id) AS totalEmployees,

            COUNT(
                DISTINCT CASE
                    WHEN a.attendance_date = CURDATE()
                    AND LOWER(a.status)
                    IN ('present', 'half_day')
                    THEN e.id
                END
            ) AS presentEmployees

        FROM employees e

        LEFT JOIN attendance a
            ON e.id = a.employee_id
            AND a.attendance_date = CURDATE()

        WHERE LOWER(e.status) = 'active'

        AND e.department IS NOT NULL

        AND TRIM(e.department) <> ''

        GROUP BY e.department

        ORDER BY e.department
    `;


    // ======================================
    // RECENT LEAVE ACTIVITY
    // ======================================

    const recentLeaveSql = `
        SELECT

            l.id,
            l.employee_id,
            l.status,
            l.start_date,
            l.end_date,

            e.first_name,
            e.last_name,
            e.employee_code

        FROM leave_requests l

        INNER JOIN employees e
            ON l.employee_id = e.id

        ORDER BY l.id DESC

        LIMIT 5
    `;


    // ======================================
    // RECENT PAYROLL ACTIVITY
    // ======================================

    const recentPayrollSql = `
        SELECT

            p.id,
            p.employee_id,

            CONCAT(
                p.year,
                '-',
                LPAD(p.month, 2, '0')
            ) AS pay_month,

            p.month,
            p.year,

            p.basic_salary,
            p.allowances,
            p.deductions,
            p.net_salary,
            p.payment_status,

            e.first_name,
            e.last_name,
            e.employee_code

        FROM payroll p

        INNER JOIN employees e
            ON p.employee_id = e.id

        ORDER BY p.id DESC

        LIMIT 5
    `;


    // ======================================
    // QUERY 1
    // ======================================

    db.query(
        totalEmployeesSql,
        (employeesError, employeesResult) => {

            if (employeesError) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to load employee statistics",
                    error: employeesError.sqlMessage
                });
            }


            // ======================================
            // QUERY 2
            // ======================================

            db.query(
                departmentsSql,
                (departmentsError, departmentsResult) => {

                    if (departmentsError) {
                        return res.status(500).json({
                            success: false,
                            message: "Unable to load department statistics",
                            error: departmentsError.sqlMessage
                        });
                    }


                    // ======================================
                    // QUERY 3
                    // ======================================

                    db.query(
                        onLeaveTodaySql,
                        (leaveError, leaveResult) => {

                            if (leaveError) {
                                return res.status(500).json({
                                    success: false,
                                    message: "Unable to load leave statistics",
                                    error: leaveError.sqlMessage
                                });
                            }


                            // ======================================
                            // QUERY 4
                            // ======================================

                            db.query(
                                attendanceTodaySql,
                                (attendanceError, attendanceResult) => {

                                    if (attendanceError) {
                                        return res.status(500).json({
                                            success: false,
                                            message: "Unable to load attendance statistics",
                                            error: attendanceError.sqlMessage
                                        });
                                    }


                                    // ======================================
                                    // QUERY 5
                                    // WEEKLY ATTENDANCE
                                    // ======================================

                                    db.query(
                                        attendanceWeeklySql,
                                        (
                                            weeklyAttendanceError,
                                            weeklyAttendanceResult
                                        ) => {

                                            if (weeklyAttendanceError) {

                                                console.error(
                                                    "WEEKLY ATTENDANCE ERROR:",
                                                    weeklyAttendanceError
                                                );

                                                return res.status(500).json({
                                                    success: false,
                                                    message:
                                                        "Unable to load weekly attendance",
                                                    error:
                                                        weeklyAttendanceError.sqlMessage
                                                });

                                            }


                                            // ======================================
                                            // QUERY 6
                                            // ======================================

                                            db.query(
                                                recentEmployeesSql,
                                                (
                                                    recentEmployeesError,
                                                    recentEmployeesResult
                                                ) => {

                                                    if (recentEmployeesError) {
                                                        return res.status(500).json({
                                                            success: false,
                                                            message:
                                                                "Unable to load recent employees",
                                                            error:
                                                                recentEmployeesError.sqlMessage
                                                        });
                                                    }


                                                    // ======================================
                                                    // QUERY 7
                                                    // ======================================

                                                    db.query(
                                                        departmentPerformanceSql,
                                                        (
                                                            performanceError,
                                                            performanceResult
                                                        ) => {

                                                            if (performanceError) {
                                                                return res.status(500).json({
                                                                    success: false,
                                                                    message:
                                                                        "Unable to load department performance",
                                                                    error:
                                                                        performanceError.sqlMessage
                                                                });
                                                            }


                                                            // ======================================
                                                            // QUERY 8
                                                            // ======================================

                                                            db.query(
                                                                recentLeaveSql,
                                                                (
                                                                    recentLeaveError,
                                                                    recentLeaveResult
                                                                ) => {

                                                                    if (recentLeaveError) {
                                                                        return res.status(500).json({
                                                                            success: false,
                                                                            message:
                                                                                "Unable to load recent leave activity",
                                                                            error:
                                                                                recentLeaveError.sqlMessage
                                                                        });
                                                                    }


                                                                    // ======================================
                                                                    // QUERY 9
                                                                    // ======================================

                                                                    db.query(
                                                                        recentPayrollSql,
                                                                        (
                                                                            recentPayrollError,
                                                                            recentPayrollResult
                                                                        ) => {

                                                                            if (recentPayrollError) {
                                                                                return res.status(500).json({
                                                                                    success: false,
                                                                                    message:
                                                                                        "Unable to load recent payroll activity",
                                                                                    error:
                                                                                        recentPayrollError.sqlMessage
                                                                                });
                                                                            }


                                                                            // ======================================
                                                                            // TOTAL EMPLOYEES
                                                                            // ======================================

                                                                            const totalEmployees =
                                                                                Number(
                                                                                    employeesResult[0]?.totalEmployees
                                                                                ) || 0;


                                                                            // ======================================
                                                                            // PRESENT TODAY
                                                                            // ======================================

                                                                            const presentCount =
                                                                                Number(
                                                                                    attendanceResult[0]?.presentCount
                                                                                ) || 0;


                                                                            // ======================================
                                                                            // MARKED ATTENDANCE
                                                                            // ======================================

                                                                            const markedAttendance =
                                                                                Number(
                                                                                    attendanceResult[0]?.markedAttendance
                                                                                ) || 0;


                                                                            // ======================================
                                                                            // ATTENDANCE %
                                                                            // ======================================

                                                                            let attendancePercentage = 0;

                                                                            if (totalEmployees > 0) {

                                                                                attendancePercentage =
                                                                                    (
                                                                                        presentCount /
                                                                                        totalEmployees
                                                                                    ) * 100;

                                                                            }


                                                                            attendancePercentage =
                                                                                Number(
                                                                                    attendancePercentage.toFixed(1)
                                                                                );


                                                                            // ======================================
                                                                            // WEEKLY ATTENDANCE DATA
                                                                            // ======================================

                                                                            const weeklyAttendance =
                                                                                weeklyAttendanceResult.map(day => {

                                                                                    const present =
                                                                                        Number(
                                                                                            day.presentCount
                                                                                        ) || 0;


                                                                                    let percentage = 0;


                                                                                    if (
                                                                                        totalEmployees > 0
                                                                                    ) {

                                                                                        percentage =
                                                                                            (
                                                                                                present /
                                                                                                totalEmployees
                                                                                            ) * 100;

                                                                                    }


                                                                                    return {

                                                                                        date:
                                                                                            day.attendance_date,

                                                                                        present:
                                                                                            present,

                                                                                        totalMarked:
                                                                                            Number(
                                                                                                day.totalMarked
                                                                                            ) || 0,

                                                                                        percentage:
                                                                                            Number(
                                                                                                percentage.toFixed(1)
                                                                                            )

                                                                                    };

                                                                                });


                                                                            // ======================================
                                                                            // DEPARTMENT PERFORMANCE
                                                                            // ======================================

                                                                            const departmentPerformance =
                                                                                performanceResult.map(
                                                                                    department => {

                                                                                        const total =
                                                                                            Number(
                                                                                                department.totalEmployees
                                                                                            ) || 0;


                                                                                        const present =
                                                                                            Number(
                                                                                                department.presentEmployees
                                                                                            ) || 0;


                                                                                        let percentage = 0;


                                                                                        if (total > 0) {

                                                                                            percentage =
                                                                                                (
                                                                                                    present /
                                                                                                    total
                                                                                                ) * 100;

                                                                                        }


                                                                                        return {

                                                                                            department:
                                                                                                department.department,

                                                                                            totalEmployees:
                                                                                                total,

                                                                                            presentEmployees:
                                                                                                present,

                                                                                            performance:
                                                                                                Number(
                                                                                                    percentage.toFixed(1)
                                                                                                )

                                                                                        };

                                                                                    }
                                                                                );


                                                                            // ======================================
                                                                            // FINAL RESPONSE
                                                                            // ======================================

                                                                            return res.json({

                                                                                success: true,

                                                                                stats: {

                                                                                    totalEmployees:
                                                                                        totalEmployees,

                                                                                    totalDepartments:
                                                                                        Number(
                                                                                            departmentsResult[0]?.totalDepartments
                                                                                        ) || 0,

                                                                                    onLeaveToday:
                                                                                        Number(
                                                                                            leaveResult[0]?.onLeaveToday
                                                                                        ) || 0,

                                                                                    attendanceToday:
                                                                                        attendancePercentage,

                                                                                    presentToday:
                                                                                        presentCount,

                                                                                    markedAttendance:
                                                                                        markedAttendance

                                                                                },


                                                                                // NEW
                                                                                weeklyAttendance:
                                                                                    weeklyAttendance,


                                                                                recentEmployees:
                                                                                    recentEmployeesResult,


                                                                                recentLeaves:
                                                                                    recentLeaveResult,


                                                                                recentPayroll:
                                                                                    recentPayrollResult,


                                                                                departmentPerformance:
                                                                                    departmentPerformance

                                                                            });

                                                                        }
                                                                    );

                                                                }
                                                            );

                                                        }
                                                    );

                                                }
                                            );

                                        }
                                    );

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});


// ==========================================
// TEST ROUTE
// ==========================================

router.get("/test", (req, res) => {

    res.json({
        success: true,
        message: "Dashboard route is working."
    });

});


module.exports = router;