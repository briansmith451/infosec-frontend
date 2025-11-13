// libraryUI.js
// User Interface for Personal Library Management

class LibraryUI {
    constructor(libraryManager) {
        this.libraryManager = libraryManager;
        this.modal = null;
        this.isLibraryEnabled = true;
        this.init();
    }

    init() {
        // Create library modal HTML
        this.createLibraryModal();
        
        // Initialize library manager
        this.libraryManager.init().then(() => {
            console.log('Personal Library ready');
            this.updateLibraryStats();
        }).catch(error => {
            console.error('Failed to initialize library:', error);
        });
    }

    createLibraryModal() {
        // Check if modal already exists
        if (document.getElementById('library-modal')) {
            this.modal = document.getElementById('library-modal');
            return;
        }

        // Create modal HTML
        const modalHTML = `
            <div id="library-modal" class="modal-overlay" style="display: none;">
                <div class="modal-content library-modal-content">
                    <div class="modal-header">
                        <h3>Personal Classification Library</h3>
                        <button id="library-modal-close" class="modal-close-button">×</button>
                    </div>
                    <div class="modal-body library-modal-body">
                        <!-- Library Stats -->
                        <div class="library-stats-section">
                            <div class="library-stat-card">
                                <div class="stat-value" id="lib-doc-count">0</div>
                                <div class="stat-label">Documents</div>
                            </div>
                            <div class="library-stat-card">
                                <div class="stat-value" id="lib-rule-count">0</div>
                                <div class="stat-label">Rules</div>
                            </div>
                            <div class="library-stat-card">
                                <div class="stat-value" id="lib-size">0 KB</div>
                                <div class="stat-label">Total Size</div>
                            </div>
                            <div class="library-toggle-card">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="library-enabled-toggle" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                                <div class="stat-label">Include in Analysis</div>
                            </div>
                        </div>

                        <!-- Upload Section -->
                        <div class="library-upload-section">
                            <h4>Add Document to Library</h4>
                            <div class="library-upload-area" id="library-upload-area">
                                <input type="file" id="library-file-input" accept=".txt,.docx,.pdf" style="display: none;">
                                <div class="upload-icon">📚</div>
                                <div class="upload-text">Drag & Drop or Click to Upload</div>
                                <div class="upload-hint">Supports: txt, docx, pdf</div>
                            </div>
                            
                            <div id="library-file-details" class="library-file-details" style="display: none;">
                                <div class="file-info">
                                    <span id="library-file-name"></span>
                                    <button id="library-file-remove" class="small-button">Remove</button>
                                </div>
                                
                                <div class="metadata-form">
                                    <div class="form-group">
                                        <label>Document Title</label>
                                        <input type="text" id="library-doc-title" placeholder="e.g., Company Classification Guide">
                                    </div>
                                    <div class="form-group">
                                        <label>Organization</label>
                                        <input type="text" id="library-doc-org" placeholder="e.g., ACME Corp">
                                    </div>
                                    <div class="form-group">
                                        <label>Default Classification</label>
                                        <select id="library-doc-class">
                                            <option value="UNCLASSIFIED">UNCLASSIFIED</option>
                                            <option value="CUI">CUI</option>
                                            <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                                            <option value="SECRET">SECRET</option>
                                            <option value="TOP SECRET">TOP SECRET</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Tags (comma-separated)</label>
                                        <input type="text" id="library-doc-tags" placeholder="e.g., network, data, export control">
                                    </div>
                                    <button id="library-upload-button" class="primary-button">
                                        <span class="spinner"></span>
                                        <span>Add to Library</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Documents List -->
                        <div class="library-documents-section">
                            <h4>Library Documents</h4>
                            <div id="library-documents-list" class="library-documents-list">
                                <!-- Documents will be added here dynamically -->
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="library-actions">
                            <button id="library-clear-button" class="danger-button">Clear Library</button>
                            <button id="library-export-button" class="secondary-button">Export Library</button>
                            <button id="library-import-button" class="secondary-button">Import Library</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('library-modal');
        
        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Modal close
        document.getElementById('library-modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        // Click outside modal to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Upload area
        const uploadArea = document.getElementById('library-upload-area');
        const fileInput = document.getElementById('library-file-input');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                this.handleFileSelect(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        // Remove file button
        document.getElementById('library-file-remove').addEventListener('click', () => {
            this.clearFileSelection();
        });

        // Upload button
        document.getElementById('library-upload-button').addEventListener('click', () => {
            this.uploadDocument();
        });

        // Library toggle
        document.getElementById('library-enabled-toggle').addEventListener('change', (e) => {
            this.isLibraryEnabled = e.target.checked;
            this.showToast(this.isLibraryEnabled ? 
                'Personal library enabled for analysis' : 
                'Personal library disabled for analysis');
        });

        // Clear library
        document.getElementById('library-clear-button').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear your entire library? This cannot be undone.')) {
                this.clearLibrary();
            }
        });

        // Export library
        document.getElementById('library-export-button').addEventListener('click', () => {
            this.exportLibrary();
        });

        // Import library
        document.getElementById('library-import-button').addEventListener('click', () => {
            this.importLibrary();
        });
    }

    handleFileSelect(file) {
        // Validate file type
        const allowedTypes = ['.txt', '.docx', '.pdf'];
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            alert('Please select a txt, docx, or pdf file');
            return;
        }

        // Show file details
        document.getElementById('library-upload-area').style.display = 'none';
        document.getElementById('library-file-details').style.display = 'block';
        document.getElementById('library-file-name').textContent = file.name;
        document.getElementById('library-doc-title').value = file.name.replace(/\.[^/.]+$/, '');
        
        // Store file reference
        this.selectedFile = file;
    }

    clearFileSelection() {
        document.getElementById('library-upload-area').style.display = 'block';
        document.getElementById('library-file-details').style.display = 'none';
        document.getElementById('library-file-input').value = '';
        this.selectedFile = null;
    }

    async uploadDocument() {
        if (!this.selectedFile) {
            alert('Please select a file');
            return;
        }

        const button = document.getElementById('library-upload-button');
        const spinner = button.querySelector('.spinner');
        const buttonText = button.querySelector('span:last-child');
        
        // Show loading state
        button.disabled = true;
        spinner.style.display = 'inline-block';
        buttonText.textContent = 'Processing...';

        try {
            // Get metadata
            const metadata = {
                title: document.getElementById('library-doc-title').value,
                organization: document.getElementById('library-doc-org').value,
                classification: document.getElementById('library-doc-class').value,
                tags: document.getElementById('library-doc-tags').value.split(',').map(t => t.trim()).filter(t => t)
            };

            // Add to library
            const result = await this.libraryManager.addDocument(this.selectedFile, metadata);
            
            if (result.success) {
                this.showToast(`Document added: ${result.rulesExtracted} rules extracted`);
                this.clearFileSelection();
                this.updateLibraryStats();
                this.loadDocumentsList();
            } else {
                throw new Error('Failed to add document');
            }

        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to add document to library: ' + error.message);
        } finally {
            // Reset button
            button.disabled = false;
            spinner.style.display = 'none';
            buttonText.textContent = 'Add to Library';
        }
    }

    async loadDocumentsList() {
        try {
            const documents = await this.libraryManager.getDocuments();
            const listContainer = document.getElementById('library-documents-list');
            
            if (documents.length === 0) {
                listContainer.innerHTML = '<div class="no-documents">No documents in library</div>';
                return;
            }

            listContainer.innerHTML = documents.map(doc => `
                <div class="library-document-item" data-doc-id="${doc.id}">
                    <div class="doc-info">
                        <div class="doc-title">${doc.title}</div>
                        <div class="doc-meta">
                            ${doc.organization} • ${doc.classification} • ${doc.ruleCount} rules
                        </div>
                    </div>
                    <button class="doc-delete-button" data-doc-id="${doc.id}">×</button>
                </div>
            `).join('');

            // Add delete handlers
            listContainer.querySelectorAll('.doc-delete-button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const docId = parseInt(btn.dataset.docId);
                    this.deleteDocument(docId);
                });
            });

        } catch (error) {
            console.error('Failed to load documents:', error);
        }
    }

    async deleteDocument(docId) {
        if (!confirm('Delete this document from your library?')) {
            return;
        }

        try {
            await this.libraryManager.deleteDocument(docId);
            this.showToast('Document removed from library');
            this.updateLibraryStats();
            this.loadDocumentsList();
        } catch (error) {
            console.error('Failed to delete document:', error);
            alert('Failed to delete document');
        }
    }

    async clearLibrary() {
        try {
            await this.libraryManager.clearLibrary();
            this.showToast('Library cleared');
            this.updateLibraryStats();
            this.loadDocumentsList();
        } catch (error) {
            console.error('Failed to clear library:', error);
            alert('Failed to clear library');
        }
    }

    async updateLibraryStats() {
        try {
            const stats = await this.libraryManager.getLibraryStats();
            
            document.getElementById('lib-doc-count').textContent = stats.documentCount;
            document.getElementById('lib-rule-count').textContent = stats.totalRules;
            
            // Format file size
            const sizeKB = Math.round(stats.totalSize / 1024);
            const sizeMB = sizeKB / 1024;
            document.getElementById('lib-size').textContent = 
                sizeMB > 1 ? `${sizeMB.toFixed(1)} MB` : `${sizeKB} KB`;

        } catch (error) {
            console.error('Failed to update stats:', error);
        }
    }

    async exportLibrary() {
        try {
            const documents = await this.libraryManager.getDocuments();
            const rules = await this.libraryManager.getRulesForAnalysis();
            
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                documents: documents,
                rules: rules
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `library-export-${new Date().getTime()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.showToast('Library exported successfully');
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export library');
        }
    }

