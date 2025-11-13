// libraryIntegration.js
// Integration code to connect personal library with main analysis

// This code should be added to the main script.js after the library scripts are loaded

// Initialize library components
let personalLibraryManager = null;
let personalLibraryUI = null;

// Initialize library after DOM is loaded
function initializePersonalLibrary() {
    try {
        // Create library manager
        personalLibraryManager = new PersonalLibraryManager();
        
        // Create library UI
        personalLibraryUI = new LibraryUI(personalLibraryManager);
        
        // CRITICAL: Make them globally accessible
        window.personalLibraryManager = personalLibraryManager;
        window.personalLibraryUI = personalLibraryUI; 

        // Add click handler to upload library button
        const uploadLibraryButton = document.getElementById('upload-library-button');
        if (uploadLibraryButton) {
            // Remove the old alert handler
            uploadLibraryButton.replaceWith(uploadLibraryButton.cloneNode(true));
            const newButton = document.getElementById('upload-library-button');
            
            // Add library open handler
            newButton.addEventListener('click', () => {
                personalLibraryUI.openModal();
            });
            
            // Add indicator badge if library has documents
            updateLibraryIndicator();
        }
        
        console.log('Personal Library initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Personal Library:', error);
    }
}

// Update library indicator badge
async function updateLibraryIndicator() {
    if (!personalLibraryManager || !personalLibraryManager.isInitialized) return;
    
    try {
        const stats = await personalLibraryManager.getLibraryStats();
        const button = document.getElementById('upload-library-button');
        
        // Remove existing indicator
        const existingIndicator = button.querySelector('.library-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Add indicator if library has documents
        if (stats.documentCount > 0) {
            const indicator = document.createElement('span');
            indicator.className = 'library-indicator';
            indicator.textContent = stats.documentCount;
            button.style.position = 'relative';
            button.appendChild(indicator);
        }
    } catch (error) {
        console.error('Failed to update library indicator:', error);
    }
}

// Enhanced analysis function that includes personal library
async function analyzeWithLibrary(text, originalAnalyzeFunction) {
    // Get library rules if enabled
    let libraryRules = [];
    if (personalLibraryUI && personalLibraryUI.isEnabled()) {
        try {
            // Search library for relevant rules
            const searchTerms = extractKeyTermsFromText(text);
            for (const term of searchTerms) {
                const rules = await personalLibraryUI.getLibraryRulesForAnalysis(term);
                libraryRules = [...libraryRules, ...rules];
            }
            
            // De-duplicate rules
            const uniqueRules = new Map();
            libraryRules.forEach(rule => {
                uniqueRules.set(rule.rule_id, rule);
            });
            libraryRules = Array.from(uniqueRules.values());
            
            console.log(`Found ${libraryRules.length} relevant rules from personal library`);
        } catch (error) {
            console.error('Failed to get library rules:', error);
        }
    }
    
    // Call original analysis function
    const results = await originalAnalyzeFunction(text);
    
    // Enhance results with library rules
    if (libraryRules.length > 0) {
        results.libraryRules = libraryRules;
        results.hasLibraryRules = true;
    }
    
    return results;
}

// Extract key terms from text for library search
function extractKeyTermsFromText(text) {
    // Extract potential classification-related terms
    const terms = new Set();
    
    // Common classification keywords
    const keywords = [
        'classified', 'secret', 'confidential', 'cui', 'restricted',
        'sensitive', 'proprietary', 'export', 'itar', 'data',
        'network', 'system', 'information', 'document', 'release'
    ];
    
    // Add keywords found in text
    keywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword)) {
            terms.add(keyword);
        }
    });
    
    // Extract acronyms (consecutive uppercase letters)
    const acronyms = text.match(/\b[A-Z]{2,}\b/g);
    if (acronyms) {
        acronyms.forEach(acronym => terms.add(acronym));
    }
    
    // Extract technical terms (words with numbers or special patterns)
    const technicalTerms = text.match(/\b[A-Z][a-zA-Z]*\d+[a-zA-Z]*/g);
    if (technicalTerms) {
        technicalTerms.slice(0, 5).forEach(term => terms.add(term));
    }
    
    return Array.from(terms).slice(0, 10); // Limit to 10 terms
}

// Modified display function to show library rules
function displayLibraryRulesInResults(libraryRules) {
    if (!libraryRules || libraryRules.length === 0) return '';
    
    return `
        <div class="library-rules-section" style="margin-top: 20px; padding: 16px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 8px;">
            <h4 style="margin-top: 0; color: #1a237e;">
                📚 Personal Library Rules Applied (${libraryRules.length})
            </h4>
            <div style="background: white; padding: 12px; border-radius: 6px; margin-top: 12px;">
                ${libraryRules.map(rule => `
                    <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #eee;">
                        <div style="display: flex; align-items: center; margin-bottom: 4px;">
                            <strong style="color: #333;">${rule.topic}</strong>
                            <span class="rule-source-badge personal">Personal Library</span>
                        </div>
                        <div style="font-size: 14px; color: #666; margin-bottom: 4px;">
                            ${rule.clean_rule}
                        </div>
                        <div style="font-size: 12px; color: #999;">
                            ${rule.organization} • ${rule.document} • ${rule.classification}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Export functions for main script integration
window.initializePersonalLibrary = initializePersonalLibrary;
window.analyzeWithLibrary = analyzeWithLibrary;
window.displayLibraryRulesInResults = displayLibraryRulesInResults;
window.updateLibraryIndicator = updateLibraryIndicator;