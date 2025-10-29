"use client";

import React, { useState } from "react";
import { 
  uploadStudentCSV, 
  uploadFacultyCSV, 
  parseCSV, 
  validateStudentCSV, 
  validateFacultyCSV,
  StudentCSVData,
  FacultyCSVData 
} from "@/services/csvUploadService";

interface CSVUploadProps {
  type: "student" | "faculty";
  onClose: () => void;
}

export default function CSVUpload({ type, onClose }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file extension instead of MIME type (more reliable)
      const fileName = selectedFile.name.toLowerCase();
      const isCSV = fileName.endsWith('.csv') || 
                   selectedFile.type === "text/csv" || 
                   selectedFile.type === "application/vnd.ms-excel" ||
                   selectedFile.type === "text/plain";
      
      if (isCSV) {
        setFile(selectedFile);
        setError("");
        parseCSVPreview(selectedFile);
      } else {
        setError("Please select a valid CSV file (.csv extension)");
        setFile(null);
        setPreview([]);
      }
    } else {
      setError("Please select a file");
      setFile(null);
      setPreview([]);
    }
  };

  const parseCSVPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        
        if (!text || text.trim() === '') {
          setError("CSV file is empty");
          setPreview([]);
          return;
        }
        
        const data = parseCSV(text);
        
        if (data.length === 0) {
          setError("No valid data found in CSV file. Please check the format.");
          setPreview([]);
          return;
        }
        
        // Validate the CSV data
        const validation = type === "student" 
          ? validateStudentCSV(data)
          : validateFacultyCSV(data);
        
        if (!validation.valid) {
          setValidationErrors(validation.errors);
          setError("CSV validation failed. Please check the errors below.");
        } else {
          setValidationErrors([]);
          setError("");
        }
        
        // Show only first 3 rows for preview
        setPreview(data.slice(0, 3));
      } catch (err) {
        console.error("Error parsing CSV:", err);
        setError("Error parsing CSV file. Please check the file format.");
        setPreview([]);
        setValidationErrors([]);
      }
    };
    
    reader.onerror = () => {
      setError("Error reading the file. Please try again.");
      setPreview([]);
    };
    
    reader.readAsText(file);
  };

  const resetForm = () => {
    setFile(null);
    setError("");
    setSuccess("");
    setPreview([]);
    setValidationErrors([]);
    setUploadComplete(false);
    setUploadProgress("");
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    if (validationErrors.length > 0) {
      setError("Please fix validation errors before uploading");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setUploadComplete(false);
    setUploadProgress("Preparing file for upload...");

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        setUploadProgress("Parsing CSV data...");
        
        const data = parseCSV(text);
        const recordCount = data.length;
        
        setUploadProgress(`Processing ${recordCount} ${type} records...`);

        let result;
        if (type === "student") {
          setUploadProgress("Creating student accounts...");
          result = await uploadStudentCSV(data as StudentCSVData[]);
        } else {
          setUploadProgress("Creating faculty accounts...");
          result = await uploadFacultyCSV(data as FacultyCSVData[]);
        }

        setUploadProgress("Finalizing upload...");

        // Set completion messages
        if (result.success > 0) {
          setUploadComplete(true);
          if (result.errors === 0) {
            setSuccess(`🎉 Upload completed successfully! ${result.success} ${type} records have been uploaded and are now available in the system.`);
          } else {
            setSuccess(`✅ Upload completed with mixed results: ${result.success} records uploaded successfully, ${result.errors} errors occurred.`);
          }
        } else {
          setError(`❌ Upload failed: No records were uploaded successfully.`);
        }

        if (result.errors > 0 && result.errorDetails.length > 0) {
          setError(`⚠️ Upload completed with errors: ${result.errorDetails.slice(0, 5).join(', ')}${result.errorDetails.length > 5 ? `... and ${result.errorDetails.length - 5} more errors` : ''}`);
        }
      };

      reader.readAsText(file);
    } catch (err: any) {
      setError(`❌ Upload failed: ${err.message || "Unknown error occurred"}`);
      setUploadComplete(false);
    } finally {
      setLoading(false);
      setUploadProgress("");
    }
  };

  const downloadTemplate = () => {
    let csvContent = "";
    let filename = "";

    if (type === "student") {
      csvContent = "studentName,studyingYear,rollNo,division,batch,electiveSubject,sId,sPassword\n";
      csvContent += "John Doe,Second Year,101,5,K5,Data Structures,ST001,pass123\n";
      csvContent += "Jane Smith,Third Year,102,6,L6,Machine Learning,ST002,pass456\n";
      filename = "student_template.csv";
    } else {
      csvContent = "name,designation,emailID,subject,E_ID,E_password\n";
      csvContent += "Dr. John Smith,Professor,john.smith@pict.edu,Computer Science,EMP001,pass123\n";
      csvContent += "Dr. Jane Doe,Associate Professor,jane.doe@pict.edu,Mathematics,EMP002,pass456\n";
      csvContent += "Prof. Mike Johnson,Assistant Professor,mike.johnson@pict.edu,Data Science,EMP003,pass789\n";
      filename = "faculty_template.csv";
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20 backdrop-blur-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <span className="mr-3">{type === "student" ? "📊" : "👨‍🏫"}</span>
            Upload {type === "student" ? "Student" : "Faculty"} CSV
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-red-400 transition-colors text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Template Download */}
        <div className="mb-6 p-4 bg-blue-500/20 border border-blue-400/40 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold mb-1">Download Template</h3>
              <p className="text-slate-300 text-sm">
                Download the CSV template with required columns and sample data
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              disabled={loading}
              className={`bg-blue-600/30 hover:bg-blue-600/50 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="mr-2">📥</span>
              Download Template
            </button>
          </div>
        </div>

        {/* Required Format */}
        <div className="mb-6 p-4 bg-purple-500/20 border border-purple-400/40 rounded-xl">
          <h3 className="text-white font-semibold mb-3">Required CSV Format:</h3>
          {type === "student" ? (
            <div className="text-slate-300 text-sm space-y-1">
              <p><strong>Columns:</strong> studentName, studyingYear, rollNo, division, batch, electiveSubject, sId, sPassword</p>
              <p><strong>Example:</strong> John Doe, Second Year, 101, 5, K5, Data Structures, ST001, pass123</p>
              <p><strong>Division/Batch Rules:</strong> Division 5 (K5, L5, M5, N5) | Division 6 (K6, L6, M6, N6)</p>
            </div>
          ) : (
            <div className="text-slate-300 text-sm space-y-1">
              <p><strong>Columns:</strong> name, designation, emailID, subject, E_ID, E_password</p>
              <p><strong>Example:</strong> Dr. John Smith, Professor, john.smith@pict.edu, Computer Science, EMP001, pass123</p>
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-purple-400/20">
            <p className="text-slate-400 text-xs">
              <strong>💡 Tips:</strong> Use exact column names • No empty rows • Save as CSV format • Download template for best results
            </p>
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-white font-semibold mb-3">Select CSV File</label>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            disabled={loading}
            className={`w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700 transition-all duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          <p className="text-slate-400 text-xs mt-2">
            Accepts .csv files. For best results, use the template above.
          </p>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3">Preview (First 3 rows):</h3>
            <div className="overflow-x-auto bg-white/5 rounded-xl p-4">
              <table className="w-full text-sm text-white">
                <thead>
                  <tr className="border-b border-white/20">
                    {Object.keys(preview[0]).map(key => (
                      <th key={key} className="text-left p-2 font-semibold">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={index} className="border-b border-white/10">
                      {Object.values(row).map((value: any, i) => (
                        <td key={i} className="p-2 text-slate-300">{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-400/40 rounded-xl p-4">
            <p className="text-red-200 text-sm font-semibold mb-2">{error}</p>
            {validationErrors.length > 0 && (
              <div className="mt-2">
                <p className="text-red-300 text-xs font-semibold mb-1">Validation Errors:</p>
                <ul className="text-red-200 text-xs space-y-1">
                  {validationErrors.slice(0, 10).map((err, index) => (
                    <li key={index}>• {err}</li>
                  ))}
                  {validationErrors.length > 10 && (
                    <li>• ... and {validationErrors.length - 10} more errors</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {success && (
          <div className={`mb-4 ${uploadComplete ? 'bg-green-500/20 border-green-400/40' : 'bg-blue-500/20 border-blue-400/40'} border rounded-xl p-4`}>
            <p className={`${uploadComplete ? 'text-green-200' : 'text-blue-200'} text-sm font-semibold`}>{success}</p>
            {uploadComplete && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-green-300 text-xs">You can now close this window or upload another file.</p>
                <div className="flex gap-2">
                  <button
                    onClick={resetForm}
                    className="bg-blue-600/30 hover:bg-blue-600/50 text-white text-xs px-3 py-1 rounded-lg transition-all duration-300"
                  >
                    Upload Another
                  </button>
                  <button
                    onClick={onClose}
                    className="bg-green-600/30 hover:bg-green-600/50 text-white text-xs px-3 py-1 rounded-lg transition-all duration-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="mb-4 bg-blue-500/20 border border-blue-400/40 rounded-xl p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 bg-blue-600 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-blue-200 text-lg font-semibold mb-2">Uploading CSV File</p>
              <p className="text-blue-300 text-sm">{uploadProgress}</p>
              <div className="mt-3 w-full bg-blue-800/30 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full animate-pulse"></div>
              </div>
              <p className="text-blue-400 text-xs mt-2">Please wait while we process your data...</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleUpload}
            disabled={!file || loading || validationErrors.length > 0}
            className={`flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 ${loading || !file || validationErrors.length > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-xl'}`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </div>
            ) : uploadComplete ? (
              <div className="flex items-center justify-center">
                <span className="mr-2">✅</span>
                Upload Complete
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span className="mr-2">🚀</span>
                Upload CSV
              </div>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className={`bg-gray-600/30 hover:bg-gray-600/50 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {uploadComplete ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}