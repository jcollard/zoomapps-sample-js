import zoomSdk from '@zoom/appssdk';
import * as Base64 from 'js-base64';

var students = [];
var searchTable = {};
var added = new Set();

function splitName(name) {
    const parts = name.trim().split(/\s/);
    const first = parts[0];
    parts.shift();
    const last = parts[parts.length - 1];
    const student = { first: first, last: last, attendance: 'Not Taken' };
    return student;
}

function studentToRow(student) {
    let klass = '';
    student.attendance === 'Not in List' ? 'class="highlight-unknown"' : '';
    if (student.attendance === 'Not in List') {
        klass = 'class="highlight-unknown"';
    } else if (student.attendance === 'Present') {
        klass = 'class="highlight-present"';
    }
    return `<tr ${klass}><td >${student.last}</td><td>${student.first}</td><td>${student.attendance}</td></tr>`;
}

function processFile(event) {
    const data = event.target.result.split(',');
    // const type = data[0];
    const base64 = data[1];
    const text = Base64.decode(base64);
    const entries = text.split('\n');
    students = entries.filter((s) => s.length > 0).map((s) => splitName(s));
    buildSearchTable();
    updateTable();
    const attendanceButton = document.getElementById('attendance-button');
    attendanceButton.disabled = false;
    const downloadButton = document.getElementById('download-button');
    downloadButton.disabled = false;
    takeAttendance();
    setInterval(async () => takeAttendance(), 2500);
}

function buildSearchTable() {
    searchTable = {};
    for (let student of students) {
        const key =
            student.last.toLowerCase().trim() +
            student.first.toLowerCase().trim();
        searchTable[key] = student;
    }
}

function compareStudent(a, b) {
    if (a.attendance === 'Present' && b.attendance !== 'Present') return 1;
    if (b.attendance === 'Present' && a.attendance !== 'Present') return -1;
    return a.last < b.last ? -1 : 1;
}

function updateTable() {
    students.sort(compareStudent);
    const div = document.getElementById('attendance-table');
    const tableData = students.map(studentToRow).join('\n');
    div.innerHTML = `<table>
    <tr><td>Last</td><td>First</td><td>Status</td></tr>
    ${tableData}
    </table>`;

    const output =
        'data:text/csv;charset=utf-8,' +
        students
            .map(
                (student) =>
                    `${student.last},${student.first},${student.attendance}`
            )
            .join('\n');
    const encoded = encodeURI(output);
    var link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', 'my_data.csv');
    const downloadCSV = document.getElementById('download-button');
    downloadCSV.href = encoded;
    downloadCSV.download = `Attendance - ${new Date().toDateString()}`;
}

function uploadNameList() {
    const nameUpload = document.getElementById('attendance-file');
    const files = nameUpload.files;
    if (!files[0]) return;
    const fileReader = new FileReader();
    fileReader.addEventListener('load', processFile);
    fileReader.readAsDataURL(files[0]);
}

async function takeAttendance() {
    const participants = await zoomSdk.getMeetingParticipants();
    for (let participant of participants.participants) {
        const rawName = participant.screenName.toLowerCase().trim();
        if (tryFirstLast(rawName)) continue;
        if (tryLastFirst(rawName)) continue;
        addUnknownStudent(participant.screenName);
    }
    for (let student of students) {
        if (student.attendance === 'Not Taken') {
            student.attendance = 'Absent';
        }
    }
    updateTable();
}

function tryFirstLast(rawName) {
    const parts = rawName.split(/\s/);
    const first = parts[0];
    const last = parts[parts.length - 1];
    if (!searchTable[first + last]) return false;
    searchTable[first + last].attendance = 'Present';
    return true;
}

function tryLastFirst(rawName) {
    const parts = rawName.split(/\s/);
    const first = parts[0];
    const last = parts[parts.length - 1];
    if (!searchTable[last + first]) return false;
    searchTable[last + first].attendance = 'Present';
    return true;
}

function addUnknownStudent(rawName) {
    const unknown = { last: rawName, first: '', attendance: 'Not in List' };
    if (added.has(rawName)) return;
    added.add(rawName);
    students.push(unknown);
}

(async () => {
    try {
        const configResponse = await zoomSdk.config({
            size: { width: 480, height: 360 },
            capabilities: [
                /* Add Capabilities Here */
                'shareApp',
                'getMeetingParticipants',
            ],
        });

        console.debug('Zoom JS SDK Configuration', configResponse);

        const nameUpload = document.getElementById('attendance-file');
        nameUpload.addEventListener('change', () => uploadNameList());

        const attendanceButton = document.getElementById('attendance-button');
        attendanceButton.addEventListener('click', () => takeAttendance());
    } catch (e) {
        console.error(e);
    }
})();
