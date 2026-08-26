// ==========================================
// SmartHR ADMIN DASHBOARD
// ==========================================

const API_URL = "https://smarthrmanagement-backend.onrender.com/api/users";


// ==========================================
// LOAD DASHBOARD STATISTICS
// ==========================================

async function loadDashboardStats() {

    console.log("SmartHR Dashboard loading...");

    try {

        const response = await fetch(API_URL);

        console.log("Users API status:", response.status);

        if (!response.ok) {

            throw new Error(
                "API Error: " + response.status
            );

        }


        const data = await response.json();

        console.log("Users API response:", data);


        if (!data.success) {

            throw new Error(
                data.message || "Unable to load users"
            );

        }


        const users =
            Array.isArray(data.users)
                ? data.users
                : [];


        // ======================================
        // TOTAL USERS
        // ======================================

        setText(
            "totalUsers",
            users.length
        );


        // ======================================
        // HR MANAGERS
        // ======================================

        setText(
            "hrManagers",
            countByRole(users, "hr")
        );


        // ======================================
        // ACTIVE USERS
        // ======================================

        setText(
            "activeUsers",
            countByStatus(users, "active")
        );


        // ======================================
        // INACTIVE USERS
        // ======================================

        setText(
            "inactiveUsers",
            countByStatus(users, "inactive")
        );


        // ======================================
        // MANAGERS
        // ======================================

        setText(
            "managerUsers",
            countByRole(users, "manager")
        );


        // ======================================
        // EMPLOYEES
        // ======================================

        setText(
            "employeeUsers",
            countByRole(users, "employee")
        );


        console.log(
            "Dashboard statistics updated successfully."
        );

    }
    catch (error) {

        console.error(
            "Dashboard statistics error:",
            error
        );

    }

}


// ==========================================
// SET TEXT SAFELY
// ==========================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent = value;

    }

}


// ==========================================
// COUNT ROLE
// ==========================================

function countByRole(users, role) {

    return users.filter(function (user) {

        return String(user.role || "")
            .toLowerCase() === role;

    }).length;

}


// ==========================================
// COUNT STATUS
// ==========================================

function countByStatus(users, status) {

    return users.filter(function (user) {

        return String(user.status || "")
            .toLowerCase() === status;

    }).length;

}


// ==========================================
// OPEN USER MANAGEMENT
// ==========================================

function openUsersPage() {

    window.location.href = "users.html";

}

// ==========================================
// OPEN EMPLOYEES PAGE
// ==========================================

function openEmployeesPage() {

    window.location.href = "employees.html";

}

// ==========================================
// ADD USER
// ==========================================

function openAddUser() {

    window.location.href = "users.html";

}


// ==========================================
// COMING SOON
// ==========================================

function comingSoon(section) {

    alert(
        section +
        " section is ready for the next module."
    );

}


// ==========================================
// MOBILE MENU
// ==========================================

function setupMobileMenu() {

    const button =
        document.getElementById("mobileMenuBtn");

    const sidebar =
        document.getElementById("sidebar");


    if (!button || !sidebar) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            sidebar.classList.toggle("show");

        }
    );

}


// ==========================================
// SYSTEM SETTINGS
// ==========================================

function setupSettings() {

    const button =
        document.getElementById("systemSettings");


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            comingSoon("System Settings");

        }
    );

}


// ==========================================
// ADD USER BUTTON
// ==========================================

function setupAddUserButton() {

    const button =
        document.getElementById("addUserBtn");


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            openAddUser();

        }
    );

}


// ==========================================
// START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadDashboardStats();

        setupMobileMenu();

        setupSettings();

        setupAddUserButton();

    }
);