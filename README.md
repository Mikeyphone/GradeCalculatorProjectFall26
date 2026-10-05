# GradCalculatorProjectFall26
=== GRADER 4 YOU ===
This is a lightweight web application designed to help students calculate their current course standing and project what grades they need for finals.
It runs entirely in the browser using vanilla HTML, CSS, and JavaScript without the need for frameworks or a database.
--- HOW TO RUN THE APPLICATION ---
BASIC USAGE
Simply double-click the "index.html" file to open it directly in any modern web browser.

TEMPLATE LOADING REQUIREMENT
To use the "Load Course Template" feature, the application must be hosted on a local web server (such as the Live Server extension in VS Code). This is because the application uses asynchronous JavaScript to fetch the "templates.json" file, and web browsers block local file fetching by default for security reasons. All other features, including manual entry and custom JSON uploads, will work fully by just opening the HTML file directly.

--- FEATURE GUIDE ---
MANUAL GRADE ENTRY
Click the "+ Add Another Assignment" button to generate a new input row.   Fill in the assignment name, its weight (as a percentage of the total syllabus), and your earned score.   If you need to delete a row, click the red "Remove" button; the application will safely delete the row while keeping your cursor focused on the surrounding elements for easy keyboard navigation.
LOADING PRESET TEMPLATES
Choose a predefined syllabus structure from the dropdown menu, such as the TAMUCC Standard or Del Mar Project-Based options.  Click "Load Data" to automatically populate the calculator with the correct assignment names and weights.

UPLOADING CUSTOM TEMPLATES
Select "Upload Custom Template..." from the dropdown menu to reveal the file upload section.
Click the file input button and select a valid .json file from your computer. The application requires the file to contain a single array of assignments with "name" and "weight" properties to format correctly.

CALCULATING YOUR STANDING
Once your data is entered, click the "Calculate Grade" button at the bottom of the form.
The application intelligently calculates your current standing based only on the assignments that have a score entered. This means your calculated grade reflects exactly where you stand right now, without future blank assignments dragging your average down.
If the total sum of your entered weights exceeds 100%, an error banner will appear at the top of the screen to warn you of the typo.   