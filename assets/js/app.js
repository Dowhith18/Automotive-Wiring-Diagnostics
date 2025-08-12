// Automotive Diagnostic Application JavaScript

// Application data
const appData = {
    vehicleMakes: ["Ford", "Chevrolet", "Toyota", "Honda", "BMW", "Mercedes-Benz", "Audi", "Nissan", "Hyundai", "Kia"],
    faultTypes: [
        {"name": "Wire Degradation", "severity": "Medium", "confidence": 0.87, "symptoms": ["Intermittent connection", "Voltage drop", "Resistance increase"]},
        {"name": "Connector Corrosion", "severity": "High", "confidence": 0.92, "symptoms": ["High resistance", "Signal loss", "DTC codes"]},
        {"name": "Terminal Crimping Failure", "severity": "Low", "confidence": 0.34, "symptoms": ["Intermittent connection", "Complete signal loss"]},
        {"name": "Insulation Failure", "severity": "High", "confidence": 0.78, "symptoms": ["Short circuits", "Blown fuses"]},
        {"name": "EMI Issues", "severity": "Medium", "confidence": 0.56, "symptoms": ["Signal disruption", "False readings"]}
    ],
    diagnosticSteps: [
        {"step": 1, "title": "Visual Inspection", "description": "Examine wiring harness for obvious damage", "estimated_time": "5-10 minutes"},
        {"step": 2, "title": "Electrical Testing", "description": "Measure resistance and continuity", "estimated_time": "10-15 minutes"},
        {"step": 3, "title": "Environmental Check", "description": "Assess moisture, temperature, vibration factors", "estimated_time": "5 minutes"},
        {"step": 4, "title": "System Scan", "description": "Perform comprehensive ECU scan", "estimated_time": "15-20 minutes"}
    ],
    sampleSensorData: {"engine_rpm": 2150, "coolant_temp": 195, "battery_voltage": 12.4, "alternator_output": 13.8, "intake_air_temp": 85, "throttle_position": 23},
    dtcCodes: ["P0171", "P0174", "P0300", "P0420", "P0440"]
};

// Application state
let currentTheme = 'dark';
let sensorChart = null;
let vehicleData = {};
let diagnosticResults = [];

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupThemeToggle();
    setupNavigation();
    setupVehicleForm();
    setupDiagnosticForm();
    setupDiagnosticSteps();
    initializeSensorData();
    initializeChart();
    populateDTCChips();
    setupEventListeners();
    
    // Add initial alerts
    addAlert('System initialized successfully', 'success');
    addAlert('Ready for vehicle diagnostics', 'info');
}

// Theme Management
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    
    themeToggle.addEventListener('click', function() {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-color-scheme', currentTheme);
        
        if (currentTheme === 'light') {
            themeIcon.textContent = '🌙';
            themeToggle.innerHTML = '<span id="themeIcon">🌙</span> Dark Mode';
        } else {
            themeIcon.textContent = '☀️';
            themeToggle.innerHTML = '<span id="themeIcon">☀️</span> Light Mode';
        }
        
        // Reinitialize chart with new theme
        if (sensorChart) {
            sensorChart.destroy();
            initializeChart();
        }
    });
}

// Navigation Management
function setupNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            navTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// Vehicle Form Management
function setupVehicleForm() {
    const makeSelect = document.getElementById('make');
    const vehicleForm = document.getElementById('vehicleForm');
    
    // Populate vehicle makes
    appData.vehicleMakes.forEach(make => {
        const option = document.createElement('option');
        option.value = make;
        option.textContent = make;
        makeSelect.appendChild(option);
    });
    
    // Handle form submission
    vehicleForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        vehicleData = {
            vin: formData.get('vin') || document.getElementById('vin').value,
            make: formData.get('make') || document.getElementById('make').value,
            model: formData.get('model') || document.getElementById('model').value,
            year: formData.get('year') || document.getElementById('year').value
        };
        
        // Validate VIN
        if (vehicleData.vin && vehicleData.vin.length !== 17) {
            addAlert('VIN must be exactly 17 characters', 'error');
            return;
        }
        
        addAlert('Vehicle information saved successfully', 'success');
        
        // Update dashboard
        updateDashboard();
    });
}

