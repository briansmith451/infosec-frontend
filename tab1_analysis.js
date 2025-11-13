// tab1_analysis.js
// Contains all logic for the Tab 1: Classification Analysis

// --- Global function to toggle individual element text ---
window.toggleElementText = function (index) {
    const result = window.currentAnalysisResults[index];
    if (!result) return;

    const elementDiv = document.querySelector(`.classified-element-text[data-index="${index}"]`);
    const textSpan = elementDiv.querySelector('.element-text-content');
    const expandIcon = elementDiv.querySelector('.expand-element-icon');

    if (expandIcon.textContent === '+') {
        textSpan.textContent = result.sentence;
        expandIcon.textContent = '−';
    } else {
        textSpan.textContent = result.sentence.substring(0, 150) + '...';
        expandIcon.textContent = '+';
    }
};

// --- Global function to toggle all classified elements ---
window.toggleAllClassifiedElements = function () {
    const expandAllLink = document.querySelector('.expand-all-link');
    const isExpanding = expandAllLink.textContent.includes('Expand');

    document.querySelectorAll('.classified-element-text').forEach(elementDiv => {
        const index = elementDiv.dataset.index;
        const result = window.currentAnalysisResults[index];
        if (!result) return;

        const textSpan = elementDiv.querySelector('.element-text-content');
        const expandIcon = elementDiv.querySelector('.expand-element-icon');

        if (expandIcon) {
            if (isExpanding) {
                textSpan.textContent = result.sentence;
                expandIcon.textContent = '−';
            } else {
                textSpan.textContent = result.sentence.substring(0, 150) + '...';
                expandIcon.textContent = '+';
            }
        }
    });

    expandAllLink.textContent = isExpanding ? '− Collapse All' : '+ Expand All';
};

// --- Global function to toggle sentence analysis visibility ---
window.toggleSentenceAnalysis = function () {
    const content = document.getElementById('sentence-analysis-content');
    const icon = document.getElementById('sentence-toggle-icon');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '−';
    } else {
        content.style.display = 'none';
        icon.textContent = '+';
    }
};

// --- Helper function to extract just the determination line ---
function extractDetermination(fullText) {
    const lines = fullText.split('\n');
    for (let line of lines) {
        if (line.includes('Not Classified') ||
            line.includes('Classified:') ||
            line.includes('Potentially Classified')) {
            return line.trim();
        }
    }
    return 'See full analysis';
}

