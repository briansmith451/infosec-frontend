// tab3_library.js
// Contains all logic for the Tab 3: Reference Library

// --- Global variable for this tab's combined results ---
window.currentCombinedLibraryResults = [];

// --- Show Full Rule in Modal (FIXED FORMATTING) ---
window.showFullRule = function (ruleId, source) {
    // Find the rule from the globally stored combined results
    const rule = window.currentCombinedLibraryResults.find(r => r.rule_id === ruleId && r.source === source);
    if (!rule) {
        alert("Could not find rule data.");
        return;
    }

    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const scgModal = document.getElementById('scg-modal');

    modalTitle.textContent = `Rule ${rule.rule_id} - Full Text`;

    // Build properly formatted modal content
    let modalContent = '<div class="modal-rule-detail">';

    modalContent += `<div class="modal-rule-field"><span class="modal-label">Rule ID:</span> ${rule.rule_id || 'N/A'}</div>`;
    modalContent += `<div class="modal-rule-field"><span class="modal-label">SCG Title:</span> ${rule.scg_title || 'N/A'}</div>`;
    modalContent += `<div class="modal-rule-field"><span class="modal-label">Topic:</span> ${rule.topic || 'N/A'}</div>`;
    modalContent += `<div class="modal-rule-field"><span class="modal-label">Classification:</span> ${rule.classification || 'N/A'}</div>`;
    
    // --- ADDED: Show source (Official or Personal) ---
    if (rule.source === 'personal') {
        modalContent += `<div class="modal-rule-field"><span class="modal-label">Source:</span> <span class="rule-source-badge personal" style="font-size: 14px;">Personal Library</span></div>`;
    } else {
        modalContent += `<div class="modal-rule-field"><span class="modal-label">Source:</span> <span class="rule-source-badge official" style="font-size: 14px;">Official Library</span></div>`;
    }

    modalContent += '<hr>';

    modalContent += '<strong>Clean Rule</strong>';
    modalContent += '<div class="modal-text-box">';
    modalContent += rule.clean_rule || 'No rule text available';
    modalContent += '</div>';

    // Only show "Full Rule Text" for official rules, as personal rules don't have it
    if (rule.source === 'official') {
        modalContent += '<hr>';
        modalContent += '<strong>Full Rule Text</strong>';
        modalContent += '<div class="modal-text-box">';
        modalContent += rule.rule_text || 'No additional text available';
        modalContent += '</div>';
    }

    modalContent += '</div>';

    modalBody.innerHTML = modalContent;
    scgModal.style.display = 'flex';
};

