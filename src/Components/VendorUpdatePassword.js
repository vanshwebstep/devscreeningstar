import React, { useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

const VendorUpdatePassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      Swal.fire({ icon: "error", title: "Error", text: "Passwords do not match." });
      return;
    }

    const vendor = JSON.parse(localStorage.getItem("vendor") || "{}");
    const token = localStorage.getItem("vendor_token");
    if (!vendor?.id || !token) {
      Swal.fire({ icon: "error", title: "Error", text: "Missing vendor ID or token." });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API}/vendor/update-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendor.id,
          _token: token,
          new_password: newPassword,
        }),
      });
      const result = await response.json();
      const newToken = result.token || result._token || "";
      if (newToken) localStorage.setItem("vendor_token", newToken);

      if (!response.ok || !result.status) {
        throw new Error(result.message || "An error occurred while updating the password.");
      }

      Swal.fire({
        icon: "success",
        title: "Password Updated",
        text: "Your password has been updated successfully.",
      }).then(() => {
        navigate("/vendor-dashboard");
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "An error occurred while updating the password.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="overflow-x-auto py-6 px-0 bg-white mt-10 m-auto">
      <div className="bg-white p-6 border md:w-1/2 mx-auto">
        <h2 className="text-4xl font-bold text-center text-[#4d606b] px-3">Update Password</h2>
        <h4 className="text-xl py-3 text-center text-[#4d606b] px-3">Must be at least 8 characters</h4>

        <form onSubmit={handleSubmit}>
          <div>
            <label className="py-1">Password:</label>
            <input
              type="password"
              name="new_password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Enter your password"
              className="w-full my-3 rounded-md p-2.5 border border-gray-300"
              required
            />
          </div>
          <div>
            <label className="py-1">Confirm Password:</label>
            <input
              type="password"
              name="confirm_password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Enter your password again"
              className="w-full my-3 rounded-md p-2.5 border border-gray-300"
              required
            />
          </div>
          <div className="md:flex gap-2">
            <button
              type="submit"
              className={`w-full my-3 rounded-md text-white p-2.5 border border-gray-300 ${isLoading ? "bg-gray-400 opacity-50 cursor-not-allowed" : "bg-[#2c81ba]"}`}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Reset Password"}
            </button>
            <button
              type="button"
              className="w-full my-3 rounded-md text-white p-2.5 border bg-red-500 border-gray-300"
              disabled={isLoading}
              onClick={() => navigate("/vendor-dashboard")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorUpdatePassword;