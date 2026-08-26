const bcrypt = require("bcryptjs");
const db = require("./db");

const schemaQueries = [
    // 1. USERS
    `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NULL,
        role ENUM('admin', 'hr', 'manager', 'employee') NOT NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 2. DEPARTMENTS
    `CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL UNIQUE,
        description TEXT,
        manager_id INT NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 3. EMPLOYEES
    `CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_code VARCHAR(50) UNIQUE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(50),
        department VARCHAR(100),
        designation VARCHAR(100),
        manager_id INT NULL,
        joining_date DATE,
        salary DECIMAL(10,2) DEFAULT 0.00,
        status ENUM('active', 'inactive', 'on_leave', 'terminated') DEFAULT 'active',
        user_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (user_id),
        INDEX (department)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 4. ATTENDANCE
    `CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        attendance_date DATE NOT NULL,
        check_in TIME NULL,
        check_out TIME NULL,
        total_hours DECIMAL(5,2) NULL,
        status ENUM('present', 'absent', 'late', 'half_day', 'on_leave') DEFAULT 'present',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (employee_id),
        INDEX (attendance_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 5. LEAVE TYPES
    `CREATE TABLE IF NOT EXISTS leave_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        total_days INT DEFAULT 12,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 6. LEAVE REQUESTS
    `CREATE TABLE IF NOT EXISTS leave_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        leave_type_id INT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        approved_by INT NULL,
        rejection_reason TEXT NULL,
        applied_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (employee_id),
        INDEX (leave_type_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 7. PAYROLL
    `CREATE TABLE IF NOT EXISTS payroll (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        month VARCHAR(20) NOT NULL,
        year INT NOT NULL,
        basic_salary DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        allowances DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        deductions DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        gross_salary DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        net_salary DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        payment_status ENUM('pending', 'paid') DEFAULT 'pending',
        payment_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (employee_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 8. PERFORMANCE
    `CREATE TABLE IF NOT EXISTS performance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        review_period VARCHAR(100) NOT NULL,
        goals_score INT DEFAULT 0,
        productivity_score INT DEFAULT 0,
        quality_score INT DEFAULT 0,
        teamwork_score INT DEFAULT 0,
        overall_score DECIMAL(5,2) DEFAULT 0.00,
        manager_comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (employee_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 9. RECOGNITION
    `CREATE TABLE IF NOT EXISTS recognition (
        id INT AUTO_INCREMENT PRIMARY KEY,
        from_user_id INT NOT NULL,
        to_employee_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (from_user_id),
        INDEX (to_employee_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 10. SUGGESTIONS
    `CREATE TABLE IF NOT EXISTS suggestions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        admin_comment TEXT NULL,
        status ENUM('submitted', 'under_review', 'reviewed', 'implemented', 'approved', 'rejected') DEFAULT 'submitted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (employee_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 11. ANNOUNCEMENTS
    `CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_by INT NOT NULL,
        status ENUM('active', 'archived') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (created_by)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 12. AUDIT LOGS
    `CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        user_role VARCHAR(50) NULL,
        action VARCHAR(100) NOT NULL,
        module VARCHAR(100) NULL,
        description TEXT,
        entity_type VARCHAR(100) NULL,
        entity_id INT NULL,
        ip_address VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 13. EMPLOYEE TASKS
    `CREATE TABLE IF NOT EXISTS employee_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
        due_date DATE NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (employee_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
];

async function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

async function addColumnIfNotExists(table, column, definition) {
    try {
        await runQuery(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`✅ Added column ${column} to ${table}`);
    } catch (err) {
        if (err.errno !== 1060 && !err.message.includes("Duplicate column name")) {
            console.warn(`Column check for ${table}.${column}:`, err.message);
        }
    }
}

async function initDatabase() {
    try {
        console.log("🔄 Checking / Initializing database tables...");
        for (const query of schemaQueries) {
            await runQuery(query);
        }

        // Run column migrations for existing tables
        await addColumnIfNotExists("suggestions", "admin_comment", "TEXT NULL");
        await addColumnIfNotExists("audit_logs", "user_role", "VARCHAR(50) NULL");
        await addColumnIfNotExists("audit_logs", "module", "VARCHAR(100) NULL");
        await addColumnIfNotExists("employee_tasks", "completed_at", "DATETIME NULL");

        console.log("✅ All tables and columns verified / upgraded successfully.");

        // Seed Leave Types
        const leaveTypes = [
            ["Casual Leave", 12],
            ["Sick Leave", 10],
            ["Annual Leave", 15],
            ["Maternity/Paternity Leave", 90]
        ];
        for (const [name, total_days] of leaveTypes) {
            await runQuery(
                "INSERT IGNORE INTO leave_types (name, total_days) VALUES (?, ?)",
                [name, total_days]
            );
        }

        // Seed Departments
        const departments = [
            ["Human Resources", "HR Management & Operations"],
            ["Engineering", "Software Development & IT"],
            ["Marketing", "Marketing & Public Relations"],
            ["Sales", "Sales & Business Development"],
            ["Finance", "Financial Planning & Accounting"]
        ];
        for (const [name, desc] of departments) {
            await runQuery(
                "INSERT IGNORE INTO departments (name, description, status) VALUES (?, ?, 'active')",
                [name, desc]
            );
        }

        // Seed Users
        const defaultPassword = await bcrypt.hash("123456", 10);
        const usersToSeed = [
            {
                username: "Siddhi Vishe",
                email: "siddhivishe23@gmail.com",
                role: "hr",
                department: "Human Resources",
                designation: "HR Manager"
            },
            {
                username: "Admin User",
                email: "admin@smarthr.com",
                role: "admin",
                department: "Engineering",
                designation: "System Administrator"
            },
            {
                username: "Manager User",
                email: "manager@smarthr.com",
                role: "manager",
                department: "Engineering",
                designation: "Team Lead"
            },
            {
                username: "Employee User",
                email: "employee@smarthr.com",
                role: "employee",
                department: "Engineering",
                designation: "Software Developer"
            }
        ];

        let employeeRecordId = null;

        for (const u of usersToSeed) {
            const existing = await runQuery("SELECT id FROM users WHERE email = ? LIMIT 1", [u.email]);
            let userId;
            if (existing.length === 0) {
                const insertRes = await runQuery(
                    "INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, 'active')",
                    [u.username, u.email, defaultPassword, u.role]
                );
                userId = insertRes.insertId;
                console.log(`✅ Seeded user: ${u.email} (${u.role})`);
            } else {
                userId = existing[0].id;
            }

            // Ensure employee profile exists for user
            const empExisting = await runQuery("SELECT id FROM employees WHERE user_id = ? LIMIT 1", [userId]);
            if (empExisting.length === 0) {
                const names = u.username.split(" ");
                const code = "EMP" + String(userId).padStart(3, "0");
                const insEmp = await runQuery(
                    `INSERT INTO employees 
                    (employee_code, first_name, last_name, phone, department, designation, joining_date, salary, status, user_id) 
                    VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?, 'active', ?)`,
                    [
                        code,
                        names[0] || u.username,
                        names[1] || "Staff",
                        "9876543210",
                        u.department,
                        u.designation,
                        60000.00,
                        userId
                    ]
                );
                if (u.role === "employee" || u.role === "hr") {
                    employeeRecordId = insEmp.insertId;
                }
                console.log(`✅ Seeded employee record for: ${u.email}`);
            } else {
                if (u.role === "employee" || u.role === "hr") {
                    employeeRecordId = empExisting[0].id;
                }
            }
        }

        // Seed Sample Suggestions if table is empty
        const existingSuggestions = await runQuery("SELECT id FROM suggestions LIMIT 1");
        if (existingSuggestions.length === 0 && employeeRecordId) {
            const sampleSuggestions = [
                [employeeRecordId, "Flexible Work Hours", "Allow flexible starting hours between 8 AM and 10 AM to improve work-life balance.", "Great idea, we are reviewing this policy.", "under_review"],
                [employeeRecordId, "Learning & Certification Budget", "Provide annual learning allowance for online certifications and tech courses.", "Approved by HR management.", "approved"],
                [employeeRecordId, "Wellness & Ergonomic Chairs", "Upgrade office chairs for ergonomic posture support during long working hours.", null, "submitted"]
            ];
            for (const [empId, title, desc, comment, status] of sampleSuggestions) {
                await runQuery(
                    "INSERT INTO suggestions (employee_id, title, description, admin_comment, status) VALUES (?, ?, ?, ?, ?)",
                    [empId, title, desc, comment, status]
                );
            }
            console.log("✅ Seeded sample suggestions.");
        }

        // Seed Sample Announcement if empty
        const existingAnnouncements = await runQuery("SELECT id FROM announcements LIMIT 1");
        if (existingAnnouncements.length === 0) {
            await runQuery(
                "INSERT INTO announcements (title, message, created_by, status) VALUES (?, ?, ?, 'active')",
                ["Welcome to SmartHR System", "SmartHR management portal is fully online. Explore your dashboard!", 1]
            );
            console.log("✅ Seeded welcome announcement.");
        }

        // Seed Sample Tasks if empty
        const existingTasks = await runQuery("SELECT id FROM employee_tasks LIMIT 1");
        if (existingTasks.length === 0 && employeeRecordId) {
            await runQuery(
                "INSERT INTO employee_tasks (employee_id, title, description, priority, status, due_date) VALUES (?, ?, ?, 'high', 'in_progress', DATE_ADD(CURDATE(), INTERVAL 5 DAY))",
                [employeeRecordId, "Complete System Onboarding", "Review your profile and update contact details in the portal."]
            );
            console.log("✅ Seeded sample task.");
        }

        console.log("🎉 Database initialization and verification complete!");
        return { success: true, message: "Database initialized, migrated, and seeded successfully" };
    } catch (err) {
        console.error("❌ Database initialization error:", err);
        return { success: false, error: err.message };
    }
}

module.exports = { initDatabase };
