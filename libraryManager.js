// libraryManager.js
// Personal Library Management System using IndexedDB

class PersonalLibraryManager {
    constructor() {
        this.dbName = 'PersonalClassificationLibrary';
        this.dbVersion = 1;
        this.db = null;
        this.isInitialized = false;
    }

    // Initialize IndexedDB
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Failed to open IndexedDB');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                console.log('Personal Library IndexedDB initialized');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create documents store
                if (!db.objectStoreNames.contains('documents')) {
                    const docStore = db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
                    docStore.createIndex('title', 'title', { unique: false });
                    docStore.createIndex('organization', 'organization', { unique: false });
                    docStore.createIndex('uploadDate', 'uploadDate', { unique: false });
                }

                // Create rules store (extracted from documents)
                if (!db.objectStoreNames.contains('rules')) {
                    const ruleStore = db.createObjectStore('rules', { keyPath: 'id', autoIncrement: true });
                    ruleStore.createIndex('documentId', 'documentId', { unique: false });
                    ruleStore.createIndex('classification', 'classification', { unique: false });
                    ruleStore.createIndex('topic', 'topic', { unique: false });
                }

                // Create embeddings store for vector search
                if (!db.objectStoreNames.contains('embeddings')) {
                    const embStore = db.createObjectStore('embeddings', { keyPath: 'id', autoIncrement: true });
                    embStore.createIndex('ruleId', 'ruleId', { unique: false });
                    embStore.createIndex('documentId', 'documentId', { unique: false });
                }

