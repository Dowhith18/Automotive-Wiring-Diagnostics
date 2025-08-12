/**
 * Main Application Controller
 * Handles UI interactions and coordinates between components
 */
class AutomotiveDiagnosticsApp {
    constructor() {
        this.models = null;
        this.diagnostics = null;
        this.currentTheme = 'light';
        this.deferredPrompt = null;
        
        this.init();
    }

    async init() {
        try {
            // Initialize core components
            this.diagnostics = new DiagnosticsEngine();
            this.models = new MLModels();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize theme
            this.initTheme();
            
            // Setup PWA
            this.setupPWA();
            
            // Load ML models
            await this.loadModels();
            
            console.log('Automotive Diagnostics App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle.addEventListener('click', () => this.toggleTheme());

        // Install button
        const installBtn = document.getElementById('install-btn');
        installBtn.addEventListener('click', () => this.installApp());

        // Diagnosis button
        const diagnoseBtn = document.getElementById('diagnose-btn');
        diagnoseBtn.addEventListener('click', () => this.runDiagnosis());

        // Close diagram button
        const closeDiagramBtn = document.getElementById('close-diagram');
        closeDiagramBtn.addEventListener('click', () => this.closeDiagramViewer());

        // Vehicle make change
        const vehicleMake = document.getElementById('vehicle-make');
        vehicleMake.addEventListener('change', (e) => this.onVehicleMakeChange(e.target.value));

        // Form validation
        this.setupFormValidation();
    }

    setupFormValidation() {
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.getAttribute('id');
        
        // Remove existing error styling
        this.clearFieldError(field);
        
        // Basic validation rules
        switch(fieldName) {
            case 'vehicle-year':
                if (value && (value < 1990 || value > 2024)) {
                    this.showFieldError(field, 'Year must be between 1990 and 2024');
                    return false;
                }
                break;
            case 'battery-voltage':
                if (value && (value < 8 || value > 16)) {
                    this.showFieldError(field, 'Battery voltage typically ranges from 8-16V');
                    return false;
                }
                break;
            case 'alternator-output':
                if (value && (value < 12 || value > 16)) {
                    this.showFieldError(field, 'Alternator output typically ranges from 12-16V');
                    return false;
                }
                break;
        }
        return true;
    }

    showFieldError(field, message) {
        field.style.borderColor = 'var(--error-color)';
        
        // Create or update error message
        let errorDiv = field.parentNode.querySelector('.field-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.style.color = 'var(--error-color)';
            errorDiv.style.fontSize = '0.8rem';
            errorDiv.style.marginTop = '0.25rem';
            field.parentNode.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
    }

    clearFieldError(field) {
        field.style.borderColor = '';
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    async loadModels() {
        try {
            this.showLoading('Loading AI models...');
            await this.models.initialize();
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            console.error('Failed to load models:', error);
            this.showError('Failed to load AI models. Some features may be limited.');
        }
    }

    async runDiagnosis() {
        try {
            // Validate form
            if (!this.validateForm()) {
                return;
            }

            // Collect input data
            const diagnosticData = this.collectDiagnosticData();
            
            // Show loading
            this.showLoading('Running AI diagnosis...');
            
            // Run diagnosis
            const results = await this.diagnostics.analyze(diagnosticData, this.models);
            
            // Display results
            this.displayResults(results);
            
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            console.error('Diagnosis failed:', error);
            this.showError('Diagnosis failed. Please check your inputs and try again.');
        }
    }

    validateForm() {
        const requiredFields = ['symptoms'];
        let isValid = true;

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            }
        });

        return isValid;
    }

    collectDiagnosticData() {
        return {
            vehicle: {
                year: document.getElementById('vehicle-year').value,
                make: document.getElementById('vehicle-make').value,
                model: document.getElementById('vehicle-model').value
            },
            symptoms: document.getElementById('symptoms').value,
            dtcCodes: document.getElementById('dtc-codes').value,
            measurements: {
                batteryVoltage: parseFloat(document.getElementById('battery-voltage').value) || null,
                alternatorOutput: parseFloat(document.getElementById('alternator-output').value) || null,
                groundResistance: parseFloat(document.getElementById('ground-resistance').value) || null
            },
            timestamp: new Date().toISOString()
        };
    }

    displayResults(results) {
        const resultsPanel = document.getElementById('results-panel');
        const resultsContent = document.getElementById('diagnostic-results');
        
        resultsContent.innerHTML = '';
        
        results.forEach((result, index) => {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'diagnostic-result fade-in';
            resultDiv.style.animationDelay = `${index * 0.1}s`;
            
            const confidenceClass = this.getConfidenceClass(result.confidence);
            
            resultDiv.innerHTML = `
                <div class="result-confidence ${confidenceClass}">
                    ${Math.round(result.confidence * 100)}% Confidence
                </div>
                <h3>${result.faultType}</h3>
                <p><strong>Description:</strong> ${result.description}</p>
                <p><strong>Likely Causes:</strong> ${result.causes.join(', ')}</p>
                <p><strong>Recommended Actions:</strong> ${result.actions.join(', ')}</p>
                ${result.wiringSections ? `
                    <div class="wiring-info">
                        <p><strong>Check These Wiring Sections:</strong> ${result.wiringSections.join(', ')}</p>
                        <button class="btn-secondary" onclick="app.showWiringDiagram('${result.faultType}')">
                            📊 View Wiring Diagram
                        </button>
                    </div>
                ` : ''}
            `;
            
            resultsContent.appendChild(resultDiv);
        });
        
        resultsPanel.style.display = 'block';
        resultsPanel.scrollIntoView({ behavior: 'smooth' });
    }

    getConfidenceClass(confidence) {
        if (confidence >= 0.8) return 'confidence-high';
        if (confidence >= 0.6) return 'confidence-medium';
        return 'confidence-low';
    }

    showWiringDiagram(faultType) {
        // This would load and display the relevant wiring diagram
        const diagramPanel = document.getElementById('diagram-panel');
        const canvas = document.getElementById('diagram-canvas');
        
        // Simulate diagram loading
        this.drawSampleWiringDiagram(canvas, faultType);
        
        diagramPanel.style.display = 'block';
        diagramPanel.scrollIntoView({ behavior: 'smooth' });
    }

    drawSampleWiringDiagram(canvas, faultType) {
        const ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 600;
        
        // Clear canvas
        ctx.fillStyle = this.currentTheme === 'dark' ? '#1e1e1e' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw sample wiring diagram
        ctx.strokeStyle = this.currentTheme === 'dark' ? '#ffffff' : '#000000';
        ctx.lineWidth = 2;
        
        // Battery
        ctx.beginPath();
        ctx.rect(50, 50, 60, 30);
        ctx.stroke();
        ctx.fillStyle = this.currentTheme === 'dark' ? '#ffffff' : '#000000';
        ctx.font = '12px Arial';
        ctx.fillText('Battery', 55, 70);
        
        // Fuse box
        ctx.beginPath();
        ctx.rect(200, 50, 80, 40);
        ctx.stroke();
        ctx.fillText('Fuse Box', 210, 75);
        
        // Component (example: headlight)
        ctx.beginPath();
        ctx.arc(400, 200, 30, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillText('Component', 370, 250);
        
        // Wires
        ctx.beginPath();
        ctx.moveTo(110, 65);
        ctx.lineTo(200, 65);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(280, 70);
        ctx.lineTo(400, 70);
        ctx.lineTo(400, 170);
        ctx.stroke();
        
        // Add fault indication if relevant
        if (faultType.toLowerCase().includes('ground')) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(400, 230);
            ctx.lineTo(400, 280);
            ctx.lineTo(350, 280);
            ctx.stroke();
            ctx.fillStyle = '#ff0000';
            ctx.fillText('Ground Issue', 300, 295);
        }
    }

    closeDiagramViewer() {
        const diagramPanel = document.getElementById('diagram-panel');
        diagramPanel.style.display = 'none';
    }

    onVehicleMakeChange(make) {
        // This could load make-specific diagnostic parameters
        console.log(`Vehicle make changed to: ${make}`);
        // You could update available models, known issues, etc.
    }

    // Theme Management
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
    }

    // PWA Management
    setupPWA() {
        // Handle install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            
            const installBtn = document.getElementById('install-btn');
            installBtn.style.display = 'block';
        });

        // Handle app installed
        window.addEventListener('appinstalled', () => {
            console.log('App installed successfully');
            const installBtn = document.getElementById('install-btn');
            installBtn.style.display = 'none';
            this.deferredPrompt = null;
        });

        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => console.log('SW registered:', registration))
                .catch(error => console.log('SW registration failed:', error));
        }
    }

    async installApp() {
        if (!this.deferredPrompt) return;

        this.deferredPrompt.prompt();
        const result = await this.deferredPrompt.userChoice;
        
        if (result.outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        
        this.deferredPrompt = null;
    }

    // UI Utilities
    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        const messageEl = overlay.querySelector('p');
        messageEl.textContent = message;
        overlay.style.display = 'flex';
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        overlay.style.display = 'none';
    }

    showError(message) {
        // You could implement a proper notification system here
        alert(message);
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new AutomotiveDiagnosticsApp();
});
