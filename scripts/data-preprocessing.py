# scripts/data-preprocessing.py

import requests
import pandas as pd
import numpy as np
from datetime import datetime
import logging

# Phase 1: Official Data Sources
class NHTSADataCollector:
    def __init__(self):
        self.base_url = "https://vpic.nhtsa.dot.gov/api"
    
    def get_vehicle_recalls(self, make, model, year):
        url = f"https://api.nhtsa.gov/recalls/recallsByVehicle"
        params = {"make": make, "model": model, "modelYear": year}
        return requests.get(url, params=params).json()
    
    def get_vehicle_makes(self):
        """Fetch all vehicle makes"""
        url = f"{self.base_url}/vehicles/GetMakesForVehicleType/car?format=json"
        response = requests.get(url)
        return response.json()

class EPADataCollector:
    def __init__(self):
        self.base_url = "https://www.fueleconomy.gov/ws/rest"
    
    def get_vehicle_data(self, year, make, model):
        """Collect EPA fuel economy and emissions data"""
        url = f"{self.base_url}/vehicle/menu/options"
        params = {"year": year, "make": make, "model": model}
        response = requests.get(url, params=params)
        return response.json()
# Add to scripts/data-preprocessing.py (continue same file)

from sklearn.datasets import make_classification

# Phase 2: Synthetic Dataset Generation
class SyntheticFaultGenerator:
    def generate_wiring_fault_scenarios(self):
        # Generate realistic electrical parameters
        voltage_readings = np.random.normal(12.6, 0.5, 10000)  # 12V system
        resistance_values = np.random.lognormal(0, 0.5, 10000)  # Wire resistance
        temperature_data = np.random.normal(75, 15, 10000)      # Operating temp
        
        # Simulate fault conditions with realistic parameter changes
        fault_scenarios = self._inject_fault_patterns(
            voltage_readings, resistance_values, temperature_data
        )
        
        return fault_scenarios
    
    def _inject_fault_patterns(self, voltage, resistance, temperature):
        """Inject realistic fault patterns into data"""
        # Implementation for fault pattern injection
        return {"voltage": voltage, "resistance": resistance, "temperature": temperature}
# Add to scripts/data-preprocessing.py (continue same file)

# Phase 3: Data Quality Validation
class DataQualityValidator:
    def validate_automotive_data(self, data):
        results = {}
        
        # Range validation for automotive parameters
        results['voltage_valid'] = self._validate_voltage_range(data['voltage'])
        results['temperature_valid'] = self._validate_temperature_range(data['temp'])
        results['completeness'] = self._check_data_completeness(data)
        
        return results
    
    def _validate_voltage_range(self, voltage_data):
        # 12V automotive systems: valid range 10.5V - 14.8V
        return (voltage_data >= 10.5).all() and (voltage_data <= 14.8).all()
    
    def _validate_temperature_range(self, temp_data):
        # Automotive temperature range: -40°F to 300°F (-40°C to 150°C)
        return (temp_data >= -40).all() and (temp_data <= 150).all()
    
    def _check_data_completeness(self, data):
        # Check for missing values
        if hasattr(data, 'isnull'):
            return 1 - (data.isnull().sum() / len(data))
        return 1.0
