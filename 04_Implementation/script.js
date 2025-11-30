let myChart;
let confirmCallback = null;

document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    renderChart();
});

function showModal(type, title, message, callback = null) {
    const modal = document.getElementById('custom-modal');
    const iconEl = document.getElementById('modal-icon');
    const titleEl = document.getElementById('modal-title');
    const msgEl = document.getElementById('modal-message');
    const btnContainer = document.getElementById('modal-buttons');

    titleEl.innerText = title;
    msgEl.innerText = message;
    confirmCallback = callback;

    if (type === 'error') {
        iconEl.innerHTML = '<i class="fa-solid fa-circle-exclamation" style="color: #eab308;"></i>';
        btnContainer.innerHTML = `<button class="btn-modal btn-ok" onclick="closeModal()">ตกลง</button>`;
    } else if (type === 'confirm') {
        iconEl.innerHTML = '<i class="fa-solid fa-trash-can" style="color: #ef4444;"></i>';
        btnContainer.innerHTML = `
                    <button class="btn-modal btn-cancel" onclick="closeModal()">ยกเลิก</button>
                    <button class="btn-modal btn-confirm-delete" onclick="executeConfirm()">ลบเลย</button>
                `;
    }
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('custom-modal').classList.remove('active');
    confirmCallback = null;
}

function executeConfirm() {
    if (confirmCallback) confirmCallback();
    closeModal();
}

function calculateBMI() {
    const weightInput = document.getElementById('weight');
    const heightInput = document.getElementById('height');

    const weight = parseFloat(weightInput.value);
    const height = parseFloat(heightInput.value);

    if (!weight || !height || weight <= 0 || height <= 0) {
        showModal('error', 'ข้อมูลไม่ครบถ้วน', 'กรุณากรอกน้ำหนักและส่วนสูงให้ถูกต้อง');
        return;
    }

    const bmiRaw = weight / ((height / 100) ** 2);
    const bmi = bmiRaw.toFixed(2);

    let status = 'ปกติ';
    let color = '#22c55e';
    if (bmi < 18.5) { status = 'ผอม'; color = '#3b82f6'; }
    else if (bmi >= 23 && bmi < 25) { status = 'ท้วม'; color = '#eab308'; }
    else if (bmi >= 25) { status = 'อ้วน'; color = '#ef4444'; }

    animateValue("bmi-value", 0, bmiRaw, 1000);

    const statusBadge = document.getElementById('bmi-status');
    statusBadge.innerText = status;
    statusBadge.style.backgroundColor = color;
    statusBadge.style.color = "white";
    statusBadge.style.boxShadow = `0 4px 10px ${color}60`;

    saveRecord(weight, height, bmi, status);

    weightInput.value = '';
    heightInput.value = '';
}

function saveRecord(w, h, bmi, status) {
    const record = {
        id: Date.now(),
        date: new Date().toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        weight: w, height: h, bmi: bmi, status: status
    };

    const history = JSON.parse(localStorage.getItem('bmiHistory')) || [];
    history.push(record);
    localStorage.setItem('bmiHistory', JSON.stringify(history));

    loadHistory();
    renderChart();
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('bmiHistory')) || [];
    const tbody = document.getElementById('history-list');
    tbody.innerHTML = '';

    history.slice().reverse().forEach(item => {
        let color = '#22c55e';
        const bmi = parseFloat(item.bmi);
        if (bmi < 18.5) { color = '#3b82f6'; }
        else if (bmi >= 23 && bmi < 25) { color = '#eab308'; }
        else if (bmi >= 25) { color = '#ef4444'; }

        const statusBadgeHtml = `
                    <span style="
                        background-color: ${color}20; 
                        color: ${color}; 
                        padding: 4px 12px; 
                        border-radius: 20px; 
                        font-size: 0.9em; 
                        font-weight: 600;
                        display: inline-block;
                        border: 1px solid ${color}40;
                    ">
                        ${item.status}
                    </span>
                `;

        tbody.innerHTML += `
                    <tr>
                        <td>${item.date}</td>
                        <td>${item.bmi}</td>
                        <td>${statusBadgeHtml}</td>
                        <td><i class="fa-solid fa-trash" style="color:#ef4444; cursor:pointer; transition:0.2s;" onclick="promptDelete(${item.id})"></i></td>
                    </tr>
                `;
    });
}

function promptDelete(id) {
    showModal('confirm', 'ยืนยันการลบ', 'คุณต้องการลบประวัติรายการนี้ใช่หรือไม่?', () => {
        const history = JSON.parse(localStorage.getItem('bmiHistory')) || [];
        const newHistory = history.filter(item => item.id !== id);
        localStorage.setItem('bmiHistory', JSON.stringify(newHistory));
        loadHistory();
        renderChart();
    });
}

function confirmClearAll() {
    showModal('confirm', 'ล้างข้อมูลทั้งหมด', 'ประวัติการคำนวณทั้งหมดจะหายไป คุณแน่ใจหรือไม่?', () => {
        localStorage.removeItem('bmiHistory');
        location.reload();
    });
}

function renderChart() {
    const ctx = document.getElementById('bmiChart');
    if (!ctx) return;

    const history = JSON.parse(localStorage.getItem('bmiHistory')) || [];
    const sortedHistory = history.slice().sort((a, b) => a.id - b.id);
    const recentData = sortedHistory.slice(-10);

    const labels = recentData.map(item => item.date);
    const dataPoints = recentData.map(item => item.bmi);

    if (myChart) myChart.destroy();

    Chart.defaults.color = '#64748b';
    Chart.defaults.borderColor = '#f1f5f9';

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'BMI Trend',
                data: dataPoints,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#3b82f6',
                pointRadius: 5,
                pointHoverRadius: 7,
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: false,
                    suggestedMin: 15,
                    suggestedMax: 35,
                    grid: { borderDash: [4, 4] }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerText = (progress * (end - start) + start).toFixed(2);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}