# 🎓 CAMCE – Context-Aware Micro-Concept Extraction

**An intelligent YouTube lecture summarization tool that extracts meaningful concepts from video transcripts and generates concise, easy-to-understand notes.**

CAMCE (Context-Aware Micro-Concept Extraction) is a Chrome extension designed to help students save time while learning from online lectures. It extracts YouTube video transcripts based on the user's selected time duration and generates concise summaries to make learning easier and more efficient.

The project combines transcript extraction, multilingual translation, and AI-based text summarization to convert lengthy lecture content into useful study notes.

## ✨ Features

- **YouTube Transcript Extraction:** Extracts transcripts directly from YouTube lectures.
- **Time-Based Transcript Filtering:** Allows users to select a specific duration (1 minute, 2 minutes, or 5 minutes) to extract transcript content from the current video playback position.
- **AI-Powered Summarization:** Generates concise summaries from extracted lecture transcripts.
- **Multilingual Support:** Supports multiple languages by translating transcript content into English before summarization.
- **Chrome Extension:** Provides an easy-to-use interface directly within the YouTube learning experience.
- **Context-Aware Notes:** Focuses on the selected lecture segment instead of summarizing the entire video.
- CAMCE provides a keyboard shortcut for quick access while watching YouTube lectures.
    Shortcut - 'Ctrl + Shift + Y'
    Action - Activate the CAMCE extension and access its features.

Note: The shortcut is designed to make accessing CAMCE easier without interrupting the learning experience.

## 🛠️ Technologies Used

| Frontend | HTML, CSS, JavaScript |
| Browser Extension | Chrome Extension APIs |
| Backend | Node.js, Express.js |
| Transcript Extraction | YouTube Transcript Library |
| AI / NLP | Python, Hugging Face Transformers |
| Translation | NLLB-200 |
| Summarization | Fine-tuned BART |
| API Framework | FastAPI |
| Deployment / Testing | Google Colab, ngrok |

## ⚙️ How It Works

1. Open a YouTube lecture in the browser.
2. Press Ctrl + Shift + Y to quickly activate CAMCE while watching a YouTube lecture.
3. Select the desired transcript duration (1, 2, or 5 minutes).
4. CAMCE extracts the available YouTube transcript.
5. The transcript is filtered according to the selected duration and current playback position.
6. If the transcript is in another supported language, it is translated into English.
7. The processed transcript is sent to the summarization model.
8. The system generates a concise English summary that students can use as study notes.

## 🏗️ Project Architecture

**Chrome Extension → Express.js Backend → Transcript Extraction → Time-Based Filtering → Translation (NLLB-200) → Summarization (BART) → Summary Display**

## 📂 Project Structure

```text
CAMCE/
│
├── extension/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   ├── content.js
│   ├── youtube.js
│   └── transcript.js
│
├── backend/
│   ├── server.js
│   └── package.json
│
├── model/
│   ├── camce_model.py
│
└── README.md
```

*Note: Adjust the folder structure above to match the actual files and directories in your repository.*

## 🚀 Installation and Setup

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd CAMCE-extension
```

### 2. Set Up the Backend

Navigate to the backend directory:

```bash
cd backend
npm install
```

Start the Express.js server:

```bash
node server.js
```

### 3. Set Up the Summarization API

Install the required Python dependencies:

```bash
pip install fastapi uvicorn transformers torch sentencepiece pyngrok
```

Run the FastAPI application:

```bash
uvicorn summarization_api:app --host 0.0.0.0 --port 8000
```

Configure the required model paths and environment variables before running the API.

### 4. Load the Chrome Extension

1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the CAMCE extension directory.
6. Open a YouTube lecture and start using CAMCE.

### 5. Configure API Endpoints

Update the backend and extension configuration with the appropriate Express.js and FastAPI endpoint URLs.

Keep authentication tokens and API credentials in environment variables or secure secret storage. Never upload actual credentials to GitHub.

## 🧠 NLP Models

**1. NLLB-200 (No Language Left Behind)**

Used for multilingual translation. It helps convert supported non-English lecture transcripts into English before summarization.

**2. BART (Bidirectional and Auto-Regressive Transformers)**

Used for text summarization. The project uses a fine-tuned BART model to generate shorter and meaningful summaries from lecture transcripts.

## 🎯 Project Objectives

- Reduce the time required to prepare lecture notes.
- Help students focus on important concepts in long educational videos.
- Support learning from multilingual educational content.
- Generate concise and understandable summaries.
- Provide an accessible learning tool through a Chrome extension.

## 🔮 Future Enhancements

- Support for additional online learning platforms.
- Automatic generation of structured notes and key points.
- Export summaries as PDF or text files.
- Improved summarization accuracy and contextual understanding.
- Bookmarking and saving important lecture segments.

Developed as an academic project.
This project is developed for educational and academic purposes.

---

⭐ If you find this project useful, consider giving the repository a star!
