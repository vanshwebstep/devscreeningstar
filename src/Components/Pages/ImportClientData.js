import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useApiLoading } from "../ApiLoadingContext";

const sampleJson = `{
  "import_name": "Client Data Import",
  "records": [
    {
      "client_application_id": "APP-10021",
      "data_qc": "1",
      "basic_entry": "1",
      "client_organization_name": "TESTING ORG",
      "client_applicant_name": "ABC TEST",
      "client_applicant_gender": "Male",
      "client_organization_code": "CL-9342",
      "updated_json": {
        "month_year": "2026-05",
        "verification_purpose": "Discreet",
        "employee_id": "CL031534",
        "contact_number": "78787878786",
        "contact_number2": "989898989898",
        "father_name": "Rahul Singh",
        "spouse_name": "ssspp",
        "QC_Date": "2026-06-23",
        "QC_Analyst_Name": "Vansh",
        "Nationality": "indian",
        "Data_Entry_Analyst_Name": "Vansh",
        "Date_of_Data": "2026-06-23",
        "initiation_date": "2026-06-22",
        "dob": "2000-06-23",
        "marital_status": "Single",
        "address": {
          "address": "kakowal road gagandeep colony",
          "address_landmark": "no",
          "residence_mobile_number": "324324324324",
          "address_state": "punjab",
          "address_pin_code": "141009"
        },
        "permanent_address": {
          "permanent_sender_name": "11012",
          "permanent_receiver_name": "21k21",
          "permanent_address": "kakowal road gagandeep colony",
          "permanent_address_landmark": "no",
          "permanent_address_state": "punjab",
          "permanent_address_pin_code": "141009"
        }
      }
    }
  ]
}`;

// ✅ NEW: robust date formatter, accepts yyyy-mm-dd, dd-mm-yyyy, dd/mm/yyyy, yyyy/mm/dd, ISO string, Date object
function formatDateSafe(dateValue) {
  if (!dateValue) return "";

  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? "" : dateValue.toISOString().split("T")[0];
  }

  const str = String(dateValue).trim();
  if (!str) return "";

  // yyyy-mm-dd or ISO string (e.g. 2024-11-19T14:54:38.000Z)
  let match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    return isValidYMD(y, m, d) ? `${y}-${m}-${d}` : "";
  }

  // yyyy/mm/dd
  match = str.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (match) {
    const [, y, m, d] = match;
    return isValidYMD(y, m, d) ? `${y}-${m}-${d}` : "";
  }

  // dd-mm-yyyy or dd/mm/yyyy
  match = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (match) {
    let [, d, m, y] = match;
    d = d.padStart(2, "0");
    m = m.padStart(2, "0");
    return isValidYMD(y, m, d) ? `${y}-${m}-${d}` : "";
  }

  // fallback native parse (e.g. "Nov 19, 2024")
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? "" : parsed.toISOString().split("T")[0];
}

function isValidYMD(y, m, d) {
  const yy = Number(y), mm = Number(m), dd = Number(d);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false;
  const date = new Date(yy, mm - 1, dd);
  return date.getFullYear() === yy && date.getMonth() === mm - 1 && date.getDate() === dd;
}

// ✅ NEW: walk each record and normalize known date fields to yyyy-MM-dd before validation/submit
const DATE_FIELDS = ["initiation_date", "dob", "QC_Date", "Date_of_Data"];

const normalizeRecordDates = (records) => {
  return records.map((record) => {
    if (!record?.updated_json) return record;

    const updated_json = { ...record.updated_json };
    DATE_FIELDS.forEach((field) => {
      if (updated_json[field]) {
        updated_json[field] = formatDateSafe(updated_json[field]);
      }
    });

    return { ...record, updated_json };
  });
};

