// Ford Pro Diagnostics - Professional Automotive Service Tool JavaScript

// Ford Application Data and Configuration
const FordDiagnostics = {
    // Vehicle and sensor data from provided JSON
    vehicleData: {
        make: "Ford",
        model: "F-150", 
        year: 2024,
        vin: "1FTEW1EP8LFC12345",
        engine: "3.5L EcoBoost V6",
        electricalSystem: "12V"
    },
    
    // Live sensor data that updates in real-time
    sensorData: {
        battery_voltage: { value: 12.6, unit: "V", min: 12.0, max: 14.4, status: "normal" },
        engine_rpm: { value: 750, unit: "RPM", min: 0, max: 6000, status: "normal" },
        coolant_temp: { value: 195, unit: "°F", min: 160, max: 220, status: "normal" },
        oil_pressure: { value: 45, unit: "PSI", min: 20, max: 80, status: "normal" },
        intake_air_temp: { value: 75, unit: "°F", min: -40, max: 150, status: "normal" },
        throttle_position: { value: 0, unit: "%", min: 0, max: 100, status: "normal" }
    },
    
    // DTC codes from provided data
    dtcCodes: [
        { code: "P0171", description: "System Too Lean (Bank 1)", severity: "medium", system: "Fuel System" },
        { code: "P0420", description: "Catalyst System Efficiency Below Threshold", severity: "low", system: "Emissions" },
        { code: "P0300", description: "Random/Multiple Cylinder Misfire Detected", severity: "high", system: "Ignition" }
    ],
    
    // ML fault predictions from provided data
    faultPredictions: [
        { fault: "O2 Sensor Degradation", confidence: 0.89, severity: "medium", probability: 89, components: ["Oxygen Sensor", "Wiring Harness"] },
        { fault: "Catalytic Converter Efficiency", confidence: 0.67, severity: "low", probability: 67, components: ["Catalytic Converter"] },
        { fault: "Fuel Injection System", confidence: 0.34, severity: "low", probability: 34, components: ["Fuel Injectors", "Fuel Rail"] }
    ],
    
    // Diagnostic steps from provided data
    diagnosticSteps: [
        { step: 1, title: "Visual Inspection", description: "Perform comprehensive visual inspection of engine bay and wiring", duration: "10-15 minutes", tools: ["Flashlight", "Mirror"], status: "pending" },
        { step: 2, title: "OBD System Scan", description: "Connect OBD scanner and retrieve all diagnostic trouble codes", duration: "5-10 minutes", tools: ["OBD Scanner"], status: "pending" },
        { step: 3, title: "Live Data Analysis", description: "Monitor live sensor data for anomalies and patterns", duration: "15-20 minutes", tools: ["OBD Scanner", "Multimeter"], status: "pending" },
        { step: 4, title: "Component Testing", description: "Test specific components based on diagnostic findings", duration: "20-30 minutes", tools: ["Multimeter", "Oscilloscope"], status: "pending" }
    ]
};

// Application State
let isConnected = false;
let liveDataInterval = null;
let liveChart = null;
let currentChartSensor = 'engine_rpm';
let chartData = [];
let alertCount = 0;
let scanStartTime = null;
let dataPointCount = 0;
let currentActiveTab = 'dashboard';

// Initialize Ford Diagnostics Application
document.addEventListener('DOMContentLoaded', function() {
    initializeFordApp();
});

function initializeFordApp() {
    console.log('Initializing Ford Pro Diagnostics...');
    
    // Wait for DOM to be fully loaded
    setTimeout(() => {
        setupNavigation();
        setupEventListeners();
        populateVehicleForm();
        initializeDashboard();
        initializeLiveChart();
        populateDTCCodes();
        populateFaultPredictions();
        populateServiceManual();
        startLiveDataUpdates();
        updateClock();
        
        // Add initial system alerts
        addAlert('Ford Pro Diagnostics system initialized', 'success');
        addAlert('OBD interface ready for connection', 'info');
        
        console.log('Ford Pro Diagnostics initialized successfully');
    }, 100);
}

