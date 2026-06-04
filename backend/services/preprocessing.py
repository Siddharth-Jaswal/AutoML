import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, LabelEncoder, OrdinalEncoder
import numpy as np

def apply_preprocessing(input_path: str, output_path: str, operations: list) -> str:
    try:
        df = pd.read_csv(input_path)
    except Exception as e:
        raise ValueError(f"Failed to read CSV: {str(e)}")
    
    for op in operations:
        op_type = op.get("type")
        cols = op.get("columns", [])
        
        # if columns empty, skip
        if not cols:
            continue
            
        # ensure cols exist
        cols = [c for c in cols if c in df.columns]
        if not cols:
            continue
        
        if op_type in ["StandardScaler", "MinMaxScaler", "RobustScaler"]:
            non_numeric = [c for c in cols if not pd.api.types.is_numeric_dtype(df[c])]
            if non_numeric:
                raise ValueError(f"{op_type} requires numerical columns. Invalid: {', '.join(non_numeric)}")
                
            if op_type == "StandardScaler":
                scaler = StandardScaler()
                df[cols] = scaler.fit_transform(df[cols])
            elif op_type == "MinMaxScaler":
                scaler = MinMaxScaler()
                df[cols] = scaler.fit_transform(df[cols])
            elif op_type == "RobustScaler":
                scaler = RobustScaler()
                df[cols] = scaler.fit_transform(df[cols])
                
        elif op_type in ["LabelEncoder", "OrdinalEncoder", "OneHotEncoding"]:
            # Typically applied to non-numerical or discrete categorical
            if op_type == "LabelEncoder":
                for col in cols:
                    le = LabelEncoder()
                    df[col] = le.fit_transform(df[col].astype(str))
            elif op_type == "OrdinalEncoder":
                oe = OrdinalEncoder()
                df[cols] = oe.fit_transform(df[cols].astype(str))
            elif op_type == "OneHotEncoding":
                df = pd.get_dummies(df, columns=cols)
                
        elif op_type == "DropMissingRows":
            df = df.dropna(subset=cols if cols else None)
            
        elif op_type in ["FillMissingMean", "FillMissingMedian"]:
            non_numeric = [c for c in cols if not pd.api.types.is_numeric_dtype(df[c])]
            if non_numeric:
                raise ValueError(f"{op_type} requires numerical columns. Invalid: {', '.join(non_numeric)}")
            
            for col in cols:
                if op_type == "FillMissingMean":
                    df[col] = df[col].fillna(df[col].mean())
                elif op_type == "FillMissingMedian":
                    df[col] = df[col].fillna(df[col].median())
                    
        elif op_type == "FillMissingMode":
            for col in cols:
                if not df[col].mode().empty:
                    df[col] = df[col].fillna(df[col].mode()[0])
                    
        elif op_type == "DropColumns":
            df = df.drop(columns=cols, errors='ignore')
            
        elif op_type == "PCA":
            non_numeric = [c for c in cols if not pd.api.types.is_numeric_dtype(df[c])]
            if non_numeric:
                raise ValueError(f"PCA requires numerical columns. Invalid: {', '.join(non_numeric)}")
                
            from sklearn.decomposition import PCA
            pca = PCA(n_components=min(2, len(cols)))
            components = pca.fit_transform(df[cols].fillna(0))
            for i in range(components.shape[1]):
                df[f"PCA_{i+1}"] = components[:, i]
            df = df.drop(columns=cols)
            
        elif op_type == "VarianceThreshold":
            non_numeric = [c for c in cols if not pd.api.types.is_numeric_dtype(df[c])]
            if non_numeric:
                raise ValueError(f"Variance Threshold requires numerical columns. Invalid: {', '.join(non_numeric)}")
                
            from sklearn.feature_selection import VarianceThreshold
            vt = VarianceThreshold(threshold=0.0)
            vt.fit(df[cols].fillna(0))
            dropped = [c for i, c in enumerate(cols) if not vt.get_support()[i]]
            df = df.drop(columns=dropped)
            
    df.to_csv(output_path, index=False)
    return output_path
