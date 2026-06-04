import pandas as pd
import io
import numpy as np

def get_basic_summary(file_bytes: bytes, filename: str) -> dict:
    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
    except Exception as e:
        raise ValueError(f"Failed to read CSV: {str(e)}")
        
    rows, cols = df.shape
    memory_usage = df.memory_usage(deep=True).sum()
    
    missing_pct = (df.isnull().sum().sum() / (rows * cols)) * 100 if rows > 0 else 0
    duplicate_rows = int(df.duplicated().sum())
    
    columns_info = []
    for col in df.columns:
        col_type = str(df[col].dtype)
        unique_vals = int(df[col].nunique())
        missing_count = int(df[col].isnull().sum())
        missing_pct_col = (missing_count / rows) * 100 if rows > 0 else 0
        
        columns_info.append({
            "name": col,
            "type": col_type,
            "unique_values": unique_vals,
            "missing_percentage": missing_pct_col
        })
        
    return {
        "filename": filename,
        "rows": rows,
        "columns": cols,
        "memory_usage_bytes": int(memory_usage),
        "missing_percentage_total": float(missing_pct),
        "duplicate_rows": duplicate_rows,
        "columns_info": columns_info
    }

def get_feature_details(file_path: str, column_name: str) -> dict:
    try:
        df = pd.read_csv(file_path, usecols=[column_name])
    except Exception as e:
        raise ValueError(f"Failed to read CSV or column not found: {str(e)}")
        
    col_data = df[column_name]
    is_numeric = pd.api.types.is_numeric_dtype(col_data)
    
    clean_data = col_data.dropna()
    
    if is_numeric:
        mode_val = clean_data.mode()
        mode = float(mode_val.iloc[0]) if not mode_val.empty else None
        
        stats = {
            "type": "numerical",
            "mean": float(clean_data.mean()) if not clean_data.empty else None,
            "median": float(clean_data.median()) if not clean_data.empty else None,
            "mode": mode,
            "std_dev": float(clean_data.std()) if len(clean_data) > 1 else None,
            "variance": float(clean_data.var()) if len(clean_data) > 1 else None,
            "min": float(clean_data.min()) if not clean_data.empty else None,
            "max": float(clean_data.max()) if not clean_data.empty else None,
            "q1": float(clean_data.quantile(0.25)) if not clean_data.empty else None,
            "q3": float(clean_data.quantile(0.75)) if not clean_data.empty else None,
            "skewness": float(clean_data.skew()) if len(clean_data) > 2 else None,
            "kurtosis": float(clean_data.kurtosis()) if len(clean_data) > 3 else None,
        }
        
        if not clean_data.empty:
            counts, bins = np.histogram(clean_data, bins=min(30, len(clean_data.unique()) if len(clean_data.unique()) > 0 else 10))
            chart_data = {
                "histogram": {
                    "counts": counts.tolist(),
                    "bins": bins.tolist()
                },
                "boxplot": {
                    "y": clean_data.tolist()
                }
            }
            if len(chart_data["boxplot"]["y"]) > 5000:
                chart_data["boxplot"]["y"] = clean_data.sample(n=5000).tolist()
        else:
            chart_data = {}
            
    else:
        mode_val = clean_data.mode()
        mode = str(mode_val.iloc[0]) if not mode_val.empty else None
        
        stats = {
            "type": "categorical",
            "unique_values": int(clean_data.nunique()),
            "mode": mode,
        }
        
        if not clean_data.empty:
            val_counts = clean_data.value_counts().head(20)
            chart_data = {
                "bar": {
                    "labels": val_counts.index.astype(str).tolist(),
                    "values": val_counts.values.tolist()
                }
            }
        else:
            chart_data = {}
            
    return {
        "column_name": column_name,
        "stats": stats,
        "chart_data": chart_data
    }

def generate_plot_data(file_path: str, plot_type: str, x_column: str, y_column: str = None) -> dict:
    try:
        cols = [x_column]
        if y_column:
            cols.append(y_column)
            
        df = pd.read_csv(file_path, usecols=cols)
        df = df.dropna()
        
        is_x_num = pd.api.types.is_numeric_dtype(df[x_column])
        is_y_num = pd.api.types.is_numeric_dtype(df[y_column]) if y_column else False
        
        # Runtime Validation
        if plot_type == "kde" and not is_x_num:
            raise ValueError("KDE Plot requires a numerical X-Axis feature.")
        if plot_type in ["box", "violin"]:
            if y_column and not is_y_num:
                raise ValueError(f"{plot_type.capitalize()} Plot requires a numerical Y-Axis feature.")
            if not y_column and not is_x_num:
                raise ValueError(f"1D {plot_type.capitalize()} Plot requires a numerical X-Axis feature.")
        
        # Downsample for scatter/line/curve
        max_points = 5000
        if len(df) > max_points and plot_type in ["scatter", "line", "curve"]:
            df = df.sample(n=max_points, random_state=42)
            
        if plot_type == "histogram":
            if pd.api.types.is_numeric_dtype(df[x_column]):
                counts, bins = np.histogram(df[x_column], bins=min(50, len(df[x_column].unique()) if len(df[x_column].unique()) > 0 else 10))
                return {
                    "type": "bar",
                    "x": bins[:-1].tolist(),
                    "y": counts.tolist()
                }
            else:
                val_counts = df[x_column].value_counts().head(50)
                return {
                    "type": "bar",
                    "x": val_counts.index.astype(str).tolist(),
                    "y": val_counts.values.tolist()
                }
        elif plot_type == "scatter":
            return {
                "type": "scatter",
                "mode": "markers",
                "x": df[x_column].tolist(),
                "y": df[y_column].tolist() if y_column else None
            }
        elif plot_type in ["line", "curve"]:
            df = df.sort_values(by=x_column)
            return {
                "type": "scatter",
                "mode": "lines",
                "x": df[x_column].tolist(),
                "y": df[y_column].tolist() if y_column else None
            }
        elif plot_type == "kde":
            from scipy.stats import gaussian_kde
            data = df[x_column].values
            if len(data) < 2:
                raise ValueError("Not enough data to calculate KDE.")
            kde = gaussian_kde(data)
            x_vals = np.linspace(data.min(), data.max(), 200)
            y_vals = kde(x_vals)
            return {
                "type": "scatter",
                "mode": "lines",
                "fill": "tozeroy",
                "x": x_vals.tolist(),
                "y": y_vals.tolist()
            }
        elif plot_type == "box":
            if y_column:
                return {
                    "type": "box",
                    "x": df[x_column].tolist(),
                    "y": df[y_column].tolist()
                }
            else:
                return {
                    "type": "box",
                    "y": df[x_column].tolist()
                }
        elif plot_type == "violin":
            if y_column:
                return {
                    "type": "violin",
                    "x": df[x_column].tolist(),
                    "y": df[y_column].tolist()
                }
            else:
                return {
                    "type": "violin",
                    "y": df[x_column].tolist()
                }
        else:
            raise ValueError(f"Unsupported plot_type: {plot_type}")
            
    except Exception as e:
        raise ValueError(f"Failed to generate plot data: {str(e)}")

