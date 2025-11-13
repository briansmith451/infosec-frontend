// script.js  
// ========== CONFIGURATION ==========
// Auto-detect based on where the page is loaded from
const API_BASE_URL = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' || 
                     window.location.protocol === 'file:' 
    ? "http://localhost:5000"
    : "https://infosec-backend.onrender.com";

console.log("API Base URL:", API_BASE_URL);  // For debugging
// ========== END CONFIGURATION ==========

// Global variable to hold server results for client-side filtering
let currentLibraryResults = [];
// Global variable to hold analysis results for modal
let currentAnalysisResults = [];
// Global setting for analysis quality
let analysisQuality = 'accurate'; // 'accurate' (Opus) or 'fast' (Haiku)
// Global variable to hold personal library rules for current analysis
let currentPersonalLibraryRules = [];

// Shareable utility: Make them global
window.API_BASE_URL = API_BASE_URL;
window.currentLibraryResults = currentLibraryResults;
window.currentAnalysisResults = currentAnalysisResults;
window.analysisQuality = analysisQuality;
window.currentPersonalLibraryRules = currentPersonalLibraryRules;


document.addEventListener("DOMContentLoaded", () => {
    
    // --- ADDED: Set pdf.js worker source ---
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';
    } else {
        console.error("pdf.js library is not loaded");
    }
    
    // Initialize personal library
    if (typeof initializePersonalLibrary !== 'undefined') {
        initializePersonalLibrary();
    }

    // --- Tab Switching Logic ---
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            const tabId = button.dataset.tab;
            tabButtons.forEach(btn => btn.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));
            button.classList.add("active");
            document.getElementById(tabId).classList.add("active");
        });
    });

    
    // --- SCG Modal Elements & Logic ---
    const scgModal = document.getElementById('scg-modal');
    const scgModalCloseButton = document.getElementById('scg-modal-close-button');
    
    scgModalCloseButton.addEventListener('click', () => {
        scgModal.style.display = 'none';
    });
    
    scgModal.addEventListener('click', (e) => {
        if (e.target === scgModal) {
            scgModal.style.display = 'none';
        }
    });

    // --- MODIFIED: Help Modal Elements & Logic ---
    const helpModal = document.getElementById('help-modal');
    const helpOpenButton = document.getElementById('help-open-button');
    const helpModalCloseButton = document.getElementById('help-modal-close-button');

    if (helpOpenButton) {
        helpOpenButton.addEventListener('click', () => {
            helpModal.style.display = 'flex';
        });
    }
    
    if (helpModalCloseButton) {
        helpModalCloseButton.addEventListener('click', () => {
            helpModal.style.display = 'none';
        });
    }
    
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.style.display = 'none';
        }
    });
    
    // --- ADDED: New Settings Modal Elements & Logic ---
    const settingsModal = document.getElementById('settings-modal');
    const settingsOpenButton = document.getElementById('settings-open-button');
    const settingsModalCloseButton = document.getElementById('settings-modal-close-button');

    if (settingsOpenButton) {
        settingsOpenButton.addEventListener('click', () => {
            settingsModal.style.display = 'flex';
        });
    }
    
    if (settingsModalCloseButton) {
        settingsModalCloseButton.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });
    }
    
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });


    // --- Quality Selector Logic ---
    const qualitySelector = document.getElementById('quality-selector');
    const qualityIndicatorText = document.getElementById('quality-indicator-text');
    const qualityPopover = document.getElementById('quality-popover');
    const qualityOptions = document.querySelectorAll('.quality-option');

    if (qualitySelector) {
        qualitySelector.addEventListener('click', (e) => {
            e.stopPropagation();
            qualityPopover.style.display = qualityPopover.style.display === 'none' ? 'block' : 'none';
        });
    }

    qualityOptions.forEach(option => {
        option.addEventListener('click', () => {
            const value = option.dataset.value;
            window.analysisQuality = value; // Set global variable
            
            // Update UI
            qualityOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            
            // Update indicator text
            if (value === 'accurate') {
                qualityIndicatorText.textContent = 'Accurate';
            } else {
                qualityIndicatorText.textContent = 'Fast';
            }
            
            // Hide popover
            qualityPopover.style.display = 'none';
        });
    });

    // Close popover when clicking outside
    document.addEventListener('click', (e) => {
        if (qualityPopover && qualitySelector && !qualitySelector.contains(e.target) && !qualityPopover.contains(e.target)) {
            qualityPopover.style.display = 'none';
        }
    });
    
    // --- Shared Copy Button Logic ---
    // We must query the whole document because buttons can be inside dynamic content
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('copy-button')) {
            const button = event.target;
            const targetId = button.dataset.target;
            const targetEl = document.getElementById(targetId);
            if (!targetEl) return;

            const textToCopy = targetEl.textContent.trim();
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = button.textContent;
                button.textContent = "Copied!";
                setTimeout(() => button.textContent = originalText, 2000);
            });
        }
    });
    
    // --- ADDED: Theme Toggle Logic ---
    const themeToggle = document.getElementById('theme-toggle-checkbox');

    // Function to set the theme
    function setTheme(isDark) {
        if (isDark) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    } 

    // Listener for the toggle switch
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            setTheme(themeToggle.checked);
        });
    }

    // Check for saved theme on page load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        themeToggle.checked = true;
        setTheme(true);
    } else {
        themeToggle.checked = false;
        setTheme(false);
    }

});