// Navigation Management - Fixed
function setupNavigation() {
    const navTabs = document.querySelectorAll('.ford-nav-tab');
    const tabContents = document.querySelectorAll('.ford-tab-content');
    
    console.log('Setting up navigation...', navTabs.length, 'tabs found');
    
    navTabs.forEach((tab, index) => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const targetTab = this.getAttribute('data-tab');
            console.log('Tab clicked:', targetTab);
            
            if (!targetTab) return;
            
            // Remove active class from all tabs and contents
            navTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Show corresponding content
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
                currentActiveTab = targetTab;
                console.log('Switched to tab:', targetTab);
                
                // Special handling for different tabs
                if (targetTab === 'diagnostic' && liveChart) {
                    setTimeout(() => {
                        if (liveChart.resize) liveChart.resize();
                    }, 100);
                }
            } else {
                console.error('Tab content not found for:', targetTab);
            }
        });
    });
    
    // Ensure dashboard is active by default
    const dashboardTab = document.querySelector('[data-tab="dashboard"]');
    const dashboardContent = document.getElementById('dashboard');
    if (dashboardTab && dashboardContent) {
        dashboardTab.classList.add('active');
        dashboardContent.classList.add('active');
    }
}

// Event Listeners Setup - Fixed
function setupEventListeners() {
    // Connection button - Fixed
    const connectionBtn = document.getElementById('connectionBtn');
    if (connectionBtn) {
        connectionBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleConnection();
        });
    }
    
    // Vehicle form
    const vehicleForm = document.getElementById('vehicleForm');
    if (vehicleForm) {
        vehicleForm.addEventListener('submit', handleVehicleForm);
    }
    
    // Chart selector
    const chartSelector = document.getElementById('chartSelector');
    if (chartSelector) {
        chartSelector.addEventListener('change', function(e) {
            currentChartSensor = e.target.value;
            updateChartSensor();
        });
    }
    
    // Diagnostic controls
    const startDiagnostic = document.getElementById('startDiagnostic');
    if (startDiagnostic) {
        startDiagnostic.addEventListener('click', startFullDiagnostic);
    }
    
    const clearCodes = document.getElementById('clearCodes');
    if (clearCodes) {
        clearCodes.addEventListener('click', clearDTCs);
    }
    
    const freezeFrame = document.getElementById('freezeFrame');
    if (freezeFrame) {
        freezeFrame.addEventListener('click', captureFreezFrame);
    }
    
    const emergencyStop = document.getElementById('emergencyStop');
    if (emergencyStop) {
        emergencyStop.addEventListener('click', emergencyStop);
    }
    
    // Export report
    const exportReport = document.getElementById('exportReport');
    if (exportReport) {
        exportReport.addEventListener('click', exportDiagnosticReport);
    }
    
    // VIN scanner simulation
    const scanVinBtn = document.getElementById('scanVinBtn');
    if (scanVinBtn) {
        scanVinBtn.addEventListener('click', simulateVinScan);
    }
}

