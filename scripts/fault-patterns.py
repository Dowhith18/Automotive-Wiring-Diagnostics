# scripts/fault-patterns.py (CREATE NEW FILE)

# Phase 6: Comprehensive Fault Classification
fault_patterns = {
    'wire_degradation': {
        'symptoms': ['intermittent_connection', 'voltage_drop', 'resistance_increase'],
        'progression': 'gradual',
        'environmental_factors': ['temperature', 'vibration', 'moisture'],
        'affected_systems': ['engine', 'transmission', 'body_control'],
        'severity_levels': {
            'minor': {'resistance_increase': '<10%', 'voltage_drop': '<0.5V'},
            'moderate': {'resistance_increase': '10-50%', 'voltage_drop': '0.5-2V'},
            'severe': {'resistance_increase': '>50%', 'voltage_drop': '>2V'}
        }
    },
    'connector_corrosion': {
        'symptoms': ['high_resistance', 'signal_loss', 'dtc_codes'],
        'progression': 'gradual',
        'environmental_factors': ['moisture', 'salt_exposure', 'temperature_cycling'],
        'affected_systems': ['all_electrical_systems'],
        'common_locations': ['engine_bay', 'undercarriage', 'door_frames']
    },
    'terminal_crimping_failure': {
        'symptoms': ['intermittent_connection', 'complete_signal_loss', 'arcing'],
        'progression': 'sudden',
        'environmental_factors': ['vibration', 'temperature_cycling'],
        'affected_systems': ['power_distribution', 'control_modules'],
        'detection_methods': ['resistance_testing', 'visual_inspection']
    },
    'insulation_failure': {
        'symptoms': ['short_circuits', 'blown_fuses', 'electrical_fires'],
        'progression': 'gradual_then_sudden',
        'environmental_factors': ['heat', 'abrasion', 'chemical_exposure'],
        'affected_systems': ['all_electrical_systems'],
        'risk_level': 'high'
    },
    'electromagnetic_interference': {
        'symptoms': ['signal_disruption', 'false_readings', 'communication_errors'],
        'progression': 'intermittent',
        'environmental_factors': ['radio_frequency', 'ignition_system', 'alternator'],
        'affected_systems': ['communication_networks', 'sensor_systems'],
        'mitigation': ['shielding', 'filtering', 'routing']
    }
}

class FaultPatternAnalyzer:
    def __init__(self):
        self.patterns = fault_patterns
    
    def analyze_symptoms(self, symptoms):
        """Match symptoms to potential fault patterns"""
        matches = {}
        
        for pattern_name, pattern_data in self.patterns.items():
            match_score = 0
            for symptom in symptoms:
                if symptom in pattern_data['symptoms']:
                    match_score += 1
            
            if match_score > 0:
                matches[pattern_name] = {
                    'score': match_score / len(pattern_data['symptoms']),
                    'pattern': pattern_data
                }
        
        return sorted(matches.items(), key=lambda x: x[1]['score'], reverse=True)
    
    def get_diagnostic_steps(self, fault_type):
        """Get recommended diagnostic steps for a fault type"""
        if fault_type in self.patterns:
            pattern = self.patterns[fault_type]
            return {
                'visual_inspection': True,
                'electrical_testing': 'resistance' in pattern['symptoms'],
                'environmental_check': pattern['environmental_factors'],
                'system_scan': pattern['affected_systems']
            }
        return None
