
// ==========================================
// CAMCE Popup
// ==========================================


// ==========================================
// Backend URLs
// ==========================================

const NODE_SERVER = "http://localhost:5000";

const FASTAPI_SERVER =
    "https://veto-scraggly-stingray.ngrok-free.dev";


// ==========================================
// Elements
// ==========================================

const platformElement =
    document.getElementById("platform");

const durationSelect =
    document.getElementById("durationSelect");

const timeRangeElement =
    document.getElementById("timeRange");

const extractBtn =
    document.getElementById("extractBtn");

const statusElement =
    document.getElementById("status");

const transcriptElement =
    document.getElementById("transcript");

const summaryElement =
    document.getElementById("summary");

const saveStatusElement =
    document.getElementById("saveStatus");

const viewNotesBtn =
    document.getElementById("viewNotesBtn");


// ==========================================
// Current video information
// ==========================================

let currentVideoUrl = "";
let currentVideoTime = 0;
let currentDuration = 0;


// ==========================================
// Format time
// ==========================================

function formatTime(seconds) {

    if (
        seconds === null ||
        seconds === undefined ||
        isNaN(seconds)
    ) {
        return "--:--";
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


// ==========================================
// Get active tab
// ==========================================

async function getActiveTab() {

    const tabs =
        await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

    if (!tabs || tabs.length === 0) {

        throw new Error(
            "Active tab not found"
        );

    }

    return tabs[0];
}


// ==========================================
// Get video information
// ==========================================

async function getVideoInformation() {

    const tab =
        await getActiveTab();

    if (
        !tab.url ||
        (
            !tab.url.includes("youtube.com") &&
            !tab.url.includes("youtu.be")
        )
    ) {

        throw new Error(
            "Please open a YouTube video."
        );

    }

    currentVideoUrl =
        tab.url;

    const result =
        await new Promise((resolve) => {

            chrome.tabs.sendMessage(
                tab.id,
                {
                    action: "getCurrentTime"
                },
                (response) => {

                    if (chrome.runtime.lastError) {

                        resolve({
                            success: false,
                            error:
                                chrome.runtime
                                    .lastError
                                    .message
                        });

                        return;
                    }

                    resolve(response);
                }
            );

        });


    if (
        result &&
        result.success
    ) {

        currentVideoTime =
            Number(result.currentTime) || 0;

        currentDuration =
            Number(result.duration) || 0;

    }

    return {

        url:
            currentVideoUrl,

        currentTime:
            currentVideoTime,

        duration:
            currentDuration
    };
}


// ==========================================
// Update time range
// ==========================================

async function updateTimeRange() {

    try {

        const info =
            await getVideoInformation();

        const selectedDuration =
            Number(durationSelect.value);

        const startTime =
            Math.max(
                0,
                info.currentTime -
                selectedDuration
            );

        timeRangeElement.textContent =
            `Time range: ${formatTime(startTime)} → ${formatTime(info.currentTime)}`;

    } catch {

        timeRangeElement.textContent =
            "Time range: --:-- → --:--";

    }
}


// ==========================================
// Detect platform
// ==========================================

async function detectPlatform() {

    try {

        const tab =
            await getActiveTab();

        if (
            tab.url.includes("youtube.com") ||
            tab.url.includes("youtu.be")
        ) {

            platformElement.textContent =
                "Platform: YouTube";

            return;
        }

        platformElement.textContent =
            "Platform: Unsupported";

    } catch {

        platformElement.textContent =
            "Platform: Unknown";

    }
}


// ==========================================
// Filter transcript by timestamp
// ==========================================

function filterTranscriptByTime(
    transcript,
    startTime,
    endTime
) {

    return transcript.filter(item => {

        if (
            item.start === null ||
            item.start === undefined
        ) {

            return false;

        }

        const itemStart =
            Number(item.start);

        const itemEnd =
            itemStart +
            Number(item.duration || 0);

        return (
            itemEnd >= startTime &&
            itemStart <= endTime
        );

    });

}


// ==========================================
// Display transcript
// ==========================================

function displayTranscript(
    transcript
) {

    transcriptElement.innerHTML = "";

    if (
        !transcript ||
        transcript.length === 0
    ) {

        transcriptElement.innerHTML = `
            <div class="transcript-paragraph">
                <div class="text">
                    No transcript found for this time range.
                </div>
            </div>
        `;

        return;
    }

    const text =
        transcript
            .map(item => item.text)
            .join(" ");

    const paragraph =
        document.createElement("div");

    paragraph.className =
        "transcript-paragraph";

    paragraph.innerHTML = `
        <div class="text">
            ${escapeHtml(text)}
        </div>
    `;

    transcriptElement.appendChild(
        paragraph
    );
}


// ==========================================
// Escape HTML
// ==========================================

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text || "";

    return div.innerHTML;
}


// ==========================================
// Get YouTube transcript
// ==========================================

async function getYouTubeTranscript(url) {

    const response =
        await fetch(
            `${NODE_SERVER}/api/youtube/transcript`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        url
                    })
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
            "Unable to extract transcript"
        );

    }

    return data.transcript;
}


// ==========================================
// Summarize transcript
// ==========================================

