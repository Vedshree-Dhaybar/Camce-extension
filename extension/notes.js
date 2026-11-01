const NODE_SERVER = "http://localhost:5000";

const notesContainer =
    document.getElementById("notesContainer");

const emptyState =
    document.getElementById("emptyState");

const statusElement =
    document.getElementById("status");

const refreshBtn =
    document.getElementById("refreshBtn");


/*
 * Format date and time
 */
function formatDateTime(dateString) {

    if (!dateString) {
        return "Unknown date";
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return "Unknown date";
    }

    return date.toLocaleString();
}


/*
 * Format timestamp
 */
function formatTime(seconds) {

    if (
        seconds === null ||
        seconds === undefined ||
        isNaN(seconds)
    ) {
        return "00:00";
    }

    seconds = Math.max(
        0,
        Math.floor(Number(seconds))
    );

    const hours =
        Math.floor(seconds / 3600);

    const minutes =
        Math.floor((seconds % 3600) / 60);

    const secs =
        seconds % 60;


    if (hours > 0) {

        return (
            String(hours).padStart(2, "0") +
            ":" +
            String(minutes).padStart(2, "0") +
            ":" +
            String(secs).padStart(2, "0")
        );

    }


    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(secs).padStart(2, "0")
    );
}


/*
 * Escape HTML
 */
function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text || "";

    return div.innerHTML;
}


/*
 * Open YouTube video at saved timestamp
 */
function openVideo(videoUrl, timestamp) {

    if (!videoUrl) {
        return;
    }

    let url = videoUrl;

    try {

        const video = new URL(videoUrl);

        video.searchParams.set(
            "t",
            Math.floor(Number(timestamp) || 0)
        );

        url = video.toString();

    } catch (error) {

        console.error(
            "Invalid video URL:",
            error
        );

    }

    chrome.tabs.create({
        url: url
    });
}


/*
 * Delete note
 */
async function deleteNote(noteId) {

    if (!noteId) {
        return;
    }


    const confirmDelete =
        confirm(
            "Are you sure you want to delete this note?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        statusElement.textContent =
            "Deleting note...";


        const response =
            await fetch(
                `${NODE_SERVER}/api/notes/${noteId}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Failed to delete note"
            );

        }


        statusElement.textContent =
            "Note deleted successfully";


        await loadNotes();


    } catch (error) {

        console.error(
            "Delete note error:",
            error
        );


        statusElement.textContent =
            "Unable to delete note";

    }
}


/*
 * Create note card
 */
function createNoteCard(note, index) {

    const card =
        document.createElement("div");

    card.className =
        "note-card";


    const noteId =
        note._id;


    const videoUrl =
        note.videoUrl || "";


    const timestamp =
        Number(note.videoTimestamp) || 0;


    const duration =
        Number(note.duration) || 0;


    const summary =
        note.note || "No summary available";


    card.innerHTML = `

        <div class="note-header">

            <div class="note-number">
                Note #${index + 1}
            </div>

            <div class="note-date">
                ${escapeHtml(
                    formatDateTime(note.createdAt)
                )}
            </div>

        </div>


        <div class="note-info">

            <div class="info-item">
                📍 Note timestamp:
                <strong>
                    ${formatTime(timestamp)}
                </strong>
            </div>

            <div class="info-item">
                ⏱ Duration:
                <strong>
                    ${formatTime(duration)}
                </strong>
            </div>

        </div>


        <div class="video-url">

            <div class="video-url-title">
                YouTube Video
            </div>

            <a
                href="${escapeHtml(videoUrl)}"
                target="_blank"
            >
                ${escapeHtml(videoUrl)}
            </a>

        </div>


        <div>

            <div class="summary-title">
                English Summary
            </div>

            <div class="summary">
                ${escapeHtml(summary)}
            </div>

        </div>


        <div class="note-actions">

            <button
                class="open-btn"
                data-action="open"
            >
                ▶ Open Video
            </button>

            <button
                class="delete-btn"
                data-action="delete"
            >
                🗑 Delete
            </button>

        </div>
    `;


    /*
     * Open video button
     */
    const openButton =
        card.querySelector(
            '[data-action="open"]'
        );


    openButton.addEventListener(
        "click",
        () => {

            openVideo(
                videoUrl,
                timestamp
            );

        }
    );


    /*
     * Delete button
     */
    const deleteButton =
        card.querySelector(
            '[data-action="delete"]'
        );


    deleteButton.addEventListener(
        "click",
        () => {

            deleteNote(noteId);

        }
    );


    return card;
}


/*
 * Load all notes
 */
async function loadNotes() {

    try {

        statusElement.textContent =
            "Loading notes...";


        notesContainer.innerHTML = "";

        emptyState.style.display =
            "none";


        const response =
            await fetch(
                `${NODE_SERVER}/api/notes`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Unable to load notes"
            );

        }


        const notes =
            data.notes || [];


        if (notes.length === 0) {

            emptyState.style.display =
                "block";

            statusElement.textContent =
                "No saved notes.";

            return;

        }


        notes.forEach(
            (note, index) => {

                const card =
                    createNoteCard(
                        note,
                        index
                    );

                notesContainer.appendChild(
                    card
                );

            }
        );


        statusElement.textContent =
            `${notes.length} saved note${
                notes.length !== 1
                    ? "s"
                    : ""
            }`;

    } catch (error) {

        console.error(
            "Load notes error:",
            error
        );


        statusElement.textContent =
            "Unable to load notes. Make sure the Node server is running.";

    }
}


/*
 * Refresh
 */
refreshBtn.addEventListener(
    "click",
    loadNotes
);


/*
 * Initial load
 */
loadNotes();