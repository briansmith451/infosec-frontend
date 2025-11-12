// Global variable to hold server results for client-side filtering
let currentLibraryResults = [];
// Global variable to hold analysis results for modal
let currentAnalysisResults = [];
// Global setting for analysis quality
let analysisQuality = 'accurate'; // 'accurate' (Opus) or 'fast' (Haiku)

document.addEventListener("DOMContentLoaded", () => {
    
    // --- Tab Switching Logic ---
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    // --- Collapsible Panel Elements ---
    const tab1Left = document.querySelector('.tab1-left');
    const inputOptionsToggle = document.getElementById('input-options-toggle');
    const newQueryButton = document.getElementById('new-query-button');
    
    // --- SCG Modal Elements ---
    const scgModal = document.getElementById('scg-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const scgModalCloseButton = document.getElementById('scg-modal-close-button');

    // --- Settings Modal Elements ---
    const settingsModal = document.getElementById('settings-modal');
    const settingsOpenButton = document.getElementById('settings-open-button');
    const settingsModalCloseButton = document.getElementById('settings-modal-close-button');
    
    // --- Header Icon Elements ---
    const uploadLibraryButton = document.getElementById('upload-library-button');

    // --- Quality Selector Elements ---
    const qualitySelector = document.getElementById('quality-selector');
    const qualityIndicatorText = document.getElementById('quality-indicator-text');
    const qualityPopover = document.getElementById('quality-popover');
    const qualityOptions = document.querySelectorAll('.quality-option');


    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            const tabId = button.dataset.tab;
            tabButtons.forEach(btn => btn.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));
            button.classList.add("active");
            document.getElementById(tabId).classList.add("active");
        });
    });

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
            currentAnalysisResults = []; // Clear old data
        });
    }
    
    // --- API Call Function for Tab 2 (Direct Policy Query) ---
    function callQueryApi(queryText, buttonEl, resultsEl, errorEl, answerEl) {
        const spinner = buttonEl.querySelector(".spinner");
        const buttonText = buttonEl.querySelector("span:last-child");
        const originalButtonText = buttonText.textContent;

        buttonEl.disabled = true;
        buttonText.textContent = "Searching...";
        spinner.style.display = "inline-block";
        resultsEl.style.display = "none";
        errorEl.style.display = "none";

        // === MODIFIED URL ===
        fetch("https://infosec-backend.onrender.com/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // --- MODIFIED: Pass the analysisQuality setting ---
            body: JSON.stringify({ 
                text: queryText,
                quality: analysisQuality 
            }),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.error || "Server returned an error"); });
            }
            return response.json();
        })
        .then(data => {
            buttonEl.disabled = false;
            buttonText.textContent = originalButtonText;
            spinner.style.display = "none";
            resultsEl.style.display = "block";

            const responseText = data.determination;
            answerEl.textContent = responseText;
            answerEl.className = "determination-box unclassified";
            
            // Extract and display classification badge
            let classificationLevel = "";
            let badgeClass = "";
            if (/classified as CUI/i.test(responseText)) {
                classificationLevel = "CUI";
                badgeClass = "cui";
            } else if (/classified as TOP SECRET/i.test(responseText)) {
                classificationLevel = "TOP SECRET";
                badgeClass = "top-secret";
            } else if (/classified as SECRET/i.test(responseText)) {
                classificationLevel = "SECRET";
                badgeClass = "secret";
            } else if (/classified as SAP/i.test(responseText)) {
                classificationLevel = "SAP";
                badgeClass = "sap";
            } else if (/not classified|unclassified/i.test(responseText)) {
                classificationLevel = "UNCLASSIFIED";
                badgeClass = "unclassified";
            }
            
            if (classificationLevel) {
                const answerHeading = resultsEl.querySelector("h2");
                if (answerHeading) {
                    const copyButton = answerHeading.querySelector(".copy-button");
                    answerHeading.innerHTML = '';
                    answerHeading.appendChild(document.createTextNode("Answer: "));
                    const badge = document.createElement("span");
                    badge.className = `classification-badge ${badgeClass}`;
                    badge.textContent = classificationLevel;
                    answerHeading.appendChild(badge);
                    answerHeading.appendChild(document.createTextNode(" "));
                    if (copyButton) answerHeading.appendChild(copyButton);
                }
            }
        })
        .catch(error => {
            console.error("Fetch Error:", error);
            buttonEl.disabled = false;
            buttonText.textContent = originalButtonText;
            spinner.style.display = "none";
            resultsEl.style.display = "block";
            errorEl.style.display = "block";
            errorEl.textContent = `Error: ${error.message}. Is the 'api_server.py' script running?`;
        });
    }

    // --- Copy Button Logic ---
    document.body.addEventListener('click', function(event) {
        if (event.target.classList.contains('copy-button')) {
            const targetId = event.target.dataset.target;
            const textElement = document.getElementById(targetId);
            if (textElement) {
                navigator.clipboard.writeText(textElement.textContent)
                    .then(() => {
                        event.target.textContent = "Copied!";
                        setTimeout(() => { event.target.textContent = "Copy"; }, 2000);
                    })
                    .catch(err => {
                        console.error('Failed to copy: ', err);
                        event.target.textContent = "Failed!";
                    });
            }
        }
    });

    // --- Event Listeners for Tab 1 ---
    const textInput = document.getElementById("text-input");
    const analyzeButtonTab1 = document.getElementById("analyze-button-tab1");
    const resultsContainerTab1 = document.getElementById("results-container-tab1");
    const analysisOutput = document.getElementById("analysis-output");

    // --- Refactored "Analyze Text" Button ---
    analyzeButtonTab1.addEventListener("click", () => {
        const textToAnalyze = textInput.value;
        if (!textToAnalyze.trim()) { alert("Please enter text to analyze."); return; }
        
        tab1Left.classList.add('collapsed'); // Collapse panel
        newQueryButton.style.display = 'none'; // Hide button
        
        const placeholder = document.getElementById('results-placeholder');
        if (placeholder) placeholder.style.display = 'none';

        startAnalysis(textToAnalyze, 'text', analyzeButtonTab1);
    });
    
    // --- File Upload Logic for Tab 1 ---
    const fileUploadArea = document.getElementById("file-upload-area");
    const fileInput = document.getElementById("file-input");
    const uploadedFileName = document.getElementById("uploaded-file-name");
    const analyzeDocumentButton = document.getElementById("analyze-document-button");
    let uploadedFileContent = null;
    
    fileUploadArea.addEventListener("click", () => fileInput.click());
    
    fileUploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        fileUploadArea.classList.add("dragover");
    });
    
    fileUploadArea.addEventListener("dragleave", () => {
        fileUploadArea.classList.remove("dragover");
    });
    
    fileUploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove("dragover");
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    });
    
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) handleFileUpload(file);
    });
    
    // --- MODIFIED: handleFileUpload to support .docx ---
    function handleFileUpload(file) {
        uploadedFileName.textContent = `📎 ${file.name}`;
        uploadedFileName.style.display = "inline-block";
        analyzeDocumentButton.style.display = "block";
        uploadedFileContent = null; // Reset content
        
        const reader = new FileReader();
        
        if (file.type === "text/plain" || file.name.endsWith(".txt")) {
            reader.onload = (e) => {
                uploadedFileContent = e.target.result;
                console.log(`Extracted ${uploadedFileContent.length} characters from .txt file`);
            };
            reader.readAsText(file);

        } else if (file.name.endsWith(".docx")) {
            reader.onload = (e) => {
                const arrayBuffer = e.target.result;
                // Use mammoth.js to extract text
                mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                    .then(result => {
                        uploadedFileContent = result.value;
                        console.log(`Extracted ${uploadedFileContent.length} characters from .docx file`);
                    })
                    .catch(err => {
                        console.error("Error reading docx:", err);
                        alert("Error reading .docx file: " + err.message);
                        uploadedFileName.style.display = "none";
                        analyzeDocumentButton.style.display = "none";
                    });
            };
            reader.readAsArrayBuffer(file);
            
        } else {
            // This is the new alert for unsupported files
            alert("Unsupported file type. Please use .txt or .docx. (PDF support coming soon!)");
            uploadedFileName.style.display = "none";
            analyzeDocumentButton.style.display = "none";
        }
    }
    
    // --- "Analyze Document" Button ---
    analyzeDocumentButton.addEventListener("click", () => {
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
    
    // --- MODIFIED: New Parallel Analysis Function ---
    function startAnalysis(textToAnalyze, analysisType, buttonEl) {
        
        // --- Show simple loading state (no progress bar) ---
        resultsContainerTab1.style.display = "block";
        analysisOutput.innerHTML = `
            <div class="loading-placeholder">
                <div class="progress-text">Analyzing document...<br>This may take a moment.</div>
            </div>`;
        
        const spinner = buttonEl.querySelector(".spinner");
        const buttonText = buttonEl.querySelector("span:last-child");
        buttonEl.disabled = true;
        spinner.style.display = "inline-block";
        
        // --- NEW: Single fetch call to the new endpoint ---
        // === MODIFIED URL ===
        fetch("https://infosec-backend.onrender.com/analyze_document", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                text: textToAnalyze,
                quality: analysisQuality 
            }),
        })
        .then(response => {
            if (!response.ok) {
                 return response.json().then(err => { throw new Error(err.error || "Server returned an error"); });
            }
            return response.json();
        })
        .then(results => {
            // --- NEW: We get all results at once ---
            
            // 1. Process all results
            currentAnalysisResults = results.map(data => {
                const fullResponseText = data.determination || "No determination provided";
                let determinationLevel = "Not Classified";
                let rationale = fullResponseText;

                if (fullResponseText.includes("Rationale:")) {
                    const parts = fullResponseText.split("Rationale:");
                    rationale = parts[1].trim();
                    const detLower = parts[0].toLowerCase();
                    if (detLower.includes("classified") && !detLower.includes("not classified")) {
                        determinationLevel = "Classified";
                    }
                    if (detLower.includes("potentially")) {
                        determinationLevel = "Potentially Classified";
                    }
                } else {
                    const detLower = fullResponseText.toLowerCase();
                    if (detLower.includes("classified") && !detLower.includes("not classified")) {
                        determinationLevel = "Classified";
                    }
                    if (detLower.includes("potentially")) {
                        determinationLevel = "Potentially Classified";
                    }
                }

                const sentenceClassification = getHighestClassification(data.retrieved_rules);

                return {
                    sentence: data.sentence,
                    determinationLevel: determinationLevel,
                    sentenceClassification: sentenceClassification,
                    rationale: rationale,
                    rules: data.retrieved_rules || []
                };
            });

            // 2. Display them
            displayDocumentResults(analysisType);
            
            // 3. Reset button
            buttonEl.disabled = false;
            spinner.style.display = "none";
            newQueryButton.style.display = 'block';
        })
        .catch(error => {
            console.error("Error during parallel analysis:", error);
            analysisOutput.innerHTML = `<div class="determination-box classified">Error: ${error.message}</div>`;
            buttonEl.disabled = false;
            spinner.style.display = "none";
            newQueryButton.style.display = 'block';
        });
    }

    // --- Helper function to get classification from rules ---
    function getHighestClassification(rules) {
        const levels = { "SECRET": 3, "CUI": 2, "VARIES": 1, "UNCLASSIFIED": 0 };
        let highestLevelNum = 0;
        let highestLevelStr = "UNCLASSIFIED";

        for (const rule of rules) {
            let ruleClass = (rule.classification || "UNCLASSIFIED").toUpperCase();
            if (ruleClass.includes("CUI")) ruleClass = "CUI";
            const levelNum = levels[ruleClass] || 0;
            if (levelNum > highestLevelNum) {
                highestLevelNum = levelNum;
                highestLevelStr = ruleClass;
            }
        }
        return highestLevelStr;
    }
    
    // --- MODIFIED: This function is now only for displaying ---
    function displayDocumentResults(analysisType) {
        
        let classifiedElements = [];
        let allScgs = new Set();
        
        // --- Classification tracking ---
        let highestSecretLevelNum = 0;
        let highestSecretLevelStr = "";
        const secretLevels = { "SECRET": 3 };
        let hasPotential = false;
        let hasCUI = false;

        // --- This loop now *only* populates the classified list ---
        currentAnalysisResults.forEach(res => { // <-- Use global variable
            // Add to classified list ONLY if AI flagged it
            if (res.determinationLevel === "Classified" || res.determinationLevel === "Potentially Classified") {
                classifiedElements.push(res);
            }
        });

        // --- This loop determines the banner ONLY from the flagged elements ---
        classifiedElements.forEach(el => {
            el.rules.forEach(rule => allScgs.add(rule.scg_title));
            const sentenceClass = el.sentenceClassification.toUpperCase();
            
            if (sentenceClass.includes("CUI")) hasCUI = true;
            
            const levelNum = secretLevels[sentenceClass] || 0;
            if (levelNum > highestSecretLevelNum) {
                highestSecretLevelNum = levelNum;
                highestSecretLevelStr = sentenceClass;
            }
            if (el.determinationLevel === "Potentially Classified") hasPotential = true;
        });


        // --- 1. Build the main determination banner ---
        let html = '';
        if (highestSecretLevelNum > 0) {
            html += `<div class="determination-box classified">CLASSIFIED [${highestSecretLevelStr}]</div>`;
        } else if (hasPotential) {
            html += `<div class="determination-box potential">POTENTIALLY CLASSIFIED</div>`;
        } else if (hasCUI) {
            html += `<div class="determination-box cui">CUI</div>`;
        } else {
            // This now correctly triggers if classifiedElements is empty
            html += `<div class="determination-box unclassified">UNCLASSIFIED</div>`;
        }

        const sourceName = (analysisType === 'document') ? 'document' : 'text';
        // Get *all* SCGs sourced, even for unclassified
        currentAnalysisResults.forEach(res => {
             res.rules.forEach(rule => allScgs.add(rule.scg_title))
        });
        const scgList = [...allScgs].length > 0 ? [...allScgs].join(', ') : 'None';

        // --- 2. Build the summary section ---
        html += `<div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 20px; line-height: 1.8;">`;
        html += `<strong>Summary:</strong> This ${sourceName} contains <strong>${classifiedElements.length}</strong> classified or potentially classified elements.<br>`;
        html += `<strong>SCGs Sourced:</strong> ${scgList}`;
        html += `</div>`;

        // --- 3. Build the Classified Elements section (or Rationale) ---
        if (classifiedElements.length > 0) {
            html += `<h3>Classified Elements</h3>`;
            classifiedElements.forEach((el, index) => {
                
                const itemClass = el.determinationLevel === "Classified" ? "is-classified" : "";
                
                // --- Build new SCG/Sections lines with links ---
                const scgTitles = [...new Set(el.rules.map(r => r.scg_title || "Unknown SCG"))];
                const scgTitlesHTML = scgTitles.map(title => `<a href="#" class="modal-link" data-scg-title="${title}">${title}</a>`).join(', ');
                
                const scgSectionsHTML = el.rules.length > 0 ? el.rules.map(r => 
                    `<a href="#" class="modal-link" data-rule-id="${r.rule_id}">${r.rule_id}</a> (${r.classification})`
                ).join(', ') : 'N/A';
                
                html += `
                    <div class="classified-element-item ${itemClass}">
                        <strong>#${index + 1}:</strong> ${el.sentence}<br>
                        <strong style="margin-top: 5px; display: inline-block;">SCG Cited:</strong> ${scgTitlesHTML}<br>
                        <strong>Sections Noted:</strong> ${scgSectionsHTML}<br>
                        <div class="rationale-container">
                            <div class="rationale-text">
                                <strong>Rationale:</strong> ${el.rationale}
                            </div>
                            <span class="expand-rationale">Show More</span>
                        </div>
                    </div>
                `;
            });
        } else if (currentAnalysisResults.length > 0) {
            // Add Rationale section if no classified elements
            html += `<h3>Rationale</h3>`;
            // Show rationale from the first sentence
            html += `<div class="rationale-text" style="-webkit-line-clamp: initial;"><strong>Rationale:</strong> ${currentAnalysisResults[0].rationale}</div>`;
        }

        // Inject the final HTML
        analysisOutput.innerHTML = html;
    }

    // --- Event listener for expanding rationale AND modal clicks ---
    analysisOutput.addEventListener('click', function(event) {
        
        // --- Handle Rationale Expand/Collapse ---
        if (event.target.classList.contains('expand-rationale')) {
            event.preventDefault(); // Stop <a> tag jump
            const container = event.target.parentElement;
            const rationaleText = container.querySelector('.rationale-text');
            const icon = event.target;
            
            rationaleText.classList.toggle('expanded');
            icon.classList.toggle('expanded');
            
            if (icon.classList.contains('expanded')) {
                icon.textContent = 'Show Less';
            } else {
                icon.textContent = 'Show More';
            }
        }
        
        // --- Handle Modal Clicks ---
        if (event.target.classList.contains('modal-link')) {
            event.preventDefault(); // Stop <a> tag jump
            const ruleId = event.target.dataset.ruleId;
            const scgTitle = event.target.dataset.scgTitle;
            
            if (ruleId) {
                openRuleModal(ruleId);
            } else if (scgTitle) {
                openScgModal(scgTitle);
            }
        }
    });

    // --- SCG Modal Control Functions ---
    function openRuleModal(ruleId) {
        let foundRule = null;
        // Search for the rule in our saved results
        for (const res of currentAnalysisResults) {
            foundRule = res.rules.find(r => r.rule_id === ruleId);
            if (foundRule) break;
        }
        
        if (foundRule) {
            modalTitle.textContent = `Rule Text: ${foundRule.rule_id} (${foundRule.scg_title})`;
            modalBody.textContent = foundRule.rule_text || "No 'rule_text' provided in source file.";
            scgModal.style.display = 'flex';
        } else {
            alert(`Error: Could not find rule ${ruleId}`);
        }
    }
    
    // --- MODIFIED: Fetches all rules from server ---
    function openScgModal(scgTitle) {
        modalTitle.textContent = `Full SCG: ${scgTitle}`;
        modalBody.innerHTML = '<div class="loading-placeholder">Loading full SCG...</div>';
        modalBody.style.whiteSpace = 'normal';
        scgModal.style.display = 'flex';
        
        // Fetch ALL rules for this SCG from the server
        // === MODIFIED URL ===
        fetch("https://infosec-backend.onrender.com/search_library", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                scg_title: scgTitle,
                search_term: "" // Empty search term gets all
            }),
        })
        .then(response => {
            if (!response.ok) throw new Error('Server error fetching SCG');
            return response.json();
        })
        .then(rules => {
            if (rules.length === 0) {
                modalBody.textContent = `Error: No rules found for ${scgTitle}.`;
                return;
            }

            // De-duplicate just in case
            const uniqueRules = new Map();
            rules.forEach(r => {
                if (!uniqueRules.has(r.rule_id)) {
                    uniqueRules.set(r.rule_id, r);
                }
            });

            let modalHtml = '';
            uniqueRules.forEach(rule => {
                // MODIFIED: Reduced newlines for less whitespace
                modalHtml += `<strong>Rule: ${rule.rule_id} (${rule.classification})</strong>\n`;
                modalHtml += (rule.rule_text || "No 'rule_text' provided.") + '\n<hr>\n';
            });
            
            modalBody.innerHTML = modalHtml.replace(/\n/g, '<br>'); // Use innerHTML to render <hr>
        })
        .catch(error => {
            console.error("Error fetching full SCG:", error);
            modalBody.textContent = `Error fetching SCG: ${error.message}`;
        });
    }
    
    function closeScgModal() {
        scgModal.style.display = 'none';
        modalTitle.textContent = '';
        modalBody.innerHTML = '';
        modalBody.style.whiteSpace = 'pre-wrap'; // Reset style
    }
    
    // Add close listeners for the SCG modal
    scgModalCloseButton.addEventListener('click', closeScgModal);
    scgModal.addEventListener('click', (event) => {
        if (event.target === scgModal) {
            closeScgModal();
        }
    });
    
    // --- Settings Modal Control Functions ---
    function openSettingsModal() {
        settingsModal.style.display = 'flex';
    }
    
    function closeSettingsModal() {
        settingsModal.style.display = 'none';
    }
    
    // Add listeners for the Settings modal
    settingsOpenButton.addEventListener('click', openSettingsModal);
    settingsModalCloseButton.addEventListener('click', closeSettingsModal);
    settingsModal.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            closeSettingsModal();
        }
    });
    
    // --- MODIFIED: Quality Popover Listeners ---
    qualitySelector.addEventListener('click', () => {
        // Position and toggle popover
        const rect = qualitySelector.getBoundingClientRect();
        qualityPopover.style.top = (rect.bottom + 8) + 'px'; // 8px spacing
        qualityPopover.style.right = (window.innerWidth - rect.right) + 'px';
        qualityPopover.style.display = qualityPopover.style.display === 'block' ? 'none' : 'block';
    });
    
    qualityOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Get value
            analysisQuality = option.dataset.value;
            
            // Update header text
            qualityIndicatorText.textContent = analysisQuality === 'fast' ? 'Fast' : 'Accurate';
            
            // Update checkmarks
            qualityOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            
            // Close popover
            qualityPopover.style.display = 'none';
            
            console.log("Analysis quality set to:", analysisQuality);
        });
    });
    
    // --- Click-outside-to-close listener for popover ---
    document.addEventListener('click', (event) => {
        if (qualityPopover.style.display === 'block' && !qualityPopover.contains(event.target) && !qualitySelector.contains(event.target)) {
            qualityPopover.style.display = 'none';
        }
    });

    // --- Listener for the Upload Library Button ---
    uploadLibraryButton.addEventListener('click', () => {
        alert("This will open the 'Upload to Personal Library' modal.");
        // We can build this modal next.
    });


    // --- Event Listener for Tab 2 ---
    const queryInput = document.getElementById("query-input");
    const analyzeButtonTab2 = document.getElementById("analyze-button-tab2");
    const resultsContainerTab2 = document.getElementById("results-container-tab2");
    const errorMessageTab2 = document.getElementById("error-message-tab2");
    const determinationElTab2 = document.getElementById("determination-tab2");

    analyzeButtonTab2.addEventListener("click", () => {
        const textToAnalyze = queryInput.value;
        if (!textToAnalyze.trim()) { alert("Please enter a question."); return; }
        callQueryApi(textToAnalyze, analyzeButtonTab2, resultsContainerTab2, errorMessageTab2, determinationElTab2);
    });
    
    // --- Logic for Tab 3: Reference Library ---
    const libraryContainer = document.getElementById("library-container");
    const libraryStatus = document.getElementById("library-status");
    const libraryErrorMsg = document.getElementById("error-message-tab3");
    const librarySearchButton = document.getElementById("library-search-button");
    const scgTitleFilter = document.getElementById("scg-title-filter");
    const librarySearchInput = document.getElementById("library-search-input");
    const classificationCheckboxes = document.querySelectorAll("#classification-checkboxes input[type='checkbox']");
    
    function searchLibrary() {
        const scgTitle = scgTitleFilter.value;
        const searchTerm = librarySearchInput.value;
        
        const spinner = librarySearchButton.querySelector(".spinner");
        const buttonText = librarySearchButton.querySelector("span:last-child");

        libraryStatus.textContent = "Searching...";
        libraryStatus.style.display = "block";
        libraryErrorMsg.style.display = "none";
        libraryContainer.innerHTML = "";
        librarySearchButton.disabled = true;
        spinner.style.display = "inline-block";

        // === MODIFIED URL ===
        fetch("https://infosec-backend.onrender.com/search_library", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                scg_title: scgTitle,
                search_term: searchTerm
            }),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.error || "Server returned an error"); });
            }
            return response.json();
        })
        .then(rules => {
            librarySearchButton.disabled = false;
            spinner.style.display = "none";
            currentLibraryResults = rules;
            filterAndRenderLibrary();
        })
        .catch(error => {
            console.error("Library Search Error:", error);
            librarySearchButton.disabled = false;
            spinner.style.display = "none";
            libraryStatus.style.display = "none";
            libraryErrorMsg.style.display = "block";
            libraryErrorMsg.textContent = `Error: ${error.message}. Is the 'api_server.py' script running?`;
        });
    }
    
    function filterAndRenderLibrary() {
        const checkedClassifications = new Set();
        classificationCheckboxes.forEach(cb => {
            if (cb.checked) {
                checkedClassifications.add(cb.value.toLowerCase());
            }
        });
        
        const filteredRules = currentLibraryResults.filter(rule => {
            let classification = (rule.classification || "N/A").toLowerCase();
            if (classification.includes("cui")) classification = "cui";
            if (classification.includes("secret")) classification = "secret";
            if (checkedClassifications.has("sap") && (rule.clean_rule || "").toLowerCase().includes("sap")) return true;
            if (checkedClassifications.has("varies") && classification.includes("varies")) return true;
            return checkedClassifications.has(classification);
        });
        
        libraryStatus.textContent = `Displaying ${filteredRules.length} of ${currentLibraryResults.length} rules.`;
        renderLibrary(filteredRules);
    }
    
    function renderLibrary(rules) {
        libraryContainer.innerHTML = "";
        if (rules.length === 0) return;
        
        rules.forEach(rule => {
            const item = document.createElement("div");
            item.className = "library-item";
            
            let classification = (rule.classification || "N/A").toLowerCase();
            if (classification.includes("cui")) classification = "cui";
            if (classification.includes("secret")) classification = "secret";
            
            const topic = rule.topic || "No Topic";
            const ruleText = rule.rule_text || "No rule text provided.";
            const scgTitle = rule.scg_title || "Unknown SCG";
            
            let highlightedText = ruleText;
            const searchWords = librarySearchInput.value.trim().split(' ');
            if (searchWords[0] !== '') {
                searchWords.forEach(word => {
                    if (word.length < 2) return;
                    const regex = new RegExp(word, 'gi');
                    highlightedText = highlightedText.replace(regex, (match) => `<mark>${match}</mark>`);
                });
            }

            item.innerHTML = `
<div class="library-header">
    <h3 class="library-topic">${topic} (ID: ${rule.rule_id})</h3>
    <span class="library-classification ${classification}">${classification.toUpperCase()}</span>
</div>
<div class="library-body">
    <span class="library-rule-line"><strong>SCG:</strong> ${scgTitle}</span>
    <span class="library-rule-line"><strong>Rule:</strong> ${highlightedText}</span>
</div>
`;
            libraryContainer.appendChild(item);
        });
    }
    
    librarySearchButton.addEventListener("click", searchLibrary);
    
    librarySearchInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") searchLibrary();
    });
    
    classificationCheckboxes.forEach(cb => {
        cb.addEventListener("change", filterAndRenderLibrary);
    });

});