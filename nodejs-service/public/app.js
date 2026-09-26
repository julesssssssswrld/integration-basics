let current = '0';
let operand = null;
let operator = null;
let waitingForSecond = false;
let justCalculated = false;

const resultEl     = document.getElementById('result');
const expressionEl = document.getElementById('expression');

const opSymbols = { add: '+', subtract: '−', multiply: '×', divide: '÷', modulo: 'mod', power: '^' };

function updateDisplay(val) {
    resultEl.classList.remove('shrink', 'smaller', 'error');
    const s = String(val);
    if (s.length > 12)     resultEl.classList.add('smaller');
    else if (s.length > 9) resultEl.classList.add('shrink');
    resultEl.textContent = s;
}

function digit(d) {
    if (justCalculated)        { current = d; justCalculated = false; }
    else if (waitingForSecond) { current = d; waitingForSecond = false; }
    else { current = current === '0' ? d : current + d; }
    updateDisplay(current);
}

function decimal() {
    if (waitingForSecond)            { current = '0.'; waitingForSecond = false; }
    else if (!current.includes('.')) { current += '.'; }
    updateDisplay(current);
}

function clearAll() {
    current = '0'; operand = null; operator = null;
    waitingForSecond = false; justCalculated = false;
    expressionEl.textContent = '';
    updateDisplay('0');
}

function toggleSign() {
    current = String(parseFloat(current) * -1);
    updateDisplay(current);
}

function percent() {
    current = String(parseFloat(current) / 100);
    updateDisplay(current);
}

function setOp(op) {
    if (operator && !waitingForSecond) calculate(true);
    operand = parseFloat(current);
    operator = op;
    waitingForSecond = true;
    expressionEl.textContent = `${current} ${opSymbols[op] || op}`;
    justCalculated = false;
}

async function calculate(chain) {
    if (operator === null) return;
    const num2 = parseFloat(current);
    const num1 = operand;
    const op   = operator;
    expressionEl.textContent = `${num1} ${opSymbols[op] || op} ${chain ? '' : num2}`;

    try {
        const res  = await fetch('/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ num1, num2, operation: op })
        });
        const data = await res.json();
        if (data.python_result?.status === 'success') {
            const r = data.python_result.result;
            current = Number.isInteger(r) ? String(r) : parseFloat(r.toFixed(10)).toString();
            updateDisplay(current);
        } else {
            showError(data.python_result?.message || data.error || 'Error');
        }
    } catch {
        showError('Service unavailable');
    }

    if (!chain) { operator = null; operand = null; waitingForSecond = false; justCalculated = true; }
    else        { operand = parseFloat(current); waitingForSecond = true; }
}

async function doSqrt() {
    const num1 = parseFloat(current);
    expressionEl.textContent = `√(${num1})`;
    try {
        const res  = await fetch('/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ num1, num2: 0, operation: 'square_root' })
        });
        const data = await res.json();
        if (data.python_result?.status === 'success') {
            current = parseFloat(data.python_result.result.toFixed(10)).toString();
            updateDisplay(current);
        } else {
            showError(data.python_result?.message || 'Error');
        }
    } catch {
        showError('Service unavailable');
    }
    justCalculated = true;
}

function showError(msg) {
    resultEl.classList.add('error');
    resultEl.textContent = msg;
    current = '0';
}

document.addEventListener('keydown', e => {
    if (e.key >= '0' && e.key <= '9') digit(e.key);
    else if (e.key === '.')                        decimal();
    else if (e.key === '+')                        setOp('add');
    else if (e.key === '-')                        setOp('subtract');
    else if (e.key === '*')                        setOp('multiply');
    else if (e.key === '/') { e.preventDefault();  setOp('divide'); }
    else if (e.key === 'Enter' || e.key === '=')   calculate();
    else if (e.key === 'Escape')                   clearAll();
    else if (e.key === 'Backspace') {
        current = current.length > 1 ? current.slice(0, -1) : '0';
        updateDisplay(current);
    }
});

function toggleHistory() {
    const panel   = document.getElementById('historyPanel');
    const overlay = document.getElementById('overlay');
    const isOpen  = panel.classList.contains('open');
    if (isOpen) {
        panel.classList.remove('open');
        overlay.classList.remove('open');
    } else {
        loadHistory();
        panel.classList.add('open');
        overlay.classList.add('open');
    }
}

async function loadHistory() {
    const list = document.getElementById('historyList');
    list.innerHTML = '<div class="history-empty">Loading…</div>';
    try {
        const rows = await fetch('/api/history').then(r => r.json());
        if (!rows.length) {
            list.innerHTML = '<div class="history-empty">No history yet.</div>';
            return;
        }
        list.innerHTML = rows.map(r => `
            <div class="history-item">
                <div class="expr">${r.num1} ${opSymbols[r.operation] || r.operation} ${r.num2}</div>
                <div class="value ${r.status === 'error' ? 'is-error' : ''}">${r.result}</div>
                <div class="timestamp">${new Date(r.timestamp).toLocaleString()}</div>
            </div>
        `).join('');
    } catch {
        list.innerHTML = '<div class="history-empty" style="color:#dc2626">Failed to load.</div>';
    }
}

async function clearHistory() {
    try {
        await fetch('/api/history/clear', { method: 'DELETE' });
        document.getElementById('historyList').innerHTML = '<div class="history-empty">No history yet.</div>';
    } catch {
        alert('Failed to clear history.');
    }
}

async function checkStatus() {
    const nodeDot   = document.getElementById('nodeDot');
    const nodeBadge = document.getElementById('nodebadge');
    const pyDot     = document.getElementById('pyDot');
    const pyBadge   = document.getElementById('pybadge');

    try {
        const data     = await fetch('/api/status').then(r => r.json());
        const pythonOk = typeof data.python === 'object' && data.python.status;

        nodeDot.className   = 'badge-dot online';
        nodeBadge.className = 'status-badge online';

        pyDot.className   = 'badge-dot ' + (pythonOk ? 'online' : 'error');
        pyBadge.className = 'status-badge' + (pythonOk ? ' online' : '');
    } catch {
        nodeDot.className   = 'badge-dot error';
        nodeBadge.className = 'status-badge';

        pyDot.className   = 'badge-dot';
        pyBadge.className = 'status-badge';
    }
}

checkStatus();
setInterval(checkStatus, 60000);