// Connection Management - Fixed
function toggleConnection() {
    console.log('Toggle connection called, current state:', isConnected);
    
    const connectionBtn = document.getElementById('connectionBtn');
    const connectionIcon = document.getElementById('connectionIcon');
    const connectionIndicator = document.getElementById('connectionIndicator');
    const connectionStatus = document.getElementById('connectionStatus');
    
    if (!connectionBtn) {
        console.error('Connection button not found');
        return;
    }
    
    if (!isConnected) {
        // Simulate connection process
        connectionBtn.innerHTML = '<span>⏳</span> Connecting...';
        connectionBtn.disabled = true;
        
        addAlert('Establishing OBD connection...', 'info');
        
        setTimeout(() => {
            isConnected = true;
            connectionBtn.innerHTML = '<span>✅</span> Connected';
            connectionBtn.classList.remove('ford-btn--secondary');
            connectionBtn.classList.add('ford-btn--primary');
            connectionBtn.disabled = false;
            
            if (connectionIndicator) {
                connectionIndicator.classList.add('connected');
            }
            if (connectionStatus) {
                connectionStatus.textContent = 'OBD Connected';
            }
            
            const vehicleStatus = document.getElementById('vehicleStatus');
            if (vehicleStatus) {
                vehicleStatus.textContent = 'Connected';
            }
            
            const systemStatus = document.getElementById('systemStatus');
            if (systemStatus) {
                systemStatus.textContent = 'OBD Active';
            }
            
            addAlert('OBD connection established successfully', 'success');
            addAlert('Live data stream initiated', 'info');
            
            // Update metrics
            updateSystemHealth();
        }, 2000);
    } else {
        // Disconnect
        isConnected = false;
        connectionBtn.innerHTML = '<span>🔌</span> Connect OBD';
        connectionBtn.classList.remove('ford-btn--primary');
        connectionBtn.classList.add('ford-btn--secondary');
        
        if (connectionIndicator) {
            connectionIndicator.classList.remove('connected');
        }
        if (connectionStatus) {
            connectionStatus.textContent = 'Disconnected';
        }
        
        const vehicleStatus = document.getElementById('vehicleStatus');
        if (vehicleStatus) {
            vehicleStatus.textContent = 'Standby';
        }
        
        const systemStatus = document.getElementById('systemStatus');
        if (systemStatus) {
            systemStatus.textContent = 'Ready';
        }
        
        addAlert('OBD connection terminated', 'warning');
    }
}

// Vehicle Form Management - Fixed
function populateVehicleForm() {
    const vinInput = document.getElementById('vin');
    const makeSelect = document.getElementById('make');
    const modelInput = document.getElementById('model');
    const yearInput = document.getElementById('year');
    const engineInput = document.getElementById('engine');
    const electricalSelect = document.getElementById('electrical');
    
    if (vinInput) vinInput.value = FordDiagnostics.vehicleData.vin;
    if (makeSelect) makeSelect.value = FordDiagnostics.vehicleData.make;
    if (modelInput) modelInput.value = FordDiagnostics.vehicleData.model;
    if (yearInput) yearInput.value = FordDiagnostics.vehicleData.year;
    if (engineInput) engineInput.value = FordDiagnostics.vehicleData.engine;
    if (electricalSelect) electricalSelect.value = FordDiagnostics.vehicleData.electricalSystem;
}

function handleVehicleForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const vehicleInfo = {
        vin: document.getElementById('vin')?.value || '',
        make: document.getElementById('make')?.value || '',
        model: document.getElementById('model')?.value || '',
        year: document.getElementById('year')?.value || '',
        engine: document.getElementById('engine')?.value || '',
        electrical: document.getElementById('electrical')?.value || ''
    };
    
    // Validate VIN
    if (vehicleInfo.vin.length !== 17) {
        addAlert('Invalid VIN: Must be exactly 17 characters', 'error');
        return;
    }
    
    // Update application data
    FordDiagnostics.vehicleData = { ...FordDiagnostics.vehicleData, ...vehicleInfo };
    
    addAlert('Vehicle information saved successfully', 'success');
    addAlert('Vehicle profile updated in system', 'info');
    
    // Switch to dashboard
    const dashboardTab = document.querySelector('[data-tab="dashboard"]');
    if (dashboardTab) {
        dashboardTab.click();
    }
}

function simulateVinScan() {
    const vinInput = document.getElementById('vin');
    const scanBtn = document.getElementById('scanVinBtn');
    
    if (!scanBtn) return;
    
    scanBtn.innerHTML = '<span>📷</span> Scanning...';
    scanBtn.disabled = true;
    
    setTimeout(() => {
        if (vinInput) {
            vinInput.value = FordDiagnostics.vehicleData.vin;
        }
        scanBtn.innerHTML = '<span>📷</span> Scan VIN';
        scanBtn.disabled = false;
        addAlert('VIN scanned successfully', 'success');
    }, 1500);
}