// --- Filter and Render Library Results Based on Checkboxes ---
function filterAndRenderLibrary() {
    const libraryContainer = document.getElementById("library-container");
    const classificationCheckboxes = document.querySelectorAll('#classification-checkboxes input[type="checkbox"]');
    // --- ADDED: Source filter ---
    const sourceCheckboxes = document.querySelectorAll('#source-checkboxes input[type="checkbox"]');

    if (!window.currentCombinedLibraryResults || window.currentCombinedLibraryResults.length === 0) {
        libraryContainer.innerHTML = '<p style="text-align: center; color: #999;">No rules found matching your criteria.</p>';
        return;
    }

    // Get checked classifications
    const checkedClassifications = Array.from(classificationCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value.toLowerCase());
        
    // --- ADDED: Get checked sources ---
    const checkedSources = Array.from(sourceCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value.toLowerCase());

    // --- MODIFIED: Filter by both source and classification ---
    const filteredRules = window.currentCombinedLibraryResults.filter(rule => {
        // 1. Filter by Source
        if (!checkedSources.includes(rule.source)) {
            return false;
        }
        
        // 2. Filter by Classification
        const ruleClass = (rule.classification || 'unclassified').toLowerCase();
        return checkedClassifications.some(checked => {
            // Handle exact matches and variations
            if (checked === 'unclassified' && ruleClass === 'unclassified') return true;
            if (checked === 'cui' && ruleClass.includes('cui')) return true;
            if (checked === 'secret' && ruleClass === 'secret') return true;
            if (checked === 'top secret' && (ruleClass === 'top secret' || ruleClass === 'ts')) return true;
            if (checked === 'varies' && ruleClass.includes('varies')) return true;
            if (checked === 'sap' && ruleClass.includes('sap')) return true;
            return false;
        });
    });

    if (filteredRules.length === 0) {
        libraryContainer.innerHTML = '<p style="text-align: center; color: #999;">No rules match the selected filters.</p>';
        return;
    }

    let html = `<p style="margin-bottom: 16px;">Found ${filteredRules.length} rule(s):</p>`;

    filteredRules.forEach(rule => {
        const classLabel = (rule.classification || 'UNCLASSIFIED').toLowerCase().replace(/\s+/g, '-');
        
        // --- ADDED: Custom rendering for personal vs. official ---
        if (rule.source === 'personal') {
            html += `
            <div class="library-item">
                <div class="library-header">
                    <div class="library-topic">${rule.topic || 'No Topic'}</div>
                    <span class="rule-source-badge personal">Personal Library</span>
                    <div class="library-classification ${classLabel}" style="margin-left: 10px;">${rule.classification || 'UNCLASSIFIED'}</div>
                </div>
                <div class="library-content">
                    <p class="library-rule">${rule.clean_rule || 'No rule text available'}</p>
                    <div class="library-metadata">
                        <span>Rule ID: ${rule.rule_id || 'N/A'}</span>
                        <span>Source Doc: ${rule.scg_title || 'N/A'}</span>
                        <span class="modal-link" onclick="showFullRule('${rule.rule_id}', 'personal')">View Details</span>
                    </div>
                </div>
            </div>
            `;
        } else {
            // Official Rule
            html += `
            <div class="library-item">
                <div class="library-header">
                    <div class="library-topic">${rule.topic || 'No Topic'}</div>
                    <span class="rule-source-badge official">Official</span>
                    <div class="library-classification ${classLabel}" style="margin-left: 10px;">${rule.classification || 'UNCLASSIFIED'}</div>
                </div>
                <div class="library-content">
                    <p class="library-rule">${rule.clean_rule || 'No rule text available'}</p>
                    <div class="library-metadata">
                        <span>Rule ID: ${rule.rule_id || 'N/A'}</span>
                        <span>SCG: ${rule.scg_title || 'N/A'}</span>
                        <span class="modal-link" onclick="showFullRule('${rule.rule_id}', 'official')">View Full Text</span>
                    </div>
                </div>
            </div>
            `;
        }
    });

    libraryContainer.innerHTML = html;
}

