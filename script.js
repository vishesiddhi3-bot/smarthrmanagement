// ==========================================
// SmartHR LOGIN SYSTEM
// ==========================================

// Get all role buttons
const roleOptions = document.querySelectorAll(".role-option");

// Get login form
const loginForm = document.getElementById("loginForm");

// Get message area
const loginMessage = document.getElementById("loginMessage");

// Get password elements
const passwordInput = document.getElementById("password");
const passwordToggle = document.getElementById("passwordToggle");

// Get login section
const loginSection = document.getElementById("loginSection");

// Get buttons
const navLogin = document.getElementById("navLogin");
const heroLogin = document.getElementById("heroLogin");
const contactLogin = document.getElementById("contactLogin");


// ==========================================
// SELECTED ROLE
// ==========================================

let selectedRole = "HR Manager";


// ==========================================
// ROLE SELECTION
// ==========================================

roleOptions.forEach(function (option) {

    option.addEventListener("click", function () {

        // Remove active from all
        roleOptions.forEach(function (item) {
            item.classList.remove("active");
        });

        // Add active to selected role
        option.classList.add("active");

        // Save selected role
        selectedRole = option.dataset.role;

        // Show message
        showMessage(
            selectedRole + " selected.",
            "success"
        );

    });

});



// ==========================================
// LOGIN FORM - REAL DATABASE LOGIN
// ==========================================

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    // Get email
    const email =
        document.getElementById("email").value.trim();

    // Get password
    const password =
        passwordInput.value.trim();


    // ======================================
    // VALIDATION
    // ======================================

    if (email === "" || password === "") {

        showMessage(
            "Please enter your email and password.",
            "error"
        );

        return;
    }


    if (!validateEmail(email)) {

        showMessage(
            "Please enter a valid email address.",
            "error"
        );

        return;
    }


    // Show loading
    showMessage(
        "Checking your account...",
        "success"
    );


    try {

        // ======================================
        // CALL BACKEND LOGIN API
        // ======================================

        const response = await fetch(
            "https://smarthrmanagement-backend.onrender.com/api/auth/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );


        const data = await response.json();


        // ======================================
        // LOGIN FAILED
        // ======================================

        if (!data.success) {

            showMessage(
                "❌ " + data.message,
                "error"
            );

            return;
        }


        // ======================================
        // GET ACTUAL ROLE FROM DATABASE
        // ======================================

        const actualRole = data.user.role;


        // ======================================
        // CHECK SELECTED ROLE
        // ======================================

        const roleMap = {

            "Admin": "admin",

            "HR Manager": "hr",

            "Manager": "manager",

            "Employee": "employee"

        };


        const selectedBackendRole =
            roleMap[selectedRole];


        // User selected wrong role
        if (actualRole !== selectedBackendRole) {

            showMessage(
                "❌ This account does not belong to the selected role.",
                "error"
            );

            return;
        }


        // ======================================
        // SAVE REAL USER INFORMATION
        // ======================================

        const user = {

            id: data.user.id,

            username: data.user.username,

            email: data.user.email,

            role: data.user.role,

            loginTime: new Date().toISOString()

        };


        localStorage.setItem(
            "smartHRUser",
            JSON.stringify(user)
        );


        // Save JWT token
        localStorage.setItem(
            "smartHRToken",
            data.token
        );


        // ======================================
        // LOGIN SUCCESS
        // ======================================

        showMessage(
            "✅ Login successful! Opening dashboard...",
            "success"
        );


        // ======================================
        // REDIRECT BASED ON DATABASE ROLE
        // ======================================

        setTimeout(function () {

            if (actualRole === "admin") {

                window.location.href =
                    "dashboards/admin.html";

            }

            else if (actualRole === "hr") {

                window.location.href =
                    "dashboards/hr.html";

            }

            else if (actualRole === "manager") {

                window.location.href =
                    "dashboards/manager.html";

            }

            else if (actualRole === "employee") {

                window.location.href =
                    "dashboards/employee.html";

            }

        }, 700);


    } catch (error) {

        console.error(error);

        showMessage(
            "❌ Cannot connect to SmartHR server.",
            "error"
        );

    }

});

// ==========================================
// EMAIL VALIDATION
// ==========================================

function validateEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}


// ==========================================
// SHOW MESSAGE
// ==========================================

function showMessage(message, type) {

    loginMessage.textContent = message;

    loginMessage.className =
        "login-message " + type;

}


// ==========================================
// PASSWORD SHOW / HIDE
// ==========================================

passwordToggle.addEventListener(
    "click",
    function () {

        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            passwordToggle.innerHTML =
                '<i class="fa-regular fa-eye-slash"></i>';

        }

        else {

            passwordInput.type = "password";

            passwordToggle.innerHTML =
                '<i class="fa-regular fa-eye"></i>';

        }

    }
);


// ==========================================
// OPEN LOGIN
// ==========================================

function openLogin() {

    loginSection.scrollIntoView({

        behavior: "smooth",

        block: "center"

    });


    setTimeout(function () {

        document
            .getElementById("email")
            .focus();

    }, 600);

}


// Navbar Login
navLogin.addEventListener(
    "click",
    openLogin
);


// Hero Login
heroLogin.addEventListener(
    "click",
    openLogin
);


// Contact Login
contactLogin.addEventListener(
    "click",
    openLogin
);


