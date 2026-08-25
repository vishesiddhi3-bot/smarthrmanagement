// ==========================================
// SmartHR - USER MANAGEMENT
// ==========================================

const API_URL = "http://localhost:5000/api/users";

let allUsers = [];
let deleteUserId = null;


// ==========================================
// DOM READY
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    loadUsers();

    setupEvents();

});


// ==========================================
// LOAD USERS
// ==========================================

async function loadUsers() {

    const tbody =
        document.getElementById("usersTableBody");

    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="loading-cell">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Loading users...
            </td>
        </tr>
    `;

    hideEmptyState();

    try {

        const response =
            await fetch(API_URL);

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load users"
            );

        }

        allUsers =
            Array.isArray(data.users)
                ? data.users
                : [];

        updateStatistics();

        renderUsers();

    }
    catch (error) {

        console.error(
            "LOAD USERS ERROR:",
            error
        );

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-cell">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    Unable to load users.
                    <br><br>
                    Make sure your backend is running.
                </td>
            </tr>
        `;

        showToast(
            error.message ||
            "Unable to load users",
            "error"
        );

    }

}


// ==========================================
// STATISTICS
// ==========================================

function updateStatistics() {

    const total =
        allUsers.length;

    const active =
        allUsers.filter(
            user =>
                String(user.status).toLowerCase() === "active"
        ).length;

    const inactive =
        allUsers.filter(
            user =>
                String(user.status).toLowerCase() === "inactive"
        ).length;

    const hr =
        allUsers.filter(
            user =>
                String(user.role).toLowerCase() === "hr"
        ).length;

    const managers =
        allUsers.filter(
            user =>
                String(user.role).toLowerCase() === "manager"
        ).length;


    setText("totalUsers", total);

    setText("activeUsers", active);

    setText("inactiveUsers", inactive);

    setText("hrCount", hr);

    setText("managerCount", managers);

}


// ==========================================
// RENDER USERS
// ==========================================

function renderUsers() {

    const tbody =
        document.getElementById(
            "usersTableBody"
        );

    const search =
        document.getElementById(
            "userSearch"
        ).value
        .trim()
        .toLowerCase();

    const role =
        document.getElementById(
            "roleFilter"
        ).value;

    const status =
        document.getElementById(
            "statusFilter"
        ).value;


    const filtered =
        allUsers.filter(user => {

            const username =
                String(user.username || "")
                    .toLowerCase();

            const email =
                String(user.email || "")
                    .toLowerCase();

            const userRole =
                String(user.role || "")
                    .toLowerCase();

            const userStatus =
                String(user.status || "")
                    .toLowerCase();


            const searchMatch =
                !search ||
                username.includes(search) ||
                email.includes(search);

            const roleMatch =
                role === "all" ||
                userRole === role;

            const statusMatch =
                status === "all" ||
                userStatus === status;


            return (
                searchMatch &&
                roleMatch &&
                statusMatch
            );

        });


    if (filtered.length === 0) {

        tbody.innerHTML = "";

        showEmptyState();

        return;

    }


    hideEmptyState();


    tbody.innerHTML =
        filtered.map(
            user => createUserRow(user)
        ).join("");

}


// ==========================================
// CREATE TABLE ROW
// ==========================================