def get_missing_values_report(file_path: str) -> dict:
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        raise ValueError(f"Failed to read CSV: {str(e)}")
        
    rows = len(df)
    
    missing_counts = df.isnull().sum()
    missing_percentages = (missing_counts / rows) * 100 if rows > 0 else missing_counts * 0
    
    missing_data = []
    for col in df.columns:
        if missing_counts[col] > 0:
            missing_data.append({
                "column": col,
                "count": int(missing_counts[col]),
                "percentage": float(missing_percentages[col])
            })
            
    missing_data = sorted(missing_data, key=lambda x: x["percentage"], reverse=True)
    
    total_missing_cells = int(missing_counts.sum())
    total_cells = rows * len(df.columns)
    overall_missing_percentage = (total_missing_cells / total_cells) * 100 if total_cells > 0 else 0
    
    rows_with_missing = int(df.isnull().any(axis=1).sum())
    rows_missing_percentage = (rows_with_missing / rows) * 100 if rows > 0 else 0

    return {
        "overall_missing_percentage": overall_missing_percentage,
        "rows_with_missing": rows_with_missing,
        "rows_missing_percentage": rows_missing_percentage,
        "total_rows": rows,
        "missing_columns": missing_data
    }

def get_correlation_matrix(file_path: str, method: str = "pearson", features: list = None) -> dict:
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        raise ValueError(f"Failed to read CSV: {str(e)}")
        
    numeric_df = df.select_dtypes(include=[np.number])
    if numeric_df.empty:
        return {"error": "No numerical columns found for correlation."}
        
    if features:
        valid_features = [f for f in features if f in numeric_df.columns]
        if not valid_features:
            return {"error": "None of the selected features are numerical or exist in the dataset."}
        numeric_df = numeric_df[valid_features]
        
    corr = numeric_df.corr(method=method)
    corr = corr.fillna(0)
    
    pairs = []
    cols = corr.columns
    for i in range(len(cols)):
        for j in range(i+1, len(cols)):
            val = float(corr.iloc[i, j])
            if abs(val) > 0.5:
                pairs.append({
                    "feature1": cols[i],
                    "feature2": cols[j],
                    "correlation": val,
                    "abs_correlation": abs(val)
                })
                
    pairs = sorted(pairs, key=lambda x: x["abs_correlation"], reverse=True)
    
    return {
        "columns": corr.columns.tolist(),
        "matrix": corr.values.tolist(),
        "top_pairs": pairs
    }

def get_outliers_report(file_path: str) -> dict:
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        raise ValueError(f"Failed to read CSV: {str(e)}")
        
    numeric_df = df.select_dtypes(include=[np.number])
    rows = len(df)
    
    if numeric_df.empty or rows == 0:
        return {
            "overall_outliers_percentage": 0,
            "rows_with_outliers": 0,
            "rows_outliers_percentage": 0,
            "total_rows": rows,
            "outlier_columns": []
        }
        
    outlier_data = []
    is_outlier_row = pd.Series(False, index=df.index)
    
    total_outliers = 0
    total_cells = rows * len(numeric_df.columns)
    
    for col in numeric_df.columns:
        Q1 = numeric_df[col].quantile(0.25)
        Q3 = numeric_df[col].quantile(0.75)
        IQR = Q3 - Q1
        
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        outliers_mask = (numeric_df[col] < lower_bound) | (numeric_df[col] > upper_bound)
        outlier_count = int(outliers_mask.sum())
        
        if outlier_count > 0:
            total_outliers += outlier_count
            is_outlier_row = is_outlier_row | outliers_mask
            
            outlier_data.append({
                "column": col,
                "count": outlier_count,
                "percentage": float((outlier_count / rows) * 100),
                "lower_bound": float(lower_bound),
                "upper_bound": float(upper_bound)
            })
            
    outlier_data = sorted(outlier_data, key=lambda x: x["percentage"], reverse=True)
    rows_with_outliers = int(is_outlier_row.sum())
    
    return {
        "overall_outliers_percentage": (total_outliers / total_cells) * 100 if total_cells > 0 else 0,
        "rows_with_outliers": rows_with_outliers,
        "rows_outliers_percentage": (rows_with_outliers / rows) * 100 if rows > 0 else 0,
        "total_rows": rows,
        "outlier_columns": outlier_data
    }