    async importLibrary() {
        // Create file input for import
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                // Validate import data
                if (!data.version || !data.documents || !data.rules) {
                    throw new Error('Invalid library export file');
                }

                // Import logic would go here
                // For now, just show a message
                alert('Import feature coming soon!');
                
            } catch (error) {
                console.error('Import failed:', error);
                alert('Failed to import library: ' + error.message);
            }
        };

        input.click();
    }

    openModal() {
        this.modal.style.display = 'flex';
        this.loadDocumentsList();
        this.updateLibraryStats();
    }

    closeModal() {
        this.modal.style.display = 'none';
    }

    showToast(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'library-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // Check if library is enabled for analysis
    isEnabled() {
        return this.isLibraryEnabled;
    }

    // Get library rules for analysis integration
    async getLibraryRulesForAnalysis(query) {
        if (!this.isEnabled()) {
            return [];
        }

        try {
            const rules = await this.libraryManager.searchLibrary(query);
            return rules.map(rule => ({
                source: 'personal_library',
                rule_id: rule.localId,
                topic: rule.topic,
                clean_rule: rule.text,
                classification: rule.classification,
                organization: rule.organization,
                document: rule.documentTitle
            }));
        } catch (error) {
            console.error('Failed to get library rules:', error);
            return [];
        }
    }
}

// Export for use in main application
window.LibraryUI = LibraryUI; 