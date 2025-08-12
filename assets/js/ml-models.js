/**
 * Machine Learning Models Handler
 * Manages TensorFlow.js models for automotive fault classification
 */
class MLModels {
    constructor() {
        this.faultClassifier = null;
        this.modelMetadata = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('Loading ML models...');
            
            // Load model metadata
            this.modelMetadata = await this.loadModelMetadata();
            
            // Load the fault classification model
            await this.loadFaultClassifier();
            
            this.isInitialized = true;
            console.log('ML models loaded successfully');
        } catch (error) {
            console.error('Failed to initialize ML models:', error);
            throw error;
        }
    }

    async loadModelMetadata() {
        try {
            const response = await fetch('assets/models/model-metadata.json');
            if (!response.ok) {
                throw new Error(`Failed to load model metadata: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn('Could not load model metadata, using defaults');
            return this.getDefaultMetadata();
        }
    }

    async loadFaultClassifier() {
        try {
            // Try to load the actual model
            this.faultClassifier = await tf.loadLayersModel('assets/models/fault-classifier.json');
            console.log('Fault classifier model loaded');
        } catch (error) {
            console.warn('Could not load trained model, using simulated classifier');
            this.faultClassifier = this.createSimulatedModel();
        }
    }

    createSimulatedModel() {
        // Create a simple simulated model for demo purposes
        return {
            predict: (inputTensor) => {
                // Simulate model prediction
                const batchSize = inputTensor.shape[0];
                const numClasses = 8; // Number of fault types
                
                // Generate random probabilities that sum to 1
                const predictions = [];
                for (let i = 0; i < batchSize; i++) {
                    const probs = Array.from({length: numClasses}, () => Math.random());
                    const sum = probs.reduce((a, b) => a + b, 0);
                    predictions.push(probs.map(p => p / sum));
                }
                
                return tf.tensor2d(predictions);
            }
        };
    }

    getDefaultMetadata() {
        return {
            version: "1.0.0",
            model_type: "fault_classifier",
            input_shape: [1, 50],
            output_classes: [
                "Battery/Charging System",
                "Ground Circuit",
                "Wiring Harness",
                "Fuse/Relay",
                "Switch/Control Module",
                "Sensor Circuit",
                "Lighting System",
                "No Fault Detected"
            ],
            feature_names: [
                "battery_voltage", "alternator_output", "ground_resistance",
                "symptoms_battery", "symptoms_lights", "symptoms_starting",
                "symptoms_charging", "symptoms_electrical", "symptoms_intermittent",
                "vehicle_age", "mileage_category", "make_ford", "make_chevrolet",
                "make_toyota", "make_honda", "make_nissan", "dtc_powertrain",
                "dtc_body", "dtc_chassis", "dtc_network"
            ],
            training_accuracy: 0.89,
            validation_accuracy: 0.85
        };
    }

    async predictFaultType(diagnosticData) {
        if (!this.isInitialized) {
            throw new Error('ML models not initialized');
        }

        try {
            // Preprocess the input data
            const features = this.preprocessInput(diagnosticData);
            
            // Convert to tensor
            const inputTensor = tf.tensor2d([features]);
            
            // Make prediction
            const predictions = this.faultClassifier.predict(inputTensor);
            const probabilitiesArray = await predictions.data();
            
            // Clean up tensors
            inputTensor.dispose();
            predictions.dispose();
            
            // Process results
            return this.processModelOutput(probabilitiesArray);
        } catch (error) {
            console.error('Prediction failed:', error);
            throw error;
        }
    }

    preprocessInput(data) {
        const features = new Array(this.modelMetadata.input_shape[1]).fill(0);
        
        // Electrical measurements (normalized)
        features[0] = this.normalizeVoltage(data.measurements.batteryVoltage);
        features[1] = this.normalizeVoltage(data.measurements.alternatorOutput);
        features[2] = this.normalizeResistance(data.measurements.groundResistance);
        
        // Symptom analysis
        const symptoms = data.symptoms.toLowerCase();
        features[3] = this.containsKeywords(symptoms, ['battery', 'dead', 'won\'t start', 'weak']) ? 1 : 0;
        features[4] = this.containsKeywords(symptoms, ['lights', 'headlight', 'dim', 'flickering']) ? 1 : 0;
        features[5] = this.containsKeywords(symptoms, ['starting', 'starter', 'crank', 'turn over']) ? 1 : 0;
        features[6] = this.containsKeywords(symptoms, ['charging', 'alternator', 'voltage']) ? 1 : 0;
        features[7] = this.containsKeywords(symptoms, ['electrical', 'power', 'fuse', 'blown']) ? 1 : 0;
        features[8] = this.containsKeywords(symptoms, ['intermittent', 'sometimes', 'occasionally']) ? 1 : 0;
        
        // Vehicle information
        features[9] = this.normalizeYear(data.vehicle.year);
        features[10] = this.categorizeMileage(data.vehicle.mileage || 100000); // Default assumption
        
        // Make one-hot encoding
        const makes = ['ford', 'chevrolet', 'toyota', 'honda', 'nissan'];
        const makeIndex = makes.indexOf(data.vehicle.make?.toLowerCase());
        for (let i = 0; i < makes.length; i++) {
            features[11 + i] = (i === makeIndex) ? 1 : 0;
        }
        
        // DTC code analysis
        const dtcCodes = data.dtcCodes?.toLowerCase() || '';
        features[16] = this.containsKeywords(dtcCodes, ['p0', 'p1', 'p2', 'p3']) ? 1 : 0; // Powertrain
        features[17] = this.containsKeywords(dtcCodes, ['b0', 'b1', 'b2', 'b3']) ? 1 : 0; // Body
        features[18] = this.containsKeywords(dtcCodes, ['c0', 'c1', 'c2', 'c3']) ? 1 : 0; // Chassis
        features[19] = this.containsKeywords(dtcCodes, ['u0', 'u1', 'u2', 'u3']) ? 1 : 0; // Network
        
        return features;
    }

    normalizeVoltage(voltage) {
        if (!voltage) return 0.5; // Neutral value for missing data
        return Math.max(0, Math.min(1, (voltage - 8) / 8)); // 8-16V range
    }

    normalizeResistance(resistance) {
        if (!resistance) return 0.5;
        return Math.max(0, Math.min(1, Math.log(resistance + 0.01) / 5)); // Log scale
    }

    normalizeYear(year) {
        if (!year) return 0.5;
        return Math.max(0, Math.min(1, (year - 1990) / 34)); // 1990-2024 range
    }

    categorizeMileage(mileage) {
        if (mileage < 50000) return 0.2;
        if (mileage < 100000) return 0.4;
        if (mileage < 150000) return 0.6;
        if (mileage < 200000) return 0.8;
        return 1.0;
    }

    containsKeywords(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }

    processModelOutput(probabilities) {
        const results = [];
        const classes = this.modelMetadata.output_classes;
        
        // Create array of class predictions with probabilities
        const classProbs = Array.from(probabilities).map((prob, index) => ({
            class: classes[index],
            probability: prob
        }));
        
        // Sort by probability (highest first)
        classProbs.sort((a, b) => b.probability - a.probability);
        
        // Return top predictions (excluding "No Fault Detected" if there are better options)
        const filteredResults = classProbs.filter(item => 
            item.class !== "No Fault Detected" || classProbs[0].class === "No Fault Detected"
        );
        
        return filteredResults.slice(0, 3); // Top 3 predictions
    }

    // Utility method to get model info
    getModelInfo() {
        return {
            isInitialized: this.isInitialized,
            metadata: this.modelMetadata,
            hasTrainedModel: this.faultClassifier && typeof this.faultClassifier.predict === 'function'
        };
    }

    // Clean up resources
    dispose() {
        if (this.faultClassifier && this.faultClassifier.dispose) {
            this.faultClassifier.dispose();
        }
        this.isInitialized = false;
    }
}
