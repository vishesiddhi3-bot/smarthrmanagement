// =====================================================
// SmartHR - SETTINGS FRONTEND
// =====================================================

const API_URL = "https://smarthrmanagement-backend.onrender.com/api";


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    loadSettings();
    loadProfile();

    setupProfileForm();
    setupPasswordForm();

    setupNotificationSettings();
    setupSystemSettings();
    setupThemeSettings();

});


// =====================================================
// LOAD SETTINGS
// =====================================================

function loadSettings() {

    const savedSettings = JSON.parse(
        localStorage.getItem("smarthrSettings") || "{}"
    );


    // -----------------------------------------------
    // NOTIFICATION SETTINGS
    // -----------------------------------------------

    setCheckbox(
        "leaveNotifications",
        savedSettings.leaveNotifications ?? true
    );

    setCheckbox(
        "payrollNotifications",
        savedSettings.payrollNotifications ?? true
    );

    setCheckbox(
        "recognitionNotifications",
        savedSettings.recognitionNotifications ?? true
    );


    // -----------------------------------------------
    // SYSTEM SETTINGS
    // -----------------------------------------------

    setCheckbox(
        "autoRefresh",
        savedSettings.autoRefresh ?? true
    );

    setCheckbox(
        "compactDashboard",
        savedSettings.compactDashboard ?? false
    );


    // -----------------------------------------------
    // THEME
    // -----------------------------------------------

    const theme =
        savedSettings.theme ||
        localStorage.getItem("smarthrTheme") ||
        "light";


    applyTheme(theme);

}


// =====================================================
// LOAD PROFILE
// =====================================================

function loadProfile() {

    try {

        const user = getLoggedInUser();


        const usernameInput =
            document.getElementById("username");

        const emailInput =
            document.getElementById("email");


        if (
            usernameInput &&
            user.username
        ) {

            usernameInput.value =
                user.username;

        }


        if (
            emailInput &&
            user.email
        ) {

            emailInput.value =
                user.email;

        }

    }
    catch (error) {

        console.error(
            "PROFILE LOAD ERROR:",
            error
        );

    }

}


// =====================================================
// PROFILE FORM
// =====================================================

function setupProfileForm() {

    const form =
        document.getElementById("profileForm");


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const username =
                document
                    .getElementById("username")
                    ?.value
                    .trim();


            const email =
                document
                    .getElementById("email")
                    ?.value
                    .trim();


            if (!username || !email) {

                showMessage(
                    "Please fill all profile fields.",
                    true
                );

                return;

            }


            const user =
                getLoggedInUser();


            if (!user.id) {

                showMessage(
                    "Login information not found. Please login again.",
                    true
                );

                return;

            }


            try {

                const token =
                    localStorage.getItem("token");


                const response =
                    await fetch(
                        `${API_URL}/users/${user.id}`,
                        {

                            method: "PUT",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                ...(token
                                    ? {
                                        Authorization:
                                            `Bearer ${token}`
                                    }
                                    : {})

                            },

                            body: JSON.stringify({

                                username:
                                    username,

                                email:
                                    email

                            })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to update profile"
                    );

                }


                // -----------------------------------
                // UPDATE LOCAL STORAGE
                // -----------------------------------

                const updatedUser = {

                    ...user,

                    username:
                        username,

                    email:
                        email

                };


                localStorage.setItem(
                    "user",
                    JSON.stringify(updatedUser)
                );


                localStorage.setItem(
                    "loggedInUser",
                    JSON.stringify(updatedUser)
                );


                showMessage(
                    "Profile updated successfully."
                );

            }
            catch (error) {

                console.error(
                    "PROFILE UPDATE ERROR:",
                    error
                );


                showMessage(
                    error.message,
                    true
                );

            }

        }
    );

}


// =====================================================
// PASSWORD FORM
// =====================================================

function setupPasswordForm() {

    const form =
        document.getElementById("passwordForm");


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const currentPassword =
                document
                    .getElementById("currentPassword")
                    ?.value;


            const newPassword =
                document
                    .getElementById("newPassword")
                    ?.value;


            const confirmPassword =
                document
                    .getElementById("confirmPassword")
                    ?.value;


            // -----------------------------------
            // VALIDATION
            // -----------------------------------

            if (
                !currentPassword ||
                !newPassword ||
                !confirmPassword
            ) {

                showMessage(
                    "Please fill all password fields.",
                    true
                );

                return;

            }


            if (newPassword.length < 6) {

                showMessage(
                    "Password must contain at least 6 characters.",
                    true
                );

                return;

            }


            if (
                newPassword !==
                confirmPassword
            ) {

                showMessage(
                    "New password and confirm password do not match.",
                    true
                );

                return;

            }


            const user =
                getLoggedInUser();


            if (!user.id) {

                showMessage(
                    "Login information not found. Please login again.",
                    true
                );

                return;

            }


            try {

                const token =
                    localStorage.getItem("token");


                const response =
                    await fetch(
                        `${API_URL}/users/${user.id}/password`,
                        {

                            method: "PUT",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                ...(token
                                    ? {
                                        Authorization:
                                            `Bearer ${token}`
                                    }
                                    : {})

                            },

                            body: JSON.stringify({

                                currentPassword:
                                    currentPassword,

                                newPassword:
                                    newPassword

                            })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to change password"
                    );

                }


                form.reset();


                showMessage(
                    "Password changed successfully."
                );

            }
            catch (error) {

                console.error(
                    "PASSWORD CHANGE ERROR:",
                    error
                );


                showMessage(
                    error.message,
                    true
                );

            }

        }
    );

}


// =====================================================
// NOTIFICATION SETTINGS
// =====================================================

