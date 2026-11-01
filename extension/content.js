
// ==========================================
// Detect platform
// ==========================================

function getPlatform() {

    const hostname =
        window.location.hostname.toLowerCase();

    if (
        hostname.includes("youtube.com") ||
        hostname === "youtu.be"
    ) {
        return "youtube";
    }

    if (
        hostname.includes("coursera.org")
    ) {
        return "coursera";
    }

    return "other";
}


// ==========================================
// Find video
// ==========================================

function findVideo() {

    // Try the normal video element first
    let video =
        document.querySelector("video");

    if (video) {
        return video;
    }

    // YouTube sometimes loads the video
    // after the content script starts.
    video =
        document.querySelector(
            "#movie_player video"
        );

    return video;
}


// ==========================================
// Get current video time
// ==========================================

function getCurrentVideoTime() {

    const video =
        findVideo();

    if (!video) {

        return {
            success: false,
            error: "Video element not found"
        };

    }

    return {

        success: true,

        currentTime:
            video.currentTime,

        duration:
            video.duration

    };

}


// ==========================================
// Pause video
// ==========================================


function pauseVideo() {

    console.log(
        "CAMCE: Pause video requested"
    );


    const video =
        findVideo();


    if (!video) {

        console.log(
            "CAMCE: Video element not found"
        );

        return {

            success: false,

            error:
                "Video element not found"

        };

    }


    console.log(
        "CAMCE: Video found"
    );


    console.log(
        "CAMCE: Current time:",
        video.currentTime
    );


    // Pause video
    video.pause();


    console.log(
        "CAMCE: video.pause() called"
    );


    // Verify pause state
    if (video.paused) {

        console.log(
            "CAMCE: VIDEO IS PAUSED"
        );

        return {

            success: true,

            currentTime:
                video.currentTime

        };

    }


    console.log(
        "CAMCE: Video is still playing"
    );


    return {

        success: false,

        currentTime:
            video.currentTime,

        error:
            "Video could not be paused"

    };

}



// ==========================================
// Extract caption tracks
// ==========================================

function extractVideoTracks() {

    const video =
        findVideo();

    if (!video) {

        return [];

    }

    const tracks =
        Array.from(
            video.textTracks || []
        );

    const result = [];


    for (const track of tracks) {

        if (
            track.kind !== "subtitles" &&
            track.kind !== "captions"
        ) {

            continue;

        }


        try {

            track.mode = "hidden";

        } catch {

            continue;

        }


        if (!track.cues) {

            continue;

        }


        for (
            const cue of track.cues
        ) {

            result.push({

                start:
                    cue.startTime,

                duration:
                    cue.endTime -
                    cue.startTime,

                text:
                    cleanText(
                        cue.text
                    )

            });

        }

    }

    return result;

}


// ==========================================
// Coursera visible captions
// ==========================================

function extractVisibleCaptionText() {

    const selectors = [

        '[class*="caption"]',

        '[class*="subtitle"]',

        '[class*="transcript"]',

        '[aria-live="polite"]'

    ];


    const elements = [];


    for (
        const selector of selectors
    ) {

        document
            .querySelectorAll(selector)
            .forEach(element => {

                const text =
                    cleanText(
                        element.innerText
                    );


                if (
                    text &&
                    !elements.includes(text)
                ) {

                    elements.push(text);

                }

            });

    }


    return elements;

}


// ==========================================
// Extract transcript
// ==========================================

function extractPageTranscript() {

    const platform =
        getPlatform();


    const tracks =
        extractVideoTracks();


    if (tracks.length > 0) {

        return {

            success: true,

            platform,

            source:
                "video-text-track",

            transcript:
                tracks

        };

    }


    if (
        platform === "coursera"
    ) {

        const captions =
            extractVisibleCaptionText();


        if (
            captions.length > 0
        ) {

            return {

                success: true,

                platform,

                source:
                    "visible-page-captions",

                transcript:
                    captions.map(
                        text => ({

                            start: null,

                            duration: null,

                            text

                        })
                    )

            };

        }

    }


    return {

        success: false,

        platform,

        error:
            "No accessible caption track found."

    };

}


// ==========================================
// Clean text
// ==========================================

function cleanText(text) {

    return text

        .replace(
            /<[^>]*>/g,
            ""
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim();

}


// ==========================================
// Messages from popup / background
// ==========================================

chrome.runtime.onMessage.addListener(

    (
        message,
        sender,
        sendResponse
    ) => {

        console.log(
            "CAMCE: Message received:",
            message
        );


        // ==================================
        // PAUSE VIDEO
        // ==================================

        if (
            message.action ===
            "PAUSE_VIDEO"
        ) {

            const result =
                pauseVideo();


            console.log(
                "CAMCE: Pause result:",
                result
            );


            sendResponse(
                result
            );


            return true;

        }


        // ==================================
        // GET CURRENT VIDEO TIME
        // ==================================

        if (
            message.action ===
            "getCurrentTime"
        ) {

            const result =
                getCurrentVideoTime();


            sendResponse(
                result
            );


            return true;

        }


        // ==================================
        // EXTRACT TRANSCRIPT
        // ==================================

        if (
            message.action ===
            "extractPageTranscript"
        ) {

            const result =
                extractPageTranscript();


            sendResponse(
                result
            );


            return true;

        }

    }

);


// ==========================================
// CAMCE loaded message
// ==========================================

console.log(
    "CAMCE content.js loaded on:",
    window.location.href
);

