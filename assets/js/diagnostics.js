/**
 * Diagnostics Engine
 * Core diagnostic logic and fault analysis
 */
class DiagnosticsEngine {
    constructor() {
        this.faultDatabase = this.initializeFaultDatabase();
        this.wiringKnowledge = this.initializeWiringKnowledge();
    }

    async analyze(diagnosticData, mlModels) {
        try {
            console.log('Starting diagnostic analysis...', diagnosticData);
            
            // Get ML model predictions
            let mlPredictions = [];
            if (mlModels && mlModels.isInitialized) {
                try {
                    const predictions = await mlModels.predictFaultType(diagnosticData);
                    mlPredictions = predictions.map(pred => ({
                        faultType: pred.class,
                        confidence: pred.probability,
                        source: 'ml'
                    }));
                } catch (error) {
                    console.warn('ML prediction failed, using rule-based fallback:', error);
                }
            }
            
            // Get rule-based predictions
            const rulePredictions = this.analyzeWithRules(diagnosticData);
            
            // Combine and rank all predictions
            const allPredictions = [...mlPredictions, ...rulePredictions];
            const finalResults = this.combineAndRankPredictions(allPredictions, diagnosticData);
            
            return finalResults;
        } catch (error) {
            console.error('Diagnostic analysis failed:', error);
            throw error;
        }
    }

    analyzeWithRules(data) {
        const results = [];
        const symptoms = data.symptoms.toLowerCase();
        const measurements = data.measurements;
        const dtcCodes = data.dtcCodes?.toLowerCase() || '';

        // Battery/Charging System Analysis
        if (this.analyzeBatterySystem(symptoms, measurements, dtcCodes)) {
            results.push({
                faultType: 'Battery/Charging System',
                confidence: 0.85,
                source: 'rules'
            });
        }

        // Ground Circuit Analysis
        if (this.analyzeGroundCircuit(symptoms, measurements)) {
            results.push({
                faultType: 'Ground Circuit',
                confidence: 0.80,
                source: 'rules'
            });
        }

        // Lighting System Analysis
        if (this.analyzeLightingSystem(symptoms, measurements)) {
            results.push({
                faultType: 'Lighting System',
                confidence: 0.75,
                source: 'rules'
            });
        }

        // Wiring Harness Analysis
        if (this.analyzeWiringHarness(symptoms, measurements)) {
            results.push({
                faultType: 'Wiring Harness',
                confidence: 0.70,
                source: 'rules'
            });
        }

        // Fuse/Relay Analysis
        if (this.analyzeFuseRelay(symptoms, dtcCodes)) {
            results.push({
                faultType: 'Fuse/Relay',
                confidence: 0.75,
                source: 'rules'
            });
        }

        return results;
    }

    analyzeBatterySystem(symptoms, measurements, dtcCodes) {
        let score = 0;

        // Symptom analysis
        if (symptoms.includes('won\'t start') || symptoms.includes('dead battery')) score += 3;
        if (symptoms.includes('slow cranking') || symptoms.includes('weak')) score += 2;
        if (symptoms.includes('charging') || symptoms.includes('alternator')) score += 2;

        // Voltage measurements
        if (measurements.batteryVoltage && measurements.batteryVoltage < 12.0) score += 3;
        if (measurements.alternatorOutput && measurements.alternatorOutput < 13.5) score += 2;
        if (measurements.batteryVoltage && measurements.batteryVoltage > 15.0) score += 2;

        // DTC codes
        if (dtcCodes.includes('p0') && (dtcCodes.includes('560') || dtcCodes.includes('562'))) score += 2;

        return score >= 3;
    }

    analyzeGroundCircuit(symptoms, measurements) {
        let score = 0;

        // Ground-specific symptoms
        if (symptoms.includes('intermittent') && symptoms.includes('electrical')) score += 2;
        if (symptoms.includes('multiple systems') || symptoms.includes('random')) score += 2;
        if (symptoms.includes('corrosion') || symptoms.includes('ground')) score += 3;

        // Ground resistance measurement
        if (measurements.groundResistance && measurements.groundResistance > 0.5) score += 3;
        if (measurements.groundResistance && measurements.groundResistance > 1.0) score += 2;

        return score >= 3;
    }

