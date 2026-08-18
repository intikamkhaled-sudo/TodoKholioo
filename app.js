/* =========================================================
   KHOLIOO
   PERSONAL PRODUCTIVITY APP
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const STORAGE_KEY = "kholioo_secure_data_v2";

const ITERATIONS = 150000;

const VERIFIER_TEXT = "KHOLIOO_PRIVATE_SPACE";


/* =========================================================
   STATE
========================================================= */

let encryptionKey = null;

let currentUser = "";

let editingTaskId = null;

let selectedHistoryDate = null;

let appData = {
    tasksByDate: {}
};


/* =========================================================
   DOM
========================================================= */

const authScreen =
    document.getElementById("authScreen");

const app =
    document.getElementById("app");

const authForm =
    document.getElementById("authForm");

const usernameInput =
    document.getElementById("username");

const passwordInput =
    document.getElementById("password");

const authSubtitle =
    document.getElementById("authSubtitle");

const authSubmit =
    document.getElementById("authSubmit");

const authError =
    document.getElementById("authError");

const togglePassword =
    document.getElementById("togglePassword");

const brandUser =
    document.getElementById("brandUser");

const logoutBtn =
    document.getElementById("logoutBtn");

const lockBtn =
    document.getElementById("lockBtn");

const openTaskModal =
    document.getElementById("openTaskModal");

const emptyAddTask =
    document.getElementById("emptyAddTask");

const taskModal =
    document.getElementById("taskModal");

const closeTaskModal =
    document.getElementById("closeTaskModal");

const cancelTask =
    document.getElementById("cancelTask");

const taskForm =
    document.getElementById("taskForm");

const taskName =
    document.getElementById("taskName");

const taskDescription =
    document.getElementById("taskDescription");

const taskPriority =
    document.getElementById("taskPriority");

const taskTime =
    document.getElementById("taskTime");

const modalTitle =
    document.getElementById("modalTitle");

const saveTaskBtn =
    document.getElementById("saveTaskBtn");

const taskList =
    document.getElementById("taskList");

const emptyState =
    document.getElementById("emptyState");

const totalTasks =
    document.getElementById("totalTasks");

const completedTasks =
    document.getElementById("completedTasks");

const remainingTasks =
    document.getElementById("remainingTasks");

const progress =
    document.getElementById("progress");

const taskDate =
    document.getElementById("taskDate");

const historyBtn =
    document.getElementById("historyBtn");

const historyOverlay =
    document.getElementById("historyOverlay");

const closeHistory =
    document.getElementById("closeHistory");

const historyList =
    document.getElementById("historyList");

const historyDetails =
    document.getElementById("historyDetails");

const weeklyGauge =
    document.getElementById("weeklyGauge");

const weeklyPercent =
    document.getElementById("weeklyPercent");

const weeklyCompleted =
    document.getElementById("weeklyCompleted");

const activeDays =
    document.getElementById("activeDays");

const bestDay =
    document.getElementById("bestDay");

const weekBars =
    document.getElementById("weekBars");

const weekTotal =
    document.getElementById("weekTotal");


/* =========================================================
   UTILS
========================================================= */

function getTodayKey() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(now.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(now.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function getDateFromKey(key) {

    const [year, month, day] =
        key.split("-").map(Number);

    return new Date(
        year,
        month - 1,
        day
    );
}


function formatDate(key) {

    const date =
        getDateFromKey(key);

    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function generateId() {

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .slice(2)
    );
}


/* =========================================================
   CRYPTO
========================================================= */

function bufferToBase64(buffer) {

    const bytes =
        new Uint8Array(buffer);

    let binary = "";

    const chunkSize = 0x8000;

    for (
        let i = 0;
        i < bytes.length;
        i += chunkSize
    ) {

        binary += String.fromCharCode(
            ...bytes.subarray(
                i,
                Math.min(
                    i + chunkSize,
                    bytes.length
                )
            )
        );
    }

    return btoa(binary);
}


function base64ToBuffer(base64) {

    const binary =
        atob(base64);

    const bytes =
        new Uint8Array(
            binary.length
        );

    for (
        let i = 0;
        i < binary.length;
        i++
    ) {

        bytes[i] =
            binary.charCodeAt(i);
    }

    return bytes.buffer;
}


async function deriveKey(
    password,
    salt
) {

    const encoder =
        new TextEncoder();

    const material =
        await crypto.subtle.importKey(
            "raw",
            encoder.encode(password),
            "PBKDF2",
            false,
            ["deriveKey"]
        );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt,
            iterations: ITERATIONS,
            hash: "SHA-256"
        },
        material,
        {
            name: "AES-GCM",
            length: 256
        },
        false,
        [
            "encrypt",
            "decrypt"
        ]
    );
}


