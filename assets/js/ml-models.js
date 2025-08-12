/**
 * Machine Learning Models Manager for AutoDiag
 * Handles TensorFlow.js model loading, caching, and predictions
 */

class MLModelManager {
  constructor() {
    this.models = new Map();
    this.modelMetadata = new Map();
    this.isInitialized = false;
    this.loadingPromises = new Map();
  }

  /**
   * Initialize the ML model manager
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🤖 Initializing ML models...');
      
      // Load model configurations
      await this.loadModelMetadata();
      
      // Preload critical models
      await this.preloadCriticalModels();
      
      this.isInitialized = true;
      console.log('✅ ML models initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize ML models:', error);
      throw new Error('ML model initialization failed');
    }
  }

  /**
   * Load model metadata and configurations
   */
  async loadModelMetadata() {
    try {
      const metadataUrl = 'assets/models/model-metadata.json';
      const response = await fetch(metadataUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to load model metadata: ${response.status}`);
      }
      
      const metadata = await response.json();
      
      // Store metadata for each model
      Object.entries(metadata.models).forEach(([modelName, config]) => {
        this.modelMetadata.set(modelName, {
          ...config,
          url: `assets/models/${config.filename}`,
          loaded: false,
          lastUsed: null
        });
      });
      
      console.log(`📋 Loaded metadata for ${this.modelMetadata.size} models`);
      
    } catch (error) {
      console.error('Failed to load model metadata:', error);
      
      // Fallback metadata for core model
      this.modelMetadata.set('faultClassifier', {
        name: 'Fault Classifier',
        filename: 'fault-classifier.json',
        url: 'assets/models/fault-classifier.json',
        type: 'classification',
        inputShape: [null, 15],
        outputClasses: ['short_circuit', 'open_circuit', 'insulation_breakdown', 
                       'connector_corrosion', 'wire_fatigue', 'ground_fault', 'overload'],
        accuracy: 0.87,
        loaded: false,
        lastUsed: null
      });
    }
  }

  /**
   * Preload critical models for faster initial predictions
   */
  async preloadCriticalModels() {
    const criticalModels = ['faultClassifier'];
    
    const loadPromises = criticalModels.map(async (modelName) => {
      try {
        await this.loadModel(modelName);
        console.log(`✅ Preloaded ${modelName}`);
      } catch (error) {
        console.warn(`⚠️ Failed to preload ${modelName}:`, error);
      }
    });
    
    await Promise.allSettled(loadPromises);
  }

  /**
   * Load a specific model
   */
  async loadModel(modelName) {
    // Return existing loading promise if already in progress
    if (this.loadingPromises.has(modelName)) {
      return this.loadingPromises.get(modelName);
    }

    // Return cached model if already loaded
    if (this.models.has(modelName)) {
      const metadata = this.modelMetadata.get(modelName);
      if (metadata) {
        metadata.lastUsed = Date.now();
      }
      return this.models.get(modelName);
    }

    const loadingPromise = this._loadModelFromUrl(modelName);
    this.loadingPromises.set(modelName, loadingPromise);

    try {
      const model = await loadingPromise;
      this.models.set(modelName, model);
      
      const metadata = this.modelMetadata.get(modelName);
      if (metadata) {
        metadata.loaded = true;
        metadata.lastUsed = Date.now();
      }
      
      return model;
    } finally {
      this.loadingPromises.delete(modelName);
    }
  }

  /**
   * Internal method to load model from URL
   */
  async _loadModelFromUrl(modelName) {
    const metadata = this.modelMetadata.get(modelName);
    if (!metadata) {
      throw new Error(`Model metadata not found: ${modelName}`);
    }

    try {
      console.log(`🔄 Loading model: ${modelName}`);
      
      const model = await tf.loadLayersModel(metadata.url);
      
      // Warm up the model with a dummy prediction
      if (metadata.inputShape && metadata.inputShape.length > 1) {
        const dummyInput = tf.zeros([1, ...metadata.inputShape.slice(1)]);
        const warmupPrediction = model.predict(dummyInput);
        warmupPrediction.dispose();
        dummyInput.dispose();
      }
      
      console.log(`✅ Successfully loaded ${modelName}`);
      return model;
      
    } catch (error) {
      console.error(`❌ Failed to load model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Get model information
   */
  getModelInfo(modelName) {
    return this.modelMetadata.get(modelName);
  }

  /**
   * Check if a model is loaded
   */
  isModelLoaded(modelName) {
    return this.models.has(modelName);
  }

  /**
   * Preprocess input data for fault classification
   */
  preprocessFaultData(inputData) {
    const {
      vehicleMake = 'unknown',
      vehicleYear = 2020,
      batteryVoltage = 12.6,
      systemCurrent = 0,
      resistance = 0,
      temperature = 25,
      symptoms = []
    } = inputData;

    // Normalize numerical features
    const normalizedVoltage = Math.max(0, Math.min(1, batteryVoltage / 24)); // 0-24V range
    const normalizedCurrent = Math.max(0, Math.min(1, systemCurrent / 50)); // 0-50A range
    const normalizedResistance = Math.max(0, Math.min(1, Math.log10(resistance + 1) / 3)); // Log scale
    const normalizedTemperature = Math.max(0, Math.min(1, (temperature + 40) / 140)); // -40 to 100°C
    const normalizedYear = Math.max(0, Math.min(1, (vehicleYear - 1990) / 35)); // 1990-2025 range

    // Encode vehicle make (simplified one-hot encoding)
    const makeFeatures = this.encodeVehicleMake(vehicleMake);

    // Encode symptoms as binary features
    const symptomFeatures = this.encodeSymptoms(symptoms);

    // Combine all features
    const features = [
      normalizedVoltage,
      normalizedCurrent,
      normalizedResistance,
      normalizedTemperature,
      normalizedYear,
      ...makeFeatures,  // 5 features
      ...symptomFeatures // 5 features
    ];

    // Ensure we have exactly 15 features
    while (features.length < 15) {
      features.push(0);
    }

    return features.slice(0, 15);
  }

  /**
   * Encode vehicle make into features
   */
  encodeVehicleMake(make) {
    const makeMapping = {
      'toyota': [1, 0, 0, 0, 0],
      'ford': [0, 1, 0, 0, 0],
      'chevrolet': [0, 0, 1, 0, 0],
      'honda': [0, 0, 0, 1, 0],
      'other': [0, 0, 0, 0, 1]
    };

    const normalizedMake = make.toLowerCase();
    return makeMapping[normalizedMake] || makeMapping['other'];
  }

  /**
   * Encode symptoms into binary features
   */
  encodeSymptoms(symptoms) {
    const symptomMapping = {
      'no_start': 0,
      'intermittent_power': 1,
      'burning_smell': 2,
      'blown_fuses': 3,
      'corrosion_visible': 4
    };

    const features = new Array(5).fill(0);
    
    symptoms.forEach(symptom => {
      const index = symptomMapping[symptom];
      if (index !== undefined) {
        features[index] = 1;
      }
    });

    return features;
  }

  /**
   * Predict automotive fault using the classification model
   */
  async predictFault(inputData) {
    try {
      // Load the fault classifier model
      const model = await this.loadModel('faultClassifier');
      const metadata = this.modelMetadata.get('faultClassifier');

      // Preprocess the input data
      const features = this.preprocessFaultData(inputData);
      
      // Create tensor input
      const tensorInput = tf.tensor2d([features]);

      // Make prediction
      const predictions = model.predict(tensorInput);
      const predictionData = await predictions.data();

      // Clean up tensors
      tensorInput.dispose();
      predictions.dispose();

      // Process prediction results
      const results = this.processPredictionResults(predictionData, metadata);

      // Update model usage timestamp
      metadata.lastUsed = Date.now();

      return results;

    } catch (error) {
      console.error('Prediction failed:', error);
      throw new Error('Failed to predict automotive fault');
    }
  }

  /**
   * Process raw prediction results into structured format
   */
  processPredictionResults(predictionData, metadata) {
    const classes = metadata.outputClasses;
    const probabilities = Array.from(predictionData);

    // Find the class with highest probability
    const maxProbIndex = probabilities.indexOf(Math.max(...probabilities));
    const predictedClass = classes[maxProbIndex];
    const confidence = probabilities[maxProbIndex];

    // Calculate severity based on confidence and fault type
    const severity = this.calculateSeverity(predictedClass, confidence);

    // Get all predictions sorted by probability
    const allPredictions = classes
      .map((className, index) => ({
        faultType: className,
        probability: probabilities[index],
        confidence: probabilities[index]
      }))
      .sort((a, b) => b.probability - a.probability);

    return {
      primaryFault: {
        faultType: predictedClass,
        confidence: confidence,
        severity: severity
      },
      allPredictions: allPredictions,
      modelAccuracy: metadata.accuracy,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate fault severity based on type and confidence
   */
  calculateSeverity(faultType, confidence) {
    const baseSeverity = {
      'short_circuit': 0.9,
      'insulation_breakdown': 0.8,
      'ground_fault': 0.8,
      'overload': 0.7,
      'connector_corrosion': 0.5,
      'open_circuit': 0.6,
      'wire_fatigue': 0.4
    };

    const base = baseSeverity[faultType] || 0.5;
    const adjustedSeverity = base * confidence;

    // Map to severity levels
    if (adjustedSeverity >= 0.8) return DiagnosticData.severityLevels.CRITICAL;
    if (adjustedSeverity >= 0.6) return DiagnosticData.severityLevels.HIGH;
    if (adjustedSeverity >= 0.4) return DiagnosticData.severityLevels.MEDIUM;
    return DiagnosticData.severityLevels.LOW;
  }

  /**
   * Generate recommendations based on prediction results
   */
  generateRecommendations(predictionResults) {
    const { primaryFault } = predictionResults;
    const { faultType, severity } = primaryFault;

    const recommendations = {
      immediate: [],
      followup: [],
      preventive: []
    };

    switch (faultType) {
      case 'short_circuit':
        recommendations.immediate.push('⚠️ DANGER: Disconnect battery immediately');
        recommendations.immediate.push('🔍 Locate and isolate the short circuit');
        recommendations.followup.push('🔧 Replace damaged wiring');
        recommendations.preventive.push('📋 Inspect wiring harnesses regularly');
        break;

      case 'open_circuit':
        recommendations.immediate.push('🔍 Check connections and continuity');
        recommendations.immediate.push('🧹 Clean corroded terminals');
        recommendations.followup.push('🔧 Repair or replace broken wires');
        break;

      case 'insulation_breakdown':
        recommendations.