// tab2_query.js
// Contains all logic for the Tab 2: Direct Query

// --- API Call Function for Tab 2 (Direct Policy Query) ---
function callQueryApi(queryText, buttonEl, resultsEl, errorEl, answerEl) {
    const spinner = buttonEl.querySelector(".spinner");
    const buttonText = buttonEl.querySelector("span:last-child");
    const originalButtonText = buttonText.textContent;

    // --- Get feedback elements ---
    const feedbackButtons = document.getElementById('feedback-buttons');
    const feedbackLike = document.getElementById('feedback-like-button');
    const feedbackDislike = document.getElementById('feedback-dislike-button');
    const feedbackConfirmation = document.getElementById('feedback-confirmation');

    buttonEl.disabled = true;
    buttonText.textContent = "Searching...";
    spinner.style.display = "inline-block";
    resultsEl.style.display = "none";
    errorEl.style.display = "none";

    // --- Reset feedback buttons on new query ---
    feedbackButtons.style.display = 'none';
    feedbackConfirmation.style.display = 'none';
    feedbackLike.disabled = false;
    feedbackDislike.disabled = false;

    // === USE API_BASE_URL VARIABLE ===
    fetch(`${window.API_BASE_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            text: queryText,
            quality: window.analysisQuality
        }),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || "Server returned an error"); });
        }
        return response.json();
    })
    .then(data => {
        const determination = data.determination || "No determination provided.";
        answerEl.textContent = determination;

        // Apply styling based on the determination
        answerEl.className = "determination-box"; // Reset classes
        if (determination.includes("TOP SECRET SAP")) {
            answerEl.classList.add("top-secret-sap");
        } else if (determination.includes("TOP SECRET")) {
            answerEl.classList.add("top-secret");
        } else if (determination.includes("POTENTIALLY SECRET")) {
            answerEl.classList.add("potentially-secret");
        } else if (determination.includes("SECRET")) {
            answerEl.classList.add("classified");
        } else if (determination.includes("CUI")) {
            answerEl.classList.add("cui");
        } else if (determination.includes("Potentially Classified")) {
            answerEl.classList.add("potential");
        } else {
            answerEl.classList.add("unclassified");
        }

        resultsEl.style.display = "block";
        // --- Show feedback buttons ---
        feedbackButtons.style.display = 'flex';
    })
    .catch(error => {
        console.error("Error:", error);
        errorEl.textContent = error.message || "An error occurred.";
        errorEl.style.display = "block";
    })
    .finally(() => {
        buttonEl.disabled = false;
        buttonText.textContent = originalButtonText;
        spinner.style.display = "none";
    });
}

// --- API Call Function for Acronym Definition ---
function callDefineApi(queryText, buttonEl, resultsEl, errorEl, answerEl) {
    const spinner = buttonEl.querySelector(".spinner");
    const buttonText = buttonEl.querySelector("span:last-child");
    const originalButtonText = buttonText.textContent;

    // --- Get feedback elements ---
    const feedbackButtons = document.getElementById('feedback-buttons');
    const feedbackLike = document.getElementById('feedback-like-button');
    const feedbackDislike = document.getElementById('feedback-dislike-button');
    const feedbackConfirmation = document.getElementById('feedback-confirmation');

    buttonEl.disabled = true;
    buttonText.textContent = "Defining...";
    spinner.style.display = "inline-block";
    resultsEl.style.display = "none";
    errorEl.style.display = "none";

    // --- Reset feedback buttons on new query ---
    feedbackButtons.style.display = 'none';
    feedbackConfirmation.style.display = 'none';
    feedbackLike.disabled = false;
    feedbackDislike.disabled = false;

    fetch(`${window.API_BASE_URL}/define_acronym`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            text: queryText,
            quality: window.analysisQuality
        }),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || "Server returned an error"); });
        }
        return response.json();
    })
    .then(data => {
        const determination = data.determination || "No determination provided.";
        answerEl.textContent = determination;

        // Apply a neutral 'unclassified' style for definitions
        answerEl.className = "determination-box unclassified";

        resultsEl.style.display = "block";
        // --- Show feedback buttons ---
        feedbackButtons.style.display = 'flex';
    })
    .catch(error => {
        console.error("Error:", error);
        errorEl.textContent = error.message || "An error occurred.";
        errorEl.style.display = "block";
    })
    .finally(() => {
        buttonEl.disabled = false;
        buttonText.textContent = originalButtonText;
        spinner.style.display = "none";
    });
}

// --- API Call Function for Translation ---
function callTranslateApi(queryText, buttonEl, resultsEl, errorEl, answerEl) {
    const spinner = buttonEl.querySelector(".spinner");
    const buttonText = buttonEl.querySelector("span:last-child");
    const originalButtonText = buttonText.textContent;

    // --- Get feedback elements ---
    const feedbackButtons = document.getElementById('feedback-buttons');
    const feedbackLike = document.getElementById('feedback-like-button');
    const feedbackDislike = document.getElementById('feedback-dislike-button');
    const feedbackConfirmation = document.getElementById('feedback-confirmation');

    buttonEl.disabled = true;
    buttonText.textContent = "Translating...";
    spinner.style.display = "inline-block";
    resultsEl.style.display = "none";
    errorEl.style.display = "none";

    // --- Reset feedback buttons on new query ---
    feedbackButtons.style.display = 'none';
    feedbackConfirmation.style.display = 'none';
    feedbackLike.disabled = false;
    feedbackDislike.disabled = false;

    fetch(`${window.API_BASE_URL}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            text: queryText,
            quality: window.analysisQuality,
            target_language: "English" // Hardcoded to English for now
        }),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || "Server returned an error"); });
        }
        return response.json();
    })
    .then(data => {
        const determination = data.determination || "No translation provided.";
        answerEl.textContent = determination;

        // Apply a neutral 'unclassified' style for translations
        answerEl.className = "determination-box unclassified";

        resultsEl.style.display = "block";
        // --- Show feedback buttons ---
        feedbackButtons.style.display = 'flex';
    })
    .catch(error => {
        console.error("Error:", error);
        errorEl.textContent = error.message || "An error occurred.";
        errorEl.style.display = "block";
    })
    .finally(() => {
        buttonEl.disabled = false;
        buttonText.textContent = originalButtonText;
        spinner.style.display = "none";
    });
}