                console.log('IndexedDB schema created/updated');
            };
        });
    }

    // Add a document to the library
    async addDocument(file, metadata) {
        if (!this.isInitialized) await this.init();

        return new Promise(async (resolve, reject) => {
            try {
                // Read file content
                const content = await this.readFileContent(file);
                
                // Parse document to extract rules
                const extractedRules = await this.parseDocumentForRules(content, file.type);
                
                // Store document
                const docTransaction = this.db.transaction(['documents'], 'readwrite');
                const docStore = docTransaction.objectStore('documents');
                
                const document = {
                    title: metadata.title || file.name,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    content: content,
                    organization: metadata.organization || 'Personal',
                    classification: metadata.classification || 'UNCLASSIFIED',
                    uploadDate: new Date().toISOString(),
                    isActive: true,
                    ruleCount: extractedRules.length,
                    tags: metadata.tags || []
                };

                const addRequest = docStore.add(document);
                
                addRequest.onsuccess = async () => {
                    const docId = addRequest.result;
                    
                    // Store extracted rules
                    await this.storeExtractedRules(docId, extractedRules, document);
                    
                    // Generate and store embeddings
                    await this.generateAndStoreEmbeddings(docId, extractedRules);
                    
                    resolve({
                        success: true,
                        documentId: docId,
                        rulesExtracted: extractedRules.length
                    });
                };

                addRequest.onerror = () => {
                    reject(addRequest.error);
                };

            } catch (error) {
                reject(error);
            }
        });
    }

    // Read file content (FIXED to handle .docx properly)
    async readFileContent(file) {
        return new Promise((resolve, reject) => {
            console.log("Reading file:", file.name, "Type:", file.type);
            
            // Handle .docx files
            if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
                || file.name.endsWith('.docx')) {
                console.log("Processing as .docx file");
                
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        // Use mammoth to extract text from .docx
                        const result = await mammoth.extractRawText({arrayBuffer: e.target.result});
                        console.log("Extracted text from .docx, length:", result.value.length);
                        console.log("First 500 chars:", result.value.substring(0, 500));
                        resolve(result.value); 
                    } catch (error) {
                        console.error("Error extracting text from .docx:", error);
                        reject(error);
                    }
                };
                reader.onerror = () => {
                    reject(new Error('Failed to read .docx file'));
                };
                reader.readAsArrayBuffer(file);
                
            } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                // PDF files - not yet implemented
                console.log("PDF files not yet supported");
                reject(new Error('PDF files are not yet supported'));
                
            } else {
                // Text files and others - read as text
                console.log("Processing as text file");
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    console.log("Text file read, length:", e.target.result.length);
                    resolve(e.target.result);
                };
                
                reader.onerror = () => {
                    reject(new Error('Failed to read file'));
                };
                
                reader.readAsText(file);
            }
        });
    }

    // Parse document to extract classification rules
    async parseDocumentForRules(content, fileType) {
        const rules = [];
        
        // Simple rule extraction (this can be enhanced with better NLP)
        const lines = content.split(/\n+/);
        let currentRule = null;
        let ruleId = 1;

        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Look for classification indicators
            if (this.looksLikeRule(trimmedLine)) {
                if (currentRule) {
                    rules.push(currentRule);
                }
                
                currentRule = {
                    localId: `PERSONAL-${ruleId++}`,
                    text: trimmedLine,
                    classification: this.extractClassification(trimmedLine),
                    topic: this.extractTopic(trimmedLine),
                    context: []
                };
            } else if (currentRule && trimmedLine) {
                // Add context to current rule
                currentRule.context.push(trimmedLine);
                if (currentRule.context.length > 3) {
                    currentRule.context.shift(); // Keep only last 3 context lines
                }
            }
        }
        
        if (currentRule) {
            rules.push(currentRule);
        }

        return rules;
    }

    // Check if a line looks like a classification rule
    looksLikeRule(line) {
        const ruleIndicators = [
            /classified/i,
            /classification/i,
            /secret/i,
            /cui/i,
            /confidential/i,
            /restricted/i,
            /public release/i,
            /must be marked/i,
            /shall be marked/i,
            /requires.*approval/i,
            /not be disclosed/i,
            /authorized for release/i
        ];

        return ruleIndicators.some(pattern => pattern.test(line));
    }

    // Extract classification level from text
    extractClassification(text) {
        if (/TOP SECRET|TS\/\/SCI/i.test(text)) return 'TOP SECRET';
        if (/SECRET/i.test(text)) return 'SECRET';
        if (/CONFIDENTIAL/i.test(text)) return 'CONFIDENTIAL';
        if (/CUI|CONTROLLED/i.test(text)) return 'CUI';
        if (/FOUO|FOR OFFICIAL USE/i.test(text)) return 'FOUO';
        return 'UNCLASSIFIED';
    }

    // Extract topic from text
    extractTopic(text) {
        // Simple topic extraction - can be enhanced
        const words = text.split(/\s+/).slice(0, 5).join(' ');
        return words.length > 50 ? words.substring(0, 50) + '...' : words;
    }

    // Store extracted rules in IndexedDB
    async storeExtractedRules(documentId, rules, document) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rules'], 'readwrite');
            const store = transaction.objectStore('rules');
            
            let stored = 0;
            rules.forEach(rule => {
                const ruleRecord = {
                    documentId: documentId,
                    documentTitle: document.title,
                    organization: document.organization,
                    localId: rule.localId,
                    text: rule.text,
                    context: rule.context.join(' '),
                    classification: rule.classification,
                    topic: rule.topic,
                    isActive: true
                };
                
                const request = store.add(ruleRecord);
                request.onsuccess = () => {
                    stored++;
                    if (stored === rules.length) {
                        resolve();
                    }
                };
            });

            if (rules.length === 0) {
                resolve();
            }
        });
    }

    // Generate embeddings for vector search (simplified version)
    async generateAndStoreEmbeddings(documentId, rules) {
        // In a real implementation, you would use a proper embedding model
        // For now, we'll create simple feature vectors based on keywords
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['embeddings'], 'readwrite');
            const store = transaction.objectStore('embeddings');
            
            let stored = 0;
            rules.forEach((rule, index) => {
                const embedding = this.createSimpleEmbedding(rule.text + ' ' + rule.context.join(' '));
                
                const embeddingRecord = {
                    ruleId: index,
                    documentId: documentId,
                    embedding: embedding,
                    vector: Array.from(embedding) // Store as array for compatibility
                };
                
                const request = store.add(embeddingRecord);
                request.onsuccess = () => {
                    stored++;
                    if (stored === rules.length) {
                        resolve();
                    }
                };
            });

            if (rules.length === 0) {
                resolve();
            }
        });
    }

    // Create simple embedding (placeholder for real embedding model)
    createSimpleEmbedding(text) {
        // This is a simplified version - in production, use a real embedding model
        const keywords = [
            'classified', 'secret', 'cui', 'confidential', 'restricted',
            'public', 'release', 'approval', 'marked', 'disclosed',
            'data', 'information', 'document', 'system', 'network'
        ];
        
        const vector = new Float32Array(keywords.length);
        const lowerText = text.toLowerCase();
        
        keywords.forEach((keyword, i) => {
            const count = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
            vector[i] = count > 0 ? 1 / (1 + Math.exp(-count)) : 0; // Sigmoid normalization
        });
        
        return vector;
    }

    // Get all documents in library
    async getDocuments() {
        if (!this.isInitialized) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['documents'], 'readonly');
            const store = transaction.objectStore('documents');
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Get rules for analysis
    async getRulesForAnalysis() {
        if (!this.isInitialized) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rules'], 'readonly');
            const store = transaction.objectStore('rules');
            const request = store.getAll();

            request.onsuccess = () => {
                const activeRules = request.result.filter(rule => rule.isActive);
                resolve(activeRules);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Search library with query
    async searchLibrary(query) {
        if (!this.isInitialized) await this.init();

        const rules = await this.getRulesForAnalysis();
        
        // Simple text search - can be enhanced with vector similarity
        const queryLower = query.toLowerCase();
        const results = rules.filter(rule => {
            const searchText = `${rule.text} ${rule.context} ${rule.topic}`.toLowerCase();
            return searchText.includes(queryLower);
        });

        // Score and sort results
        results.forEach(rule => {
            const textMatches = (rule.text.toLowerCase().match(new RegExp(queryLower, 'g')) || []).length;
            const contextMatches = (rule.context.toLowerCase().match(new RegExp(queryLower, 'g')) || []).length;
            rule.relevanceScore = textMatches * 2 + contextMatches; // Weight text matches higher
        });

        results.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        return results.slice(0, 10); // Return top 10 results
    }

    // Delete a document and its rules
    async deleteDocument(documentId) {
        if (!this.isInitialized) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['documents', 'rules', 'embeddings'], 'readwrite');
            
            // Delete document
            transaction.objectStore('documents').delete(documentId);
            
            // Delete associated rules
            const ruleStore = transaction.objectStore('rules');
            const ruleIndex = ruleStore.index('documentId');
            const ruleRequest = ruleIndex.openCursor(IDBKeyRange.only(documentId));
            
            ruleRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };

            // Delete associated embeddings
            const embStore = transaction.objectStore('embeddings');
            const embIndex = embStore.index('documentId');
            const embRequest = embIndex.openCursor(IDBKeyRange.only(documentId));
            
            embRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };

            transaction.oncomplete = () => {
                resolve({ success: true });
            };

            transaction.onerror = () => {
                reject(transaction.error);
            };
        });
    }

    // Get library statistics
    async getLibraryStats() {
        if (!this.isInitialized) await this.init();

        const documents = await this.getDocuments();
        const rules = await this.getRulesForAnalysis();
        
        const stats = {
            documentCount: documents.length,
            totalRules: rules.length,
            totalSize: documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0),
            classifications: {},
            organizations: {}
        };

        rules.forEach(rule => {
            stats.classifications[rule.classification] = (stats.classifications[rule.classification] || 0) + 1;
            stats.organizations[rule.organization] = (stats.organizations[rule.organization] || 0) + 1;
        });

        return stats;
    }

    // Clear entire library
    async clearLibrary() {
        if (!this.isInitialized) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['documents', 'rules', 'embeddings'], 'readwrite');
            
            transaction.objectStore('documents').clear();
            transaction.objectStore('rules').clear();
            transaction.objectStore('embeddings').clear();

            transaction.oncomplete = () => {
                resolve({ success: true });
            };

            transaction.onerror = () => {
                reject(transaction.error);
            };
        });
    }
}

// Export for use in main application
window.PersonalLibraryManager = PersonalLibraryManager;