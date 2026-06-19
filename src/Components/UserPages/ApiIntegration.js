import React, { useState, useEffect } from 'react';
import { Key, RefreshCcw, Download, Copy } from "lucide-react";
import Swal from 'sweetalert2';

export default function ApiIntegration() {
  const storedBranchData = JSON.parse(localStorage.getItem("branch"));
  const customer_id = storedBranchData?.customer_id;
  const branch_token = localStorage.getItem("branch_token");
  const branch_id = storedBranchData?.id;

  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState("");

  // Fetch current token
  const fetchAccessToken = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://api.screeningstar.co.in/branch/access-token?branch_id=${branch_id}&_token=${branch_token}&customer_id=${customer_id}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );

      if (!response.ok) {
        const errorData = await response.json();
        Swal.fire("Error!", errorData.message || "Failed to fetch token", "error");
        return;
      }

      const data = await response.json();
      if (data.access_token) {
        setAccessToken(data.access_token);
      }
    } catch (error) {
      console.error("Fetch token error:", error);
      Swal.fire("Error!", "Something went wrong", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessToken();
  }, []);

  const handleGenerateToken = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://api.screeningstar.co.in/branch/access-token/generate?branch_id=${branch_id}&_token=${branch_token}&customer_id=${customer_id}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );

      if (!response.ok) {
        const errorData = await response.json();
        Swal.fire("Error!", errorData.message || "Failed to generate token", "error");
        return;
      }

      const data = await response.json();
      const newToken = data.access_token || data._token || data.token;

      if (newToken) {
        setAccessToken(newToken);
      }
      fetchAccessToken();
      Swal.fire("Success!", "New access token generated successfully", "success");

    } catch (error) {
      console.error("Token generation error:", error);
      Swal.fire("Error!", "Something went wrong", "error");
    } finally {
      setIsLoading(false);
    }
  };
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/ScreeningstarApi's.postman_collection";
    link.download = "ScreeningstarApi's.postman_collection";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const copyToken = () => {
    navigator.clipboard.writeText(accessToken);
    Swal.fire("Copied!", "Access token copied to clipboard.", "success");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-md p-10">
        <h2 className="text-2xl font-semibold text-center mb-10">
          API Token Management
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Access Token */}
          <div className="border rounded-xl p-8 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-50">
              <Key className="text-blue-500" size={28} />
            </div>
            <p className="font-semibold text-lg">Access Token</p>
            {isLoading ? (
              <p className="text-gray-400 mt-2">Loading...</p>
            ) : accessToken ? (
              <div className="flex items-center gap-2 mt-2 bg-gray-100 px-4 py-2 rounded-lg w-full break-all">
                <span className="text-sm text-gray-700">{accessToken}</span>
                <button onClick={copyToken} className="p-1 rounded-full hover:bg-gray-200">
                  <Copy size={18} />
                </button>
              </div>
            ) : (
              <p className="text-gray-400 mt-2">No token available</p>
            )}
          </div>

          {/* Generate Token */}
          <div className="border rounded-xl p-8 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-green-50">
              <RefreshCcw className="text-green-500" size={28} />
            </div>
            <p className="font-semibold text-lg">Generate New Token</p>
            <button
              onClick={handleGenerateToken}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full text-lg"
            >
              Generate New Token
            </button>
          </div>

          {/* Download Postman */}
          <div className="border rounded-xl p-8 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-purple-50">
              <Download className="text-purple-500" size={28} />
            </div>
            <p className="font-semibold text-lg text-center">
              Download Postman<br />Collection
            </p>
            <button
              onClick={handleDownload}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-full text-lg"
            >
              Download
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8 text-red-500 text-lg">
          <span>⚠</span>
          <p>Generating a new token will revoke your previous token.</p>
        </div>
      </div>
    </div>
  );
}