// ==========================================
// LOGOUT FUNCTION
// ==========================================

function logout() {

    localStorage.removeItem("smartHRUser");

    window.location.href =
        "../index.html";
}
// =====================================================
// SMART HR - REGISTER / CREATE ACCOUNT
// =====================================================

const registerForm =
    document.getElementById("registerForm");

const showRegister =
    document.getElementById("showRegister");

const loginCard =
    document.querySelector(".login-card");


// =====================================================
// OPEN REGISTER FORM
// =====================================================

if (showRegister && registerForm) {

    showRegister.addEventListener("click", function () {

        registerForm.classList.add("active");

        if (loginCard) {
            loginCard.classList.add("register-open");
        }

        const loginForm =
            document.getElementById("loginForm");

        if (loginForm) {
            loginForm.style.display = "none";
        }

        showRegister.style.display = "none";

    });

}


// =====================================================
// REGISTER ACCOUNT
// =====================================================

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const username =
                document
                    .getElementById("registerUsername")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("registerEmail")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("registerPassword")
                    .value;


            const role =
                document
                    .getElementById("registerRole")
                    .value;


            const message =
                document.getElementById(
                    "registerMessage"
                );


            // ==============================
            // VALIDATION
            // ==============================

            if (!username || !email || !password || !role) {

                message.textContent =
                    "Please fill all fields.";

                message.className =
                    "login-message error";

                return;

            }


            if (!validateEmail(email)) {

                message.textContent =
                    "Please enter a valid email address.";

                message.className =
                    "login-message error";

                return;

            }


            if (password.length < 6) {

                message.textContent =
                    "Password must be at least 6 characters.";

                message.className =
                    "login-message error";

                return;

            }


            // ==============================
            // LOADING
            // ==============================

            const submitButton =
                registerForm.querySelector(
                    'button[type="submit"]'
                );


            if (submitButton) {

                submitButton.disabled = true;

                submitButton.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Creating Account...
                `;

            }


            message.textContent =
                "Creating your SmartHR account...";

            message.className =
                "login-message";


            try {

                // ==============================
                // REGISTER API
                // ==============================

                const response =
                    await fetch(
                        "https://smarthrmanagement-backend.onrender.com/api/auth/register",
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                username:
                                    username,

                                email:
                                    email,

                                password:
                                    password,

                                role:
                                    role

                            })

                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "REGISTER RESPONSE:",
                    data
                );


                // ==============================
                // REGISTER FAILED
                // ==============================

                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "Unable to create account."
                    );

                }


                // ==============================
                // SUCCESS
                // ==============================

                message.textContent =
                    "✅ Account created successfully!";

                message.className =
                    "login-message success";


                registerForm.reset();


                // ==============================
                // HIDE REGISTER
                // ==============================

                setTimeout(function () {

                    registerForm.classList.remove(
                        "active"
                    );


                    if (loginCard) {

                        loginCard.classList.remove(
                            "register-open"
                        );

                    }


                    const loginForm =
                        document.getElementById(
                            "loginForm"
                        );


                    if (loginForm) {

                        loginForm.style.display =
                            "block";

                    }


                    if (showRegister) {

                        showRegister.style.display =
                            "block";

                    }


                    // ==========================
                    // AUTO FILL LOGIN EMAIL
                    // ==========================

                    const loginEmail =
                        document.getElementById(
                            "email"
                        );


                    if (loginEmail) {

                        loginEmail.value =
                            email;

                    }


                    // ==========================
                    // SELECT REGISTERED ROLE
                    // ==========================

                    const roleMap = {

                        employee:
                            "Employee",

                        manager:
                            "Manager",

                        hr:
                            "HR Manager",

                        admin:
                            "Admin"

                    };


                    const registeredRole =
                        roleMap[role];


                    if (registeredRole) {

                        roleOptions.forEach(
                            function (option) {

                                option.classList.remove(
                                    "active"
                                );


                                if (
                                    option.dataset.role ===
                                    registeredRole
                                ) {

                                    option.classList.add(
                                        "active"
                                    );

                                    selectedRole =
                                        registeredRole;

                                }

                            }
                        );

                    }


                    // ==========================
                    // SHOW LOGIN MESSAGE
                    // ==========================

                    showMessage(
                        "✅ Account created! Please enter your password to login.",
                        "success"
                    );


                    // Focus password

                    if (passwordInput) {

                        passwordInput.focus();

                    }

                }, 1000);


            }
            catch (error) {

                console.error(
                    "REGISTER ERROR:",
                    error
                );


                message.textContent =
                    "❌ " +
                    (
                        error.message ||
                        "Cannot connect to SmartHR server."
                    );


                message.className =
                    "login-message error";

            }
            finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.innerHTML = `
                        Create Account
                        <i class="fa-solid fa-user-plus"></i>
                    `;

                }

            }

        }
    );

}
// =====================================================
// CREATE ACCOUNT / REGISTER TOGGLE
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const showRegister =
        document.getElementById("showRegister");

    const registerForm =
        document.getElementById("registerForm");

    const loginForm =
        document.getElementById("loginForm");

    const loginCard =
        document.querySelector(".login-card");


    if (!showRegister || !registerForm) {
        return;
    }


    showRegister.addEventListener("click", function () {

        registerForm.classList.add("active");

        if (loginCard) {
            loginCard.classList.add("register-open");
        }

        registerForm.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });

    });

});