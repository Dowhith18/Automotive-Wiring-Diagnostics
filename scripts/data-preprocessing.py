"""
Data Preprocessing Pipeline for Automotive Diagnostics
Processes raw diagnostic data for machine learning training
"""

import pandas as pd
import numpy as np
import json
import re
from pathlib import Path
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
import joblib

class AutomotiveDiagnosticsPreprocessor:
    def __init__(self):
        self.label_encoders = {}
        self.scaler = StandardScaler()
        self.symptom_vectorizer = TfidfVectorizer(max_features=100, stop_words='english')
        self.feature_names = []
        
    def load_raw_data(self, data_path):
        """Load raw diagnostic data from various sources"""
        raw_data = []
        
        # Load from multiple file types
        data_files = list(Path(data_path).glob('*.csv')) + list(Path(data_path).glob('*.json'))
        
        for file_path in data_files:
            if file_path.suffix == '.csv':
                df = pd.read_csv(file_path)
                raw_data.append(df)
            elif file_path.suffix == '.json':
                with open(file_path, 'r') as f:
                    json_data = json.load(f)
                    df = pd.json_normalize(json_data)
                    raw_data.append(df)
        
        if raw_data:
            return pd.concat(raw_data, ignore_index=True)
        else:
            return pd.DataFrame()
    
    def clean_data(self, df):
        """Clean and standardize the raw data"""
        print("Cleaning data...")
        
        # Remove duplicates
        df = df.drop_duplicates()
        
        # Standardize column names
        df.columns = df.columns.str.lower().str.replace(' ', '_').str.replace('-', '_')
        
        # Clean text fields
        text_columns = ['symptoms', 'description', 'repair_notes']
        for col in text_columns:
            if col in df.columns:
                df[col] = df[col].astype(str).str.lower()
                df[col] = df[col].apply(self.clean_text)
        
        # Standardize vehicle information
        if 'make' in df.columns:
            df['make'] = df['make'].str.lower().str.strip()
        if 'model' in df.columns:
            df['model'] = df['model'].str.lower().str.strip()
        
        # Clean DTC codes
        if 'dtc_codes' in df.columns:
            df['dtc_codes'] = df['dtc_codes'].apply(self.clean_dtc_codes)
        
        # Handle missing values
        df = self.handle_missing_values(df)
        
        return df
    
    def clean_text(self, text):
        """Clean text data"""
        if pd.isna(text):
            return ""
        
        # Convert to string and lowercase
        text = str(text).lower()
        
        # Remove special characters but keep spaces
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text
    
    def clean_dtc_codes(self, codes):
        """Clean and standardize DTC codes"""
        if pd.isna(codes):
            return ""
        
        codes = str(codes).upper()
        # Extract valid DTC codes (format: P0123, B1234, etc.)
        dtc_pattern = r'[PCBU][0-3][0-9A-F]{3}'
        found_codes = re.findall(dtc_pattern, codes)
        
        return ' '.join(found_codes)
    
    def handle_missing_values(self, df):
        """Handle missing values appropriately"""
        # Numerical columns - fill with median
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        for col in numerical_cols:
            df[col] = df[col].fillna(df[col].median())
        
        # Categorical columns - fill with mode or 'unknown'
        categorical_cols = df.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            if col in ['make', 'model']:
                df[col] = df[col].fillna('unknown')
            else:
                df[col] = df[col].fillna('')
        
        return df
    
    def extract_features(self, df):
        """Extract features for machine learning"""
        print("Extracting features...")
        
        features = pd.DataFrame()
        
        # Vehicle features
        features = pd.concat([features, self.extract_vehicle_features(df)], axis=1)
        
        # Symptom features
        features = pd.concat([features, self.extract_symptom_features(df)], axis=1)
        
        # Measurement features
        features = pd.concat([features, self.extract_measurement_features(df)], axis=1)
        
        # DTC code features
        features = pd.concat([features, self.extract_dtc_features(df)], axis=1)
        
        # Temporal features
        features = pd.concat([features, self.extract_temporal_features(df)], axis=1)
        
        self.feature_names = list(features.columns)
        return features
    
    def extract_vehicle_features(self, df):
        """Extract vehicle-related features"""
        vehicle_features = pd.DataFrame()
        
        # Year normalization
        if 'year' in df.columns:
            current_year = pd.Timestamp.now().year
            vehicle_features['vehicle_age'] = current_year - df['year']
            vehicle_features['vehicle_age_normalized'] = (vehicle_features['vehicle_age'] - vehicle_features['vehicle_age'].min()) / (vehicle_features['vehicle_age'].max() - vehicle_features['vehicle_age'].min())
        
        # Mileage categories
        if 'mileage' in df.columns:
            vehicle_features['mileage_category'] = pd.cut(df['mileage'], 
                                                        bins=[0, 50000, 100000, 150000, 200000, np.inf],
                                                        labels=[0, 1, 2, 3, 4])
        
        # Make encoding (one-hot for common makes)
        if 'make' in df.columns:
            common_makes = ['ford', 'chevrolet', 'toyota', 'honda', 'nissan']
            for make in common_makes:
                vehicle_features[f'make_{make}'] = (df['make'] == make).astype(int)
            vehicle_features['make_other'] = (~df['make'].isin(common_makes)).astype(int)
        
        return vehicle_features
    
    def extract_symptom_features(self, df):
        """Extract features from symptom descriptions"""
        symptom_features = pd.DataFrame()
        
        if 'symptoms' in df.columns:
            # Define symptom categories
            symptom_keywords = {
                'battery': ['battery', 'dead', 'weak', 'won\'t start'],
                'lights': ['lights', 'headlight', 'dim', 'flickering', 'bright'],
                'starting': ['starting', 'starter', 'crank', 'turn over'],
                'charging': ['charging', 'alternator', 'voltage'],
                'electrical': ['electrical', 'power', 'fuse', 'blown', 'short'],
                'intermittent': ['intermittent', 'sometimes', 'occasionally', 'random'],
                'multiple_systems': ['multiple', 'several', 'various', 'all']
            }
            
            # Create binary features for each symptom category
            for category, keywords in symptom_keywords.items():
                pattern = '|'.join(keywords)
                symptom_features[f'symptoms_{category}'] = df['symptoms'].str.contains(pattern, regex=True, na=False).astype(int)
            
            # TF-IDF features for symptom text
            if not df['symptoms'].isna().all():
                tfidf_features = self.symptom_vectorizer.fit_transform(df['symptoms'].fillna(''))
                tfidf_df = pd.DataFrame(tfidf_features.toarray(), 
                                      columns=[f'tfidf_{i}' for i in range(tfidf_features.shape[1])])
                symptom_features = pd.concat([symptom_features, tfidf_df], axis=1)
        
        return symptom_features
    
    def extract_measurement_features(self, df):
        """Extract features from electrical measurements"""
        measurement_features = pd.DataFrame()
        
        # Direct measurement features
        measurement_cols = ['battery_voltage', 'alternator_output', 'ground_resistance']
        for col in measurement_cols:
            if col in df.columns:
                # Normalized values
                measurement_features[f'{col}_normalized'] = df[col]
                
                # Categorical ranges
                if col == 'battery_voltage':
                    measurement_features['battery_low'] = (df[col] < 12.0).astype(int)
                    measurement_features['battery_high'] = (df[col] > 14.0).astype(int)
                elif col == 'alternator_output':
                    measurement_features['alternator_low'] = (df[col] < 13.5).astype(int)
                    measurement_features['alternator_high'] = (df[col] > 15.0).astype(int)
                elif col == 'ground_resistance':
                    measurement_features['ground_high'] = (df[col] > 0.5).astype(int)
        
        # Derived features
        if 'battery_voltage' in df.columns and 'alternator_output' in df.columns:
            measurement_features['charging_differential'] = df['alternator_output'] - df['battery_voltage']
            measurement_features['charging_ratio'] = df['alternator_output'] / (df['battery_voltage'] + 1e-6)
        
        return measurement_features
    
    def extract_dtc_features(self, df):
        """Extract features from DTC codes"""
        dtc_features = pd.DataFrame()
        
        if 'dtc_codes' in df.columns:
            # Count of different DTC types
            dtc_types = ['P', 'B', 'C', 'U']
            for dtc_type in dtc_types:
                pattern = f'{dtc_type}[0-3][0-9A-F]{{3}}'
                dtc_features[f'dtc_{dtc_type.lower()}_count'] = df['dtc_codes'].str.count(pattern)
                dtc_features[f'has_dtc_{dtc_type.lower()}'] = (dtc_features[f'dtc_{dtc_type.lower()}_count'] > 0).astype(int)
            
            # Total DTC count
            dtc_features['total_dtc_count'] = dtc_features[[f'dtc_{t.lower()}_count' for t in dtc_types]].sum(axis=1)
            
            # Specific common codes
            common_codes = ['P0601', 'P0562', 'P0563', 'B1000', 'U0100']
            for code in common_codes:
                dtc_features[f'has_{code.lower()}'] = df['dtc_codes'].str.contains(code).astype(int)
        
        return dtc_features
    
    def extract_temporal_features(self, df):
        """Extract temporal features"""
        temporal_features = pd.DataFrame()
        
        if 'date' in df.columns or 'timestamp' in df.columns:
            date_col = 'date' if 'date' in df.columns else 'timestamp'
            dates = pd.to_datetime(df[date_col])
            
            temporal_features['month'] = dates.dt.month
            temporal_features['season'] = ((dates.dt.month - 1) // 3).astype(int)  # 0=Winter, 1=Spring, 2=Summer, 3=Fall
            temporal_features['is_winter'] = (temporal_features['season'] == 0).astype(int)
        
        return temporal_features
    
    def encode_labels(self, df, target_column='fault_type'):
        """Encode target labels"""
        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found in data")
        
        # Clean target labels
        labels = df[target_column].str.lower().str.strip()
        
        # Standardize common fault types
        label_mapping = {
            'battery': 'Battery/Charging System',
            'charging': 'Battery/Charging System',
            'alternator': 'Battery/Charging System',
            'ground': 'Ground Circuit',
            'grounding': 'Ground Circuit',
            'lights': 'Lighting System',
            'lighting': 'Lighting System',
            'headlight': 'Lighting System',
            'wiring': 'Wiring Harness',
            'harness': 'Wiring Harness',
            'wire': 'Wiring Harness',
            'fuse': 'Fuse/Relay',
            'relay': 'Fuse/Relay',
            'switch': 'Switch/Control Module',
            'module': 'Switch/Control Module',
            'sensor': 'Sensor Circuit'
        }
        
        # Apply mapping
        for key, value in label_mapping.items():
            labels = labels.str.replace(key, value.lower())
        
        # Encode labels
        le = LabelEncoder()
        encoded_labels = le.fit_transform(labels)
        
        self.label_encoders['fault_type'] = le
        
        return encoded_labels, le.classes_
    
    def preprocess_pipeline(self, data_path, output_path, target_column='fault_type'):
        """Complete preprocessing pipeline"""
        print("Starting preprocessing pipeline...")
        
        # Load raw data
        df = self.load_raw_data(data_path)
        if df.empty:
            raise ValueError("No data found to process")
        
        print(f"Loaded {len(df)} records")
        
        # Clean data
        df_clean = self.clean_data(df)
        print(f"After cleaning: {len(df_clean)} records")
        
        # Extract features
        features = self.extract_features(df_clean)
        print(f"Extracted {features.shape[1]} features")
        
        # Encode labels
        if target_column in df_clean.columns:
            labels, class_names = self.encode_labels(df_clean, target_column)
            print(f"Found {len(class_names)} fault classes: {class_names}")
        else:
            labels = None
            class_names = None
        
        # Scale features
        features_scaled = self.scaler.fit_transform(features)
        
        # Create output directory
        output_path = Path(output_path)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Save processed data
        np.save(output_path / 'features.npy', features_scaled)
        if labels is not None:
            np.save(output_path / 'labels.npy', labels)
        
        # Save feature names and metadata
        metadata = {
            'feature_names': self.feature_names,
            'class_names': class_names.tolist() if class_names is not None else None,
            'num_features': features_scaled.shape[1],
            'num_samples': features_scaled.shape[0]
        }
        
        with open(output_path / 'metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        # Save preprocessors
        joblib.dump(self.scaler, output_path / 'scaler.pkl')
        joblib.dump(self.label_encoders, output_path / 'label_encoders.pkl')
        joblib.dump(self.symptom_vectorizer, output_path / 'symptom_vectorizer.pkl')
        
        print(f"Preprocessing complete. Output saved to {output_path}")
        
        return features_scaled, labels, metadata

def main():
    """Main preprocessing function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Preprocess automotive diagnostic data')
    parser.add_argument('--input', type=str, required=True, help='Input data directory')
    parser.add_argument('--output', type=str, required=True, help='Output directory')
    parser.add_argument('--target', type=str, default='fault_type', help='Target column name')
    
    args = parser.parse_args()
    
    preprocessor = AutomotiveDiagnosticsPreprocessor()
    
    try:
        features, labels, metadata = preprocessor.preprocess_pipeline(
            args.input, args.output, args.target
        )
        print("Preprocessing completed successfully!")
        print(f"Features shape: {features.shape}")
        if labels is not None:
            print(f"Labels shape: {labels.shape}")
        
    except Exception as e:
        print(f"Error during preprocessing: {e}")
        raise

if __name__ == "__main__":
    main()
