import React, { useState, useEffect, useCallback } from "react";
import "../App.css";
import Logo from "../imgs/userLoginLogo.png";
import adminBG from "../imgs/admin-bg3.jpeg";
import { Modal, Button, Form } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";
import Swal from 'sweetalert2';
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Importing eye icons

import axios from "axios";

const UserLogin = () => {
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState({});
  const [loading, setLoading] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [loginResult, setLoginResult] = useState(null);
  const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
  const storedToken = localStorage.getItem("_token");
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const emailFromQuery = query.get('email') || '';
  const adminidFromQuery = query.get('adminid') || '';
  const tokenFromQuery = query.get('token') || '';
  const logoFromQuery = query.get('logo') || '';
  console.log('logoFromQuery', logoFromQuery)
  const usernameFromQuery = query.get('branchEmail') || '';
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false); // State for password visibility

  const [loginData, setLoginData] = useState({
    username: emailFromQuery,
    password: '',
  });

useEffect(() => {
  if (usernameFromQuery) {
    setLoginData((prevState) => ({
      ...prevState,
      username: usernameFromQuery,
    }));
  }
}, [usernameFromQuery]);

useEffect(() => {
  // Run only once when the component mounts and username is already set
  if (usernameFromQuery) {
    const fetchOnLoad = async () => {
      setIsLoading(true);
      if (storedToken && usernameFromQuery && admin_id) {
        const requestOptions = {
          method: "GET",
          redirect: "follow",
        };
        try {
          const response = await fetch(
            `https://api.screeningstar.co.in/customer/fetch-branch-password?branch_email=${usernameFromQuery}&admin_id=${admin_id}&_token=${storedToken}`,
            requestOptions
          );
          const result = await response.json();
          const newToken = result.token || result._token || '';
          if (newToken) {
            localStorage.setItem("branch_token", newToken);
          }
          if (result.status) {
            setLoginData((prevState) => ({
              ...prevState,
              password: result.password || '',
            }));
          } else {
            console.log('Something went wrong');
          }
        } catch (error) {
          Swal.fire({
            title: 'Error!',
            text: 'Error:',
            icon: 'error',
            confirmButtonText: 'Ok',
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log('Something is missing');
        setIsLoading(false);
      }
    };

    fetchOnLoad();
  }
}, []); // 👈 Empty dependency: only run on first render

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setOtpModalOpen(false); // Close OTP modal if open
    setError({});  // Ensure it's cleared
    localStorage.removeItem('branch_token');
    localStorage.removeItem('branch');

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      ...(adminidFromQuery && { admin_id: adminidFromQuery }),
      ...(tokenFromQuery && { admin_token: tokenFromQuery }),
      username: loginData.username,
      password: loginData.password,
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    try {
      const loginResponse = await fetch(
        "https://api.screeningstar.co.in/branch/login",
        requestOptions
      );

      if (!loginResponse.ok) {
        // Handle HTTP errors
        const errorResult = await loginResponse.json();
        const errorMessage = errorResult.message || "Invalid login credentials.";
        setError(errorMessage);  // Set error state as a string
        return;
      }

      const loginResult = await loginResponse.json();

      if (loginResult.status) {
        localStorage.setItem('inHome', 'yes');
        if (loginResult.branchData) {
          localStorage.setItem('branch_token', loginResult.token);
          localStorage.setItem('branch', JSON.stringify(loginResult.branchData));
          const branchimage = JSON.parse(localStorage.getItem("branch"))?.logo;
          if (branchimage && /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(branchimage)) {
            Swal.fire({
              title: '',
              html: `
                <div style="text-align: center;">
                  <img src="${branchimage}" 
                       alt="Admin Image" 
                       style="width: 100px; height: 100px; border-radius: 50%; margin: 0 auto; margin-bottom: 15px;" />
                  <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">
                    Login successful. Redirecting...
                  </div>
                </div>
              `,
              showConfirmButton: false,
              timer: 4000,
              timerProgressBar: true,
              customClass: {
                popup: 'swal-custom-popup',
                htmlContainer: 'swal-custom-html',
              }
            });
          } else {
            Swal.fire({
              title: 'Success!',
              text: 'Login successful. Redirecting...',
              icon: 'success',
              timer: 2000,
              timerProgressBar: true,
            });
          }
          

          localStorage.removeItem('sectiontabJson');
          localStorage.removeItem('subMenu');
          localStorage.removeItem('SideBarName');

          setTimeout(() => navigate("/user-dashboard"), 500); // Adding delay

        } else {
          setLoading(false);
          setOtpModalOpen(true);
          setLoginResult(loginResult);
        }

      } else {
        Swal.fire({
          title: 'Error!',
          text: loginResult.message || 'Login failed',
          icon: 'error',
          confirmButtonText: 'Ok',
        });
      }
    } catch (error) {
      const errorMessage = error.message || "An unexpected error occurred during login.";
      setError(errorMessage);

      Swal.fire({
        title: 'Login Failed!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      setLoading(false);
    }
  };


  const handleOtpSubmit = async (otp) => {
    setLoading(true);
    const { username } = loginData;

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, otp }),
    };

    try {
      const response = await fetch('https://api.screeningstar.co.in/branch/verify-two-factor', requestOptions);
      const result = await response.json();
      console.log('API Response:', result); // Debugging log

      if (result.status) {
        // Store admin data and token in local storage
        localStorage.setItem('branch_token', result.token);
        localStorage.setItem('branch', JSON.stringify(result.branchData));
        console.log('Data stored in localStorage:', localStorage.getItem('branch')); // Debugging log
        setOtpModalOpen(false);
        localStorage.setItem('inHome', 'yes');
        Swal.fire({
          title: 'Success!',
          text: 'OTP verified successfully. Redirecting...',
          icon: 'success',
          timer: 2000,
          timerProgressBar: true,
        });

        localStorage.removeItem('sectiontabJson');
        localStorage.removeItem('subMenu');
        localStorage.removeItem('SideBarName');

        setTimeout(() => navigate("/user-dashboard"), 500); // Adding delay
      } else {
        setLoading(false)
        setError({ otp: result.message || 'Invalid OTP' });
      }
    } catch (error) {
      setLoading(false)
      setError({ otp: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }

  };

  return (
    <div
      className="p-6 sm:p-8 bg-[#e2e2e2] min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: `url(${adminBG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex flex-col lg:flex-row w-full lg:w-[60%] max-w-[1200px] bg-white rounded-lg overflow-hidden shadow-lg">
        {/* Left Section */}
        <div className="flex-1 bg-[#073d88] flex flex-col items-center py-[80px]  justify-center px-6">
          <div className="text-center">
            <h1 className="text-white text-2xl md:text-4xl font-bold">
              Welcome to the "Track Master"
            </h1>
            <h3 className="text-white text-sm md:text-lg mt-4 px-2">
              Verification Portal, presented by <br /> ScreeningStar Solutions Pvt
              Ltd!
            </h3>
            <div className="border-b border-white w-[60%] mx-auto mt-4"></div>
            <p className="text-white text-xs md:text-sm mt-6 px-4">
              Our Client Servicing Expert is available from 9:30 AM to 7:00 PM to
              assist with support for the Background Screening process or
              application status.
            </p>
            <p className="text-white text-xs md:text-sm mt-2 px-4">
              “Our Reach extends across all the corners of the world” - India and
              Global
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex-1 flex items-center justify-center bg-white lg:border-4 border-[#ee8f1b] py-[50px] px-6">
          <form
            className="w-full max-w-sm sm:max-w-md bg-white rounded-lg"
            onSubmit={handleUserSubmit}
          >
            <img
              src={Logo}
              className=" w-[350px] sm:w-[350px] mb-4 mx-auto"
              alt="Logo"
            />
            {logoFromQuery && typeof logoFromQuery === "string" && logoFromQuery.trim() !== "" && (
              <img
                src={logoFromQuery}
                className="mb-6 w-[50px] md:w-[100px] mx-auto"
                alt="Logo"
                onError={(e) => e.target.style.display = "none"} // Hide image if it fails to load
              />
            )}


            <input
              type="email"
              id="username"
              name="username"
              placeholder="Email ID"
              required
              value={loginData.username}
              onChange={handleChange}
              className="p-3 mb-4 w-full rounded bg-gray-100 border-l-4 border-[#073d88] focus:outline-none focus:ring-2 focus:ring-[#073d88] placeholder-gray-500 text-sm"
            />
              <div className="mr-2 md:flex-1 mb-3 w-full relative">
            <input
              name="password"
              placeholder="Password"
              required
              value={loginData.password}
              onChange={handleChange}
                className="p-3 mb-4 w-full rounded bg-gray-100 border-l-4 border-[#073d88] focus:outline-none focus:ring-2 focus:ring-[#073d88] placeholder-gray-500 text-sm"

                    id="password"
                    type={passwordVisible ? "text" : "password"}
                                />
              <span
                                className="absolute right-3 top-3 cursor-pointer"
                                onClick={() => setPasswordVisible(!passwordVisible)} // Toggle password visibility
                              >
                                {passwordVisible ? <FaEyeSlash className="text-gray-400 mt-1 mr-1" /> : <FaEye FaEyeSlash className="text-gray-400 mt-1 mr-1" />} {/* Show/hide icon */}
                              </span>

            {error && Object.keys(error).length > 0 ? (
              <p className="text-red-500 text-center text-sm">{JSON.stringify(error)}</p>
            ) : (
              error && <p className="text-red-500 text-center text-sm"></p>
            )}
            </div>
            <div className="flex justify-between items-center mb-4 text-sm">
              <label className="flex items-center text-gray-500">
                <input type="checkbox" className="mr-2" />
                Keep me signed in
              </label>
              <Link to="/user-forgot-password" className="text-[#073d88]">
                Reset Password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading || isLoading}
              className={`text-lg w-full py-2 bg-[#073d88] text-white rounded hover:bg-[#0553a1] transition duration-200 ${loading || isLoading ? 'bg-gray-400 opacity-50 cursor-not-allowed' : 'bg-[#2c81ba]'} border-gray-300`}
            >
              {loading || isLoading ? "Please wait..." : "Login"}
            </button>
          </form>
          <OtpModal
            show={otpModalOpen}
            onHide={() => setOtpModalOpen(false)}
            onSubmit={handleOtpSubmit}
            className="z-10"
            error={error.otp}

          />
        </div>
      </div>
    </div>




  );
};
const OtpModal = ({ show, onHide, onSubmit, error }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (otp) {
      setLoading(true);
      try {
        await onSubmit(otp); // Assuming onSubmit is a promise-based function
        setOtp(''); // Clear the input field if successful
      } catch (err) {
        // Handle submission error (optional)
        console.error('Submission error:', err);
      } finally {
        setLoading(false); // Reset loading state regardless of success or error
      }
    } else {
      onSubmit('');
      setLoading(false); // Ensure loading is reset even when no OTP is entered
    }
  };


  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      dialogClassName="custom-modal admin_modal"
      backdrop="static"
      keyboard={false}
    >
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        {/* Modal Content */}
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-6 transform transition-all duration-300 ease-out scale-100">
          {/* Header */}
          <div className="border-b border-gray-300 px-8 py-5 flex justify-between items-center">
            <h3 className="text-2xl font-semibold text-gray-900">OTP Verification</h3>
            <button
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={onHide}
            >
              ✖
            </button>
          </div>

          {/* Body */}
          <div className="px-8 py-6">
            <form>
              <div className="mb-6">
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-gray-700"
                >
                  One-Time Password (OTP)
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="mt-2 w-full px-5 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <p className="mt-2 text-xs text-gray-500">
                  A 6-digit code has been sent to your email.
                </p>
                {error && (
                  <p className="text-sm text-red-500 mt-2">{error}</p>
                )}
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-300 px-8 py-5 flex justify-end space-x-6">
            <button
              className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-5 py-3 rounded-md text-sm focus:outline-none"
              onClick={onHide}
            >
              Cancel
            </button>
            <button
              className="bg-blue-600 text-white hover:bg-blue-700  px-5 py-3 rounded-md text-sm focus:outline-none shadow-md"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Please wait...' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    </Modal>




  );
};

export default UserLogin;
