import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const VendorResetPassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [passwordToken, setPasswordToken] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const emailFromUrl = queryParams.get("email");
    const tokenFromUrl = queryParams.get("token");

    if (emailFromUrl && tokenFromUrl) {
      setEmail(emailFromUrl);
      setPasswordToken(tokenFromUrl);
      return;
    }

    Swal.fire({ icon: "error", title: "Error", text: "Missing email or password token in the URL." });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      Swal.fire({ icon: "warning", title: "Warning", text: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      Swal.fire({ icon: "error", title: "Oops...", text: "Passwords do not match!" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/vendor/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password_token: passwordToken, new_password: newPassword }),
      });
      const result = await response.json();
      if (!response.ok || !result.status) throw new Error(result.message || "Something went wrong, please try again.");

      Swal.fire({ icon: "success", title: "Password Reset Successful", text: "Your password has been changed.", confirmButtonText: "OK" })
        .then((swalResult) => {
          if (swalResult.isConfirmed) navigate("/vendor-login");
        });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message || "Failed to communicate with the server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-x-auto py-6 px-0 bg-white mt-10 m-auto">
      <div className="bg-white p-6 border w-11/12 md:w-1/2 mx-auto">
        <h2 className="text-4xl font-bold text-center text-[#4d606b] px-3">Set New Password</h2>
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
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full my-3 rounded-md text-white p-2.5 border border-gray-300 ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#2c81ba]"}`}
          >
            {loading ? "Loading..." : "Reset Password"}
          </button>
        </form>

        <h3 className="text-lg text-center font-semibold">
          <Link to="/vendor-login" className="text-[#61c0ff] hover:text-blue-800 no-underline">Back to Login</Link>
        </h3>
      </div>
    </div>
  );
};

export default VendorResetPassword;