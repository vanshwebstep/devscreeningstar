import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Logo from "../imgs/userLoginLogo.png";
import adminBG from "../imgs/admin-bg3.jpeg";
import "../App.css";

const VendorLogin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const emailFromQuery = query.get("email") || "";
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginData, setLoginData] = useState({ email: emailFromQuery, password: "" });

  useEffect(() => {
    setLoginData((prev) => ({ ...prev, email: emailFromQuery }));
  }, [emailFromQuery]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    localStorage.removeItem("vendor_token");
    localStorage.removeItem("vendor");

    try {
      const response = await fetch("http://localhost:5000/vendor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const result = await response.json();
      if (!response.ok || !result.status) throw new Error(result.message || "Invalid login credentials.");

      localStorage.setItem("vendor_token", result.token);
      localStorage.setItem("vendor", JSON.stringify(result.vendorData));
      Swal.fire({ title: "Success!", text: "Login successful. Redirecting...", icon: "success", timer: 1500, timerProgressBar: true });
      setTimeout(() => navigate("/vendor-dashboard"), 500);
    } catch (err) {
      setError(err.message || "Login failed.");
      Swal.fire("Login Failed", err.message || "Login failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="p-6 sm:p-8 bg-[#e2e2e2] min-h-screen flex items-center justify-center"
      style={{ backgroundImage: `url(${adminBG})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="flex flex-col lg:flex-row w-full lg:w-[60%] max-w-[1200px] bg-white rounded-lg overflow-hidden shadow-lg">
        <div className="flex-1 bg-[#073d88] flex flex-col items-center py-[80px] justify-center px-6">
          <div className="text-center">
            <h1 className="text-white text-2xl md:text-4xl font-bold">Welcome to the "Track Master"</h1>
            <h3 className="text-white text-sm md:text-lg mt-4 px-2">Vendor Portal, presented by <br /> ScreeningStar Solutions Pvt Ltd!</h3>
            <div className="border-b border-white w-[60%] mx-auto mt-4"></div>
            <p className="text-white text-xs md:text-sm mt-6 px-4">Use your ScreeningStar vendor credentials to access your dashboard.</p>
            <p className="text-white text-xs md:text-sm mt-2 px-4">Our Reach extends across all the corners of the world - India and Global</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center bg-white lg:border-4 border-[#ee8f1b] py-[50px] px-6">
          <form className="w-full max-w-sm sm:max-w-md bg-white rounded-lg" onSubmit={handleSubmit}>
            <img src={Logo} className="w-[350px] sm:w-[350px] mb-4 mx-auto" alt="Logo" />
            <input
              type="email"
              name="email"
              placeholder="Email ID"
              required
              value={loginData.email}
              onChange={handleChange}
              className="p-3 mb-4 w-full rounded bg-gray-100 border-l-4 border-[#073d88] focus:outline-none focus:ring-2 focus:ring-[#073d88] placeholder-gray-500 text-sm"
            />
            <div className="mb-3 w-full relative">
              <input
                name="password"
                placeholder="Password"
                required
                value={loginData.password}
                onChange={handleChange}
                className="p-3 mb-4 w-full rounded bg-gray-100 border-l-4 border-[#073d88] focus:outline-none focus:ring-2 focus:ring-[#073d88] placeholder-gray-500 text-sm"
                type={passwordVisible ? "text" : "password"}
              />
              <span className="absolute right-3 top-3 cursor-pointer" onClick={() => setPasswordVisible((value) => !value)}>
                {passwordVisible ? <FaEyeSlash className="text-gray-400 mt-1 mr-1" /> : <FaEye className="text-gray-400 mt-1 mr-1" />}
              </span>
              {error && <p className="text-red-500 text-center text-sm">{error}</p>}
            </div>
            <div className="flex justify-between items-center mb-4 text-sm">
              <label className="flex items-center text-gray-500"><input type="checkbox" className="mr-2" />Keep me signed in</label>
              <Link to="/vendor-login" className="text-[#073d88]">Reset Password?</Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`text-lg w-full py-2 text-white rounded hover:bg-[#0553a1] transition duration-200 ${loading ? "bg-gray-400 opacity-50 cursor-not-allowed" : "bg-[#2c81ba]"}`}
            >
              {loading ? "Please wait..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VendorLogin;
