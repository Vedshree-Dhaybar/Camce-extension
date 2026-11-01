
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const { fetchTranscript } = require("youtube-transcript");


// ========================================
// Load environment variables
// ========================================

dotenv.config();


// ========================================
// Create Express app
// ========================================

const app = express();

app.use(cors());

app.use(express.json());


// ========================================
// MongoDB connection
// ========================================

const MONGODB_URI =
    process.env.MONGODB_URI;


if (!MONGODB_URI) {

    console.error(
        "ERROR: MONGODB_URI is not defined in .env"
    );

    process.exit(1);

}


mongoose
    .connect(MONGODB_URI)
    .then(() => {

        console.log(
            "MongoDB connected successfully"
        );

    })
    .catch((error) => {

        console.error(
            "MongoDB connection error:",
            error.message
        );

    });


// ========================================
// Note Schema
// ========================================

const noteSchema = new mongoose.Schema({

    videoUrl: {
        type: String,
        required: true
    },

    videoTimestamp: {
        type: Number,
        required: true
    },

    note: {
        type: String,
        required: true
    },

    duration: {
        type: Number,
        default: null
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});


// ========================================
// Note Model
// ========================================

const Note =
    mongoose.model(
        "Note",
        noteSchema
    );


// ========================================
// Extract YouTube transcript
// ========================================

app.post(
    "/api/youtube/transcript",
    async (req, res) => {

        try {

            const { url } =
                req.body;


            if (!url) {

                return res.status(400).json({

                    success: false,

                    error:
                        "YouTube URL is required"

                });

            }


            console.log(
                "YouTube URL:",
                url
            );


            const transcript =
                await fetchTranscript(url);


            if (
                !transcript ||
                transcript.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    error:
                        "No transcript/captions found"

                });

            }


            const result =
                transcript.map(item => ({

                    // Convert milliseconds
                    // into seconds
                    start:
                        Number(item.offset) /
                        1000,

                    duration:
                        Number(item.duration) /
                        1000,

                    text:
                        cleanText(
                            item.text
                        )

                }));


            console.log(
                `Extracted ${result.length} transcript segments`
            );


            res.json({

                success: true,

                platform:
                    "youtube",

                transcript:
                    result

            });


        } catch (error) {

            console.error(error);


            res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }

    }
);


// ========================================
// Save summarized note
// ========================================

app.post(
    "/api/notes",
    async (req, res) => {

        try {

            const {
                videoUrl,
                videoTimestamp,
                note,
                duration
            } = req.body;


            // Validate required fields

            if (!videoUrl) {

                return res.status(400).json({

                    success: false,

                    error:
                        "YouTube video URL is required"

                });

            }


            if (
                videoTimestamp === undefined ||
                videoTimestamp === null
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Video timestamp is required"

                });

            }


            if (!note) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Note is required"

                });

            }


            // Create note

            const newNote =
                new Note({

                    videoUrl,

                    videoTimestamp:

                        Number(
                            videoTimestamp
                        ),

                    note,

                    duration:
                        duration !== undefined
                            ? Number(duration)
                            : null

                });


            // Save to MongoDB

            const savedNote =
                await newNote.save();


            console.log(
                "Note saved:",
                savedNote._id
            );


            res.status(201).json({

                success: true,

                message:
                    "Note saved successfully",

                note:
                    savedNote

            });


        } catch (error) {

            console.error(
                "Save note error:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }

    }
);


// ========================================
// Get all saved notes
// ========================================

app.get(
    "/api/notes",
    async (req, res) => {

        try {

            const notes =
                await Note
                    .find()
                    .sort({
                        createdAt: -1
                    });


            res.json({

                success: true,

                count:
                    notes.length,

                notes

            });


        } catch (error) {

            console.error(
                "Get notes error:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }

    }
);


// ========================================
// Delete a note
// ========================================

app.delete(
    "/api/notes/:id",
    async (req, res) => {

        try {

            const deletedNote =
                await Note.findByIdAndDelete(
                    req.params.id
                );


            if (!deletedNote) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Note not found"

                });

            }


            res.json({

                success: true,

                message:
                    "Note deleted successfully"

            });


        } catch (error) {

            console.error(
                "Delete note error:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }

    }
);


// ========================================
// Health check
// ========================================

app.get(
    "/",
    (req, res) => {

        res.json({

            message:
                "CAMCE Video Transcript API is running",

            mongodb:
                mongoose.connection.readyState === 1
                    ? "connected"
                    : "disconnected"

        });

    }
);


// ========================================
// Clean transcript text
// ========================================

function cleanText(text) {

    return text

        .replace(
            /<[^>]*>/g,
            ""
        )

        .replace(
            /&nbsp;/g,
            " "
        )

        .replace(
            /&amp;/g,
            "&"
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim();

}


// ========================================
// Start server
// ========================================

const PORT = 5000;

app.listen(
    PORT,
    () => {

        console.log(
            `Transcript server running on http://localhost:${PORT}`
        );

    }
);

