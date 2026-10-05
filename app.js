// ==========================================
// 1. UTILITIES & VISUAL FEEDBACK
// ==========================================
const statusMessage = document.getElementById('status-message');

function showFeedback(message, type = 'error') {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.className = `feedback-banner ${type}`;
    statusMessage.style.display = 'block';
}

function clearFeedback() {
    if (!statusMessage) return;
    statusMessage.style.display = 'none';
    statusMessage.textContent = '';
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ==========================================
// 2. CLOCK / TIME DISPLAY
// ==========================================
const dateTimeElement = document.getElementById('time-display');

function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    if (dateTimeElement) {
        dateTimeElement.textContent = now.toLocaleDateString(undefined, options);
    }
}
setInterval(updateDateTime, 1000);
updateDateTime(); // Initial call

// ==========================================
// 3. UI ROW MANAGEMENT (Render, Add, Remove)
// ==========================================
const assignmentsContainer = document.getElementById('assignments-container');
const addRowBtn = document.getElementById('add-row-btn');

function renderAssignments(assignments) {
    assignmentsContainer.innerHTML = '<legend>Assignment Scores</legend>';

    assignments.forEach((assignment, index) => {
        const rowNum = index + 1;
        const rowDiv = document.createElement('div');
        rowDiv.className = 'assignment-row';

        const safeName = escapeHTML(assignment.name);
        const safeWeight = parseFloat(assignment.weight) || 0; 

        rowDiv.innerHTML = `
            <label for="assign-name-${rowNum}">Name</label>
            <input type="text" id="assign-name-${rowNum}" name="assign-name-${rowNum}" value="${safeName}" required>
            
            <label for="assign-weight-${rowNum}">Weight (%)</label>
            <input type="number" id="assign-weight-${rowNum}" name="assign-weight-${rowNum}" value="${safeWeight}" min="0" max="100" step="any" inputmode="decimal" required>
            
            <label for="assign-score-${rowNum}">Score</label>
            <input type="number" id="assign-score-${rowNum}" name="assign-score-${rowNum}" min="0" step="any" inputmode="decimal">
            
            <button type="button" class="remove-row-btn">Remove</button>
        `;
        assignmentsContainer.appendChild(rowDiv);
    });
}

function addBlankRow() {
    clearFeedback();
    const uniqueId = Date.now(); 
    
    const rowDiv = document.createElement('div');
    rowDiv.className = 'assignment-row';

    rowDiv.innerHTML = `
        <label for="assign-name-${uniqueId}">Name</label>
        <input type="text" id="assign-name-${uniqueId}" name="assign-name-${uniqueId}" placeholder="New Assignment" required>
        
        <label for="assign-weight-${uniqueId}">Weight (%)</label>
        <input type="number" id="assign-weight-${uniqueId}" name="assign-weight-${uniqueId}" min="0" max="100" step="any" inputmode="decimal" required>
        
        <label for="assign-score-${uniqueId}">Score</label>
        <input type="number" id="assign-score-${uniqueId}" name="assign-score-${uniqueId}" min="0" step="any" inputmode="decimal">
        
        <button type="button" class="remove-row-btn">Remove</button>
    `;
    assignmentsContainer.appendChild(rowDiv);

    const nameInput = rowDiv.querySelector('input[type="text"]');
    if (nameInput) nameInput.focus();
}

addRowBtn.addEventListener('click', addBlankRow);

// Row removal with visual focus preservation
assignmentsContainer.addEventListener('click', function(event) {
    if (event.target.classList.contains('remove-row-btn')) {
        const row = event.target.closest('.assignment-row');
        if (!row) return;

        const prevRow = row.previousElementSibling && row.previousElementSibling.classList.contains('assignment-row') ? row.previousElementSibling : null;
        const nextRow = row.nextElementSibling && row.nextElementSibling.classList.contains('assignment-row') ? row.nextElementSibling : null;

        let targetToFocus = nextRow ? nextRow.querySelector('input') : (prevRow ? prevRow.querySelector('input') : addRowBtn);

        row.remove();
        if (targetToFocus) targetToFocus.focus();
    }
});

