// 1. Grab all necessary elements from the DOM
const templateSelect = document.getElementById('course-template');
const loadBtn = document.getElementById('load-template-btn');
const assignmentsContainer = document.getElementById('assignments-container');
const gradeForm = document.getElementById('grade-form');
const resultsDisplay = document.getElementById('results-display');
const addRowBtn = document.getElementById('add-row-btn');
const fileInput = document.getElementById('custom-file-upload');
const customUploadSection = document.getElementById('custom-upload-section');
const statusMessage = document.getElementById('status-message');

// Visual Feedback helpers (displays in-page message banner instead of native alert)
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

// 2. The main Async function to fetch data
async function loadTemplate() {
    clearFeedback();
    const selectedTemplate = templateSelect.value;

    if (!selectedTemplate) {
        showFeedback("Please select a syllabus template first.", "error");
        return;
    }

    try {
        const response = await fetch('templates.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const templateData = data[selectedTemplate];

        if (templateData) {
            renderAssignments(templateData);
            const templateName = templateSelect.options[templateSelect.selectedIndex].text;
            showFeedback(`Loaded ${templateData.length} assignments from "${templateName}".`, "success");
        }
    } catch (error) {
        console.error("Error loading the JSON data:", error);
        showFeedback("Could not load templates. Make sure you are using a local web server (like VS Code Live Server).", "error");
    }
}

// Helper function to sanitize strings and prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// 3. Function to build and inject the HTML rows safely
function renderAssignments(assignments) {
    assignmentsContainer.innerHTML = '<legend>Assignment Scores</legend>';

    assignments.forEach((assignment, index) => {
        const rowNum = index + 1;
        const rowDiv = document.createElement('div');
        rowDiv.className = 'assignment-row';

        // Sanitize strings and enforce numbers
        const safeName = escapeHTML(assignment.name);
        const safeWeight = parseFloat(assignment.weight) || 0; 

        rowDiv.innerHTML = `
            <label for="assign-name-${rowNum}">Name</label>
            <input type="text" id="assign-name-${rowNum}" name="assign-name-${rowNum}" value="${safeName}">
            
            <label for="assign-weight-${rowNum}">Weight (%)</label>
            <input type="number" id="assign-weight-${rowNum}" name="assign-weight-${rowNum}" value="${safeWeight}" min="0" max="100" step="any" inputmode="decimal">
            
            <label for="assign-score-${rowNum}">Score</label>
            <input type="number" id="assign-score-${rowNum}" name="assign-score-${rowNum}" min="0" step="any" inputmode="decimal">
            
            <button type="button" class="remove-row-btn" aria-label="Remove Assignment ${rowNum}">Remove</button>
        `;
        assignmentsContainer.appendChild(rowDiv);
    });
}

function addBlankRow() {
    clearFeedback();
    const uniqueId = Date.now(); 
    const currentRows = assignmentsContainer.querySelectorAll('.assignment-row');
    const rowNum = currentRows.length + 1;

    const rowDiv = document.createElement('div');
    rowDiv.className = 'assignment-row';

    rowDiv.innerHTML = `
        <label for="assign-name-${uniqueId}">Name</label>
        <input type="text" id="assign-name-${uniqueId}" name="assign-name-${uniqueId}" placeholder="New Assignment">
        
        <label for="assign-weight-${uniqueId}">Weight (%)</label>
        <input type="number" id="assign-weight-${uniqueId}" name="assign-weight-${uniqueId}" min="0" max="100" step="any" inputmode="decimal">
        
        <label for="assign-score-${uniqueId}">Score</label>
        <input type="number" id="assign-score-${uniqueId}" name="assign-score-${uniqueId}" min="0" step="any" inputmode="decimal">
        
        <button type="button" class="remove-row-btn" aria-label="Remove Assignment ${rowNum}">Remove</button>
    `;
    assignmentsContainer.appendChild(rowDiv);

    // Visually shift focus to the newly added row
    const nameInput = rowDiv.querySelector('input[type="text"]');
    if (nameInput) {
        nameInput.focus();
    }
}

// 5. Function to calculate the final grade
function calculateGrade(event) {
    event.preventDefault();
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

        // Tally all entered weights to check for syllabus typos
        if (!isNaN(weight)) {
            totalSyllabusWeight += weight;
            
            // Only calculate points if a score is actually entered
            if (!isNaN(score)) {
                totalEarnedPoints += (score * (weight / 100));
                totalWeightCompleted += weight;
            }
        }
    });

    // Trigger the existing error banner if weights exceed 100%
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

// Listen for when the user selects a file
fileInput.addEventListener('change', function(event) {
    clearFeedback();
    const file = event.target.files[0];
    
    if (!file) return;

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

// 6. Attach all Event Listeners
loadBtn.addEventListener('click', loadTemplate);
addRowBtn.addEventListener('click', addBlankRow);
gradeForm.addEventListener('submit', calculateGrade);

// Row removal with visual focus preservation
assignmentsContainer.addEventListener('click', function(event) {
    if (event.target.classList.contains('remove-row-btn')) {
        const row = event.target.closest('.assignment-row');
        if (!row) return;

        // Preserve focus location so the user does not get lost
        const prevRow = row.previousElementSibling && row.previousElementSibling.classList.contains('assignment-row') ? row.previousElementSibling : null;
        const nextRow = row.nextElementSibling && row.nextElementSibling.classList.contains('assignment-row') ? row.nextElementSibling : null;

        let targetToFocus = null;
        if (nextRow) {
            targetToFocus = nextRow.querySelector('input');
        } else if (prevRow) {
            targetToFocus = prevRow.querySelector('input');
        } else {
            targetToFocus = addRowBtn;
        }

        row.remove();

        if (targetToFocus) {
            targetToFocus.focus();
        }
    }
});

// Listen for changes on the dropdown menu
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

// 7. Display current date and time in the header
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const formattedDateTime = now.toLocaleDateString(undefined, options);
    const dateTimeElement = document.getElementById('current-time');
    dateTimeElement.textContent = formattedDateTime;
}

// Update the date and time every second
setInterval(updateDateTime, 1000);
updateDateTime(); // Initial call