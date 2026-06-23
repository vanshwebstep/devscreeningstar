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
          records,
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
