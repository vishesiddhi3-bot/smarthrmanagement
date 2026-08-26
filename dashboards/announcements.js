// =====================================================
// SmartHR - ANNOUNCEMENTS
// =====================================================

const API_URL = "https://smarthrmanagement-backend.onrender.com/api";


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    setupAnnouncementForm();

    setupCharacterCounter();

    loadAnnouncements();

});


// =====================================================
// LOAD ANNOUNCEMENTS
// =====================================================

async function loadAnnouncements() {

    const container =
        document.getElementById("announcementList");


    if (!container) return;


    container.innerHTML = `
        <div class="loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading announcements...
        </div>
    `;


    try {

        const response =
            await fetch(
                `${API_URL}/announcements`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load announcements"
            );

        }


        const announcements =
            data.announcements ||
            data.data ||
            [];


        updateStatistics(
            announcements
        );


        renderAnnouncements(
            announcements
        );

    }
    catch (error) {

        console.error(
            "ANNOUNCEMENTS LOAD ERROR:",
            error
        );


        container.innerHTML = `
            <div class="empty">

                <i class="fa-solid fa-circle-exclamation"></i>

                Unable to load announcements.

                <br>

                <small>
                    ${escapeHtml(error.message)}
                </small>

            </div>
        `;

    }

}


// =====================================================
// RENDER ANNOUNCEMENTS
// =====================================================

function renderAnnouncements(
    announcements
) {

    const container =
        document.getElementById(
            "announcementList"
        );


    if (!container) return;


    if (!announcements.length) {

        container.innerHTML = `
            <div class="empty">

                <i class="fa-solid fa-bullhorn"></i>

                No announcements found.

            </div>
        `;

        return;

    }


    container.innerHTML =
        announcements
            .map(
                announcement => {

                    const publisher =
                        announcement.created_by_name ||
                        "HR / Admin";


                    return `
                        <div
                            class="announcement-item"
                        >

                            <div class="announcement-icon">

                                <i
                                    class="fa-solid fa-bullhorn"
                                ></i>

                            </div>


                            <div
                                class="announcement-content"
                            >

                                <div
                                    class="announcement-top"
                                >

                                    <div>

                                        <h3>
                                            ${escapeHtml(
                                                announcement.title ||
                                                "Announcement"
                                            )}
                                        </h3>

                                    </div>


                                    <button
                                        class="delete-btn"
                                        title="Delete Announcement"
                                        onclick="deleteAnnouncement(
                                            ${Number(
                                                announcement.id
                                            )}
                                        )"
                                    >

                                        <i
                                            class="fa-solid fa-trash"
                                        ></i>

                                    </button>

                                </div>


                                <p>
                                    ${escapeHtml(
                                        announcement.message ||
                                        ""
                                    )}
                                </p>


                                <div
                                    class="announcement-meta"
                                >

                                    <span>

                                        <i
                                            class="fa-solid fa-user"
                                        ></i>

                                        ${escapeHtml(
                                            publisher
                                        )}

                                    </span>


                                    <span>

                                        <i
                                            class="fa-solid fa-calendar"
                                        ></i>

                                        ${formatDate(
                                            announcement.created_at
                                        )}

                                    </span>


                                    <span>

                                        <i
                                            class="fa-solid fa-clock"
                                        ></i>

                                        ${formatTime(
                                            announcement.created_at
                                        )}

                                    </span>

                                </div>

                            </div>

                        </div>
                    `;

                }
            )
            .join("");

}


// =====================================================
// STATISTICS
// =====================================================

function updateStatistics(
    announcements
) {

    const totalElement =
        document.getElementById(
            "totalAnnouncements"
        );


    const latestElement =
        document.getElementById(
            "latestAnnouncement"
        );


    const publisherElement =
        document.getElementById(
            "latestPublisher"
        );


    if (totalElement) {

        totalElement.textContent =
            announcements.length;

    }


    if (!announcements.length) {

        if (latestElement) {

            latestElement.textContent =
                "-";

        }


        if (publisherElement) {

            publisherElement.textContent =
                "-";

        }

        return;

    }


    const latest =
        announcements[0];


    if (latestElement) {

        latestElement.textContent =
            formatDate(
                latest.created_at
            );

    }


    if (publisherElement) {

        publisherElement.textContent =
            latest.created_by_name ||
            "HR / Admin";

    }

}


// =====================================================
// FORM SETUP
// =====================================================

