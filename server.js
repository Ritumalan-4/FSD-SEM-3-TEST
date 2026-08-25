const http = require('http');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'students.json');

// Helper to ensure students.json exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

const server = http.createServer((req, res) => {
    const { method, url } = req;

    // 1 & 2. GET / -> Serve Welcome Message & HTML Form
    if (url === '/' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Student Record System</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    form { display: flex; flex-direction: column; width: 300px; gap: 10px; }
                    input { padding: 8px; }
                    button { padding: 10px; background-color: #28a745; color: white; border: none; cursor: pointer; }
                    a { display: inline-block; margin-top: 15px; }
                </style>
            </head>
            <body>
                <h1>Welcome to the Student Record System</h1>
                <h3>Add New Student</h3>
                <form action="/add-student" method="POST">
                    <input type="text" name="name" placeholder="Student Name" required />
                    <input type="text" name="rollNo" placeholder="Roll Number" required />
                    <input type="text" name="course" placeholder="Course" required />
                    <input type="email" name="email" placeholder="Email" required />
                    <button type="submit">Add Student</button>
                </form>
                <a href="/students">View All Student Records</a>
            </body>
            </html>
        `);
    }

    // 3. POST /add-student -> Handle Form Submission & Save to students.json
    else if (url === '/add-student' && method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const formData = querystring.parse(body);

            // Read existing records
            fs.readFile(DATA_FILE, 'utf8', (err, data) => {
                let students = [];
                if (!err && data) {
                    try {
                        students = JSON.parse(data);
                    } catch (e) {
                        students = [];
                    }
                }

                // Add new student entry
                students.push(formData);

                // Write updated array back to file
                fs.writeFile(DATA_FILE, JSON.stringify(students, null, 2), (err) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Failed to save student record.');
                        return;
                    }
                    // Redirect back to main page or /students after success
                    res.writeHead(302, { 'Location': '/students' });
                    res.end();
                });
            });
        });
    }

    // 4. GET /students -> Display Saved Student Records
    else if (url === '/students' && method === 'GET') {
        fs.readFile(DATA_FILE, 'utf8', (err, data) => {
            let students = [];
            if (!err && data) {
                try {
                    students = JSON.parse(data);
                } catch (e) {
                    students = [];
                }
            }

            let tableRows = students.map(s => `
                <tr>
                    <td style="border: 1px solid #ccc; padding: 8px;">${s.name || ''}</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">${s.rollNo || ''}</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">${s.course || ''}</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">${s.email || ''}</td>
                </tr>
            `).join('');

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Student Records</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; }
                        table { border-collapse: collapse; width: 600px; margin-bottom: 20px; }
                        th { border: 1px solid #ccc; padding: 8px; background-color: #f4f4f4; text-align: left; }
                    </style>
                </head>
                <body>
                    <h2>Student Records</h2>
                    ${students.length > 0 ? `
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Roll Number</th>
                                    <th>Course</th>
                                    <th>Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    ` : '<p>No student records found.</p>'}
                    <a href="/">Add Another Student</a>
                </body>
                </html>
            `);
        });
    }

    // 404 Route
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});