// --- MODIFIED: Enhanced Results Display Function ---
function displayEnhancedResults(results, recommended_scgs) {
    // Build overall summary with new 6-level classification system
    let unclassifiedCount = 0;
    let cuiCount = 0;
    let secretCount = 0;
    let potentiallySecretCount = 0;
    let topSecretCount = 0;
    let topSecretSAPCount = 0;

    results.forEach(result => {
        const det = result.determination.toLowerCase();
        // Check for specific classification levels
        if (det.includes('top secret') && det.includes('sap')) {
            topSecretSAPCount++;
        } else if (det.includes('top secret')) {
            topSecretCount++;
        } else if (det.includes('secret') && !det.includes('top secret') && !det.includes('potentially') && !det.includes('not classified')) {
            secretCount++;
        } else if (det.includes('potentially') && (det.includes('secret') || det.includes('classified'))) {
            potentiallySecretCount++;
        } else if (det.includes('cui')) {
            cuiCount++;
        } else {
            unclassifiedCount++;
        }
    });

    const totalSentences = results.length;

    // FIXED: Determine overall classification (highest level present)
    let overallClass = 'unclassified';
    let overallText = 'UNCLASSIFIED';

    // Check from highest to lowest classification level
    if (topSecretSAPCount > 0) {
        overallClass = 'top-secret-sap';
        overallText = 'TOP SECRET SAP';
    } else if (topSecretCount > 0) {
        overallClass = 'top-secret';
        overallText = 'TOP SECRET';
    } else if (secretCount > 0) {
        // If there's actual SECRET content, show SECRET, not POTENTIALLY SECRET
        overallClass = 'classified';
        overallText = 'SECRET';
    } else if (potentiallySecretCount > 0) {
        // Only show POTENTIALLY SECRET if there's no definitive SECRET content
        overallClass = 'potentially-secret';
        overallText = 'POTENTIALLY SECRET';
    } else if (cuiCount > 0) {
        overallClass = 'cui';
        overallText = 'CUI';
    }

    let html = `
        <div class="summary-section">
            <div class="determination-box ${overallClass}" style="display: flex; align-items: center; justify-content: center; font-size: 18px; padding: 8px; margin-bottom: 20px; height: 36px;">
                <span>Overall Document Classification: ${overallText}</span>
            </div>
            
            <div style="display: flex; justify-content: space-around; margin-bottom: 20px;">
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #5cb85c;">${unclassifiedCount}</div>
                    <div style="font-size: 12px; color: #666;">UNCLASSIFIED</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #5a2d82;">${cuiCount}</div>
                    <div style="font-size: 12px; color: #666;">CUI</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #d9534f;">${secretCount}</div>
                    <div style="font-size: 12px; color: #666;">SECRET</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #ff8c00;">${potentiallySecretCount}</div>
                    <div style="font-size: 12px; color: #666;">POTENTIALLY SECRET</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #f0ad4e;">${topSecretCount}</div>
                    <div style="font-size: 12px; color: #666;">TOP SECRET</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #333;">${topSecretSAPCount}</div>
                    <div style="font-size: 12px; color: #666;">TOP SECRET SAP</div>
                </div>
            </div>
        </div>
    `;

    // Add classified items if any (EXCLUDE UNCLASSIFIED AND CUI)
    if (secretCount > 0 || potentiallySecretCount > 0 || topSecretCount > 0 || topSecretSAPCount > 0) {
        html += `
            <div class="classified-section">
                <h3 style="color: #d9534f; border-bottom: 2px solid #d9534f; padding-bottom: 5px; position: relative;">
                    ⚠️ Classified Elements Found
                    <span class="expand-all-link" onclick="toggleAllClassifiedElements()">+ Expand All</span>
                </h3>
        `;

        results.forEach((result, index) => {
            const det = result.determination.toLowerCase();
            // ONLY show items that are SECRET or higher (not unclassified, not CUI)
            if ((det.includes('secret') && !det.includes('not classified')) || (det.includes('potentially') && det.includes('classified'))) {
                // Skip CUI items
                if (det.includes('cui') && !det.includes('secret')) {
                    return;
                }

                let level = 'UNKNOWN';
                let levelClass = '';

                if (det.includes('top secret') && det.includes('sap')) {
                    level = 'TOP SECRET SAP';
                    levelClass = 'top-secret-sap';
                } else if (det.includes('top secret')) {
                    level = 'TOP SECRET';
                    levelClass = 'top-secret';
                } else if (det.includes('secret') && !det.includes('top secret') && !det.includes('potentially')) {
                    level = 'SECRET';
                    levelClass = 'is-classified';
                } else if (det.includes('potentially') && det.includes('secret')) {
                    level = 'POTENTIALLY SECRET';
                    levelClass = 'potentially-secret';
                } else if (det.includes('potentially classified')) {
                    level = 'POTENTIALLY CLASSIFIED';
                    levelClass = 'potential';
                }

                // Check if sentence is longer than ~150 characters for 2 lines
                const fullSentence = result.sentence;
                const needsExpansion = fullSentence.length > 150;
                const displayText = needsExpansion ? fullSentence.substring(0, 150) + '...' : fullSentence;

                html += `
                    <div class="classified-element-item ${levelClass}">
                        <div class="classified-element-header">
                            <strong>Sentence ${index + 1}:</strong>
                            <span style="color: ${levelClass === 'potentially-secret' ? '#ff8c00' : levelClass === 'top-secret' ? '#f0ad4e' : '#d9534f'}; font-weight: bold; margin-left: 10px;">[${level}]</span>
                            <span class="modal-link" onclick="showSentenceDetails(${index})" style="margin-left: auto;">
                                View Details →
                            </span>
                        </div>
                        <div class="classified-element-text" data-index="${index}">
                            <span class="element-text-content">${displayText}</span>
                            ${needsExpansion ? `<span class="expand-element-icon" onclick="toggleElementText(${index})">+</span>` : ''}
                        </div>
                    </div>
                `;
            }
        });

        html += `</div>`;
    }
    
    // --- ADDED: SCG Recommendation Section ---
    if (recommended_scgs && recommended_scgs.length > 0) {
        html += `
            <div class="recommendation-section">
                <h3 style="color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 5px;">
                    💡 SCG Recommendations
                </h3>
                <p style="font-size: 14px; color: #555;">This analysis detected keywords related to the following classification guides. You may want to consult them for additional guidance:</p>
                <ul>
        `;
        
        recommended_scgs.forEach(title => {
            html += `<li>${title}</li>`;
        });

        html += `
                </ul>
            </div>
        `;
    }
    // --- END: SCG Recommendation Section ---

    // Add collapsible sentence-by-sentence analysis
    html += `
        <div class="detailed-section">
            <h3 style="border-bottom: 2px solid #0056b3; padding-bottom: 5px; cursor: pointer; user-select: none;" onclick="toggleSentenceAnalysis()">
                📋 Sentence-by-Sentence Analysis
                <span id="sentence-toggle-icon" style="float: right; font-family: monospace;">+</span>
            </h3>
            <div id="sentence-analysis-content" style="display: none;">
    `;

    results.forEach((result, index) => {
        const det = result.determination.toLowerCase();
        let sentenceClass = 'not-classified';

        if (det.includes('top secret')) {
            sentenceClass = 'top-secret';
        } else if (det.includes('secret') && !det.includes('top secret') && !det.includes('potentially') && !det.includes('not classified')) {
            sentenceClass = 'classified';
        } else if (det.includes('potentially') && (det.includes('secret') || det.includes('classified'))) {
            sentenceClass = 'potentially-secret';
        } else if (det.includes('cui')) {
            sentenceClass = 'cui';
        }

        html += `
            <div class="sentence-analysis ${sentenceClass}">
                <div class="sentence-text">
                    <span class="sentence-number">${index + 1}</span>
                    ${result.sentence}
                </div>
                <div class="sentence-result">
                    <strong>Determination:</strong> ${extractDetermination(result.determination)}
                    <span class="modal-link" onclick="showSentenceDetails(${index})" style="margin-left: 10px;">
                        [View Full Analysis]
                    </span>
                </div>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    document.getElementById("analysis-output").innerHTML = html;
}

// --- Function to add personal library banner ---
function addPersonalLibraryBanner(ruleCount) {
    // Wait a moment for DOM to be ready
    setTimeout(() => {
        const existingBanner = document.querySelector('.personal-library-banner');
        if (existingBanner) return; // Don't add duplicate

        const banner = document.createElement('div');
        banner.className = 'personal-library-banner';
        banner.style.cssText = 'margin: 20px 0; padding: 12px 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white;';
        banner.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center;">
                    <span style="font-size: 20px; margin-right: 10px;">📚</span>
                    <span style="font-weight: 600;">Personal Library Enhanced</span>
                </div>
                <span style="font-size: 14px; opacity: 0.9;">
                    ${ruleCount} rules from your GIDE Classification Guidance applied
                </span>
            </div>
        `;

        const summarySection = document.querySelector('.summary-section');
        if (summarySection && summarySection.nextSibling) {
            summarySection.parentNode.insertBefore(banner, summarySection.nextSibling);
        }
    }, 100);
}