// Dashboard Management
function initializeDashboard() {
    updateSensorDisplay();
    updateMetrics();
}

function updateSensorDisplay() {
    const sensorGrid = document.getElementById('sensorGrid');
    if (!sensorGrid) return;
    
    sensorGrid.innerHTML = '';
    
    Object.entries(FordDiagnostics.sensorData).forEach(([key, sensor]) => {
        const sensorItem = document.createElement('div');
        sensorItem.className = 'ford-sensor-item';
        sensorItem.innerHTML = `
            <div class="ford-sensor-label">${formatSensorName(key)}</div>
            <div class="ford-sensor-value">
                ${sensor.value.toFixed(1)}<span class="ford-sensor-unit">${sensor.unit}</span>
            </div>
            <div class="ford-sensor-status ${sensor.status}">${sensor.status.toUpperCase()}</div>
        `;
        sensorGrid.appendChild(sensorItem);
    });
}

function formatSensorName(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function updateMetrics() {
    const activeDTCs = document.getElementById('activeDTCs');
    if (activeDTCs) {
        activeDTCs.textContent = FordDiagnostics.dtcCodes.length;
    }
    
    const highConfidencePredictions = FordDiagnostics.faultPredictions.filter(p => p.confidence > 0.7);
    const avgConfidence = FordDiagnostics.faultPredictions.reduce((sum, p) => sum + p.confidence, 0) / FordDiagnostics.faultPredictions.length;
    
    const mlConfidence = document.getElementById('mlConfidence');
    if (mlConfidence) {
        mlConfidence.textContent = Math.round(avgConfidence * 100) + '%';
    }
}

function updateSystemHealth() {
    const health = isConnected ? Math.floor(Math.random() * 5) + 95 : 85;
    const systemHealth = document.getElementById('systemHealth');
    if (systemHealth) {
        systemHealth.textContent = health + '%';
    }
}

// Live Data Updates
function startLiveDataUpdates() {
    if (liveDataInterval) {
        clearInterval(liveDataInterval);
    }
    
    liveDataInterval = setInterval(() => {
        updateSensorData();
        updateSensorDisplay();
        updateLiveChart();
        updateGauges();
        updateQuickStats();
        
        if (isConnected) {
            dataPointCount++;
        }
    }, 2500); // Update every 2.5 seconds
}

function updateSensorData() {
    Object.keys(FordDiagnostics.sensorData).forEach(key => {
        const sensor = FordDiagnostics.sensorData[key];
        const baseValue = getBaseValue(key);
        const variation = getVariation(key);
        
        // Simulate realistic sensor fluctuations
        sensor.value = Math.max(sensor.min, Math.min(sensor.max, 
            baseValue + (Math.random() - 0.5) * variation));
        
        // Update sensor status based on value
        sensor.status = getSensorStatus(key, sensor.value, sensor.min, sensor.max);
    });
}

function getBaseValue(sensorKey) {
    const baseValues = {
        battery_voltage: 12.6,
        engine_rpm: isConnected ? 750 + Math.sin(Date.now() / 5000) * 50 : 0,
        coolant_temp: 195,
        oil_pressure: 45,
        intake_air_temp: 75,
        throttle_position: isConnected ? Math.abs(Math.sin(Date.now() / 8000)) * 15 : 0
    };
    return baseValues[sensorKey] || 0;
}

function getVariation(sensorKey) {
    const variations = {
        battery_voltage: 0.3,
        engine_rpm: 25,
        coolant_temp: 5,
        oil_pressure: 3,
        intake_air_temp: 3,
        throttle_position: 2
    };
    return variations[sensorKey] || 1;
}

function getSensorStatus(key, value, min, max) {
    const range = max - min;
    const normalMin = min + range * 0.2;
    const normalMax = max - range * 0.2;
    
    if (value < normalMin || value > normalMax) {
        return 'warning';
    } else if (value < min * 1.1 || value > max * 0.9) {
        return 'error';
    }
    return 'normal';
}

// Live Chart Management - Fixed
function initializeLiveChart() {
    const chartCanvas = document.getElementById('liveChart');
    if (!chartCanvas) {
        console.log('Chart canvas not found, skipping chart initialization');
        return;
    }
    
    const ctx = chartCanvas.getContext('2d');
    
    // Initialize chart data
    chartData = Array.from({length: 20}, () => 
        FordDiagnostics.sensorData[currentChartSensor].value);
    
    try {
        liveChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: 20}, (_, i) => `${i * 2.5}s ago`).reverse(),
                datasets: [{
                    label: formatSensorName(currentChartSensor),
                    data: chartData,
                    borderColor: '#FF6B1A',
                    backgroundColor: 'rgba(255, 107, 26, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 2,
                    pointHoverRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#333'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            color: '#666'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#666',
                            maxTicksLimit: 8
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                animation: {
                    duration: 0
                }
            }
        });
        console.log('Chart initialized successfully');
    } catch (error) {
        console.error('Error initializing chart:', error);
    }
}

