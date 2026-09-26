const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = 3000;
const PYTHON_URL = 'http://localhost:5001';
const CSV_FILE = path.join(__dirname, 'history.csv');

if (!fs.existsSync(CSV_FILE)) {
    fs.writeFileSync(CSV_FILE, 'timestamp,num1,num2,operation,result,status\n');
}

function logToCSV(num1, num2, operation, result, status) {
    const timestamp = new Date().toISOString();
    const row = `${timestamp},${num1},${num2},${operation},${result},${status}\n`;
    fs.appendFileSync(CSV_FILE, row);
}

app.get('/hello', (req, res) => {
    res.json({ message: 'Hello from Node.js Gateway!' });
});

app.post('/api/calculate', async (req, res) => {
    console.log('Node.js received:', req.body);
    try {
        const pythonResponse = await axios.post(`${PYTHON_URL}/calculate`, req.body);
        const { num1, num2, operation } = req.body;
        const result = pythonResponse.data.result;
        logToCSV(num1, num2, operation, result, 'success');
        res.json({
            gateway_message: 'Node.js successfully aggregated the data!',
            python_result: pythonResponse.data
        });
    } catch (error) {
        const { num1, num2, operation } = req.body;
        const errMsg = error.response?.data?.message || error.message;
        logToCSV(num1, num2, operation, errMsg, 'error');
        if (error.response) {
            res.status(error.response.status).json({
                gateway_message: 'Python returned an error.',
                python_result: error.response.data
            });
        } else {
            console.error('Error:', error.message);
            res.status(500).json({
                error: 'Failed to reach Python service. Is it running on port 5001?'
            });
        }
    }
});

app.get('/api/status', async (req, res) => {
    try {
        const ping = await axios.get(`${PYTHON_URL}/ping`);
        res.json({
            gateway: 'Node.js is running',
            python: ping.data
        });
    } catch (error) {
        res.status(500).json({
            gateway: 'Node.js is running',
            python: 'Python is NOT reachable'
        });
    }
});

app.get('/api/history', (req, res) => {
    if (!fs.existsSync(CSV_FILE)) {
        return res.json([]);
    }
    const lines = fs.readFileSync(CSV_FILE, 'utf8').trim().split('\n');
    const headers = lines[0].split(',');
    const rows = lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, h, i) => { obj[h] = values[i]; return obj; }, {});
    });
    res.json(rows.reverse());
});

app.delete('/api/history/clear', (req, res) => {
    fs.writeFileSync(CSV_FILE, 'timestamp,num1,num2,operation,result,status\n');
    res.json({ message: 'History cleared.' });
});

app.listen(PORT, () => {
    console.log(`Node.js Gateway: http://localhost:${PORT}`);
    console.log(`Python service:  ${PYTHON_URL}`);
});