function createUserRow(user) {

    const username =
        escapeHTML(user.username || "Unknown");

    const email =
        escapeHTML(user.email || "-");

    const role =
        String(user.role || "")
            .toLowerCase();

    const status =
        String(user.status || "")
            .toLowerCase();

    const id =
        Number(user.id);


    const initials =
        getInitials(user.username);


    const roleText =
        getRoleText(role);


    const statusText =
        status === "active"
            ? "Active"
            : "Inactive";


    const created =
        formatDate(user.created_at);


    const statusButtonClass =
        status === "active"
            ? "deactivate"
            : "";


    const statusIcon =
        status === "active"
            ? "fa-user-slash"
            : "fa-user-check";


    const statusTitle =
        status === "active"
            ? "Deactivate User"
            : "Activate User";


    return `

        <tr>

            <td>

                <div class="user-cell">

                    <div class="user-avatar">
                        ${initials}
                    </div>

                    <div>

                        <div class="user-name">
                            ${username}
                        </div>

                        <div class="user-id">
                            User ID: ${id}
                        </div>

                    </div>

                </div>

            </td>


            <td>
                ${email}
            </td>


            <td>

                <span class="role-badge role-${role}">
                    ${roleText}
                </span>

            </td>


            <td>

                <span class="status-badge status-${status}">
                    ${statusText}
                </span>

            </td>


            <td>
                ${created}
            </td>


            <td>

                <div class="actions">

                    <button
                        class="action-btn edit-btn"
                        title="Edit User"
                        onclick="openEditUser(${id})">

                        <i class="fa-solid fa-pen"></i>

                    </button>


                    <button
                        class="action-btn status-btn ${statusButtonClass}"
                        title="${statusTitle}"
                        onclick="toggleUserStatus(${id}, '${status}')">

                        <i class="fa-solid ${statusIcon}"></i>

                    </button>


                    <button
                        class="action-btn delete-btn-small"
                        title="Delete User"
                        onclick="openDeleteUser(${id})">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </div>

            </td>

        </tr>

    `;

}


// ==========================================
// ADD USER
// ==========================================

function openAddUser() {

    document.getElementById(
        "userForm"
    ).reset();

    document.getElementById(
        "editUserId"
    ).value = "";

    document.getElementById(
        "modalTitle"
    ).textContent =
        "Add New User";

    document.getElementById(
        "modalSubtitle"
    ).textContent =
        "Create a new SmartHR user.";

    document.getElementById(
        "password"
    ).required = true;

    document.getElementById(
        "passwordRequired"
    ).textContent = "*";

    document.getElementById(
        "passwordHelp"
    ).textContent =
        "Password is required when creating a user.";

    document.getElementById(
        "saveUserBtn"
    ).innerHTML =
        `<i class="fa-solid fa-check"></i> Save User`;

    showModal("userModal");

}


// ==========================================
// EDIT USER
// ==========================================

function openEditUser(id) {

    const user =
        allUsers.find(
            item => Number(item.id) === Number(id)
        );

    if (!user) {

        showToast(
            "User not found",
            "error"
        );

        return;

    }


    document.getElementById(
        "editUserId"
    ).value = user.id;

    document.getElementById(
        "username"
    ).value = user.username || "";

    document.getElementById(
        "email"
    ).value = user.email || "";

    document.getElementById(
        "role"
    ).value = user.role || "";

    document.getElementById(
        "status"
    ).value = user.status || "active";

    document.getElementById(
        "password"
    ).value = "";

    document.getElementById(
        "password"
    ).required = false;

    document.getElementById(
        "passwordRequired"
    ).textContent = "";

    document.getElementById(
        "passwordHelp"
    ).textContent =
        "Leave blank to keep the existing password.";

    document.getElementById(
        "modalTitle"
    ).textContent =
        "Edit User";

    document.getElementById(
        "modalSubtitle"
    ).textContent =
        "Update user information and access.";

    document.getElementById(
        "saveUserBtn"
    ).innerHTML =
        `<i class="fa-solid fa-floppy-disk"></i> Update User`;

    showModal("userModal");

}


// ==========================================
// SAVE USER
// ==========================================

