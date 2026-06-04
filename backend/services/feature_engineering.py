import pandas as pd
import numpy as np

def apply_feature_engineering(input_path: str, output_path: str, operations: list) -> str:
    try:
        df = pd.read_csv(input_path)
    except Exception as e:
        raise ValueError(f"Failed to read CSV: {str(e)}")
        
    for op in operations:
        op_type = op.get("type")
        
        if op_type == "LogTransform":
            col = op.get("column")
            if col not in df.columns or not pd.api.types.is_numeric_dtype(df[col]):
                raise ValueError(f"LogTransform requires a numerical column. Invalid: {col}")
            min_val = df[col].min()
            if min_val < 0:
                df[f"{col}_log"] = np.log1p(df[col] - min_val)
            else:
                df[f"{col}_log"] = np.log1p(df[col])
                
        elif op_type == "Mathematical":
            col1 = op.get("column1")
            col2 = op.get("column2")
            math_op = op.get("operation")
            new_col_name = op.get("new_column_name")
            
            if col1 not in df.columns or not pd.api.types.is_numeric_dtype(df[col1]):
                raise ValueError(f"Mathematical operation requires numerical columns. Invalid: {col1}")
            if col2 not in df.columns or not pd.api.types.is_numeric_dtype(df[col2]):
                raise ValueError(f"Mathematical operation requires numerical columns. Invalid: {col2}")
                
            if math_op == "add":
                df[new_col_name] = df[col1] + df[col2]
            elif math_op == "sub":
                df[new_col_name] = df[col1] - df[col2]
            elif math_op == "mul":
                df[new_col_name] = df[col1] * df[col2]
            elif math_op == "div":
                df[new_col_name] = df[col1] / df[col2].replace(0, np.nan)
                
        elif op_type == "Binning":
            col = op.get("column")
            bins = int(op.get("bins", 3))
            strategy = op.get("strategy", "uniform")
            
            if col not in df.columns or not pd.api.types.is_numeric_dtype(df[col]):
                raise ValueError(f"Binning requires a numerical column. Invalid: {col}")
                
            if strategy == "quantile":
                df[f"{col}_binned"] = pd.qcut(df[col], q=bins, labels=False, duplicates='drop')
            else:
                df[f"{col}_binned"] = pd.cut(df[col], bins=bins, labels=False)
                
        elif op_type == "Polynomial":
            col = op.get("column")
            degree = int(op.get("degree", 2))
            
            if col not in df.columns or not pd.api.types.is_numeric_dtype(df[col]):
                raise ValueError(f"Polynomial expansion requires a numerical column. Invalid: {col}")
                
            for d in range(2, degree + 1):
                df[f"{col}_pow_{d}"] = df[col] ** d
                    
    df.to_csv(output_path, index=False)
    return output_path