function setupAnnouncementForm() {

    const form =
        document.getElementById(
            "announcementForm"
        );


    if (!form) return;


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const title =
                document
                    .getElementById("title")
                    .value
                    .trim();


            const message =
                document
                    .getElementById("message")
                    .value
                    .trim();


            if (!title) {

                showMessage(
                    "Please enter an announcement title.",
                    true
                );

                return;

            }


            if (!message) {

                showMessage(
                    "Please enter an announcement message.",
                    true
                );

                return;

            }


            // =========================================
            // GET LOGGED-IN USER
            // =========================================

            const user =
                getLoggedInUser();


            if (!user || !user.id) {

                showMessage(
                    "Login information not found. Please login again.",
                    true
                );

                return;

            }


            const publishButton =
                document.getElementById(
                    "publishBtn"
                );


            if (publishButton) {

                publishButton.disabled =
                    true;

                publishButton.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Publishing...
                `;

            }


            const payload = {

                title:
                    title,

                message:
                    message,

                created_by:
                    Number(user.id)

            };


            try {

                const response =
                    await fetch(
                        `${API_URL}/announcements`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to save announcement"
                    );

                }


                showMessage(
                    "Announcement published successfully."
                );


                form.reset();


                const counter =
                    document.getElementById(
                        "characterCount"
                    );


                if (counter) {

                    counter.textContent =
                        "0";

                }


                await loadAnnouncements();

            }
            catch (error) {

                console.error(
                    "ANNOUNCEMENT SAVE ERROR:",
                    error
                );


                showMessage(
                    error.message,
                    true
                );

            }
            finally {

                if (publishButton) {

                    publishButton.disabled =
                        false;

                    publishButton.innerHTML = `
                        <i class="fa-solid fa-paper-plane"></i>
                        Publish Announcement
                    `;

                }

            }

        }
    );

}


// =====================================================
// CHARACTER COUNTER
// =====================================================

function setupCharacterCounter() {

    const textarea =
        document.getElementById(
            "message"
        );


    const counter =
        document.getElementById(
            "characterCount"
        );


    if (!textarea || !counter) return;


    textarea.addEventListener(
        "input",
        () => {

            counter.textContent =
                textarea.value.length;

        }
    );

}


// =====================================================
// GET LOGGED-IN USER
// =====================================================

function getLoggedInUser() {

    const possibleKeys = [

        "user",

        "currentUser",

        "loggedInUser",

        "loginUser",

        "smarthr_user"

    ];


    for (
        const key of possibleKeys
    ) {

        const stored =
            localStorage.getItem(key);


        if (!stored) continue;


        try {

            const parsed =
                JSON.parse(stored);


            if (
                parsed &&
                parsed.id
            ) {

                return parsed;

            }


            if (
                parsed &&
                parsed.user &&
                parsed.user.id
            ) {

                return parsed.user;

            }

        }
        catch (error) {

            console.warn(
                `Unable to parse ${key}`,
                error
            );

        }

    }


    // =========================================
    // DIRECT USER ID FALLBACK
    // =========================================

    const possibleIdKeys = [

        "userId",

        "user_id",

        "loggedInUserId",

        "currentUserId"

    ];


    for (
        const key of possibleIdKeys
    ) {

        const id =
            localStorage.getItem(key);


        if (id) {

            return {
                id: Number(id)
            };

        }

    }


    return null;

}


// =====================================================
// DELETE ANNOUNCEMENT
// =====================================================

async function deleteAnnouncement(
    id
) {

    if (!id) {

        showMessage(
            "Invalid announcement ID.",
            true
        );

        return;

    }


    const confirmed =
        confirm(
            "Are you sure you want to delete this announcement?"
        );


    if (!confirmed) return;


    try {

        const response =
            await fetch(
                `${API_URL}/announcements/${id}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to delete announcement"
            );

        }


        showMessage(
            "Announcement deleted successfully."
        );


        loadAnnouncements();

    }
    catch (error) {

        console.error(
            "ANNOUNCEMENT DELETE ERROR:",
            error
        );


        showMessage(
            error.message,
            true
        );

    }

}


// =====================================================
// DATE
// =====================================================

function formatDate(
    value
) {

    if (!value) {

        return "-";

    }


    const date =
        new Date(value);


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return String(value);

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


// =====================================================
// TIME
// =====================================================

function formatTime(
    value
) {

    if (!value) {

        return "-";

    }


    const date =
        new Date(value);


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date.toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// =====================================================
// MESSAGE
// =====================================================

function showMessage(
    message,
    error = false
) {

    const element =
        document.getElementById(
            "formMessage"
        );


    if (!element) return;


    element.textContent =
        message;


    element.className =
        error
            ? "form-message error"
            : "form-message success";


    setTimeout(
        () => {

            element.textContent =
                "";

            element.className =
                "form-message";

        },
        4000
    );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================================
// BACK TO DASHBOARD
// =====================================================

function goBack() {

    window.location.href =
        "hr.html";

}