function updateLiveChart() {
    if (!liveChart) return;
    
    const newValue = FordDiagnostics.sensorData[currentChartSensor].value;
    chartData.shift();
    chartData.push(newValue);
    
    liveChart.data.datasets[0].data = [...chartData];
    liveChart.update('none');
}

function updateChartSensor() {
    if (!liveChart) return;
    
    // Reset chart data for new sensor
    chartData = Array.from({length: 20}, () => 
        FordDiagnostics.sensorData[currentChartSensor].value);
    
    liveChart.data.datasets[0].label = formatSensorName(currentChartSensor);
    liveChart.data.datasets[0].data = [...chartData];
    liveChart.update();
}

// Gauges Management
function updateGauges() {
    const gaugesGrid = document.getElementById('gaugesGrid');
    if (!gaugesGrid) return;
    
    gaugesGrid.innerHTML = '';
    
    // Create gauges for key sensors
    const keySensors = ['engine_rpm', 'battery_voltage', 'coolant_temp', 'oil_pressure'];
    
    keySensors.forEach(key => {
        const sensor = FordDiagnostics.sensorData[key];
        const gauge = document.createElement('div');
        gauge.className = 'ford-gauge';
        gauge.innerHTML = `
            <div class="ford-gauge-value">${sensor.value.toFixed(1)}</div>
            <div class="ford-gauge-label">${formatSensorName(key)}</div>
        `;
        gaugesGrid.appendChild(gauge);
    });
}

// DTC Codes Management
function populateDTCCodes() {
    const dtcList = document.getElementById('dtcList');
    if (!dtcList) return;
    
    dtcList.innerHTML = '';
    
    if (FordDiagnostics.dtcCodes.length === 0) {
        dtcList.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--ford-text-secondary);">No active DTCs found</div>';
        return;
    }
    
    FordDiagnostics.dtcCodes.forEach(dtc => {
        const dtcItem = document.createElement('div');
        dtcItem.className = 'ford-dtc-item';
        dtcItem.innerHTML = `
            <span class="ford-dtc-code">${dtc.code}</span>
            <span class="ford-dtc-description">${dtc.description}</span>
            <span class="ford-severity-${dtc.severity}">${dtc.severity.toUpperCase()}</span>
        `;
        dtcList.appendChild(dtcItem);
    });
}