async function summarizeTranscript(text) {

    summaryElement.textContent =
        "Translating and generating English summary...";


    const response =
        await fetch(
            `${FASTAPI_SERVER}/api/summarize`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    text: text,

                    // Current working setup
                    // Arabic -> English -> BART
                    source_language:
                        "arb_Arab"

                })
            }
        );


    const data =
        await response.json();


    console.log(
        "CAMCE: FastAPI response:",
        data
    );


    if (!response.ok) {

        throw new Error(
            data.error ||
            data.detail ||
            "Summarization failed"
        );

    }


    if (!data.success) {

        throw new Error(
            data.error ||
            "Summarization failed"
        );

    }


    if (
        !data.summary ||
        data.summary.trim().length === 0
    ) {

        throw new Error(
            "No summary returned by FastAPI."
        );

    }


    // ==========================================
    // Display English summary
    // ==========================================

    summaryElement.textContent =
        data.summary;


    console.log(
        "CAMCE: English summary:",
        data.summary
    );


    return data.summary;
}




// ==========================================
// Display summary
// ==========================================

function displaySummary(summary) {

    if (
        !summary ||
        summary.trim().length === 0
    ) {

        summaryElement.textContent =
            "No summary generated.";

        return;
    }


    // Clear previous summary
    summaryElement.innerHTML = "";


    // Create summary text safely
    const summaryText =
        document.createElement("div");

    summaryText.textContent =
        summary;


    summaryElement.appendChild(
        summaryText
    );


    // Make sure summary section is visible
    summaryElement.style.display =
        "block";
}


// ==========================================
// Save note to MongoDB
// ==========================================

async function saveNoteToMongoDB(
    videoUrl,
    videoTimestamp,
    duration,
    note
) {

    console.log(
        "CAMCE: Saving note to MongoDB..."
    );

    saveStatusElement.textContent =
        "Saving note...";


    try {

        const response =
            await fetch(
                `${NODE_SERVER}/api/notes`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            videoUrl,
                            videoTimestamp,
                            duration,
                            note
                        })
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
                "Failed to save note"
            );

        }


        console.log(
            "CAMCE: Note saved successfully:",
            data.note
        );


        saveStatusElement.textContent =
            "✓ Note saved automatically";


    } catch (error) {

        console.error(
            "CAMCE: MongoDB save error:",
            error
        );


        saveStatusElement.textContent =
            "⚠ Note could not be saved";

    }
}


// ==========================================
// Extract Transcript button
// ==========================================

extractBtn.addEventListener(
    "click",
    async () => {

        try {

            extractBtn.disabled =
                true;


            statusElement.textContent =
                "Getting video information...";


            transcriptElement.innerHTML =
                "";


            summaryElement.textContent =
                "Generating summary...";


            saveStatusElement.textContent =
                "";


            // ==================================
            // Get video information
            // ==================================

            const info =
                await getVideoInformation();


            currentVideoUrl =
                info.url;

            currentVideoTime =
                info.currentTime;


            const selectedDuration =
                Number(
                    durationSelect.value
                );


            const startTime =
                Math.max(
                    0,
                    currentVideoTime -
                    selectedDuration
                );


            timeRangeElement.textContent =
                `Time range: ${formatTime(startTime)} → ${formatTime(currentVideoTime)}`;


            // ==================================
            // Get transcript
            // ==================================

            statusElement.textContent =
                "Extracting transcript...";


            const fullTranscript =
                await getYouTubeTranscript(
                    currentVideoUrl
                );


            // ==================================
            // Filter transcript
            // ==================================

            const filteredTranscript =
                filterTranscriptByTime(
                    fullTranscript,
                    startTime,
                    currentVideoTime
                );


            if (
                filteredTranscript.length === 0
            ) {

                throw new Error(
                    "No transcript found in the selected time range."
                );

            }


            // ==================================
            // Display transcript
            // ==================================

            displayTranscript(
                filteredTranscript
            );


            // ==================================
            // Prepare transcript text
            // ==================================

            const transcriptText =
                filteredTranscript
                    .map(item => item.text)
                    .join(" ");


            console.log(
                "CAMCE transcript length:",
                transcriptText.length
            );


            // ==================================
            // Generate summary
            // ==================================

            statusElement.textContent =
                "Translating and summarizing...";


            const summary =
                await summarizeTranscript(
                    transcriptText
                );


            // ==================================
            // Display summary
            // ==================================

            displaySummary(
                summary
            );


            statusElement.textContent =
                "Summary generated successfully";


            // ==================================
            // Save summary to MongoDB
            // ==================================

            await saveNoteToMongoDB(
                currentVideoUrl,
                currentVideoTime,
                selectedDuration,
                summary
            );

        } catch (error) {

            console.error(
                "CAMCE extraction error:",
                error
            );


            statusElement.textContent =
                error.message;


            summaryElement.textContent =
                "Summary could not be generated.";

        } finally {

            extractBtn.disabled =
                false;

        }

    }
);


// ==========================================
// Duration changed
// ==========================================

durationSelect.addEventListener(
    "change",
    updateTimeRange
);


// ==========================================
// View All Notes
// ==========================================

viewNotesBtn.addEventListener(
    "click",
    () => {

        chrome.tabs.create({
            url:
                chrome.runtime.getURL(
                    "notes.html"
                )
        });

    }
);


// ==========================================
// Initial setup
// ==========================================

(async function init() {

    await detectPlatform();

    await updateTimeRange();

})();

