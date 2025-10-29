"use client";

import { useState } from "react";

interface ExportButtonProps {
  data: any[];
  filename: string;
  className?: string;
  formats?: ("csv" | "json")[];
}

export default function ExportButton({
  data,
  filename,
  className = "",
  formats = ["csv", "json"]
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || "";
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = (data: any[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async (format: "csv" | "json") => {
    setIsExporting(true);
    try {
      if (format === "csv") {
        exportToCSV(data, filename);
      } else if (format === "json") {
        exportToJSON(data, filename);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (formats.length === 1) {
    return (
      <button
        onClick={() => handleExport(formats[0])}
        disabled={isExporting || data.length === 0}
        className={`btn-outline ${className}`}
      >
        {isExporting ? (
          <>
            <div className="loading-spinner w-4 h-4 mr-2" />
            Exporting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export {formats[0].toUpperCase()}
          </>
        )}
      </button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex space-x-2">
        {formats.map(format => (
          <button
            key={format}
            onClick={() => handleExport(format)}
            disabled={isExporting || data.length === 0}
            className="btn-outline text-sm px-3 py-2"
          >
            {isExporting ? (
              <div className="loading-spinner w-3 h-3" />
            ) : (
              format.toUpperCase()
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Utility function to flatten nested objects for CSV export
export function flattenObject(obj: any, prefix = ""): any {
  const flattened: any = {};

  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = value;
    }
  });

  return flattened;
}

// Hook for preparing data for export
export function useExportData(rawData: any[], transform?: (item: any) => any) {
  const processedData = rawData.map(item => {
    const transformed = transform ? transform(item) : item;
    return flattenObject(transformed);
  });

  return processedData;
}