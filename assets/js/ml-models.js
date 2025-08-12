// assets/js/ml-models.js

// Phase 5: Machine Learning Model Integration
import * as tf from '@tensorflow/tfjs';

class AutomotiveFaultPredictor {
    constructor() {
        this.model = null;
        this.isModelLoaded = false;
    }
    
    async createModel() {
        this.model = tf.sequential({
            layers: [
                tf.layers.dense({inputShape: [50], units: 128, activation: 'relu'}),
                tf.layers.dropout({rate: 0.2}),
                tf.layers.dense({units: 64, activation: 'relu'}),
                tf.layers.dense({units: 8, activation: 'softmax'}) // 8 fault types
            ]
        });
        
        this.model.compile({
            optimizer: 'adam',
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });
        
        console.log('Model created successfully');
    }
    
    async trainModel(trainingData, labels) {
        if (!this.model) {
            await this.createModel();
        }
        
        const xs = tf.tensor2d(trainingData);
        const ys = tf.tensor2d(labels);
        
        const history = await this.model.fit(xs, ys, {
            epochs: 100,
            batchSize: 32,
            validationSplit: 0.2,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}`);
                }
            }
        });
        
        // Clean up tensors
        xs.dispose();
        ys.dispose();
        
        return history;
    }
    
    async loadModel() {
        try {
            this.model = await tf.loadLayersModel('/assets/models/fault-classifier.json');
            this.isModelLoaded = true;
            console.log('Pre-trained model loaded successfully');
        } catch (error) {
            console.log('No pre-trained model found, creating new model');
            await this.createModel();
        }
    }
    
    async predict(inputData) {
        if (!this.model) {
            throw new Error('Model not loaded. Call loadModel() first.');
        }
        
        const prediction = this.model.predict(tf.tensor2d([inputData]));
        const result = await prediction.data();
        prediction.dispose();
        
        return result;
    }
    
    async saveModel() {
        if (this.model) {
            await this.model.save('file:///assets/models/fault-classifier');
            console.log('Model saved successfully');
        }
    }
}

// Export for use in other modules
export { AutomotiveFaultPredictor };