// Fault Predictions Management
function populateFaultPredictions() {
    const predictionsContainer = document.getElementById('predictionsContainer');
    if (!predictionsContainer) return;
    
    predictionsContainer.innerHTML = '';
    
    if (FordDiagnostics.faultPredictions.length === 0) {
        predictionsContainer.innerHTML = `
            <div class="ford-card ford-report-placeholder">
                <div class="ford-card-body">
                    <div class="ford-placeholder-content">
                        <div class="ford-placeholder-icon">🤖</div>
                        <h3>No ML Predictions Available</h3>
                        <p>Run a diagnostic scan to generate AI-powered fault predictions</p>
                        <button class="btn ford-btn ford-btn--primary" onclick="document.querySelector('[data-tab=diagnostic]').click()">
                            Start Diagnostic Scan
                        </button>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    FordDiagnostics.faultPredictions.forEach(prediction => {
        const predictionCard = document.createElement('div');
        predictionCard.className = `ford-prediction-card severity-${prediction.severity}`;
        predictionCard.innerHTML = `
            <h3>${prediction.fault}</h3>
            <div class="ford-confidence-meter">
                <span>Confidence:</span>
                <div class="ford-confidence-bar">
                    <div class="ford-confidence-fill" style="width: ${prediction.confidence * 100}%"></div>
                </div>
                <span><strong>${Math.round(prediction.confidence * 100)}%</strong></span>
            </div>
            <p><strong>Severity:</strong> ${prediction.severity.charAt(0).toUpperCase() + prediction.severity.slice(1)}</p>
            <p><strong>Affected Components:</strong> ${prediction.components.join(', ')}</p>
            <p><strong>Recommended Action:</strong> ${getRecommendedAction(prediction.fault)}</p>
        `;
        predictionsContainer.appendChild(predictionCard);
    });
}

function getRecommendedAction(fault) {
    const actions = {
        "O2 Sensor Degradation": "Inspect oxygen sensor wiring and replace if necessary",
        "Catalytic Converter Efficiency": "Test catalyst efficiency and consider replacement",
        "Fuel Injection System": "Clean fuel injectors and check fuel pressure"
    };
    return actions[fault] || "Consult Ford service manual for specific procedures";
}

// Service Manual Management
function populateServiceManual() {
    const manualSteps = document.getElementById('manualSteps');
    if (!manualSteps) return;
    
    manualSteps.innerHTML = '';
    
    FordDiagnostics.diagnosticSteps.forEach((step, index) => {
        const stepCard = document.createElement('div');
        stepCard.className = 'ford-step-card';
        stepCard.innerHTML = `
            <div class="ford-step-header" onclick="toggleManualStep(${index})">
                <div class="ford-step-number">${step.step}</div>
                <div class="ford-step-title">${step.title}</div>
                <div class="ford-step-duration">${step.duration}</div>
            </div>
            <div class="ford-step-content hidden" id="manual-step-${index}">
                <p><strong>Description:</strong> ${step.description}</p>
                <p><strong>Required Tools:</strong> ${step.tools.join(', ')}</p>
                <p><strong>Estimated Time:</strong> ${step.duration}</p>
                <button class="btn ford-btn ford-btn--primary" onclick="markStepComplete(${index})">
                    Mark Complete
                </button>
            </div>
        `;
        manualSteps.appendChild(stepCard);
    });
}

function toggleManualStep(index) {
    const stepContent = document.getElementById(`manual-step-${index}`);
    if (stepContent) {
        stepContent.classList.toggle('hidden');
    }
}

function markStepComplete(index) {
    const stepCards = document.querySelectorAll('.ford-step-card');
    if (stepCards[index]) {
        const stepCard = stepCards[index];
        const stepNumber = stepCard.querySelector('.ford-step-number');
        
        if (stepNumber) {
            stepNumber.style.background = '#00A651';
        }
        stepCard.style.opacity = '0.8';
        
        FordDiagnostics.diagnosticSteps[index].status = 'completed';
        addAlert(`Step ${index + 1}: ${FordDiagnostics.diagnosticSteps[index].title} completed`, 'success');
    }
}

// Diagnostic Controls
function startFullDiagnostic() {
    addAlert('Initiating comprehensive vehicle diagnostic scan...', 'info');
    
    scanStartTime = Date.now();
    const startBtn = document.getElementById('startDiagnostic');
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.innerHTML = '<span>⏳</span> Scanning...';
    }
    
    // Simulate diagnostic process
    setTimeout(() => {
        addAlert('Engine systems scan completed', 'success');
    }, 2000);
    
    setTimeout(() => {
        addAlert('Transmission diagnostic completed', 'success');
    }, 4000);
    
    setTimeout(() => {
        addAlert('Emissions system check completed', 'success');
    }, 6000);
    
    setTimeout(() => {
        addAlert('Full diagnostic scan completed successfully', 'success');
        generateDiagnosticReport();
        
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.innerHTML = '<span>▶️</span> Start Full Scan';
        }
        
        // Switch to results tab
        const resultsTab = document.querySelector('[data-tab="results"]');
        if (resultsTab) {
            resultsTab.click();
        }
    }, 8000);
}

function clearDTCs() {
    addAlert('Clearing diagnostic trouble codes...', 'info');
    
    setTimeout(() => {
        FordDiagnostics.dtcCodes.length = 0;
        populateDTCCodes();
        const activeDTCs = document.getElementById('activeDTCs');
        if (activeDTCs) {
            activeDTCs.textContent = '0';
        }
        addAlert('All DTCs cleared successfully', 'success');
    }, 1500);
}

function captureFreezFrame() {
    const timestamp = new Date().toLocaleString();
    addAlert(`Freeze frame captured at ${timestamp}`, 'success');
    
    // In a real application, this would save current sensor readings
    console.log('Freeze frame data:', {
        timestamp,
        sensorData: { ...FordDiagnostics.sensorData }
    });
}

function emergencyStop() {
    addAlert('Emergency diagnostic stop initiated', 'warning');
    
    if (liveDataInterval) {
        clearInterval(liveDataInterval);
    }
    
    setTimeout(() => {
        startLiveDataUpdates();
        addAlert('System resumed normal operation', 'info');
    }, 3000);
}

// Report Generation
function generateDiagnosticReport() {
    const resultsContainer = document.getElementById('resultsContainer');
    if (!resultsContainer) return;
    
    const scanDuration = scanStartTime ? ((Date.now() - scanStartTime) / 1000).toFixed(1) : '0';
    
    resultsContainer.innerHTML = `
        <div class="ford-card">
            <div class="ford-card-header">
                <h3>Diagnostic Report Summary</h3>
                <button class="btn ford-btn ford-btn--primary" onclick="exportDiagnosticReport()">
                    <span>📄</span> Export PDF
                </button>
            </div>
            <div class="ford-card-body">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    <div style="background: var(--color-bg-1); padding: 1rem; border-radius: 8px;">
                        <h4>Vehicle Information</h4>
                        <p><strong>VIN:</strong> ${FordDiagnostics.vehicleData.vin}</p>
                        <p><strong>Vehicle:</strong> ${FordDiagnostics.vehicleData.year} ${FordDiagnostics.vehicleData.make} ${FordDiagnostics.vehicleData.model}</p>
                        <p><strong>Engine:</strong> ${FordDiagnostics.vehicleData.engine}</p>
                    </div>
                    <div style="background: var(--color-bg-3); padding: 1rem; border-radius: 8px;">
                        <h4>Scan Results</h4>
                        <p><strong>Duration:</strong> ${scanDuration}s</p>
                        <p><strong>DTCs Found:</strong> ${FordDiagnostics.dtcCodes.length}</p>
                        <p><strong>Scan Date:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                </div>
                
                <h4>Diagnostic Findings</h4>
                <div style="margin-bottom: 2rem;">
                    ${FordDiagnostics.dtcCodes.map(dtc => `
                        <div style="border: 1px solid var(--ford-border); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                            <h5>${dtc.code} - ${dtc.description}</h5>
                            <p><strong>System:</strong> ${dtc.system}</p>
                            <p><strong>Severity:</strong> ${dtc.severity.charAt(0).toUpperCase() + dtc.severity.slice(1)}</p>
                            <p><strong>Recommendation:</strong> ${getRepairRecommendation(dtc.code)}</p>
                        </div>
                    `).join('')}
                </div>
                
                <h4>ML Fault Predictions</h4>
                <div>
                    ${FordDiagnostics.faultPredictions.map(pred => `
                        <div style="border: 1px solid var(--ford-border); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                            <h5>${pred.fault} (${Math.round(pred.confidence * 100)}% confidence)</h5>
                            <p><strong>Severity:</strong> ${pred.severity}</p>
                            <p><strong>Components:</strong> ${pred.components.join(', ')}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function getRepairRecommendation(code) {
    const recommendations = {
        'P0171': 'Check for vacuum leaks, inspect MAF sensor, verify fuel pressure',
        'P0420': 'Test catalytic converter efficiency, check oxygen sensors',
        'P0300': 'Inspect ignition coils, spark plugs, and fuel injectors'
    };
    return recommendations[code] || 'Consult Ford technical service bulletins';
}

function exportDiagnosticReport() {
    addAlert('Generating professional diagnostic report...', 'info');
    
    setTimeout(() => {
        addAlert('Diagnostic report exported successfully', 'success');
        
        // In a real application, this would generate and download a PDF
        const reportData = {
            vehicleInfo: FordDiagnostics.vehicleData,
            timestamp: new Date().toISOString(),
            dtcCodes: FordDiagnostics.dtcCodes,
            sensorData: FordDiagnostics.sensorData,
            predictions: FordDiagnostics.faultPredictions,
            diagnosticSteps: FordDiagnostics.diagnosticSteps
        };
        
        console.log('Ford Diagnostic Report:', reportData);
    }, 1500);
}

// Alert System
function addAlert(message, type = 'info') {
    const alertsList = document.getElementById('alertsList');
    if (!alertsList) return;
    
    const alert = document.createElement('div');
    
    alert.className = `ford-alert ford-alert--${type}`;
    alert.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>${message}</span>
            <button onclick="this.closest('.ford-alert').remove(); updateAlertCount();" 
                    style="background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2rem;">×</button>
        </div>
        <div style="font-size: 0.75rem; margin-top: 0.25rem; opacity: 0.8;">
            ${new Date().toLocaleTimeString()}
        </div>
    `;
    
    alertsList.insertBefore(alert, alertsList.firstChild);
    
    alertCount++;
    updateAlertCount();
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
            updateAlertCount();
        }
    }, 10000);
    
    // Keep only last 10 alerts
    const alerts = alertsList.querySelectorAll('.ford-alert');
    if (alerts.length > 10) {
        alerts[alerts.length - 1].remove();
    }
}