// --- MODIFIED: Unified Library Search Function ---
async function searchLibrary() {
    const librarySearchInput = document.getElementById("library-search-input");
    const scgTitleFilter = document.getElementById("scg-title-filter");
    const librarySearchButton = document.getElementById("library-search-button");
    const libraryContainer = document.getElementById("library-container");
    const libraryStatus = document.getElementById("library-status");
    const libraryErrorMsg = document.getElementById("error-message-tab3");
    
    // --- ADDED: Get source checkboxes ---
    const officialCheckbox = document.querySelector('#source-checkboxes input[value="Official"]');
    const personalCheckbox = document.querySelector('#source-checkboxes input[value="Personal"]');

    const scgTitle = scgTitleFilter.value;
    const searchTerm = librarySearchInput.value.trim();

    const spinner = librarySearchButton.querySelector(".spinner");

    libraryStatus.style.display = "block";
    libraryStatus.textContent = "Searching libraries...";
    libraryErrorMsg.style.display = "none";
    libraryContainer.innerHTML = "";
    librarySearchButton.disabled = true;
    spinner.style.display = "inline-block";

    let officialSearchPromise = Promise.resolve([]);
    let personalSearchPromise = Promise.resolve([]);

    // --- ADDED: Conditional search ---
    if (officialCheckbox.checked) {
        officialSearchPromise = fetch(`${window.API_BASE_URL}/search_library`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                scg_title: scgTitle,
                search_term: searchTerm
            })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.error || "Server returned an error"); });
            }
            return response.json();
        })
        .then(rules => {
            // Add 'source' identifier
            return rules.map(rule => ({ ...rule, source: 'official' }));
        })
        .catch(error => {
            console.error("Official library search error:", error);
            libraryErrorMsg.textContent = `Official search failed: ${error.message}`;
            libraryErrorMsg.style.display = "block";
            return []; // Return empty on error
        });
    }

    if (personalCheckbox.checked && window.personalLibraryManager) {
        personalSearchPromise = window.personalLibraryManager.searchLibrary(searchTerm)
            .then(rules => {
                // Add 'source' and map fields to match official rules
                return rules.map(rule => ({
                    rule_id: rule.localId,
                    scg_title: rule.documentTitle,
                    topic: rule.topic,
                    clean_rule: rule.text,
                    classification: rule.classification,
                    rule_text: rule.context, // Use context as "rule_text"
                    source: 'personal'
                }));
            })
            .catch(error => {
                console.error("Personal library search error:", error);
                libraryErrorMsg.textContent = `Personal search failed: ${error.message}`;
                libraryErrorMsg.style.display = "block";
                return []; // Return empty on error
            });
    }
    
    // --- ADDED: Run searches in parallel ---
    try {
        const [officialResults, personalResults] = await Promise.all([
            officialSearchPromise,
            personalSearchPromise
        ]);

        // Combine results
        window.currentCombinedLibraryResults = [...officialResults, ...personalResults];
        
        // Filter and render
        filterAndRenderLibrary();
        libraryStatus.style.display = "none";
        
    } catch (error) {
        console.error("Combined search error:", error);
        libraryStatus.textContent = "Search failed.";
    } finally {
        librarySearchButton.disabled = false;
        spinner.style.display = "none";
    }
}


// --- ADDED: Function to load SCG titles into filter ---
function loadScgTitles() {
    const scgTitleFilter = document.getElementById("scg-title-filter");
    
    fetch(`${window.API_BASE_URL}/get_scg_titles`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to load SCG titles");
            }
            return response.json();
        })
        .then(titles => {
            // Clear existing options (except "All SCGs")
            while (scgTitleFilter.options.length > 1) {
                scgTitleFilter.remove(1);
            }
            
            // Add new titles
            titles.forEach(title => {
                const option = document.createElement("option");
                option.value = title;
                option.textContent = title;
                scgTitleFilter.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Error loading SCG titles:", error);
            // Keep the default hardcoded option as a fallback
        });
}


// --- Initialize Tab 3 ---
function initializeTab3() {
    // === API Endpoint 3 - Library Search (Tab 3) ===
    const librarySearchButton = document.getElementById("library-search-button");
    const librarySearchInput = document.getElementById("library-search-input");
    const classificationCheckboxes = document.querySelectorAll('#classification-checkboxes input[type="checkbox"]');
    // --- ADDED: Source checkboxes ---
    const sourceCheckboxes = document.querySelectorAll('#source-checkboxes input[type="checkbox"]');

    // --- Event Listeners for Library Search ---
    librarySearchButton.addEventListener("click", searchLibrary);

    librarySearchInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") searchLibrary();
    });

    // --- MODIFIED: Add listeners to all filters ---
    classificationCheckboxes.forEach(cb => {
        cb.addEventListener("change", filterAndRenderLibrary);
    });
    
    sourceCheckboxes.forEach(cb => {
        cb.addEventListener("change", filterAndRenderLibrary);
    });
    
    // --- ADDED: Load the filter dropdown ---
    loadScgTitles();
}

// Call the initializer
initializeTab3(); 