    analyzeLightingSystem(symptoms, measurements) {
        let score = 0;

        // Lighting-specific symptoms
        if (symptoms.includes('lights') || symptoms.includes('headlight')) score += 3;
        if (symptoms.includes('dim') || symptoms.includes('flickering')) score += 2;
        if (symptoms.includes('one side') || symptoms.includes('left') || symptoms.includes('right')) score += 1;

        // Voltage correlation with lighting issues
        if (measurements.batteryVoltage && measurements.batteryVoltage < 11.5) score += 1;

        return score >= 3;
    }

    analyzeWiringHarness(symptoms, measurements) {
        let score = 0;

        // Wiring harness symptoms
        if (symptoms.includes('harness') || symptoms.includes('wiring')) score += 3;
        if (symptoms.includes('chafed') || symptoms.includes('damaged')) score += 2;
        if (symptoms.includes('connector') || symptoms.includes('plug')) score += 2;
        if (symptoms.includes('vibration') || symptoms.includes('movement')) score += 1;

        return score >= 3;
    }

    analyzeFuseRelay(symptoms, dtcCodes) {
        let score = 0;

        // Fuse/relay symptoms
        if (symptoms.includes('fuse') || symptoms.includes('blown')) score += 3;
        if (symptoms.includes('relay') || symptoms.includes('clicking')) score += 2;
        if (symptoms.includes('no power') || symptoms.includes('dead')) score += 1;

        // Multiple system failures often indicate fuse box issues
        if (symptoms.includes('multiple') && symptoms.includes('system')) score += 2;

        return score >= 3;
    }

    combineAndRankPredictions(predictions, diagnosticData) {
        // Group predictions by fault type
        const grouped = {};
        
        predictions.forEach(pred => {
            if (!grouped[pred.faultType]) {
                grouped[pred.faultType] = {
                    faultType: pred.faultType,
                    confidences: [],
                    sources: []
                };
            }
            grouped[pred.faultType].confidences.push(pred.confidence);
            grouped[pred.faultType].sources.push(pred.source);
        });

        // Calculate combined confidence scores
        const results = Object.values(grouped).map(group => {
            // Average confidence, with bonus for multiple sources
            let combinedConfidence = group.confidences.reduce((a, b) => a + b, 0) / group.confidences.length;
            
            // Boost confidence if both ML and rules agree
            if (group.sources.includes('ml') && group.sources.includes('rules')) {
                combinedConfidence = Math.min(0.95, combinedConfidence * 1.2);
            }

            return {
                faultType: group.faultType,
                confidence: combinedConfidence,
                description: this.getFaultDescription(group.faultType),
                causes: this.getProbableCauses(group.faultType),
                actions: this.getRecommendedActions(group.faultType),
                wiringSections: this.getRelevantWiringSections(group.faultType, diagnosticData)
            };
        });

        // Sort by confidence and return top results
        results.sort((a, b) => b.confidence - a.confidence);
        return results.slice(0, 5); // Top 5 results
    }

    getFaultDescription(faultType) {
        const descriptions = {
            'Battery/Charging System': 'Issues with battery performance, charging system operation, or related electrical components affecting power supply.',
            'Ground Circuit': 'Problems with electrical ground connections causing erratic behavior across multiple systems.',
            'Lighting System': 'Faults in headlights, taillights, or other lighting circuits affecting visibility and safety.',
            'Wiring Harness': 'Damaged, corroded, or compromised wiring affecting electrical connectivity.',
            'Fuse/Relay': 'Blown fuses or failed relays disrupting power distribution to various systems.',
            'Switch/Control Module': 'Faulty switches or electronic control modules affecting system operation.',
            'Sensor Circuit': 'Problems with sensor circuits affecting system monitoring and control.',
            'No Fault Detected': 'No specific electrical fault identified. Issue may be intermittent or require additional diagnosis.'
        };
        return descriptions[faultType] || 'Unknown fault type requiring further investigation.';
    }