async function encryptData(
    data,
    key
) {

    const encoder =
        new TextEncoder();

    const iv =
        crypto.getRandomValues(
            new Uint8Array(12)
        );

    const encoded =
        encoder.encode(
            JSON.stringify(data)
        );

    const encrypted =
        await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv
            },
            key,
            encoded
        );

    return {
        iv: bufferToBase64(iv),
        data: bufferToBase64(encrypted)
    };
}


async function decryptData(
    encryptedObject,
    key
) {

    const decoder =
        new TextDecoder();

    const iv =
        new Uint8Array(
            base64ToBuffer(
                encryptedObject.iv
            )
        );

    const encrypted =
        base64ToBuffer(
            encryptedObject.data
        );

    const decrypted =
        await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv
            },
            key,
            encrypted
        );

    return JSON.parse(
        decoder.decode(decrypted)
    );
}


/* =========================================================
   STORAGE
========================================================= */

function getStoredData() {

    const raw =
        localStorage.getItem(
            STORAGE_KEY
        );

    if (!raw) {
        return null;
    }

    try {

        return JSON.parse(raw);

    } catch {

        return null;

    }
}


async function saveSecureData() {

    if (!encryptionKey) {
        return;
    }

    const encrypted =
        await encryptData(
            appData,
            encryptionKey
        );

    const stored =
        getStoredData();

    const payload = {

        version: 2,

        username: currentUser,

        salt: stored?.salt || "",

        verifier: stored?.verifier || "",

        encrypted

    };

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(payload)
    );
}


/* =========================================================
   CREATE ACCOUNT
========================================================= */

async function createAccount(
    username,
    password
) {

    const salt =
        crypto.getRandomValues(
            new Uint8Array(16)
        );

    const key =
        await deriveKey(
            password,
            salt
        );

    const verifier =
        await encryptData(
            {
                value:
                    VERIFIER_TEXT
            },
            key
        );

    const encrypted =
        await encryptData(
            {
                tasksByDate: {}
            },
            key
        );

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({

            version: 2,

            username,

            salt:
                bufferToBase64(salt),

            verifier,

            encrypted

        })
    );

    encryptionKey = key;

    currentUser = username;

    appData = {
        tasksByDate: {}
    };

    showApp();
}


/* =========================================================
   LOGIN
========================================================= */

async function login(
    username,
    password
) {

    const stored =
        getStoredData();

    if (!stored) {

        await createAccount(
            username,
            password
        );

        return;

    }


    if (
        username.trim().toLowerCase() !==
        String(stored.username)
            .trim()
            .toLowerCase()
    ) {

        throw new Error(
            "Incorrect username or password."
        );

    }


    const salt =
        new Uint8Array(
            base64ToBuffer(
                stored.salt
            )
        );

    const key =
        await deriveKey(
            password,
            salt
        );


    try {

        const verification =
            await decryptData(
                stored.verifier,
                key
            );

        if (
            verification.value !==
            VERIFIER_TEXT
        ) {

            throw new Error();

        }

        const decrypted =
            await decryptData(
                stored.encrypted,
                key
            );

        encryptionKey = key;

        currentUser =
            stored.username;

        appData =
            decrypted || {
                tasksByDate: {}
            };

        showApp();

    } catch {

        throw new Error(
            "Incorrect username or password."
        );

    }
}


/* =========================================================
   AUTH UI
========================================================= */

function updateAuthMode() {

    const hasAccount =
        Boolean(
            localStorage.getItem(
                STORAGE_KEY
            )
        );


    if (hasAccount) {

        authSubtitle.textContent =
            "Welcome back. Unlock your private space.";

        authSubmit.textContent =
            "Unlock Kholioo";

        usernameInput.value =
            getStoredData()?.username || "";

    } else {

        authSubtitle.textContent =
            "Create your private productivity space.";

        authSubmit.textContent =
            "Create Private Space";

    }

}