function updateAlertCount() {
    const activeAlerts = document.querySelectorAll('.ford-alert').length;
    const alertCountElement = document.getElementById('alertCount');
    if (alertCountElement) {
        alertCountElement.textContent = activeAlerts;
    }
    alertCount = activeAlerts;
}

// Quick Stats Updates
function updateQuickStats() {
    const now = new Date();
    
    const lastUpdate = document.getElementById('lastUpdate');
    if (lastUpdate) {
        lastUpdate.textContent = now.toLocaleTimeString();
    }
    
    const dataPoints = document.getElementById('dataPoints');
    if (dataPoints) {
        dataPoints.textContent = dataPointCount.toLocaleString();
    }
    
    if (scanStartTime) {
        const elapsed = ((Date.now() - scanStartTime) / 1000).toFixed(1);
        const scanTime = document.getElementById('scanTime');
        if (scanTime) {
            scanTime.textContent = elapsed + 's';
        }
    }
}

// Clock Update
function updateClock() {
    setInterval(() => {
        const currentTime = document.getElementById('currentTime');
        if (currentTime) {
            currentTime.textContent = new Date().toLocaleTimeString();
        }
    }, 1000);
}

// Global Functions for onclick handlers
window.toggleManualStep = toggleManualStep;
window.markStepComplete = markStepComplete;
window.exportDiagnosticReport = exportDiagnosticReport;

// Export for debugging
window.FordDiagnostics = FordDiagnostics;