async function saveUser(event) {

    event.preventDefault();


    const id =
        document.getElementById(
            "editUserId"
        ).value;

    const username =
        document.getElementById(
            "username"
        ).value.trim();

    const email =
        document.getElementById(
            "email"
        ).value.trim();

    const role =
        document.getElementById(
            "role"
        ).value;

    const status =
        document.getElementById(
            "status"
        ).value;

    const password =
        document.getElementById(
            "password"
        ).value;


    if (!username || !email || !role) {

        showToast(
            "Please fill all required fields.",
            "error"
        );

        return;

    }


    const button =
        document.getElementById(
            "saveUserBtn"
        );


    button.disabled = true;

    button.innerHTML =
        `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;


    try {

        let url;
        let method;
        let body;


        // ==================================
        // EDIT
        // ==================================

        if (id) {

            url =
                `${API_URL}/${id}`;

            method = "PUT";

            body = {
                username,
                email,
                role,
                status
            };


            if (password) {

                body.password =
                    password;

            }

        }

        // ==================================
        // ADD
        // ==================================

        else {

            url = API_URL;

            method = "POST";

            if (!password) {

                showToast(
                    "Password is required.",
                    "error"
                );

                button.disabled = false;

                button.innerHTML =
                    `<i class="fa-solid fa-check"></i> Save User`;

                return;

            }


            body = {
                username,
                email,
                password,
                role,
                status
            };

        }


        const response =
            await fetch(
                url,
                {
                    method: method,

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(body)
                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to save user"
            );

        }


        closeModal("userModal");


        showToast(
            data.message ||
            "User saved successfully",
            "success"
        );


        await loadUsers();

    }
    catch (error) {

        console.error(
            "SAVE USER ERROR:",
            error
        );

        showToast(
            error.message ||
            "Unable to save user",
            "error"
        );

    }
    finally {

        button.disabled = false;

    }

}


// ==========================================
// ACTIVATE / DEACTIVATE
// ==========================================

async function toggleUserStatus(
    id,
    currentStatus
) {

    const newStatus =
        currentStatus === "active"
            ? "inactive"
            : "active";


    const actionText =
        newStatus === "active"
            ? "activate"
            : "deactivate";


    const confirmed =
        confirm(
            `Are you sure you want to ${actionText} this user?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/${id}/status`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            status: newStatus
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to update status"
            );

        }


        showToast(
            data.message ||
            "Status updated successfully",
            "success"
        );


        await loadUsers();

    }
    catch (error) {

        console.error(
            "STATUS ERROR:",
            error
        );

        showToast(
            error.message ||
            "Unable to update status",
            "error"
        );

    }

}


// ==========================================
// DELETE USER - OPEN
// ==========================================

function openDeleteUser(id) {

    const user =
        allUsers.find(
            item =>
                Number(item.id) === Number(id)
        );


    if (!user) {

        showToast(
            "User not found",
            "error"
        );

        return;

    }


    deleteUserId =
        Number(id);


    document.getElementById(
        "deleteMessage"
    ).textContent =
        `Are you sure you want to permanently delete "${user.username}"? This action cannot be undone.`;


    showModal("deleteModal");

}


// ==========================================
// DELETE USER
// ==========================================

async function deleteUser() {

    if (!deleteUserId) {
        return;
    }


    const button =
        document.getElementById(
            "confirmDeleteBtn"
        );


    button.disabled = true;

    button.innerHTML =
        `<i class="fa-solid fa-spinner fa-spin"></i> Deleting...`;


    try {

        const response =
            await fetch(
                `${API_URL}/${deleteUserId}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to delete user"
            );

        }


        closeModal("deleteModal");


        showToast(
            data.message ||
            "User deleted successfully",
            "success"
        );


        deleteUserId = null;


        await loadUsers();

    }
    catch (error) {

        console.error(
            "DELETE USER ERROR:",
            error
        );

        showToast(
            error.message ||
            "Unable to delete user",
            "error"
        );

    }
    finally {

        button.disabled = false;

        button.innerHTML =
            `<i class="fa-solid fa-trash"></i> Delete`;

    }

}


// ==========================================
// EVENTS
// ==========================================