// Diagnostic Form Management
function setupDiagnosticForm() {
    const runDiagnosticBtn = document.getElementById('runDiagnostic');
    
    runDiagnosticBtn.addEventListener('click', function() {
        const dtcCodes = document.getElementById('dtcCodes').value;
        const symptoms = document.getElementById('symptoms').value;
        
        if (!dtcCodes && !symptoms) {
            addAlert('Please enter DTC codes or symptoms to run analysis', 'warning');
            return;
        }
        
        runMLAnalysis(dtcCodes, symptoms);
    });
}

// DTC Chips
function populateDTCChips() {
    const dtcChipsContainer = document.getElementById('dtcChips');
    
    appData.dtcCodes.forEach(code => {
        const chip = document.createElement('div');
        chip.className = 'dtc-chip';
        chip.textContent = code;
        chip.addEventListener('click', function() {
            const dtcInput = document.getElementById('dtcCodes');
            const currentValue = dtcInput.value;
            const newValue = currentValue ? `${currentValue}, ${code}` : code;
            dtcInput.value = newValue;
        });
        dtcChipsContainer.appendChild(chip);
    });
}

// ML Analysis
function runMLAnalysis(dtcCodes, symptoms) {
    addAlert('Running ML analysis...', 'info');
    
    // Simulate processing time
    setTimeout(() => {
        const predictions = generatePredictions(dtcCodes, symptoms);
        displayPredictions(predictions);
        generateResults(predictions);
        
        // Update dashboard
        document.getElementById('faultCount').textContent = predictions.length;
        
        addAlert(`Analysis complete - ${predictions.length} potential issues detected`, 'success');
        
        // Automatically switch to predictions tab
        document.querySelector('[data-tab="predictions"]').click();
    }, 2000);
}

function generatePredictions(dtcCodes, symptoms) {
    // Simulate ML prediction logic
    const relevantFaults = appData.faultTypes.filter(fault => {
        // Simple matching logic for demonstration
        return Math.random() > 0.3; // Random selection for demo
    });
    
    return relevantFaults.map(fault => ({
        ...fault,
        confidence: Math.max(0.3, fault.confidence + (Math.random() - 0.5) * 0.2)
    })).sort((a, b) => b.confidence - a.confidence);
}

function displayPredictions(predictions) {
    const container = document.getElementById('predictionsContainer');
    container.innerHTML = '';
    
    if (predictions.length === 0) {
        container.innerHTML = '<div class="card"><div class="card__body"><p>No significant fault predictions found.</p></div></div>';
        return;
    }
    
    predictions.forEach(prediction => {
        const card = document.createElement('div');
        card.className = `prediction-card severity-${prediction.severity.toLowerCase()}`;
        
        card.innerHTML = `
            <div class="prediction-header">
                <h3 class="prediction-title">${prediction.name}</h3>
                <span class="status status--${getSeverityStatus(prediction.severity)}">${prediction.severity}</span>
            </div>
            <div class="confidence-meter">
                <span class="confidence-label">Confidence:</span>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${prediction.confidence * 100}%"></div>
                </div>
                <span class="confidence-value">${Math.round(prediction.confidence * 100)}%</span>
            </div>
            <div class="symptoms-list">
                ${prediction.symptoms.map(symptom => `<span class="symptom-tag">${symptom}</span>`).join('')}
            </div>
        `;
        
        container.appendChild(card);
    });
}

function getSeverityStatus(severity) {
    switch (severity.toLowerCase()) {
        case 'high': return 'error';
        case 'medium': return 'warning';
        case 'low': return 'success';
        default: return 'info';
    }
}

// Diagnostic Steps
function setupDiagnosticSteps() {
    const stepsContainer = document.getElementById('diagnosticSteps');
    
    appData.diagnosticSteps.forEach((step, index) => {
        const stepCard = document.createElement('div');
        stepCard.className = 'step-card';
        
        stepCard.innerHTML = `
            <div class="step-header" onclick="toggleStep(${index})">
                <div class="step-number">${step.step}</div>
                <h3 class="step-title">${step.title}</h3>
                <span class="step-time">${step.estimated_time}</span>
            </div>
            <div class="step-content hidden" id="step-content-${index}">
                <p>${step.description}</p>
                <button class="btn btn--outline btn--sm" onclick="markStepComplete(${index})">Mark Complete</button>
            </div>
        `;
        
        stepsContainer.appendChild(stepCard);
    });
}

