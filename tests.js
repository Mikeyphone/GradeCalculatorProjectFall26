/*
This is a simple test suite for the "Grader 4 You" application.
It runs a series of automated tests to verify that the core functionalities of the grade calculator work as expected.
The tests are executed in the browser console and provide immediate feedback on pass/fail status.
*/

// tests.js

// A simple assertion function to log results to the browser console
function assert(condition, testName) {
    if (condition) {
        console.log(`%c✔ PASS: ${testName}`, "color: #16a34a; font-weight: bold;");
    } else {
        console.error(`❌ FAIL: ${testName}`);
    }
}

// Main test suite
async function runTestSuite() {
    console.log("%c Starting Grader 4 You Automated Tests...", "background: #2563eb; color: white; padding: 4px; font-weight: bold; font-size: 14px;");

    const container = document.getElementById('assignments-container');
    const addBtn = document.getElementById('add-row-btn');
    const form = document.getElementById('grade-form');
    const results = document.getElementById('results-display');
    const statusBanner = document.getElementById('status-message');

    // Helper: Reset the UI before each test
    function resetUI() {
        container.innerHTML = '<legend>Assignment Scores</legend>';
        results.innerHTML = '<p>Your calculated grade will appear here.</p>';
        if (typeof clearFeedback === "function") clearFeedback();
    }

    // Helper: Add a row and fill it with data
    function fillRow(name, weight, score) {
        addBtn.click();
        const rows = document.querySelectorAll('.assignment-row');
        const latestRow = rows[rows.length - 1];
        
        latestRow.querySelector('input[name^="assign-name"]').value = name;
        latestRow.querySelector('input[name^="assign-weight"]').value = weight;
        if (score !== null) {
            latestRow.querySelector('input[name^="assign-score"]').value = score;
        }
    }

    // --- TEST CASES ---

    // Test 1: Standard Calculation
    resetUI();
    fillRow('Midterm', 50, 90);
    fillRow('Final', 50, 100);
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    
    assert(
        results.textContent.includes('95.00%'), 
        "Standard Calculation: 90% and 100% at equal weights should average to 95.00%"
    );

    // Test 2: Missing/Incomplete Scores
    resetUI();
    fillRow('Homework 1', 20, 100);
    fillRow('Homework 2', 20, null); // Blank score
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    assert(
        results.textContent.includes('100.00%') && results.textContent.includes('Based on 20%'), 
        "Partial Data: Should only calculate based on completed weights (100% on 20% of the syllabus)"
    );

    // Test 3: Weight Exceeds 100% Warning
    resetUI();
    fillRow('Midterm', 60, 100);
    fillRow('Final', 60, 100);
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    assert(
        statusBanner.style.display === 'block' && statusBanner.textContent.includes('120%'),
        "Validation: Should trigger error banner if total syllabus weight exceeds 100%"
    );

    // Test 4: Decimal and Edge Case Math
    resetUI();
    fillRow('Quiz', 33.3, 85.5);
    fillRow('Project', 66.7, 92);
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    assert(
        results.textContent.includes('89.84%'),
        "Decimal Math: (85.5 * 0.333) + (92 * 0.667) should calculate precisely"
    );

    // Test 5: Row Removal Recalculation
    resetUI();
    fillRow('Keep Me', 50, 100);
    fillRow('Delete Me', 50, 0); // This would drag the grade to 50%
    
    // Simulate clicking the remove button on the second row
    const rows = document.querySelectorAll('.assignment-row');
    rows[1].querySelector('.remove-row-btn').click();
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    assert(
        results.textContent.includes('100.00%'),
        "DOM Management: Deleting a row should remove its data from the final calculation"
    );

    console.log("%c Tests Complete. ", "background: #166534; color: white; padding: 4px; font-weight: bold;");
    
    // Clean up the UI after tests so the user can interact normally
    resetUI();
    addBtn.click();
}

// Run tests automatically after the DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
    // Adding a slight delay to ensure app.js has initialized
    setTimeout(runTestSuite, 500);
});