function setupEvents() {

    document.getElementById(
        "addUserBtn"
    ).addEventListener(
        "click",
        openAddUser
    );


    document.getElementById(
        "userForm"
    ).addEventListener(
        "submit",
        saveUser
    );


    document.getElementById(
        "closeModalBtn"
    ).addEventListener(
        "click",
        () => closeModal("userModal")
    );


    document.getElementById(
        "cancelBtn"
    ).addEventListener(
        "click",
        () => closeModal("userModal")
    );


    document.getElementById(
        "cancelDeleteBtn"
    ).addEventListener(
        "click",
        () => closeModal("deleteModal")
    );


    document.getElementById(
        "confirmDeleteBtn"
    ).addEventListener(
        "click",
        deleteUser
    );


    document.getElementById(
        "userSearch"
    ).addEventListener(
        "input",
        renderUsers
    );


    document.getElementById(
        "roleFilter"
    ).addEventListener(
        "change",
        renderUsers
    );


    document.getElementById(
        "statusFilter"
    ).addEventListener(
        "change",
        renderUsers
    );


    document.getElementById(
        "refreshBtn"
    ).addEventListener(
        "click",
        loadUsers
    );


    document.getElementById(
        "togglePassword"
    ).addEventListener(
        "click",
        togglePassword
    );


    document.getElementById(
        "mobileMenuBtn"
    ).addEventListener(
        "click",
        toggleSidebar
    );


    // Close modal when clicking overlay

    document
        .getElementById("userModal")
        .addEventListener(
            "click",
            function(event) {

                if (event.target === this) {

                    closeModal(
                        "userModal"
                    );

                }

            }
        );


    document
        .getElementById("deleteModal")
        .addEventListener(
            "click",
            function(event) {

                if (event.target === this) {

                    closeModal(
                        "deleteModal"
                    );

                }

            }
        );


    // ESC key

    document.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Escape") {

                closeModal(
                    "userModal"
                );

                closeModal(
                    "deleteModal"
                );

            }

        }
    );

}


// ==========================================
// PASSWORD TOGGLE
// ==========================================

function togglePassword() {

    const input =
        document.getElementById(
            "password"
        );

    const icon =
        document.querySelector(
            "#togglePassword i"
        );


    if (input.type === "password") {

        input.type = "text";

        icon.className =
            "fa-solid fa-eye-slash";

    }
    else {

        input.type = "password";

        icon.className =
            "fa-solid fa-eye";

    }

}


// ==========================================
// MODAL
// ==========================================

function showModal(id) {

    document
        .getElementById(id)
        .classList.add("show");

    document.body.style.overflow =
        "hidden";

}


function closeModal(id) {

    document
        .getElementById(id)
        .classList.remove("show");

    document.body.style.overflow =
        "";

}


// ==========================================
// EMPTY STATE
// ==========================================

function showEmptyState() {

    document
        .getElementById("emptyState")
        .classList.add("show");

}


function hideEmptyState() {

    document
        .getElementById("emptyState")
        .classList.remove("show");

}


// ==========================================
// TOAST
// ==========================================

let toastTimer;


function showToast(
    message,
    type = "success"
) {

    const toast =
        document.getElementById(
            "toast"
        );

    const messageElement =
        document.getElementById(
            "toastMessage"
        );

    const icon =
        toast.querySelector("i");


    clearTimeout(toastTimer);


    messageElement.textContent =
        message;


    toast.className =
        `toast show ${type}`;


    icon.className =
        type === "success"
            ? "fa-solid fa-circle-check"
            : "fa-solid fa-circle-exclamation";


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3500
        );

}


// ==========================================
// SIDEBAR
// ==========================================

function toggleSidebar() {

    document
        .querySelector(".sidebar")
        .classList.toggle("show");

}


// ==========================================
// COMING SOON
// ==========================================

function comingSoon(section) {

    showToast(
        `${section} module will be connected next.`,
        "error"
    );

}


// ==========================================
// HELPERS
// ==========================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;

    }

}


function getInitials(name) {

    if (!name) {
        return "U";
    }


    const words =
        String(name)
            .trim()
            .split(/\s+/);


    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();

}


function getRoleText(role) {

    switch (role) {

        case "admin":
            return "Admin";

        case "hr":
            return "HR Manager";

        case "manager":
            return "Manager";

        case "employee":
            return "Employee";

        default:
            return role || "Unknown";

    }

}


function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }


    const date =
        new Date(dateValue);


    if (isNaN(date.getTime())) {
        return "-";
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}