function showAuth() {

    app.classList.add("hidden");

    authScreen.classList.remove(
        "hidden"
    );

    updateAuthMode();

    passwordInput.value = "";

    authError.textContent = "";

    passwordInput.focus();
}


function showApp() {

    authScreen.classList.add(
        "hidden"
    );

    app.classList.remove(
        "hidden"
    );

    brandUser.textContent =
        `Private space · ${currentUser}`;

    renderToday();

    renderHistory();

    updateWeeklyPerformance();
}


/* =========================================================
   AUTH EVENTS
========================================================= */

authForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        authError.textContent = "";

        const username =
            usernameInput.value.trim();

        const password =
            passwordInput.value;

        if (
            username.length < 2
        ) {

            authError.textContent =
                "Username must be at least 2 characters.";

            return;

        }

        if (
            password.length < 6
        ) {

            authError.textContent =
                "Password must be at least 6 characters.";

            return;

        }


        authSubmit.disabled = true;

        authSubmit.textContent =
            "Securing your space...";


        try {

            await login(
                username,
                password
            );

        } catch (error) {

            authError.textContent =
                error.message;

            authSubmit.disabled =
                false;

            updateAuthMode();

        }

    }
);


togglePassword.addEventListener(
    "click",
    function () {

        const isPassword =
            passwordInput.type === "password";

        passwordInput.type =
            isPassword
                ? "text"
                : "password";

        togglePassword.textContent =
            isPassword
                ? "Hide"
                : "Show";

    }
);


/* =========================================================
   LOGOUT / LOCK
========================================================= */

function lockApp() {

    encryptionKey = null;

    currentUser = "";

    app.classList.add("hidden");

    authScreen.classList.remove(
        "hidden"
    );

    passwordInput.value = "";

    authError.textContent = "";

    updateAuthMode();

    passwordInput.focus();
}


logoutBtn.addEventListener(
    "click",
    function () {

        const confirmed =
            confirm(
                "Lock your private Kholioo space?"
            );

        if (confirmed) {
            lockApp();
        }

    }
);


lockBtn.addEventListener(
    "click",
    function () {
        lockApp();
    }
);


/* =========================================================
   TASK DATA
========================================================= */

function getTodayTasks() {

    const today =
        getTodayKey();

    if (
        !Array.isArray(
            appData.tasksByDate[today]
        )
    ) {

        appData.tasksByDate[today] = [];

    }

    return appData.tasksByDate[today];
}


async function persist() {

    await saveSecureData();

    updateStats();

    updateWeeklyPerformance();

    renderHistory();
}


/* =========================================================
   TASK MODAL
========================================================= */

function openAddTaskModal() {

    editingTaskId = null;

    modalTitle.textContent =
        "Add New Task";

    saveTaskBtn.textContent =
        "Add Task";

    taskForm.reset();

    taskPriority.value =
        "medium";

    taskModal.classList.add(
        "active"
    );

    setTimeout(
        () => taskName.focus(),
        100
    );

}


function openEditTaskModal(
    taskId
) {

    const tasks =
        getTodayTasks();

    const task =
        tasks.find(
            item =>
                item.id === taskId
        );

    if (!task) {
        return;
    }


    editingTaskId =
        taskId;

    modalTitle.textContent =
        "Edit Task";

    saveTaskBtn.textContent =
        "Save Changes";


    taskName.value =
        task.name || "";

    taskDescription.value =
        task.description || "";

    taskPriority.value =
        task.priority || "medium";

    taskTime.value =
        task.time || "";


    taskModal.classList.add(
        "active"
    );

    setTimeout(
        () => taskName.focus(),
        100
    );

}


function closeTaskModalFn() {

    taskModal.classList.remove(
        "active"
    );

    editingTaskId = null;

    taskForm.reset();

    taskPriority.value =
        "medium";
}


openTaskModal.addEventListener(
    "click",
    openAddTaskModal
);


emptyAddTask.addEventListener(
    "click",
    openAddTaskModal
);


closeTaskModal.addEventListener(
    "click",
    closeTaskModalFn
);


cancelTask.addEventListener(
    "click",
    closeTaskModalFn
);


taskModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            taskModal
        ) {

            closeTaskModalFn();

        }

    }
);


/* =========================================================
   ADD / EDIT TASK
========================================================= */

taskForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const name =
            taskName.value.trim();

        if (!name) {
            return;
        }


        const tasks =
            getTodayTasks();


        if (editingTaskId) {

            const task =
                tasks.find(
                    item =>
                        item.id ===
                        editingTaskId
                );

            if (task) {

                task.name =
                    name;

                task.description =
                    taskDescription.value.trim();

                task.priority =
                    taskPriority.value;

                task.time =
                    taskTime.value;

            }

        } else {

            tasks.push({

                id:
                    generateId(),

                name,

                description:
                    taskDescription.value.trim(),

                priority:
                    taskPriority.value,

                time:
                    taskTime.value,

                completed:
                    false,

                createdAt:
                    new Date().toISOString()

            });

        }


        await persist();

        renderToday();

        closeTaskModalFn();

    }
);


/* =========================================================
   RENDER TASKS
========================================================= */

function renderToday() {

    const tasks =
        getTodayTasks();

    taskList.innerHTML = "";


    if (tasks.length === 0) {

        emptyState.style.display =
            "flex";

    } else {

        emptyState.style.display =
            "none";

    }


    tasks.forEach(
        task => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                `task-card ${
                    task.completed
                        ? "completed"
                        : ""
                }`;


            const timeText =
                task.time
                    ? formatTime(
                        task.time
                    )
                    : "";


            card.innerHTML = `

                <input
                    type="checkbox"
                    class="task-checkbox"
                    ${task.completed ? "checked" : ""}
                    data-id="${escapeHTML(task.id)}"
                >

                <div class="task-info">

                    <div class="task-title">
                        ${escapeHTML(task.name)}
                    </div>

                    ${
                        task.description
                            ? `
                            <div class="task-description">
                                ${escapeHTML(task.description)}
                            </div>
                            `
                            : ""
                    }

                    <div class="task-meta">

                        <span
                            class="priority ${escapeHTML(task.priority)}"
                        >
                            ${escapeHTML(task.priority)}
                        </span>

                        ${
                            timeText
                                ? `
                                <span class="task-time">
                                    🕐 ${timeText}
                                </span>
                                `
                                : ""
                        }

                    </div>

                </div>

                <div class="task-actions">

                    <button
                        class="edit-task"
                        data-edit="${escapeHTML(task.id)}"
                        title="Edit"
                    >
                        ✎
                    </button>

                    <button
                        class="delete-task"
                        data-delete="${escapeHTML(task.id)}"
                        title="Delete"
                    >
                        ×
                    </button>

                </div>
            `;


            taskList.appendChild(
                card
            );

        }
    );


    updateStats();


    taskDate.textContent =
        new Date().toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        );

}


/* =========================================================
   TASK EVENTS
========================================================= */

taskList.addEventListener(
    "change",
    async function (event) {

        if (
            !event.target.classList.contains(
                "task-checkbox"
            )
        ) {
            return;
        }


        const id =
            event.target.dataset.id;

        const tasks =
            getTodayTasks();

        const task =
            tasks.find(
                item =>
                    item.id === id
            );

        if (!task) {
            return;
        }


        task.completed =
            event.target.checked;


        await persist();

        renderToday();

    }
);


taskList.addEventListener(
    "click",
    async function (event) {

        const editButton =
            event.target.closest(
                "[data-edit]"
            );

        const deleteButton =
            event.target.closest(
                "[data-delete]"
            );


        if (editButton) {

            openEditTaskModal(
                editButton.dataset.edit
            );

            return;

        }


        if (deleteButton) {

            const confirmed =
                confirm(
                    "Delete this task?"
                );

            if (!confirmed) {
                return;
            }


            const id =
                deleteButton.dataset.delete;

            const today =
                getTodayKey();


            appData.tasksByDate[today] =
                getTodayTasks().filter(
                    task =>
                        task.id !== id
                );


            await persist();

            renderToday();

        }

    }
);


/* =========================================================
   STATS
========================================================= */

function updateStats() {

    const tasks =
        getTodayTasks();

    const total =
        tasks.length;

    const completed =
        tasks.filter(
            task =>
                task.completed
        ).length;

    const remaining =
        total - completed;

    const percentage =
        total === 0
            ? 0
            : Math.round(
                (completed / total) *
                100
            );


    totalTasks.textContent =
        total;

    completedTasks.textContent =
        completed;

    remainingTasks.textContent =
        remaining;

    progress.textContent =
        `${percentage}%`;
}


/* =========================================================
   TIME
========================================================= */

function formatTime(time) {

    if (!time) {
        return "";
    }

    const [hours, minutes] =
        time.split(":");

    const date =
        new Date();

    date.setHours(
        Number(hours),
        Number(minutes)
    );

    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   HISTORY
========================================================= */

function getHistoryDates() {

    return Object.keys(
        appData.tasksByDate
    )
        .filter(
            date =>
                Array.isArray(
                    appData.tasksByDate[date]
                ) &&
                appData.tasksByDate[date].length > 0
        )
        .sort(
            (a, b) =>
                b.localeCompare(a)
        );
}


function renderHistory() {

    const dates =
        getHistoryDates();


    historyList.innerHTML = "";


    if (dates.length === 0) {

        historyList.innerHTML = `
            <div class="history-empty">
                No previous tasks yet.
            </div>
        `;

        return;
    }


    dates.forEach(
        date => {

            const tasks =
                appData.tasksByDate[
                    date
                ];

            const completed =
                tasks.filter(
                    task =>
                        task.completed
                ).length;


            const item =
                document.createElement(
                    "div"
                );

            item.className =
                `history-day ${
                    selectedHistoryDate === date
                        ? "active"
                        : ""
                }`;


            item.dataset.date =
                date;


            item.innerHTML = `

                <div class="history-day-top">

                    <span class="history-date">
                        ${escapeHTML(formatDate(date))}
                    </span>

                    <span>
                        →
                    </span>

                </div>

                <div class="history-stats">
                    ${completed}/${tasks.length}
                    completed
                </div>

            `;


            historyList.appendChild(
                item
            );

        }
    );

}


historyList.addEventListener(
    "click",
    function (event) {

        const day =
            event.target.closest(
                ".history-day"
            );

        if (!day) {
            return;
        }


        selectedHistoryDate =
            day.dataset.date;

        renderHistory();

        renderHistoryDetails(
            selectedHistoryDate
        );

    }
);


function renderHistoryDetails(
    date
) {

    const tasks =
        appData.tasksByDate[date] || [];


    const completed =
        tasks.filter(
            task =>
                task.completed
        ).length;


    historyDetails.innerHTML = `

        <div class="history-details-title">

            <span class="section-label">
                ${escapeHTML(formatDate(date))}
            </span>

            <h3>
                ${completed} of ${tasks.length}
                tasks completed
            </h3>

        </div>

        ${tasks.map(
            task => `
                <div
                    class="history-task ${
                        task.completed
                            ? "completed"
                            : ""
                    }"
                >

                    <div class="history-task-check">
                        ${task.completed ? "✓" : "○"}
                    </div>

                    <div class="history-task-name">
                        ${escapeHTML(task.name)}
                    </div>

                </div>
            `
        ).join("")}

        <button
            class="import-day-btn"
            id="importDayBtn"
        >
            Import These Tasks To Today
        </button>

    `;


    document
        .getElementById("importDayBtn")
        ?.addEventListener(
            "click",
            () => importDay(date)
        );

}


function importDay(date) {

    const source =
        appData.tasksByDate[date] || [];


    if (!source.length) {
        return;
    }


    const today =
        getTodayKey();


    if (
        !Array.isArray(
            appData.tasksByDate[today]
        )
    ) {

        appData.tasksByDate[today] =
            [];

    }


    const imported =
        source.map(
            task => ({

                ...task,

                id:
                    generateId(),

                completed:
                    false,

                createdAt:
                    new Date().toISOString()

            })
        );


    appData.tasksByDate[today].push(
        ...imported
    );


    persist().then(
        () => {

            renderToday();

            closeHistoryModal();

            alert(
                `${imported.length} task(s) imported to today.`
            );

        }
    );

}


/* =========================================================
   HISTORY MODAL
========================================================= */

function openHistoryModal() {

    selectedHistoryDate = null;

    renderHistory();

    historyDetails.innerHTML = `

        <div class="history-placeholder">

            <div class="details-icon">
                📅
            </div>

            <h3>
                Select a day
            </h3>

            <p>
                Choose a previous day to see its tasks.
            </p>

        </div>

    `;


    historyOverlay.classList.add(
        "active"
    );

}


function closeHistoryModal() {

    historyOverlay.classList.remove(
        "active"
    );

}


historyBtn.addEventListener(
    "click",
    openHistoryModal
);


closeHistory.addEventListener(
    "click",
    closeHistoryModal
);


historyOverlay.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            historyOverlay
        ) {

            closeHistoryModal();

        }

    }
);


/* =========================================================
   WEEKLY PERFORMANCE
========================================================= */

function getWeekDates() {

    const today =
        new Date();

    today.setHours(
        0, 0, 0, 0
    );


    const day =
        today.getDay();

    const mondayOffset =
        day === 0
            ? -6
            : 1 - day;


    const monday =
        new Date(today);

    monday.setDate(
        today.getDate() +
        mondayOffset
    );


    const dates = [];


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const date =
            new Date(monday);

        date.setDate(
            monday.getDate() + i
        );


        const key =
            date.toISOString()
                .slice(0, 10);

        dates.push(key);

    }


    return dates;
}


function updateWeeklyPerformance() {

    const dates =
        getWeekDates();


    let total =
        0;

    let completed =
        0;

    let active =
        0;

    let best =
        null;


    const dayData =
        dates.map(
            date => {

                const tasks =
                    appData.tasksByDate[
                        date
                    ] || [];


                const done =
                    tasks.filter(
                        task =>
                            task.completed
                    ).length;


                total +=
                    tasks.length;

                completed +=
                    done;


                if (tasks.length > 0) {
                    active++;
                }


                if (
                    !best ||
                    done > best.completed
                ) {

                    best = {

                        date,

                        completed:
                            done,

                        total:
                            tasks.length

                    };

                }


                return {
                    date,
                    total: tasks.length,
                    completed: done
                };

            }
        );


    const percentage =
        total === 0
            ? 0
            : Math.round(
                (completed / total) *
                100
            );


    weeklyPercent.textContent =
        `${percentage}%`;


    weeklyCompleted.textContent =
        completed;


    activeDays.textContent =
        `${active} / 7`;


    if (
        best &&
        best.total > 0
    ) {

        bestDay.textContent =
            getDateFromKey(
                best.date
            ).toLocaleDateString(
                "en-US",
                {
                    weekday: "short"
                }
            );

    } else {

        bestDay.textContent =
            "—";

    }


    weekTotal.textContent =
        `${total} task${total === 1 ? "" : "s"}`;


    updateGauge(
        percentage
    );


    renderWeekBars(
        dayData
    );

}


function updateGauge(
    percentage
) {

    const radius =
        86;

    const circumference =
        2 *
        Math.PI *
        radius;


    weeklyGauge.style.strokeDasharray =
        circumference;


    const offset =
        circumference -
        (
            percentage /
            100
        ) *
        circumference;


    weeklyGauge.style.strokeDashoffset =
        offset;

}


function renderWeekBars(
    data
) {

    weekBars.innerHTML = "";


    const max =
        Math.max(
            ...data.map(
                item =>
                    item.total
            ),
            1
        );


    data.forEach(
        item => {

            const date =
                getDateFromKey(
                    item.date
                );


            const label =
                date.toLocaleDateString(
                    "en-US",
                    {
                        weekday: "narrow"
                    }
                );


            const height =
                item.total === 0
                    ? 2
                    : Math.max(
                        8,
                        (
                            item.total /
                            max
                        ) *
                        100
                    );


            const fill =
                item.total === 0
                    ? 2
                    : (
                        item.completed /
                        item.total
                    ) *
                    height;


            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                "day-bar";


            wrapper.innerHTML = `

                <div class="bar-track">

                    <div
                        class="bar-fill"
                        style="height:${fill}%"
                    ></div>

                </div>

                <span class="day-label">
                    ${label}
                </span>

            `;


            weekBars.appendChild(
                wrapper
            );

        }
    );

}


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            closeTaskModalFn();

            closeHistoryModal();

        }


        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "n" &&
            !app.classList.contains("hidden")
        ) {

            event.preventDefault();

            openAddTaskModal();

        }

    }
);


/* =========================================================
   START
========================================================= */

updateAuthMode();