function setupNotificationSettings() {

    const ids = [

        "leaveNotifications",
        "payrollNotifications",
        "recognitionNotifications"

    ];


    ids.forEach((id) => {

        const checkbox =
            document.getElementById(id);


        if (!checkbox) {
            return;
        }


        checkbox.addEventListener(
            "change",
            saveSettings
        );

    });

}


// =====================================================
// SYSTEM SETTINGS
// =====================================================

function setupSystemSettings() {

    const ids = [

        "autoRefresh",
        "compactDashboard"

    ];


    ids.forEach((id) => {

        const checkbox =
            document.getElementById(id);


        if (!checkbox) {
            return;
        }


        checkbox.addEventListener(
            "change",
            saveSettings
        );

    });

}


// =====================================================
// SAVE SETTINGS
// =====================================================

function saveSettings() {

    const settings = {

        leaveNotifications:
            getCheckboxValue(
                "leaveNotifications"
            ),

        payrollNotifications:
            getCheckboxValue(
                "payrollNotifications"
            ),

        recognitionNotifications:
            getCheckboxValue(
                "recognitionNotifications"
            ),

        autoRefresh:
            getCheckboxValue(
                "autoRefresh"
            ),

        compactDashboard:
            getCheckboxValue(
                "compactDashboard"
            ),

        theme:
            document.body.classList.contains(
                "dark-mode"
            )
                ? "dark"
                : "light"

    };


    localStorage.setItem(
        "smarthrSettings",
        JSON.stringify(settings)
    );


    showMessage(
        "Settings saved successfully."
    );

}


// =====================================================
// GET CHECKBOX VALUE
// =====================================================

function getCheckboxValue(id) {

    const checkbox =
        document.getElementById(id);


    return checkbox
        ? checkbox.checked
        : false;

}


// =====================================================
// THEME SETTINGS
// =====================================================

function setupThemeSettings() {

    const themeButtons =
        document.querySelectorAll(
            ".theme-option"
        );


    themeButtons.forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                const theme =
                    button.dataset.theme;


                if (!theme) {
                    return;
                }


                applyTheme(theme);

                saveTheme(theme);

            }
        );

    });

}


// =====================================================
// APPLY THEME
// =====================================================

function applyTheme(theme) {

    const body =
        document.body;


    if (theme === "dark") {

        body.classList.add(
            "dark-mode"
        );

    }
    else {

        body.classList.remove(
            "dark-mode"
        );

    }


    const buttons =
        document.querySelectorAll(
            ".theme-option"
        );


    buttons.forEach((button) => {

        button.classList.toggle(
            "active",
            button.dataset.theme === theme
        );

    });


    localStorage.setItem(
        "smarthrTheme",
        theme
    );

}


// =====================================================
// SAVE THEME
// =====================================================

function saveTheme(theme) {

    const settings =
        JSON.parse(
            localStorage.getItem(
                "smarthrSettings"
            ) || "{}"
        );


    settings.theme =
        theme;


    localStorage.setItem(
        "smarthrSettings",
        JSON.stringify(settings)
    );


    showMessage(
        theme === "dark"
            ? "Dark theme applied."
            : "Light theme applied."
    );

}


// =====================================================
// PASSWORD VISIBILITY
// =====================================================

function togglePassword(
    inputId,
    button
) {

    const input =
        document.getElementById(inputId);


    if (!input) {
        return;
    }


    if (input.type === "password") {

        input.type =
            "text";


        button.innerHTML = `
            <i class="fa-solid fa-eye-slash"></i>
        `;

    }
    else {

        input.type =
            "password";


        button.innerHTML = `
            <i class="fa-solid fa-eye"></i>
        `;

    }

}


// =====================================================
// RESET SETTINGS
// =====================================================

function resetSettings() {

    const confirmed =
        confirm(
            "Are you sure you want to reset all settings?"
        );


    if (!confirmed) {
        return;
    }


    const defaultSettings = {

        leaveNotifications:
            true,

        payrollNotifications:
            true,

        recognitionNotifications:
            true,

        autoRefresh:
            true,

        compactDashboard:
            false,

        theme:
            "light"

    };


    localStorage.setItem(
        "smarthrSettings",
        JSON.stringify(
            defaultSettings
        )
    );


    localStorage.setItem(
        "smarthrTheme",
        "light"
    );


    setCheckbox(
        "leaveNotifications",
        true
    );

    setCheckbox(
        "payrollNotifications",
        true
    );

    setCheckbox(
        "recognitionNotifications",
        true
    );

    setCheckbox(
        "autoRefresh",
        true
    );

    setCheckbox(
        "compactDashboard",
        false
    );


    applyTheme("light");


    showMessage(
        "Settings reset successfully."
    );

}


// =====================================================
// SET CHECKBOX
// =====================================================

function setCheckbox(
    id,
    value
) {

    const checkbox =
        document.getElementById(id);


    if (checkbox) {

        checkbox.checked =
            value;

    }

}


// =====================================================
// GET LOGGED-IN USER
// =====================================================

function getLoggedInUser() {

    try {

        const user =
            JSON.parse(
                localStorage.getItem("user") ||
                localStorage.getItem("loggedInUser") ||
                "{}"
            );


        return user || {};

    }
    catch (error) {

        console.error(
            "USER DATA ERROR:",
            error
        );


        return {};

    }

}


// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(
    message,
    error = false
) {

    const element =
        document.getElementById(
            "message"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.style.color =
        error
            ? "#dc2626"
            : "#16a34a";


    clearTimeout(
        window.settingsMessageTimer
    );


    window.settingsMessageTimer =
        setTimeout(() => {

            element.textContent =
                "";

        }, 4000);

}


// =====================================================
// BACK TO DASHBOARD
// =====================================================

function goBack() {

    window.location.href =
        "hr.html";

}