// --- Show/Hide Loading Screen Functions ---
function showLoadingScreen() {
    const placeholder = document.getElementById('results-placeholder');
    if (placeholder) {
        placeholder.style.display = 'none';
    }

    // Create or show loading screen
    let loadingScreen = document.getElementById('analysis-loading-screen');
    if (!loadingScreen) {
        loadingScreen = document.createElement('div');
        loadingScreen.id = 'analysis-loading-screen';
        loadingScreen.className = 'analysis-loading-screen';
        loadingScreen.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner-large"></div>
                <h3>Analyzing Document</h3>
                <p class="loading-message">
                    Processing time varies by document length:<br>
                    • Up to 1,000 words: 5-30 seconds<br>
                    • Over 1,000 words: 30-60 seconds<br>
                    • Several thousand words: May take over a minute
                </p>
                <div class="loading-progress-bar">
                    <div class="loading-progress-fill"></div>
                </div>
            </div>
        `;
        document.querySelector('.tab1-right').appendChild(loadingScreen);
    } else {
        loadingScreen.style.display = 'flex';
    }
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('analysis-loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
}

// --- ADDED: Feedback sender for Tab 1 ---
function sendFeedbackTab1(feedbackType) {
    const feedbackLikeButton = document.getElementById('feedback-like-button-tab1');
    const feedbackDislikeButton = document.getElementById('feedback-dislike-button-tab1');
    const feedbackConfirmation = document.getElementById('feedback-confirmation-tab1');

    // Disable buttons
    feedbackLikeButton.disabled = true;
    feedbackDislikeButton.disabled = true;

    // Show confirmation
    feedbackConfirmation.style.display = 'inline';

    // Get the input text (either from text area or file)
    let queryText = document.getElementById("text-input").value;
    if (!queryText) {
        const analyzeButton = document.getElementById("analyze-document-button");
        queryText = analyzeButton.dataset.fileContent || "File Content (not available)";
    }
    
    // Get a summary of the determination
    const determination = document.querySelector(".summary-section .determination-box").textContent;

    // Send data to backend
    fetch(`${window.API_BASE_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            feedback_type: feedbackType,
            query: `[Document Analysis] ${queryText.substring(0, 200)}...`, // Send snippet
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

// --- MODIFIED: Unified Analysis Function ---
async function startAnalysis(textToAnalyze, sourceType, buttonEl) {
    const spinner = buttonEl.querySelector(".spinner");
    const buttonText = buttonEl.querySelector("span:last-child");
    const originalButtonText = buttonText.textContent;

    // --- Get feedback elements ---
    const feedbackButtons = document.getElementById('feedback-buttons-tab1');
    const feedbackLike = document.getElementById('feedback-like-button-tab1');
    const feedbackDislike = document.getElementById('feedback-dislike-button-tab1');
    const feedbackConfirmation = document.getElementById('feedback-confirmation-tab1');
    
    // --- Reset feedback buttons ---
    feedbackButtons.style.display = 'none';
    feedbackConfirmation.style.display = 'none';
    feedbackLike.disabled = false;
    feedbackDislike.disabled = false;

    buttonEl.disabled = true;
    buttonText.textContent = "Analyzing...";
    spinner.style.display = "inline-block";

    // Show loading screen
    showLoadingScreen();

    // First, search personal library for relevant rules
    window.currentPersonalLibraryRules = [];
    if (window.personalLibraryUI && window.personalLibraryUI.isEnabled()) {
        try {
            console.log("Searching personal library for relevant rules...");

            // Extract search terms from text
            const searchTerms = new Set();

            // Common GIDE and classification terms to search for
            const gideTerms = ['GIDE', 'JADC2', 'sensor', 'shooter', 'AI', 'ML', 'machine learning',
                'OPLAN', 'targeting', 'engagement', 'network', 'architecture',
                'quantum', 'exercise', 'algorithm', 'timeline', 'pacific',
                'experiment', 'integration', 'capability', 'operational'];

            // Check which terms are present in the text
            gideTerms.forEach(term => {
                if (textToAnalyze.toLowerCase().includes(term.toLowerCase())) {
                    searchTerms.add(term);
                }
            });

            // Search library for each term
            const allRules = new Map();
            for (const term of searchTerms) {
                const rules = await window.personalLibraryManager.searchLibrary(term);
                rules.forEach(rule => {
                    // Use localId as unique key
                    if (!allRules.has(rule.localId)) {
                        allRules.set(rule.localId, {
                            rule_id: rule.localId,
                            topic: rule.topic,
                            classification: rule.classification,
                            clean_rule: rule.text,
                            source: 'personal_library',
                            organization: rule.organization || 'Personal Library',
                            document: rule.documentTitle || 'GIDE Classification Guidance',
                            relevance: 0
                        });
                    }
                });
            }

            window.currentPersonalLibraryRules = Array.from(allRules.values());
            console.log(`Found ${window.currentPersonalLibraryRules.length} unique personal library rules`);

        } catch (error) {
            console.error('Error searching personal library:', error);
        }
    }

    // Call the API for analysis
    fetch(`${window.API_BASE_URL}/analyze_document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            text: textToAnalyze,
            quality: window.analysisQuality
        }),
    })
    .then(response => {
        if (!response.ok) {
             return response.json().then(err => { throw new Error(err.error || "Server returned an error"); });
        }
        return response.json();
    })
    .then(response_data => { // MODIFIED: Handle new object
        
        const results = response_data.analysis_results;
        const recommended_scgs = response_data.recommended_scgs;
        
        // Enhance each sentence result with relevant personal library rules
        if (window.currentPersonalLibraryRules.length > 0) {
            results.forEach((result, index) => {
                const sentenceText = result.sentence.toLowerCase();

                // Find personal library rules relevant to this sentence
                const relevantRules = window.currentPersonalLibraryRules.filter(rule => {
                    // Check if rule keywords match the sentence
                    const ruleKeywords = (rule.clean_rule + ' ' + rule.topic).toLowerCase()
                        .split(/\s+/)
                        .filter(word => word.length > 4);

                    // Count matching keywords
                    const matches = ruleKeywords.filter(keyword => sentenceText.includes(keyword)).length;

                    // Return true if at least 2 keywords match or if specific terms match
                    return matches >= 2 ||
                        (sentenceText.includes('oplan') && rule.clean_rule.toLowerCase().includes('oplan')) ||
                        (sentenceText.includes('timeline') && rule.clean_rule.toLowerCase().includes('timeline')) ||
                        (sentenceText.includes('quantum') && rule.clean_rule.toLowerCase().includes('quantum')) ||
                        (sentenceText.includes('engagement') && rule.clean_rule.toLowerCase().includes('engagement'));
                });

                // Add personal library rules to this sentence's results
                if (relevantRules.length > 0) {
                    if (!result.retrieved_rules) {
                        result.retrieved_rules = [];
                    }

                    // Add personal rules (limit to top 3 most relevant)
                    relevantRules.slice(0, 3).forEach(rule => {
                        // Don't add duplicates
                        const isDuplicate = result.retrieved_rules.some(r =>
                            r.clean_rule === rule.clean_rule || r.rule_id === rule.rule_id
                        );

                        if (!isDuplicate) {
                            result.retrieved_rules.push(rule);
                        }
                    });

                    console.log(`Added ${relevantRules.length} personal library rules to sentence ${index + 1}`);
                }
            });
        }

        // Process all results
        window.currentAnalysisResults = results;

        // Hide loading screen and show results
        hideLoadingScreen();
        document.getElementById("results-container-tab1").style.display = 'block';
        document.querySelector('.tab1-left').classList.add('collapsed');
        document.getElementById('new-query-button').style.display = 'block';

        // Generate the enhanced HTML
        displayEnhancedResults(results, recommended_scgs); // MODIFIED: Pass recommendations
        
        // Show feedback buttons
        feedbackButtons.style.display = 'flex';

        // Add personal library indicator if rules were used
        if (window.currentPersonalLibraryRules.length > 0) {
            addPersonalLibraryBanner(window.currentPersonalLibraryRules.length);
        }

    })
    .catch(error => {
        console.error("Analysis error:", error);
        hideLoadingScreen();
        alert(`Analysis failed: ${error.message}`);
    })
    .finally(() => {
        buttonEl.disabled = false;
        buttonText.textContent = originalButtonText;
        spinner.style.display = "none";
    });
}

// --- MODIFIED: Updated handleFileUpload function ---
function handleFileUpload(file) {
    const uploadedFileName = document.getElementById("uploaded-file-name");
    const analyzeDocumentButton = document.getElementById("analyze-document-button");
    
    uploadedFileName.textContent = file.name;
    uploadedFileName.style.display = "block";
    let uploadedFileContent = null; // Reset content
    analyzeDocumentButton.style.display = "none";

    if (file.type === "text/plain" || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedFileContent = e.target.result;
            analyzeDocumentButton.style.display = "block";
            // Attach content to button
            analyzeDocumentButton.dataset.fileContent = uploadedFileContent;
        };
        reader.readAsText(file);

    } else if (file.name.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            mammoth.extractRawText({ arrayBuffer: e.target.result })
                .then((result) => {
                    uploadedFileContent = result.value;
                    analyzeDocumentButton.style.display = "block";
                    // Attach content to button
                    analyzeDocumentButton.dataset.fileContent = uploadedFileContent;
                })
                .catch((err) => {
                    alert("Error reading .docx file: " + err.message);
                    uploadedFileName.style.display = "none";
                    analyzeDocumentButton.style.display = "none";
                });
        };
        reader.readAsArrayBuffer(file);

    } else if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const loadingTask = pdfjsLib.getDocument({ data: e.target.result });
            loadingTask.promise.then(async (doc) => {
                let allText = '';
                for (let i = 1; i <= doc.numPages; i++) {
                    const page = await doc.getPage(i);
                    const textContent = await page.getTextContent();
                    allText += textContent.items.map(item => item.str).join(' ') + '\n';
                }
                uploadedFileContent = allText;
                analyzeDocumentButton.style.display = "block";
                // Attach content to button
                analyzeDocumentButton.dataset.fileContent = uploadedFileContent;
            }).catch((err) => {
                alert("Error reading .pdf file: " + err.message);
                uploadedFileName.style.display = "none";
                analyzeDocumentButton.style.display = "none";
            });
        };
        reader.readAsArrayBuffer(file);

    } else {
        // This alert now includes PDF
        alert("Unsupported file type. Please use .txt, .docx, or .pdf.");
        uploadedFileName.style.display = "none";
        analyzeDocumentButton.style.display = "none";
    }
}


// --- Initialize Tab 1 ---
// We wrap this in a function to be called from script.js
function initializeTab1() {
    // --- Collapsible Panel Elements ---
    const tab1Left = document.querySelector('.tab1-left');
    const inputOptionsToggle = document.getElementById('input-options-toggle');
    const newQueryButton = document.getElementById('new-query-button');
    
    // === API Endpoint 1 - Document Analysis (Tab 1) ===
    const textInput = document.getElementById("text-input");
    const analyzeButtonTab1 = document.getElementById("analyze-button-tab1");
    
    // --- File Upload Logic for Tab 1 ---
    const fileUploadArea = document.getElementById("file-upload-area");
    const fileInput = document.getElementById("file-input");
    const analyzeDocumentButton = document.getElementById("analyze-document-button");
    
    // --- ADDED: Feedback Elements ---
    const feedbackButtons = document.getElementById('feedback-buttons-tab1');
    const feedbackLikeButton = document.getElementById('feedback-like-button-tab1');
    const feedbackDislikeButton = document.getElementById('feedback-dislike-button-tab1');
    const feedbackConfirmation = document.getElementById('feedback-confirmation-tab1');
    
    // --- Collapsible Panel Logic ---
    if (inputOptionsToggle && tab1Left) {
        inputOptionsToggle.addEventListener('click', () => {
            tab1Left.classList.toggle('collapsed');
            // If we're expanding, hide the "New Query" button
            if (!tab1Left.classList.contains('collapsed')) {
                newQueryButton.style.display = 'none';
            }
        });
    }

    // --- "New Analysis" Button Logic ---
    if (newQueryButton && tab1Left) {
        newQueryButton.addEventListener('click', () => {
            tab1Left.classList.remove('collapsed');
            newQueryButton.style.display = 'none';

            // Reset the results panel
            document.getElementById("results-container-tab1").style.display = 'none';
            document.getElementById("results-placeholder").style.display = 'block';
            document.getElementById("analysis-output").innerHTML = ''; // Clear old results
            window.currentAnalysisResults = []; // Clear old data

            // Clear the text area
            document.getElementById("text-input").value = '';
            
            // Clear file upload
            document.getElementById("uploaded-file-name").textContent = '';
            document.getElementById("uploaded-file-name").style.display = 'none';
            document.getElementById("file-input").value = '';
            analyzeDocumentButton.style.display = 'none';
            
            // --- ADDED: Hide feedback buttons ---
            feedbackButtons.style.display = 'none';
            feedbackConfirmation.style.display = 'none';
            feedbackLikeButton.disabled = false;
            feedbackDislikeButton.disabled = false;
        });
    }
    
    // --- "Analyze Text" Button ---
    analyzeButtonTab1.addEventListener("click", () => {
        const textToAnalyze = textInput.value;
        if (!textToAnalyze.trim()) { alert("Please enter text to analyze."); return; }

        tab1Left.classList.add('collapsed'); // Collapse panel
        newQueryButton.style.display = 'none'; // Hide button

        const placeholder = document.getElementById('results-placeholder');
        if (placeholder) placeholder.style.display = 'none';

        startAnalysis(textToAnalyze, 'text', analyzeButtonTab1);
    });

    // Handle drag and drop
    fileUploadArea.addEventListener("click", () => fileInput.click());
    fileUploadArea.addEventListener("dragover", (e) => { e.preventDefault(); fileUploadArea.classList.add("dragover"); });
    fileUploadArea.addEventListener("dragleave", () => fileUploadArea.classList.remove("dragover"));
    fileUploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove("dragover");
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length) {
            handleFileUpload(e.target.files[0]);
        }
    });
    
    // --- "Analyze Document" Button ---
    analyzeDocumentButton.addEventListener("click", () => {
        const uploadedFileContent = analyzeDocumentButton.dataset.fileContent;
        if (!uploadedFileContent) {
            alert("No file content loaded, or file is still processing. Please wait a moment and try again.");
            return;
        } 

        tab1Left.classList.add('collapsed'); // Collapse panel
        newQueryButton.style.display = 'none'; // Hide button

        const placeholder = document.getElementById('results-placeholder');
        if (placeholder) placeholder.style.display = 'none';

        startAnalysis(uploadedFileContent, 'document', analyzeDocumentButton);
    });
    
    // --- ADDED: Feedback Listeners ---
    feedbackLikeButton.addEventListener('click', () => sendFeedbackTab1('like'));
    feedbackDislikeButton.addEventListener('click', () => sendFeedbackTab1('dislike'));
}

// Call the initializer
initializeTab1();