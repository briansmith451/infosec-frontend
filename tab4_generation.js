// tab4_generation.js
// Contains all logic for the Tab 4: Generation

function callGenerateApi(queryText, buttonEl, resultsEl, errorEl, answerEl) {
    const spinner = buttonEl.querySelector(".spinner");
    const buttonText = buttonEl.querySelector("span:last-child");
    const originalButtonText = buttonText.textContent;

    buttonEl.disabled = true;
    buttonText.textContent = "Generating...";
    spinner.style.display = "inline-block";
    resultsEl.style.display = "none";
    errorEl.style.display = "none";

    fetch(`${window.API_BASE_URL}/generate_document`, {
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
        const determination = data.determination || "No text generated.";
        answerEl.textContent = determination; // Use textContent to preserve line breaks
        resultsEl.style.display = "block";
        
        // --- MODIFIED: Wrap scroll in a setTimeout ---
        // This pushes the scroll command to the end of the event queue,
        // allowing the browser to render the resultsEl first.
        setTimeout(() => {
            resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0); 
        
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

// --- ADDED: File Upload handler for Tab 4 ---
function handleGenerationFileUpload(file) {
    const uploadedFileName = document.getElementById("uploaded-file-name-tab4");
    const generationInput = document.getElementById("generation-input");
    
    uploadedFileName.textContent = file.name;
    uploadedFileName.style.display = "block";
    generationInput.value = "Reading file content..."; // Placeholder

    if (file.type === "text/plain" || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            generationInput.value = e.target.result;
        };
        reader.readAsText(file);

    } else if (file.name.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            mammoth.extractRawText({ arrayBuffer: e.target.result })
                .then((result) => {
                    generationInput.value = result.value;
                })
                .catch((err) => {
                    alert("Error reading .docx file: " + err.message);
                    uploadedFileName.style.display = "none";
                    generationInput.value = "";
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
                    // Join items with a space, and add a new line for each page
                    allText += textContent.items.map(item => item.str).join(' ') + '\n\n';
                }
                generationInput.value = allText;
            }).catch((err) => {
                alert("Error reading .pdf file: " + err.message);
                uploadedFileName.style.display = "none";
                generationInput.value = "";
            });
        };
        reader.readAsArrayBuffer(file);

    } else {
        alert("Unsupported file type. Please use .txt, .docx, or .pdf.");
        uploadedFileName.style.display = "none";
        generationInput.value = "";
    }
}


function initializeTab4() {
    const generationInput = document.getElementById('generation-input');
    const generateButton = document.getElementById('generate-button');
    const generationResultsContainer = document.getElementById('generation-results-container');
    const generationOutput = document.getElementById('generation-output');
    const errorMessageTab4 = document.getElementById('error-message-tab4');
    
    // --- ADDED: Tab 4 File Upload Elements ---
    const fileUploadAreaTab4 = document.getElementById("file-upload-area-tab4");
    const fileInputTab4 = document.getElementById("file-input-tab4");
    const uploadedFileNameTab4 = document.getElementById("uploaded-file-name-tab4");
    const clearButtonTab4 = document.getElementById("clear-button-tab4");

    if (generateButton) {
        generateButton.addEventListener('click', () => {
            const textToGenerate = generationInput.value;
            if (!textToGenerate.trim()) {
                alert("Please enter text to generate a document from.");
                return;
            }
            callGenerateApi(textToGenerate, generateButton, generationResultsContainer, errorMessageTab4, generationOutput);
        });
    }
    
    // --- ADDED: Event listeners for Tab 4 file upload ---
    fileUploadAreaTab4.addEventListener("click", () => fileInputTab4.click());
    fileUploadAreaTab4.addEventListener("dragover", (e) => { e.preventDefault(); fileUploadAreaTab4.classList.add("dragover"); });
    fileUploadAreaTab4.addEventListener("dragleave", () => fileUploadAreaTab4.classList.remove("dragover"));
    fileUploadAreaTab4.addEventListener("drop", (e) => {
        e.preventDefault();
        fileUploadAreaTab4.classList.remove("dragover");
        if (e.dataTransfer.files.length) {
            fileInputTab4.files = e.dataTransfer.files;
            handleGenerationFileUpload(e.dataTransfer.files[0]);
        }
    });

    fileInputTab4.addEventListener("change", (e) => {
        if (e.target.files.length) {
            handleGenerationFileUpload(e.target.files[0]);
        }
    });
     
    // --- ADDED: Event listener for Tab 4 Clear Button ---
    clearButtonTab4.addEventListener("click", () => {
        generationInput.value = "";
        generationOutput.textContent = "";
        generationResultsContainer.style.display = "none";
        errorMessageTab4.style.display = "none";
        uploadedFileNameTab4.textContent = "";
        uploadedFileNameTab4.style.display = "none";
        fileInputTab4.value = "";
    });
}

// Call the initializer
initializeTab4();