const ImportClientData = () => {
  const navigate = useNavigate();
  const { validateAdminLogin, setApiLoading } = useApiLoading();
  const [jsonText, setJsonText] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const hasValidatedRef = useRef(false);

  useEffect(() => {
    const initialize = async () => {
      if (hasValidatedRef.current) return;
      hasValidatedRef.current = true;

      try {
        await validateAdminLogin();
      } catch (error) {
        console.error(error.message);
        navigate("/admin-login");
      }
    };

    initialize();
  }, [navigate, validateAdminLogin]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setJsonText(loadEvent.target?.result || "");
      setImportResult(null);
    };
    reader.onerror = () => {
      Swal.fire("Error!", "Unable to read selected JSON file.", "error");
    };
    reader.readAsText(file);
  };

  // ✅ validate required fields same as DataGenerateReport (month_year, verification_purpose) + client_application_id
  const validateRecords = (records) => {
    const validationErrors = [];

    records.forEach((record, index) => {
      const rowNum = index + 1;
      const missingFields = [];

      if (!record.client_application_id) {
        missingFields.push("client_application_id");
      }

      const monthYear = record?.updated_json?.month_year;
      const verificationPurpose = record?.updated_json?.verification_purpose;

      if (!monthYear) {
        missingFields.push("updated_json.month_year");
      }
      if (!verificationPurpose) {
        missingFields.push("updated_json.verification_purpose");
      }

      if (missingFields.length > 0) {
        validationErrors.push({
          row: rowNum,
          client_application_id: record.client_application_id || "N/A",
          missingFields,
        });
      }
    });

    return validationErrors;
  };

  const handleSubmit = async () => {
    const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
    const token = localStorage.getItem("_token");

    if (!adminId || !token) {
      Swal.fire("Error!", "Admin login details are missing.", "error");
      return;
    }

    let parsedJson;
    try {
      parsedJson = JSON.parse(jsonText);
    } catch (error) {
      Swal.fire("Invalid JSON", "Please paste or upload valid JSON.", "error");
      return;
    }

    const records = Array.isArray(parsedJson) ? parsedJson : parsedJson.records;
    if (!Array.isArray(records) || records.length === 0) {
      Swal.fire("Invalid Format", "JSON must contain a non-empty records array.", "error");
      return;
    }

    // ✅ NEW: normalize all date fields to yyyy-MM-dd regardless of input format (dd-mm-yyyy, dd/mm/yyyy, etc.)
    const normalizedRecords = normalizeRecordDates(records);

    // ✅ required fields validation before hitting API (now runs on normalized records)
    const validationErrors = validateRecords(normalizedRecords);
    // ✅ better styled error list instead of plain <ul><li>
    if (validationErrors.length > 0) {
      const errorListHtml = validationErrors
        .map(
          (err) => `
        <div style="
          text-align:left;
          border:1px solid #f1b0b7;
          background:#fff5f5;
          border-radius:8px;
          padding:10px 14px;
          margin-bottom:8px;
        ">
          <div style="font-weight:600; color:#b02a37; margin-bottom:4px;">
            Row ${err.row} 
            <span style="font-weight:400; color:#6b7280;">(${err.client_application_id})</span>
          </div>
          <div style="font-size:13px; color:#374151;">
            Missing: 
            ${err.missingFields
              .map(
                (f) =>
                  `<span style="
                    display:inline-block;
                    background:#fee2e2;
                    color:#991b1b;
                    padding:2px 8px;
                    border-radius:6px;
                    font-size:12px;
                    margin:2px 4px 2px 0;
                  ">${f}</span>`
              )
              .join("")}
          </div>
        </div>`
        )
        .join("");

      Swal.fire({
        title: "Required Fields Missing",
        html: `
      <div style="max-height:320px; overflow-y:auto; padding:4px 2px;">
        ${errorListHtml}
      </div>
    `,
        icon: "error",
        confirmButtonColor: "#2c81ba", // ✅ matches your theme color instead of default purple
        width: 480, // ✅ wider popup so badges don't wrap awkwardly
      });
      return;
    }

    setLoading(true);
    setApiLoading(true);
    setImportResult(null);

    try {
      const response = await fetch("https://api.screeningstar.co.in/data-management/import-client-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          admin_id: adminId,
          _token: token,
          import_name: parsedJson.import_name || fileName || "Client Data Import",
          records: normalizedRecords, // ✅ changed from records -> normalizedRecords
        }),
      });

      const result = await response.json();
      const newToken = result.token || result._token || token;
      if (newToken) {
        localStorage.setItem("_token", newToken);
      }

      setImportResult(result);

      if (result.status) {
        Swal.fire("Import Completed", result.message || "Client data imported successfully.", "success");
      } else {
        Swal.fire("Import Failed", result.message || "No records were imported.", "error");
      }
    } catch (error) {
      console.error("Import error:", error);
      Swal.fire("Error!", "Failed to import client data. Please try again.", "error");
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  };

  return (
    <div className="bg-white border border-black md:p-12 p-6 w-full mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold text-[#4d606b]">Import Client Data</h1>
        <button
          type="button"
          className="px-4 py-2 text-white rounded-md font-bold bg-[#2c81ba] hover:bg-[#0f5381]"
          onClick={() => setJsonText(sampleJson)}
        >
          Load Sample JSON
        </button>
      </div>

      <div className="bg-gray-100 border border-gray-300 rounded-md p-3 text-sm text-left mb-4">
        <p><strong>Required:</strong> every record must include <code>client_application_id</code>.</p>
        <p><strong>Data:</strong> manual Data Management values must be inside <code>updated_json</code>. Nested <code>address</code> and <code>permanent_address</code> are supported.</p>
      </div>

      <div className="mb-4 text-left">
        <label className="block font-semibold mb-2">Upload JSON File</label>
        <input
          type="file"
          accept="application/json,.json"
          className="w-full border rounded-md p-2"
          onChange={handleFileChange}
        />
        {fileName && <p className="text-sm text-gray-600 mt-1">Selected: {fileName}</p>}
      </div>

      <div className="mb-4 text-left">
        <label className="block font-semibold mb-2">Or Paste JSON</label>
        <textarea
          className="w-full border rounded-md p-3 min-h-[340px] font-mono text-sm"
          value={jsonText}
          onChange={(event) => {
            setJsonText(event.target.value);
            setImportResult(null);
          }}
          placeholder='{"records":[{"client_application_id":"APP-10021","updated_json":{"month_year":"2026-05","verification_purpose":"Discreet"}}]}'
        />
      </div>

      <div className="flex justify-end gap-3 mb-5">
        <button
          type="button"
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          onClick={() => {
            setJsonText("");
            setFileName("");
            setImportResult(null);
          }}
        >
          Clear
        </button>
        <button
          type="button"
          className="px-4 py-2 text-white rounded-md font-bold bg-green-500 hover:bg-green-600 disabled:opacity-50"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Importing..." : "Submit Import"}
        </button>
      </div>

      {importResult && (
        <div className="border border-black rounded-md overflow-hidden">
          <div className="bg-[#c1dff2] p-3 font-semibold text-left">
            Total: {importResult.summary?.total || 0} | Imported: {importResult.summary?.imported || 0} | Failed: {importResult.summary?.failed || 0}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black px-3 py-2">Row</th>
                  <th className="border border-black px-3 py-2">Client Application ID</th>
                  <th className="border border-black px-3 py-2">Status</th>
                  <th className="border border-black px-3 py-2">Message</th>
                </tr>
              </thead>
              <tbody>
                {(importResult.results || []).map((row) => (
                  <tr key={row.row}>
                    <td className="border border-black px-3 py-2 text-center">{row.row}</td>
                    <td className="border border-black px-3 py-2">{row.client_application_id || "N/A"}</td>
                    <td className={`border border-black px-3 py-2 font-semibold ${row.status === "success" ? "text-green-600" : "text-red-600"}`}>
                      {row.status}
                    </td>
                    <td className="border border-black px-3 py-2">{row.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportClientData;