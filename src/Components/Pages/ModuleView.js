import React, { useState, useEffect, useCallback } from "react";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft } from "react-icons/fa";
import AceEditor from "react-ace"; // Code Editor for HTML
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/theme-chrome"; // Light theme
import "ace-builds/src-noconflict/ext-language_tools"; // Optional: for language tools
import ace from "ace-builds/src-noconflict/ace";
import Swal from "sweetalert2";
// Configure the worker path
ace.config.set("basePath", "https://cdn.jsdelivr.net/npm/ace-builds@1.4.12/src-noconflict/");
ace.config.setModuleUrl(
  "ace/mode/html_worker",
  "https://cdn.jsdelivr.net/npm/ace-builds@1.4.12/src-noconflict/worker-html.js"
);

const ViewModules = () => {
  const [mode, setMode] = useState("edit");
  const [editors, setEditors] = useState({});
  const [activeEditor, setActiveEditor] = useState(null);
  const navigate = useNavigate();
  const [moduleData, setModuleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorData, setEditorData] = useState({}); // Stores HTML content

  const handleView = (data) => {
    setActiveEditor(data.id);
    setEditors((prev) => ({
      ...prev,
      [data.id]: {
        template: data.template || "",
        comments: data.comments || "{}",
        title: data.title || "Untitled",
      },
    }));

    setEditorData((prev) => ({
      ...prev,
      [data.id]: data.template || "", // Load full HTML content
    }));
  };

  const handleGoBack = () => {
    navigate("/admin-Modules");
  };

  const handleTextChange = (id, newValue) => {
    setEditors((prev) => ({
      ...prev,
      [id]: { ...prev[id], template: newValue },
    }));
    setEditorData((prev) => ({
      ...prev,
      [id]: newValue,
    }));
  };

  const handleSubmit = async (id) => {
    if (!editors[id]) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No data found for the selected module!",
      });
      return;
    }

    console.log(`Submitted HTML for Module ${id}:`, editors[id]);
    console.log('editors', editors);

    const template = editors[id]?.template || "";
    const title = editors[id]?.title || "";

    const adminData = JSON.parse(localStorage.getItem("admin"));
    const admin_id = adminData?.id;
    const storedToken = localStorage.getItem("_token");

    if (!admin_id || !storedToken) {
      Swal.fire({
        icon: "error",
        title: "Authentication Error",
        text: "Admin ID or Token is missing!",
      });
      return;
    }

    const url = `https://api.screeningstar.co.in/email-template/module/template/update`;

    const requestBody = {
      id,
      admin_id,
      _token: storedToken,
      template,
      title
    };

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: `Module ${id} has been updated successfully.`,
        });
        fetchModuleData();
      } else {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: result.message || "Something went wrong!",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: "Failed to update module. Please try again!",
      });
      console.error("Error updating module:", error);
    }

    setActiveEditor(null);
  }

  const handleCancel = () => {
    setActiveEditor(null);
  };

  const fetchModuleData = async () => {
    setLoading(true);
    const urlParams = new URLSearchParams(window.location.search);
    const module = urlParams.get("modules");

    const adminData = JSON.parse(localStorage.getItem("admin"));
    const admin_id = adminData?.id;
    const storedToken = localStorage.getItem("_token");

    if (!admin_id || !storedToken || !module) {
      console.error("Missing required parameters: admin_id, token, or module");
      setLoading(false);
      return;
    }

    const url = `https://api.screeningstar.co.in/email-template/module/templates?admin_id=${admin_id}&_token=${storedToken}&module=${module}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();

      if (result.token || result._token) {
        localStorage.setItem("_token", result.token || result._token);
      }

      setModuleData(result.services || []);
    } catch (error) {
      console.error("Error fetching module data:", error.message);
    } finally {
      setLoading(false);
    }
  };
  const toggleMode = useCallback((newMode) => {
    if (mode !== newMode) setMode(newMode);
  }, [mode]);
  useEffect(() => {
    fetchModuleData();
  }, []);

  const Loader = () => (
    <div className="flex w-full justify-center items-center h-20">
      <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
    </div>
  );

  return (
    <div className="w-full border border-black overflow-hidden p-6">
      {activeEditor === null ? (
        <div className="bg-white md:p-6 pt-0">
          <div
            onClick={handleGoBack}
            className="flex mb-4 items-center w-36 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
          >
            <FaChevronLeft className="text-xl text-white" />
            <span className="font-semibold text-lg">Go Back</span>
          </div>
          <table className="min-w-full border-collapse border border-black">
            <thead>
              <tr className="bg-[#c1dff2] whitespace-nowrap text-[#4d606b] text-left">
                <th className="uppercase border border-black px-4 py-2 text-center">SI</th>
                <th className="uppercase border border-black px-4 py-2">Action</th>
                <th className="uppercase border border-black px-4 py-2 text-center">View</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-500">
                    <Loader className="text-center" />
                  </td>
                </tr>
              ) : moduleData?.length === 0 ? (
                <tr>
                  <td colSpan={3} className="border border-black px-4 py-2 text-center">
                    No data available
                  </td>
                </tr>
              ) : (
                moduleData.map((data, index) => (
                  <tr key={data.id}>
                    <td className="border border-black px-4 py-2 text-center">{index + 1}</td>
                    <td className="border border-black px-4 py-2">{data.action}</td>
                    <td className="border border-black px-4 py-2 text-center">
                      <button
                        className="ml-2 p-2 px-4 font-bold text-white bg-green-500 hover:bg-green-600 rounded-md"
                        onClick={() => handleView(data)}
                      >
                        VIEW
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-6">
          <div
            onClick={() => setActiveEditor(null)}
            className="flex mb-4 items-center w-36 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
          >
            <FaChevronLeft className="text-xl text-white" />
            <span className="font-semibold text-lg">Go Back</span>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <input
              type="text"
              className="text-lg font-bold mb-2 p-3 rounded-lg border border-gray-400"
              value={editors[activeEditor]?.title || ""}
              onChange={(e) => {
                setEditors((prev) => ({
                  ...prev,
                  [activeEditor]: {
                    ...prev[activeEditor],
                    title: e.target.value, // Update only the title
                  },
                }));
              }}
            />

            <div className="w-full">
              <h4 className="text-md font-semibold mb-1">Comments:</h4>
              <pre className="bg-gray-200 p-2 rounded text-gray-800">
                {(() => {
                  const comments = editors[activeEditor]?.comments;
                  if (!comments || comments === "{}") return "No comments available.";

                  try {
                    return Object.entries(JSON.parse(comments))
                      .map(([key, value]) => `{{${key.replace(/{{|}}/g, "").toUpperCase()}}}: ${value}`)
                      .join("\n");
                  } catch (error) {
                    console.error("Error parsing comments:", error);
                    return "Invalid comments format.";
                  }
                })()}
              </pre>
            </div>
          </div>
          <div>
            <div className="mb-3 flex justify-center mt-4 gap-3">
              <button
                onClick={() => toggleMode("edit")}
                disabled={mode === "edit"}
                className={`px-4 py-2 rounded-lg font-semibold text-white transition 
      ${mode === "edit" ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-md"}
    `}
              >
                Editor Mode
              </button>

              <button
                onClick={() => toggleMode("view")}
                disabled={mode === "view"}
                className={`px-4 py-2 rounded-lg font-semibold text-white transition 
      ${mode === "view" ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 active:scale-95 shadow-md"}
    `}
              >
                View Mode
              </button>
            </div>

            <div style={{ width: "100%", height: "500px", borderRadius: "5px" }}>
              {mode === "edit" ? (
                <AceEditor
                  mode="html"
                  theme="chrome"
                  value={editorData[activeEditor] || ""}
                  onChange={(newValue) => handleTextChange(activeEditor, newValue)}
                  name="html_editor"
                  editorProps={{ $blockScrolling: true }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <iframe
                  title="Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    background: "#fff",
                  }}
                  srcDoc={editorData[activeEditor] || "<p>Preview will appear here...</p>"}
                />
              )}
            </div>
          </div>

          <div className="mt-4 flex space-x-4">
            <button
              className="p-2 px-6 font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-md"
              onClick={() => handleSubmit(activeEditor)}
            >
              SAVE
            </button>
            <button
              className="p-2 px-6 font-bold text-white bg-red-500 hover:bg-red-600 rounded-md"
              onClick={handleCancel}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewModules;