/* =========================================================
   KHOLIOO - TODO LIST APP
   Complete Application JavaScript
========================================================= */


/* =========================================================
   DOM ELEMENTS
========================================================= */

const openTaskModal =
    document.getElementById("openTaskModal");
const emptyAddTask =
    document.getElementById("emptyAddTask");
    
const taskModal =
    document.getElementById("taskModal");

const closeTaskModalButton =
    document.getElementById("closeTaskModal");

const cancelTaskButton =
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


const taskList =
    document.getElementById("taskList");

const emptyState =
    document.getElementById("emptyState");


const totalTasksElement =
    document.getElementById("totalTasks");

const completedTasksElement =
    document.getElementById("completedTasks");

const remainingTasksElement =
    document.getElementById("remainingTasks");

const progressElement =
    document.getElementById("progress");

const progressFill =
    document.getElementById("progressFill");


const taskDateElement =
    document.getElementById("taskDate");


/* =========================================================
   HISTORY ELEMENTS
========================================================= */

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


/* =========================================================
   MODAL ELEMENTS
========================================================= */

const modalTitle =
    document.getElementById("modalTitle");

const saveTaskBtn =
    document.getElementById("saveTaskBtn");


/* =========================================================
   APPLICATION STATE
========================================================= */

let editingTaskId = null;


/* =========================================================
   STORAGE KEY
========================================================= */

const STORAGE_KEY =
    "kholioo_tasks";


/* =========================================================
   DATE HELPERS
========================================================= */

function getTodayKey() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;
}


function formatFullDate(dateKey) {

    const date =
        new Date(
            `${dateKey}T00:00:00`
        );


    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );
}


function formatHistoryDate(dateKey) {

    const date =
        new Date(
            `${dateKey}T00:00:00`
        );


    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}


/* =========================================================
   STORAGE FUNCTIONS
========================================================= */

function getTasks() {

    try {

        const stored =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!stored) {
            return {};
        }


        const parsed =
            JSON.parse(stored);


        if (
            typeof parsed !== "object" ||
            parsed === null ||
            Array.isArray(parsed)
        ) {

            return {};

        }


        return parsed;

    } catch (error) {

        console.error(
            "Could not read tasks:",
            error
        );

        return {};

    }
}


function saveTasks(allTasks) {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(allTasks)
        );

    } catch (error) {

        console.error(
            "Could not save tasks:",
            error
        );

    }
}


function getTodayTasks() {

    const allTasks =
        getTasks();


    return Array.isArray(
        allTasks[getTodayKey()]
    )
        ? allTasks[getTodayKey()]
        : [];
}


function saveTodayTasks(tasks) {

    const allTasks =
        getTasks();


    allTasks[getTodayKey()] =
        tasks;


    saveTasks(allTasks);

}


/* =========================================================
   INITIALIZE DATE
========================================================= */

function updateDate() {

    if (!taskDateElement) {
        return;
    }


    taskDateElement.textContent =
        formatFullDate(
            getTodayKey()
        );

}


/* =========================================================
   OPEN ADD TASK MODAL
========================================================= */

function openAddTaskModal() {

    editingTaskId = null;


    if (modalTitle) {

        modalTitle.textContent =
            "Add New Task";

    }


    if (saveTaskBtn) {

        saveTaskBtn.textContent =
            "Add Task";

    }


    if (taskForm) {

        taskForm.reset();

    }


    if (taskModal) {

        taskModal.classList.add(
            "active"
        );

    }


    setTimeout(
        () => {

            if (taskName) {
                taskName.focus();
            }

        },
        100
    );

}


/* =========================================================
   CLOSE TASK MODAL
========================================================= */

function closeTaskModal() {

    if (taskModal) {

        taskModal.classList.remove(
            "active"
        );

    }


    if (taskForm) {

        taskForm.reset();

    }


    editingTaskId = null;


    if (modalTitle) {

        modalTitle.textContent =
            "Add New Task";

    }


    if (saveTaskBtn) {

        saveTaskBtn.textContent =
            "Add Task";

    }

}


/* =========================================================
   ADD BUTTON EVENT
========================================================= */

if (openTaskModal) {

    openTaskModal.addEventListener(
        "click",
        openAddTaskModal
    );

}

if (emptyAddTask) {

    emptyAddTask.addEventListener(
        "click",
        openAddTaskModal
    );

}
/* =========================================================
   CLOSE MODAL EVENTS
========================================================= */

if (closeTaskModalButton) {

    closeTaskModalButton.addEventListener(
        "click",
        closeTaskModal
    );

}


if (cancelTaskButton) {

    cancelTaskButton.addEventListener(
        "click",
        closeTaskModal
    );

}


/* Close when clicking outside */

if (taskModal) {

    taskModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target === taskModal
            ) {

                closeTaskModal();

            }

        }
    );

}


/* =========================================================
   ADD / EDIT TASK
========================================================= */

if (taskForm) {

    taskForm.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();


            const name =
                taskName
                    ? taskName.value.trim()
                    : "";


            const description =
                taskDescription
                    ? taskDescription.value.trim()
                    : "";


            const priority =
                taskPriority
                    ? taskPriority.value
                    : "medium";


            const time =
                taskTime
                    ? taskTime.value
                    : "";


            if (!name) {

                if (taskName) {
                    taskName.focus();
                }

                return;

            }


            const tasks =
                getTodayTasks();


            /* =========================================
               EDIT EXISTING TASK
            ========================================= */

            if (
                editingTaskId !== null
            ) {

                const task =
                    tasks.find(
                        item =>
                            String(item.id) ===
                            String(editingTaskId)
                    );


                if (task) {

                    task.name =
                        name;

                    task.description =
                        description;

                    task.priority =
                        priority;

                    task.time =
                        time;

                }


                saveTodayTasks(
                    tasks
                );

                renderTasks();

                updateStatistics();

                closeTaskModal();

                return;

            }


            /* =========================================
               ADD NEW TASK
            ========================================= */

            const newTask = {

                id:
                    Date.now()
                    +
                    Math.random(),

                name:
                    name,

                description:
                    description,

                priority:
                    priority,

                time:
                    time,

                completed:
                    false,

                createdAt:
                    new Date().toISOString()

            };


            tasks.push(
                newTask
            );


            saveTodayTasks(
                tasks
            );


            renderTasks();

            updateStatistics();

            closeTaskModal();

        }
    );

}


/* =========================================================
   RENDER TASKS
========================================================= */

function renderTasks() {

    if (!taskList) {
        return;
    }


    const tasks =
        getTodayTasks();


    taskList.innerHTML = "";


    if (
        tasks.length === 0
    ) {

        if (emptyState) {

            emptyState.style.display =
                "block";

        }


        return;

    }


    if (emptyState) {

        emptyState.style.display =
            "none";

    }


    tasks.forEach(
        task => {

            const taskElement =
                createTaskElement(
                    task
                );


            taskList.appendChild(
                taskElement
            );

        }
    );

}


/* =========================================================
   CREATE TASK ELEMENT
========================================================= */

function createTaskElement(task) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "task-card";


    if (task.completed) {

        card.classList.add(
            "completed"
        );

    }


    const priority =
        normalizePriority(
            task.priority
        );


    const priorityLabel =
        priority.charAt(0).toUpperCase()
        +
        priority.slice(1);


    card.innerHTML = `

        <input
            type="checkbox"
            class="task-checkbox"
            ${task.completed ? "checked" : ""}
            aria-label="Complete task"
        >


        <div class="task-info">

            <div class="task-title">
                ${escapeHTML(task.name)}
            </div>


            ${
                task.description
                    ? `
                        <div class="task-description">
                            ${escapeHTML(
                                task.description
                            )}
                        </div>
                    `
                    : ""
            }


            <div class="task-meta">

                <span
                    class="priority ${priority}"
                >
                    ${priorityLabel}
                </span>


                ${
                    task.time
                        ? `
                            <span class="task-time">
                                ${escapeHTML(
                                    task.time
                                )}
                            </span>
                        `
                        : ""
                }

            </div>

        </div>


        <div class="task-actions">

            <button
                class="edit-task"
                type="button"
                title="Edit task"
                aria-label="Edit task"
            >
                ✎
            </button>


            <button
                class="delete-task"
                type="button"
                title="Delete task"
                aria-label="Delete task"
            >
                ×
            </button>

        </div>

    `;


    /* Checkbox */

    const checkbox =
        card.querySelector(
            ".task-checkbox"
        );


    if (checkbox) {

        checkbox.addEventListener(
            "change",
            () => {

                toggleTask(
                    task.id
                );

            }
        );

    }


    /* Edit */

    const editButton =
        card.querySelector(
            ".edit-task"
        );


    if (editButton) {

        editButton.addEventListener(
            "click",
            () => {

                editTask(
                    task.id
                );

            }
        );

    }


    /* Delete */

    const deleteButton =
        card.querySelector(
            ".delete-task"
        );


    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            () => {

                deleteTask(
                    task.id
                );

            }
        );

    }


    return card;

}


/* =========================================================
   TOGGLE TASK
========================================================= */

function toggleTask(id) {

    const tasks =
        getTodayTasks();


    const task =
        tasks.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!task) {
        return;
    }


    task.completed =
        !task.completed;


    saveTodayTasks(
        tasks
    );


    renderTasks();

    updateStatistics();

}


/* =========================================================
   DELETE TASK
========================================================= */

function deleteTask(id) {

    const tasks =
        getTodayTasks();


    const newTasks =
        tasks.filter(
            task =>
                String(task.id) !==
                String(id)
        );


    saveTodayTasks(
        newTasks
    );


    renderTasks();

    updateStatistics();

}


/* =========================================================
   EDIT TASK
========================================================= */

function editTask(id) {

    const tasks =
        getTodayTasks();


    const task =
        tasks.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!task) {
        return;
    }


    editingTaskId =
        task.id;


    if (taskName) {

        taskName.value =
            task.name || "";

    }


    if (taskDescription) {

        taskDescription.value =
            task.description || "";

    }


    if (taskPriority) {

        taskPriority.value =
            normalizePriority(
                task.priority
            );

    }


    if (taskTime) {

        taskTime.value =
            task.time || "";

    }


    if (modalTitle) {

        modalTitle.textContent =
            "Edit Task";

    }


    if (saveTaskBtn) {

        saveTaskBtn.textContent =
            "Save Changes";

    }


    if (taskModal) {

        taskModal.classList.add(
            "active"
        );

    }


    setTimeout(
        () => {

            if (taskName) {
                taskName.focus();
            }

        },
        100
    );

}


/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics() {

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


    let progress = 0;


    if (total > 0) {

        progress =
            Math.round(
                (
                    completed /
                    total
                ) * 100
            );

    }


    if (totalTasksElement) {

        totalTasksElement.textContent =
            total;

    }


    if (completedTasksElement) {

        completedTasksElement.textContent =
            completed;

    }


    if (remainingTasksElement) {

        remainingTasksElement.textContent =
            remaining;

    }


    if (progressElement) {

        progressElement.textContent =
            `${progress}%`;

    }


    if (progressFill) {

        progressFill.style.width =
            `${progress}%`;

    }

}


/* =========================================================
   HISTORY - OPEN
========================================================= */

if (historyBtn) {

    historyBtn.addEventListener(
        "click",
        () => {

            if (historyOverlay) {

                historyOverlay.classList.add(
                    "active"
                );

            }


            renderHistory();

        }
    );

}


/* =========================================================
   HISTORY - CLOSE
========================================================= */

if (closeHistory) {

    closeHistory.addEventListener(
        "click",
        () => {

            if (historyOverlay) {

                historyOverlay.classList.remove(
                    "active"
                );

            }

        }
    );

}


/* Close history when clicking overlay */

if (historyOverlay) {

    historyOverlay.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                historyOverlay
            ) {

                historyOverlay.classList.remove(
                    "active"
                );

            }

        }
    );

}


/* =========================================================
   RENDER HISTORY
========================================================= */

function renderHistory() {

    if (!historyList) {
        return;
    }


    const allTasks =
        getTasks();


    const dates =
        Object.keys(
            allTasks
        )
        .filter(
            date =>
                Array.isArray(
                    allTasks[date]
                )
        )
        .sort()
        .reverse();


    historyList.innerHTML =
        "";


    if (historyDetails) {

        historyDetails.innerHTML =
            "";

        historyDetails.classList.add(
            "hidden"
        );

    }


    if (
        dates.length === 0
    ) {

        historyList.innerHTML = `

            <div class="history-empty">

                <div class="history-empty-icon">
                    📅
                </div>

                <h3>
                    No history yet
                </h3>

                <p>
                    Your saved days will
                    appear here.
                </p>

            </div>

        `;

        return;

    }


    dates.forEach(
        date => {

            const tasks =
                allTasks[date];


            const total =
                tasks.length;


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
                "history-day";


            item.dataset.date =
                date;


            item.innerHTML = `

                <div class="history-day-top">

                    <span class="history-date">
                        ${formatHistoryDate(
                            date
                        )}
                    </span>

                    <span class="history-arrow">
                        →
                    </span>

                </div>


                <div class="history-stats">

                    <span>
                        ${total} ${
                            total === 1
                                ? "task"
                                : "tasks"
                        }
                    </span>

                    <span>
                        ${completed} completed
                    </span>

                </div>

            `;


            item.addEventListener(
                "click",
                () => {

                    showHistoryDetails(
                        date
                    );

                }
            );


            historyList.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   SHOW HISTORY DETAILS
========================================================= */

function showHistoryDetails(date) {

    if (!historyDetails) {
        return;
    }


    const allTasks =
        getTasks();


    const tasks =
        Array.isArray(
            allTasks[date]
        )
            ? allTasks[date]
            : [];


    /* Remove active */

    document
        .querySelectorAll(
            ".history-day"
        )
        .forEach(
            item => {

                item.classList.remove(
                    "active"
                );

            }
        );


    /* Active selected day */

    const selected =
        document.querySelector(
            `.history-day[data-date="${date}"]`
        );


    if (selected) {

        selected.classList.add(
            "active"
        );

    }


    historyDetails.classList.remove(
        "hidden"
    );


    historyDetails.innerHTML = `

        <div class="history-details-title">

            <h3>
                ${formatFullDate(
                    date
                )}
            </h3>

        </div>

    `;


    if (
        tasks.length === 0
    ) {

        historyDetails.innerHTML += `

            <p
                style="
                    font-size:12px;
                    color:var(--muted);
                "
            >
                No tasks for this day.
            </p>

        `;

        return;

    }


    tasks.forEach(
        task => {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "history-task";


            if (task.completed) {

                element.classList.add(
                    "completed"
                );

            }


            element.innerHTML = `

                <div class="history-task-check">

                    ${
                        task.completed
                            ? "✓"
                            : "○"
                    }

                </div>


                <span
                    class="history-task-name"
                >
                    ${escapeHTML(
                        task.name
                    )}
                </span>

            `;


            historyDetails.appendChild(
                element
            );

        }
    );


    /* Import */

    const importButton =
        document.createElement(
            "button"
        );


    importButton.className =
        "import-day-btn";


    importButton.type =
        "button";


    importButton.textContent =
        "Import This Day";


    importButton.addEventListener(
        "click",
        () => {

            importDay(
                date
            );

        }
    );


    historyDetails.appendChild(
        importButton
    );

}


/* =========================================================
   IMPORT PREVIOUS DAY
========================================================= */

function importDay(date) {

    const allTasks =
        getTasks();


    const oldTasks =
        Array.isArray(
            allTasks[date]
        )
            ? allTasks[date]
            : [];


    if (
        oldTasks.length === 0
    ) {

        return;

    }


    const todayTasks =
        getTodayTasks();


    const importedTasks =
        oldTasks.map(
            task => ({

                ...task,

                id:
                    Date.now()
                    +
                    Math.random(),

                completed:
                    false,

                createdAt:
                    new Date().toISOString()

            })
        );


    const newTasks = [

        ...todayTasks,

        ...importedTasks

    ];


    saveTodayTasks(
        newTasks
    );


    renderTasks();

    updateStatistics();


    if (historyOverlay) {

        historyOverlay.classList.remove(
            "active"
        );

    }

}


/* =========================================================
   PRIORITY NORMALIZER
========================================================= */

function normalizePriority(
    priority
) {

    const value =
        String(
            priority || "medium"
        ).toLowerCase();


    if (
        value === "low" ||
        value === "medium" ||
        value === "high"
    ) {

        return value;

    }


    return "medium";

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

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


/* =========================================================
   KEYBOARD SUPPORT
========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        /* Escape */

        if (
            event.key === "Escape"
        ) {

            if (
                taskModal &&
                taskModal.classList.contains(
                    "active"
                )
            ) {

                closeTaskModal();

            }


            if (
                historyOverlay &&
                historyOverlay.classList.contains(
                    "active"
                )
            ) {

                historyOverlay.classList.remove(
                    "active"
                );

            }

        }

    }
);


/* =========================================================
   INITIALIZE APP
========================================================= */

function initializeApp() {

    updateDate();

    renderTasks();

    updateStatistics();

}


/* Start */

initializeApp();