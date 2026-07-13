import React, { useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

const VendorForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please enter your email." });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/vendor/forgot-password-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const result = await response.json();
      if (!response.ok || !result.status) throw new Error(result.message || "Unable to send reset instructions.");

      if (result.resetLink) {
        Swal.fire({
          icon: "warning",
          title: "Reset Link Generated",
          html: `<p>${result.message || "Email delivery failed."}</p><a href="${result.resetLink}" class="text-[#2c81ba]" target="_self">Open Reset Password Link</a>`,
        });
      } else {
        Swal.fire({ icon: "success", title: "Success", text: result.message || "Reset instructions have been sent to your email." });
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message || "A network error occurred. Please try again later." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-x-auto py-6 px-0 bg-white mt-10 m-auto">
      <div className="bg-white p-6 border w-11/12 md:w-1/2 mx-auto">
        <h2 className="text-4xl font-bold text-left text-[#4d606b] px-3">Forgot Password</h2>
        <h4 className="text-base py-3 text-left text-[#4d606b] px-3">We will send you reset instructions.</h4>

        <form onSubmit={handleSubmit}>
          <div>
            <label className="py-1">Email:</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
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

export default VendorForgotPassword;