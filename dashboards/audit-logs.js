// ==========================================
// SmartHR - AUDIT LOGS JAVASCRIPT
// ==========================================

const API_URL =
    "https://smarthrmanagement-backend.onrender.com/api/audit-logs";


let deleteLogId = null;


// ==========================================
// DOM READY
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadAuditStats();

        loadAuditLogs();

        setupEvents();

    }
);


// ==========================================
// LOAD LOGS
// ==========================================

async function loadAuditLogs() {

    const tableBody =
        document.getElementById(
            "logsTableBody"
        );

    const emptyState =
        document.getElementById(
            "emptyState"
        );


    tableBody.innerHTML = `

        <tr>

            <td
                colspan="8"
                class="loading">

                <i class="fa-solid fa-spinner fa-spin"></i>

                Loading audit logs...

            </td>

        </tr>

    `;

    emptyState.classList.add("hidden");


    try {

        const search =
            document.getElementById(
                "searchInput"
            ).value.trim();


        const action =
            document.getElementById(
                "actionFilter"
            ).value;


        const date =
            document.getElementById(
                "dateFilter"
            ).value;


        const params =
            new URLSearchParams();


        if (search) {
            params.append(
                "search",
                search
            );
        }


        if (action !== "all") {

            params.append(
                "action",
                action
            );

        }


        if (date) {

            params.append(
                "date",
                date
            );

        }


        const response =
            await fetch(
                `${API_URL}?${params.toString()}`
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load audit logs"
            );

        }


        const logs =
            Array.isArray(data.logs)
                ? data.logs
                : [];


        renderLogs(logs);


    }
    catch (error) {

        console.error(
            "LOAD AUDIT LOGS ERROR:",
            error
        );


        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="loading">

                    <i class="fa-solid fa-circle-exclamation"></i>

                    Unable to load audit logs.

                </td>

            </tr>

        `;

    }

}


// ==========================================
// RENDER LOGS
// ==========================================

function renderLogs(logs) {

    const tableBody =
        document.getElementById(
            "logsTableBody"
        );


    const emptyState =
        document.getElementById(
            "emptyState"
        );


    if (logs.length === 0) {

        tableBody.innerHTML = "";

        emptyState.classList.remove(
            "hidden"
        );

        return;

    }


    emptyState.classList.add(
        "hidden"
    );


    tableBody.innerHTML =
        logs.map(
            function (log, index) {

                return `

                    <tr>

                        <td>
                            ${index + 1}
                        </td>


                        <td>

                            <div class="user-cell">

                                <div class="user-mini-avatar">

                                    ${getInitials(
                                        log.username
                                    )}

                                </div>

                                <div>

                                    <strong>
                                        ${escapeHTML(
                                            log.username ||
                                            "System"
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHTML(
                                            log.role ||
                                            "system"
                                        )}
                                    </span>

                                </div>

                            </div>

                        </td>


                        <td>

                            <span class="action-badge ${getActionClass(
                                log.action
                            )}">

                                <i class="${getActionIcon(
                                    log.action
                                )}"></i>

                                ${formatAction(
                                    log.action
                                )}

                            </span>

                        </td>


                        <td>

                            ${escapeHTML(
                                log.description ||
                                "-"
                            )}

                        </td>


                        <td>

                            <span class="entity-text">

                                ${
                                    log.entity_type
                                        ? escapeHTML(
                                            log.entity_type
                                        ) +
                                          (
                                            log.entity_id
                                                ? " #" +
                                                  escapeHTML(
                                                    String(
                                                        log.entity_id
                                                    )
                                                  )
                                                : ""
                                          )
                                        : "-"
                                }

                            </span>

                        </td>


                        <td>

                            <span class="ip-text">

                                ${escapeHTML(
                                    log.ip_address ||
                                    "-"
                                )}

                            </span>

                        </td>


                        <td>

                            <span class="date-text">

                                ${formatDate(
                                    log.created_at
                                )}

                            </span>

                        </td>


                        <td>

                            <button
                                class="row-delete"
                                title="Delete"
                                onclick="openDeleteModal(${log.id})">

                                <i class="fa-solid fa-trash"></i>

                            </button>

                        </td>

                    </tr>

                `;

            }
        ).join("");

}


// ==========================================
// LOAD STATISTICS
// ==========================================

async function loadAuditStats() {

    try {

        const response =
            await fetch(
                `${API_URL}/stats`
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load statistics"
            );

        }


        const stats =
            data.stats || {};


        setText(
            "totalLogs",
            stats.total || 0
        );


        setText(
            "loginLogs",
            stats.login || 0
        );


        setText(
            "userLogs",
            stats.users || 0
        );


        setText(
            "leaveLogs",
            stats.leaves || 0
        );


        setText(
            "adminLogs",
            stats.admin || 0
        );


    }
    catch (error) {

        console.error(
            "AUDIT STATS ERROR:",
            error
        );

    }

}


// ==========================================
// SET TEXT
// ==========================================

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


// ==========================================
// ACTION CLASS
// ==========================================

function getActionClass(action) {

    const value =
        String(action || "")
            .toLowerCase();


    if (value === "login") {
        return "action-login";
    }


    if (value === "logout") {
        return "action-logout";
    }


    if (value.includes("user")) {
        return "action-user";
    }


    if (value.includes("leave")) {
        return "action-leave";
    }


    if (value.includes("admin")) {
        return "action-admin";
    }


    return "action-other";

}


// ==========================================
// ACTION ICON
// ==========================================

function getActionIcon(action) {

    const value =
        String(action || "")
            .toLowerCase();


    if (value === "login") {

        return "fa-solid fa-right-to-bracket";

    }


    if (value === "logout") {

        return "fa-solid fa-right-from-bracket";

    }


    if (value.includes("user")) {

        return "fa-solid fa-user";

    }


    if (value.includes("leave")) {

        return "fa-solid fa-calendar-check";

    }


    if (value.includes("admin")) {

        return "fa-solid fa-user-shield";

    }


    return "fa-solid fa-circle-info";

}


// ==========================================
// FORMAT ACTION
// ==========================================

function formatAction(action) {

    if (!action) {
        return "Unknown";
    }


    return String(action)
        .replace(/_/g, " ")
        .replace(/\b\w/g, function (letter) {

            return letter.toUpperCase();

        });

}


// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }


    const date =
        new Date(dateValue);


    if (isNaN(date.getTime())) {

        return escapeHTML(
            String(dateValue)
        );

    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ==========================================
// INITIALS
// ==========================================

function getInitials(name) {

    if (!name) {
        return "SY";
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
        words[1][0]
    ).toUpperCase();

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ==========================================
// DELETE MODAL
// ==========================================

function openDeleteModal(id) {

    deleteLogId =
        Number(id);


    document
        .getElementById("deleteModal")
        .classList.remove("hidden");

}


function closeDeleteModal() {

    deleteLogId = null;


    document
        .getElementById("deleteModal")
        .classList.add("hidden");

}


// ==========================================
// DELETE SINGLE LOG
// ==========================================

async function deleteAuditLog() {

    if (!deleteLogId) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/${deleteLogId}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to delete log"
            );

        }


        closeDeleteModal();


        await loadAuditLogs();

        await loadAuditStats();


        alert(
            "Audit log deleted successfully."
        );


    }
    catch (error) {

        console.error(
            "DELETE LOG ERROR:",
            error
        );


        alert(
            error.message ||
            "Unable to delete audit log."
        );

    }

}


// ==========================================
// CLEAR ALL MODAL
// ==========================================

function openClearModal() {

    document
        .getElementById("clearModal")
        .classList.remove("hidden");

}


function closeClearModal() {

    document
        .getElementById("clearModal")
        .classList.add("hidden");

}


// ==========================================
// CLEAR ALL LOGS
// ==========================================

async function clearAllLogs() {

    try {

        const response =
            await fetch(
                API_URL,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to clear logs"
            );

        }


        closeClearModal();


        await loadAuditLogs();

        await loadAuditStats();


        alert(
            "All audit logs cleared successfully."
        );


    }
    catch (error) {

        console.error(
            "CLEAR LOGS ERROR:",
            error
        );


        alert(
            error.message ||
            "Unable to clear audit logs."
        );

    }

}


// ==========================================
// SETUP EVENTS
// ==========================================

function setupEvents() {

    // --------------------------------------
    // REFRESH
    // --------------------------------------

    document
        .getElementById("refreshBtn")
        .addEventListener(
            "click",
            async function () {

                this.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i>';


                await loadAuditLogs();

                await loadAuditStats();


                this.innerHTML =
                    '<i class="fa-solid fa-rotate"></i>';

            }
        );


    // --------------------------------------
    // SEARCH
    // --------------------------------------

    let searchTimer;


    document
        .getElementById("searchInput")
        .addEventListener(
            "input",
            function () {

                clearTimeout(
                    searchTimer
                );


                searchTimer =
                    setTimeout(
                        loadAuditLogs,
                        350
                    );

            }
        );


    // --------------------------------------
    // ACTION FILTER
    // --------------------------------------

    document
        .getElementById("actionFilter")
        .addEventListener(
            "change",
            loadAuditLogs
        );


    // --------------------------------------
    // DATE FILTER
    // --------------------------------------

    document
        .getElementById("dateFilter")
        .addEventListener(
            "change",
            loadAuditLogs
        );


    // --------------------------------------
    // RESET
    // --------------------------------------

    document
        .getElementById("resetFilters")
        .addEventListener(
            "click",
            function () {

                document
                    .getElementById(
                        "searchInput"
                    )
                    .value = "";


                document
                    .getElementById(
                        "actionFilter"
                    )
                    .value = "all";


                document
                    .getElementById(
                        "dateFilter"
                    )
                    .value = "";


                loadAuditLogs();

            }
        );


    // --------------------------------------
    // DELETE MODAL
    // --------------------------------------

    document
        .getElementById("cancelDelete")
        .addEventListener(
            "click",
            closeDeleteModal
        );


    document
        .getElementById("confirmDelete")
        .addEventListener(
            "click",
            deleteAuditLog
        );


    // --------------------------------------
    // CLEAR MODAL
    // --------------------------------------

    document
        .getElementById("clearLogsBtn")
        .addEventListener(
            "click",
            openClearModal
        );


    document
        .getElementById("cancelClear")
        .addEventListener(
            "click",
            closeClearModal
        );


    document
        .getElementById("confirmClear")
        .addEventListener(
            "click",
            clearAllLogs
        );


    // --------------------------------------
    // CLOSE MODALS ON BACKDROP
    // --------------------------------------

    document
        .getElementById("deleteModal")
        .addEventListener(
            "click",
            function (event) {

                if (
                    event.target === this
                ) {

                    closeDeleteModal();

                }

            }
        );


    document
        .getElementById("clearModal")
        .addEventListener(
            "click",
            function (event) {

                if (
                    event.target === this
                ) {

                    closeClearModal();

                }

            }
        );

}