// --- Feedback Button Logic ---
function sendFeedback(feedbackType) {
    const queryInput = document.getElementById("query-input");
    const determinationTab2 = document.getElementById("determination-tab2");
    const feedbackLikeButton = document.getElementById('feedback-like-button');
    const feedbackDislikeButton = document.getElementById('feedback-dislike-button');
    const feedbackConfirmation = document.getElementById('feedback-confirmation');
    
    const query = queryInput.value;
    const determination = determinationTab2.textContent;

    // Disable buttons
    feedbackLikeButton.disabled = true;
    feedbackDislikeButton.disabled = true;

    // Show confirmation
    feedbackConfirmation.style.display = 'inline';

    // Send data to backend
    fetch(`${window.API_BASE_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            feedback_type: feedbackType,
            query: query,
            determination: determination
        }),
    })
    .then(response => response.json())
    .then(data => {
        console.log("Feedback logged:", data.status);
    })
    .catch(error => {
        console.error("Error sending feedback:", error);
        // Re-enable buttons if sending failed
        feedbackLikeButton.disabled = false;
        feedbackDislikeButton.disabled = false;
        feedbackConfirmation.style.display = 'none';
    });
}

// --- Initialize Tab 2 ---
function initializeTab2() {
    // --- API Endpoint 2: Direct Policy Query (Tab 2) ---
    const queryInput = document.getElementById("query-input");
    const analyzeButtonTab2 = document.getElementById("analyze-button-tab2");
    const defineAcronymButton = document.getElementById("define-acronym-button");
    const translateButton = document.getElementById("translate-button");
    const resultsContainerTab2 = document.getElementById("results-container-tab2");
    const errorMessageTab2 = document.getElementById("error-message-tab2");
    const determinationTab2 = document.getElementById("determination-tab2");

    analyzeButtonTab2.addEventListener("click", () => {
        const queryText = queryInput.value;
        if (!queryText.trim()) {
            alert("Please enter a classification question.");
            return;
        }
        callQueryApi(queryText, analyzeButtonTab2, resultsContainerTab2, errorMessageTab2, determinationTab2);
    });

    // --- Event listener for Define Acronym button ---
    defineAcronymButton.addEventListener("click", () => {
        const queryText = queryInput.value;
        if (!queryText.trim()) {
            alert("Please enter a term or acronym to define.");
            return;
        }
        callDefineApi(queryText, defineAcronymButton, resultsContainerTab2, errorMessageTab2, determinationTab2);
    });

    // --- Event listener for Translate button ---
    translateButton.addEventListener("click", () => {
        const queryText = queryInput.value;
        if (!queryText.trim()) {
            alert("Please enter text to translate.");
            return;
        }
        callTranslateApi(queryText, translateButton, resultsContainerTab2, errorMessageTab2, determinationTab2);
    });

    // --- Event listener for "Enter" key on Tab 2 input ---
    queryInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            // "Enter" should trigger the primary action, which is "Ask Question"
            analyzeButtonTab2.click();
        } 
    });

    // --- Feedback Button Listeners ---
    const feedbackLikeButton = document.getElementById('feedback-like-button');
    const feedbackDislikeButton = document.getElementById('feedback-dislike-button');
    
    feedbackLikeButton.addEventListener('click', () => sendFeedback('like'));
    feedbackDislikeButton.addEventListener('click', () => sendFeedback('dislike'));
}

// Call the initializer
initializeTab2();