// ==========================================
// 4. DATA LOADING (Templates & Custom Upload)
// ==========================================
const templateSelect = document.getElementById('course-template');
const loadBtn = document.getElementById('load-template-btn');
const fileInput = document.getElementById('custom-file-upload');
const customUploadSection = document.getElementById('custom-upload-section');

async function loadTemplate() {
    clearFeedback();
    const selectedTemplate = templateSelect.value;

    if (!selectedTemplate) {
        showFeedback("Please select a syllabus template first.", "error");
        return;
    }

    const existingRows = document.querySelectorAll('.assignment-row');
    if (existingRows.length > 0) {
        const confirmOverwrite = confirm("Loading a template will overwrite your current entries. Do you wish to continue?");
        if (!confirmOverwrite) return;
    }

    try {
        const response = await fetch('templates.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const templateData = data[selectedTemplate];

        if (templateData) {
            renderAssignments(templateData);
            const templateName = templateSelect.options[templateSelect.selectedIndex].text;
            showFeedback(`Loaded ${templateData.length} assignments from "${templateName}".`, "success");
        }
    } catch (error) {
        console.error("Error loading the JSON data:", error);
        showFeedback("Could not load templates. Make sure you are using a local web server.", "error");
    }
}

loadBtn.addEventListener('click', loadTemplate);

templateSelect.addEventListener('change', function() {
    clearFeedback();
    if (templateSelect.value === 'custom') {
        customUploadSection.style.display = 'block';
        loadBtn.style.display = 'none';
        fileInput.focus();
    } else {
        customUploadSection.style.display = 'none';
        loadBtn.style.display = 'inline-flex';
    }
});

fileInput.addEventListener('change', function(event) {
    clearFeedback();
    const file = event.target.files[0];
    if (!file) return;

    const existingRows = document.querySelectorAll('.assignment-row');
    if (existingRows.length > 0) {
        const confirmOverwrite = confirm("Uploading a template will overwrite your current entries. Continue?");
        if (!confirmOverwrite) {
            fileInput.value = ''; // Reset file input if they cancel
            return;
        }
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const customData = JSON.parse(e.target.result);
            if (Array.isArray(customData)) {
                renderAssignments(customData);
                showFeedback(`Custom syllabus uploaded: ${customData.length} assignments loaded.`, "success");
                fileInput.value = ''; 
            } else {
                showFeedback("Format error: Your JSON file must contain a single array of assignments.", "error");
            }
        } catch (error) {
            console.error("Error parsing JSON:", error);
            showFeedback("Invalid JSON file. Please check your formatting.", "error");
        }
    };
    reader.readAsText(file);
});

// ==========================================
// 5. CALCULATIONS
// ==========================================
const gradeForm = document.getElementById('grade-form');
const resultsDisplay = document.getElementById('results-display');

function calculateGrade(event) {
    event.preventDefault(); // Native form validation now runs before this is ever called
    clearFeedback();

    const rows = document.querySelectorAll('.assignment-row');
    let totalEarnedPoints = 0;
    let totalWeightCompleted = 0;
    let totalSyllabusWeight = 0; 

    rows.forEach(row => {
        const weightInput = row.querySelector('input[name^="assign-weight"]');
        const scoreInput = row.querySelector('input[name^="assign-score"]');
        
        const weight = parseFloat(weightInput.value);
        const score = parseFloat(scoreInput.value);

        if (!isNaN(weight)) {
            totalSyllabusWeight += weight;
            if (!isNaN(score)) {
                totalEarnedPoints += (score * (weight / 100));
                totalWeightCompleted += weight;
            }
        }
    });

    if (totalSyllabusWeight > 100) {
        showFeedback(`Warning: Total syllabus weight is currently ${totalSyllabusWeight}%. It should not exceed 100%.`, 'error');
    }

    if (totalWeightCompleted === 0) {
        resultsDisplay.innerHTML = '<p>Please enter at least one score and weight to calculate your grade.</p>';
        return;
    }

    const currentGrade = (totalEarnedPoints / (totalWeightCompleted / 100)).toFixed(2);
    
    resultsDisplay.innerHTML = `
        <p><strong>Current Grade:</strong> ${currentGrade}%</p>
        <p><em>Based on ${totalWeightCompleted}% of your total course weight completed.</em></p>
    `;
}

gradeForm.addEventListener('submit', calculateGrade);