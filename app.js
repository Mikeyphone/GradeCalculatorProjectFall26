// 1. Grab all necessary elements from the DOM
const templateSelect = document.getElementById('course-template');
const loadBtn = document.getElementById('load-template-btn');
const assignmentsContainer = document.getElementById('assignments-container');
const gradeForm = document.getElementById('grade-form');
const resultsDisplay = document.getElementById('results-display');
const addRowBtn = document.getElementById('add-row-btn');

// 2. The main Async function to fetch data
async function loadTemplate() {
    const selectedTemplate = templateSelect.value;

    if (!selectedTemplate) {
        alert("Please select a syllabus template first.");
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
        }
    } catch (error) {
        console.error("Error loading the JSON data:", error);
        alert("Could not load templates. Make sure you are using a local web server (like VS Code Live Server).");
    }
}

// 3. Function to build and inject the HTML rows
function renderAssignments(assignments) {
    assignmentsContainer.innerHTML = '<legend>Assignment Scores</legend>';

    assignments.forEach((assignment, index) => {
        const rowNum = index + 1;
        const rowDiv = document.createElement('div');
        rowDiv.className = 'assignment-row';

        rowDiv.innerHTML = `
            <label for="assign-name-${rowNum}">Name</label>
            <input type="text" id="assign-name-${rowNum}" name="assign-name-${rowNum}" value="${assignment.name}">
            
            <label for="assign-weight-${rowNum}">Weight (%)</label>
            <input type="number" id="assign-weight-${rowNum}" name="assign-weight-${rowNum}" value="${assignment.weight}" min="0" max="100">
            
            <label for="assign-score-${rowNum}">Score</label>
            <input type="number" id="assign-score-${rowNum}" name="assign-score-${rowNum}" min="0">
            
            <button type="button" class="remove-row-btn" aria-label="Remove ${assignment.name}">Remove</button>
        `;
        assignmentsContainer.appendChild(rowDiv);
    });
}

function addBlankRow() {
    // We use Date.now() here to guarantee a unique ID even if rows were deleted
    const uniqueId = Date.now(); 
    const rowDiv = document.createElement('div');
    rowDiv.className = 'assignment-row';

    rowDiv.innerHTML = `
        <label for="assign-name-${uniqueId}">Name</label>
        <input type="text" id="assign-name-${uniqueId}" name="assign-name-${uniqueId}" placeholder="New Assignment">
        
        <label for="assign-weight-${uniqueId}">Weight (%)</label>
        <input type="number" id="assign-weight-${uniqueId}" name="assign-weight-${uniqueId}" min="0" max="100">
        
        <label for="assign-score-${uniqueId}">Score</label>
        <input type="number" id="assign-score-${uniqueId}" name="assign-score-${uniqueId}" min="0">
        
        <button type="button" class="remove-row-btn" aria-label="Remove assignment">Remove</button>
    `;
    assignmentsContainer.appendChild(rowDiv);
}

// 5. Function to calculate the final grade
function calculateGrade(event) {
    // This exact line is what stops the page from refreshing
    event.preventDefault();

    const rows = document.querySelectorAll('.assignment-row');
    let totalEarnedPoints = 0;
    let totalWeightEntered = 0;

    rows.forEach(row => {
        const weightInput = row.querySelector('input[name^="assign-weight"]');
        const scoreInput = row.querySelector('input[name^="assign-score"]');
        
        const weight = parseFloat(weightInput.value);
        const score = parseFloat(scoreInput.value);

        if (!isNaN(weight) && !isNaN(score)) {
            totalEarnedPoints += (score * (weight / 100));
            totalWeightEntered += weight;
        }
    });

    if (totalWeightEntered === 0) {
        resultsDisplay.innerHTML = '<p>Please enter at least one score and weight to calculate your grade.</p>';
        return;
    }

    const currentGrade = (totalEarnedPoints / (totalWeightEntered / 100)).toFixed(2);
    
    resultsDisplay.innerHTML = `
        <p><strong>Current Grade:</strong> ${currentGrade}%</p>
        <p><em>Based on ${totalWeightEntered}% of your total course weight completed.</em></p>
    `;
}

// 6. Attach all Event Listeners
loadBtn.addEventListener('click', loadTemplate);
addRowBtn.addEventListener('click', addBlankRow);
gradeForm.addEventListener('submit', calculateGrade);
assignmentsContainer.addEventListener('click', function(event) {
    // Check if the thing clicked was a remove button
    if (event.target.classList.contains('remove-row-btn')) {
        // Find the parent row and remove it from the DOM
        event.target.closest('.assignment-row').remove();
    }
});