function toggleStep(index) {
    const stepContent = document.getElementById(`step-content-${index}`);
    stepContent.classList.toggle('hidden');
}

function markStepComplete(index) {
    const stepCard = document.querySelectorAll('.step-card')[index];
    stepCard.style.opacity = '0.7';
    stepCard.querySelector('.step-number').style.background = 'var(--color-success)';
    addAlert(`Step ${index + 1} marked as complete`, 'success');
}

// Sensor Data Management
function initializeSensorData() {
    updateSensorDisplay();
    
    // Update sensor data every 3 seconds
    setInterval(updateSensorData, 3000);
}

function updateSensorData() {
    // Simulate sensor data changes
    Object.keys(appData.sampleSensorData).forEach(key => {
        const baseValue = appData.sampleSensorData[key];
        const variation = baseValue * 0.1; // 10% variation
        appData.sampleSensorData[key] = baseValue + (Math.random() - 0.5) * variation;
    });
    
    updateSensorDisplay();
    updateChart();
}

function updateSensorDisplay() {
    const sensorGrid = document.getElementById('sensorGrid');
    sensorGrid.innerHTML = '';
    
    const sensorConfigs = {
        engine_rpm: { name: 'Engine RPM', unit: 'rpm' },
        coolant_temp: { name: 'Coolant Temp', unit: '°F' },
        battery_voltage: { name: 'Battery Voltage', unit: 'V' },
        alternator_output: { name: 'Alternator Output', unit: 'V' },
        intake_air_temp: { name: 'Intake Air Temp', unit: '°F' },
        throttle_position: { name: 'Throttle Position', unit: '%' }
    };
    
    Object.entries(appData.sampleSensorData).forEach(([key, value]) => {
        const config = sensorConfigs[key];
        const sensorCard = document.createElement('div');
        sensorCard.className = 'sensor-card';
        
        sensorCard.innerHTML = `
            <div class="sensor-card__header">
                <span class="sensor-card__title">${config.name}</span>
            </div>
            <div class="sensor-card__value">
                ${Math.round(value * 10) / 10}
                <span class="sensor-card__unit">${config.unit}</span>
            </div>
        `;
        
        sensorGrid.appendChild(sensorCard);
    });
}

// Chart Management
function initializeChart() {
    const ctx = document.getElementById('realtimeChart').getContext('2d');
    const isDark = currentTheme === 'dark';
    
    sensorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 10}, (_, i) => `${i * 3}s`),
            datasets: [{
                label: 'Engine RPM',
                data: Array.from({length: 10}, () => Math.random() * 1000 + 1500),
                borderColor: '#ff8c00',
                backgroundColor: 'rgba(255, 140, 0, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: isDark ? '#f5f5f5' : '#134252'
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: isDark ? '#f5f5f5' : '#134252'
                    },
                    grid: {
                        color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: isDark ? '#f5f5f5' : '#134252'
                    },
                    grid: {
                        color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
}

function updateChart() {
    if (!sensorChart) return;
    
    const newData = Math.round(appData.sampleSensorData.engine_rpm);
    sensorChart.data.datasets[0].data.shift();
    sensorChart.data.datasets[0].data.push(newData);
    sensorChart.update('none');
}

// Results Generation
function generateResults(predictions) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    const summaryCard = document.createElement('div');
    summaryCard.className = 'results-summary';
    summaryCard.innerHTML = `
        <h3>Diagnostic Summary</h3>
        <p><strong>Vehicle:</strong> ${vehicleData.year || 'N/A'} ${vehicleData.make || 'N/A'} ${vehicleData.model || 'N/A'}</p>
        <p><strong>Analysis Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Issues Detected:</strong> ${predictions.length}</p>
        <p><strong>Highest Priority:</strong> ${predictions[0]?.severity || 'None'}</p>
    `;
    
    const resultsGrid = document.createElement('div');
    resultsGrid.className = 'results-grid';
    
    predictions.forEach((prediction, index) => {
        const recommendationCard = document.createElement('div');
        recommendationCard.className = 'recommendation-card';
        
        const priority = prediction.severity.toLowerCase();
        recommendationCard.innerHTML = `
            <div class="recommendation-header">
                <div class="priority-indicator priority-${priority}"></div>
                <h4>${prediction.name}</h4>
                <span class="confidence-value">${Math.round(prediction.confidence * 100)}%</span>
            </div>
            <p><strong>Recommended Action:</strong> ${getRecommendation(prediction)}</p>
            <p><strong>Estimated Cost:</strong> ${getEstimatedCost(prediction)}</p>
            <p><strong>Urgency:</strong> ${getUrgency(prediction.severity)}</p>
        `;
        
        resultsGrid.appendChild(recommendationCard);
    });
    
    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(summaryCard);
    resultsContainer.appendChild(resultsGrid);
}

