class AutomotiveDiagnostics {
    constructor() {
        this.model = null;
        this.initializeApp();
    }

    async initializeApp() {
        await this.loadMLModel();
        this.setupEventListeners();
        this.initializeCharts();
    }

    async loadMLModel() {
        try {
            this.model = await tf.loadLayersModel('assets/models/fault-classifier.json');
            console.log('ML model loaded successfully');
        } catch (error) {
            console.error('Error loading model:', error);
        }
    }

    setupEventListeners() {
        document.getElementById('diagnostic-form').addEventListener('submit', 
            (e) => this.handlePrediction(e));
    }

    async handlePrediction(event) {
        event.preventDefault();
        const formData = this.collectFormData();
        const prediction = await this.predictFault(formData);
        this.displayResults(prediction);
        this.updateCharts(prediction);
    }

    collectFormData() {
        return {
            vehicleMake: document.getElementById('vehicle-make').value,
            voltage: parseFloat(document.getElementById('voltage-reading').value),
            symptoms: this.getSelectedSymptoms()
        };
    }

    async predictFault(inputData) {
        const processedInput = this.preprocessInput(inputData);
        const tensorInput = tf.tensor2d([processedInput]);
        const prediction = this.model.predict(tensorInput);
        return await prediction.data();
    }

    displayResults(prediction) {
        const resultsPanel = document.getElementById('prediction-results');
        resultsPanel.classList.remove('hidden');
        
        // Update fault type, confidence, and recommendations
        this.updateFaultDisplay(prediction);
        this.generateRecommendations(prediction);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new AutomotiveDiagnostics();
});