    getProbableCauses(faultType) {
        const causes = {
            'Battery/Charging System': [
                'Worn or damaged battery',
                'Faulty alternator',
                'Loose or corroded battery connections',
                'Defective voltage regulator',
                'Excessive electrical load'
            ],
            'Ground Circuit': [
                'Corroded ground connections',
                'Loose ground straps',
                'Damaged ground wires',
                'Poor chassis grounding',
                'Oxidized ground terminals'
            ],
            'Lighting System': [
                'Burned out bulbs',
                'Faulty light switches',
                'Damaged wiring to lights',
                'Bad ground connections',
                'Failed lighting control module'
            ],
            'Wiring Harness': [
                'Physical damage to wires',
                'Corrosion in connectors',
                'Chafing against sharp edges',
                'Heat damage',
                'Rodent damage'
            ],
            'Fuse/Relay': [
                'Blown fuse',
                'Failed relay',
                'Overloaded circuit',
                'Corrosion in fuse box',
                'Loose fuse or relay connections'
            ]
        };
        return causes[faultType] || ['Unknown causes requiring detailed inspection'];
    }

    getRecommendedActions(faultType) {
        const actions = {
            'Battery/Charging System': [
                'Test battery voltage and load capacity',
                'Check alternator output voltage',
                'Inspect battery terminals for corrosion',
                'Verify proper belt tension',
                'Test charging system under load'
            ],
            'Ground Circuit': [
                'Inspect all ground connections',
                'Clean corroded ground points',
                'Verify ground strap integrity',
                'Check chassis ground resistance',
                'Apply dielectric grease to connections'
            ],
            'Lighting System': [
                'Replace burned out bulbs',
                'Test light switch operation',
                'Check wiring continuity to affected lights',
                'Inspect for proper ground connections',
                'Scan for lighting control module codes'
            ],
            'Wiring Harness': [
                'Visually inspect harness for damage',
                'Check connector integrity',
                'Test wire continuity',
                'Look for signs of chafing or heat damage',
                'Verify proper harness routing'
            ],
            'Fuse/Relay': [
                'Check all related fuses',
                'Test relay operation',
                'Inspect fuse box for corrosion',
                'Verify proper fuse ratings',
                'Check for loose connections'
            ]
        };
        return actions[faultType] || ['Perform comprehensive electrical system inspection'];
    }

    getRelevantWiringSections(faultType, diagnosticData) {
        const sections = {
            'Battery/Charging System': ['Battery cables', 'Alternator circuit', 'Power distribution'],
            'Ground Circuit': ['Engine ground', 'Body ground', 'Chassis ground'],
            'Lighting System': ['Headlight circuit', 'Taillight circuit', 'Interior lighting'],
            'Wiring Harness': ['Engine harness', 'Body harness', 'Dash harness'],
            'Fuse/Relay': ['Fuse box', 'Power distribution', 'Relay box']
        };
        
        // Customize based on vehicle make if available
        const make = diagnosticData.vehicle?.make?.toLowerCase();
        if (make && sections[faultType]) {
            return sections[faultType].map(section => `${section} (${make.charAt(0).toUpperCase() + make.slice(1)})`);
        }
        
        return sections[faultType] || ['General wiring inspection required'];
    }

    initializeFaultDatabase() {
        // This would typically be loaded from a comprehensive database
        return {
            commonFaults: [
                {
                    symptoms: ['won\'t start', 'dead battery'],
                    faultType: 'Battery/Charging System',
                    priority: 'high'
                },
                {
                    symptoms: ['lights dim', 'flickering'],
                    faultType: 'Lighting System',
                    priority: 'medium'
                }
                // ... more fault patterns
            ],
            makeSpecific: {
                ford: {
                    commonIssues: ['Ground circuit problems in F-series trucks']
                },
                chevrolet: {
                    commonIssues: ['Alternator issues in Silverado models']
                }
                // ... more make-specific data
            }
        };
    }

    initializeWiringKnowledge() {
        // This would contain detailed wiring information
        return {
            colorCodes: {
                red: 'Power/Battery positive',
                black: 'Ground/Battery negative',
                blue: 'Headlight circuit',
                green: 'Turn signal circuit'
                // ... more color codes
            },
            connectorTypes: {
                weather_pack: 'Sealed connector for harsh environments',
                metri_pack: 'Standard GM connector series',
                junior_power_timer: 'High current applications'
                // ... more connector types
            }
        };
    }
}