function getRecommendation(prediction) {
    const recommendations = {
        'Wire Degradation': 'Inspect and replace damaged wire sections',
        'Connector Corrosion': 'Clean connectors and apply dielectric grease',
        'Terminal Crimping Failure': 'Re-crimp or replace affected terminals',
        'Insulation Failure': 'Replace damaged wire harness sections',
        'EMI Issues': 'Check for proper shielding and grounding'
    };
    return recommendations[prediction.name] || 'Consult technical manual for specific guidance';
}

function getEstimatedCost(prediction) {
    const costs = {
        'Wire Degradation': '$150-300',
        'Connector Corrosion': '$50-150',
        'Terminal Crimping Failure': '$75-200',
        'Insulation Failure': '$200-500',
        'EMI Issues': '$100-250'
    };
    return costs[prediction.name] || '$100-400';
}

function getUrgency(severity) {
    switch (severity.toLowerCase()) {
        case 'high': return 'Immediate attention required';
        case 'medium': return 'Address within 1-2 weeks';
        case 'low': return 'Monitor and address during next service';
        default: return 'As needed';
    }
}

// Alert System
function addAlert(message, type = 'info') {
    const alertsList = document.getElementById('alertsList');
    const alert = document.createElement('div');
    alert.className = `alert alert--${type}`;
    alert.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; margin-left: auto;">&times;</button>
    `;
    alert.style.display = 'flex';
    alert.style.justifyContent = 'space-between';
    alert.style.alignItems = 'center';
    
    alertsList.insertBefore(alert, alertsList.firstChild);
    
    // Remove alert after 5 seconds
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
    
    // Keep only last 5 alerts
    const alerts = alertsList.querySelectorAll('.alert');
    if (alerts.length > 5) {
        alerts[alerts.length - 1].remove();
    }
}

// Dashboard Updates
function updateDashboard() {
    // Update vehicle count and status based on form completion
    if (vehicleData.vin) {
        addAlert('Vehicle connected successfully', 'success');
        
        // Update diagnostic status
        const statusElements = document.querySelectorAll('.status');
        statusElements.forEach(status => {
            if (status.textContent === 'Ready to Scan') {
                status.textContent = 'Vehicle Connected';
                status.className = 'status status--success';
            }
        });
    }
}

// Event Listeners
function setupEventListeners() {
    // Export report functionality
    document.getElementById('exportReport').addEventListener('click', function() {
        if (diagnosticResults.length === 0) {
            addAlert('No diagnostic data to export. Run analysis first.', 'warning');
            return;
        }
        
        // Simulate report export
        addAlert('Diagnostic report exported successfully', 'success');
        
        // In a real application, this would generate and download a PDF
        const reportData = {
            vehicle: vehicleData,
            timestamp: new Date().toISOString(),
            sensorData: appData.sampleSensorData,
            predictions: diagnosticResults
        };
        
        console.log('Report data:', reportData);
    });
    
    // VIN input formatting
    document.getElementById('vin').addEventListener('input', function(e) {
        e.target.value = e.target.value.toUpperCase();
    });
}