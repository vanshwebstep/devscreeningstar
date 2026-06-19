import { React, useState } from "react";
import "../App.css";
import loginImg from "../imgs/login-img.jpg";
import axios from "axios";
import Logo from "../imgs/userLoginLogo.png";
import adminBG from "../imgs/admin-bg4.png";

import Swal from "sweetalert2";
import { Modal, Button, Form } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Importing eye icons
import { Link } from "react-router-dom";
import { useApiLoading } from './ApiLoadingContext';


const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
  
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [loginResult, setLoginResult] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [input, setInput] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState({});
  const [passwordVisible, setPasswordVisible] = useState(false); // State for password visibility

  const handleChange = (event) => {
    const { name, value } = event.target;
    setInput((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatRole = (role) => {
    return role
      .replace(/[^a-zA-Z0-9\s]/g, " ") // Replace special characters with spaces
      .split(" ") // Split into words
      .filter(Boolean) // Remove empty strings from the array
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
      .join(" "); // Join words with spaces
  };
  const validate = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const newErr = {};

    if (!input.username) {
      newErr.username = "This field is required";
    } else if (!emailRegex.test(input.username)) {
      newErr.username = "Please enter a valid email address";
    }

    if (!input.password) {
      newErr.password = "Please enter your password correctly";
    }

    return Object.keys(newErr).length > 0 ? newErr : null;
  };


  const handleAdminSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setOtpModalOpen(false); // Close OTP modal if open
    setError({});

    localStorage.removeItem('_token');
    localStorage.removeItem('admin');

    // Validate input
    const validationErrors = validate();
    if (validationErrors) {
      setError(validationErrors);
      setLoading(false);
      return;
    }

    // Prepare login data
    const loginData = {
      username: input.username,
      password: input.password,
    };

    try {
      // Make the POST request to login
      const response = await axios.post('https://api.screeningstar.co.in/admin/login', loginData);
      const result = response.data;

      if (result.status) {
        
        if (result.token) {
          const { adminData, token } = result; // Use the result from the response

          // Store admin data and token in local storage
          localStorage.setItem('admin', JSON.stringify(adminData));
          localStorage.setItem('_token', token);
          const adminImage = JSON.parse(localStorage.getItem("admin"))?.profile_picture;
          setOtpModalOpen(false);
          Swal.fire({
            title: '',
            html: `
              <div style="text-align: center;">
                <!-- Image at the top -->
                <img src="${adminImage || 'default-image-url.jpg'}" 
                     alt="Admin Image" 
                     style="width: 100px; height: 100px; border-radius: 50%; margin: 0 auto; margin-bottom: 15px;" />
                
                <!-- Welcome text -->
                <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">
                  Welcome, ${adminData.name || 'Admin'}!
                </div>
          
                <!-- Admin details -->
                <p style="font-size: 16px; margin-bottom: 5px;">
                  <strong>Role:</strong> ${formatRole(adminData.role) || 'N/A'}
                </p>
                <p style="font-size: 16px; margin-bottom: 15px;">
                  <strong>Designation:</strong> ${formatRole(adminData.designation) || 'N/A'}
                </p>
              </div>
            `,
            showConfirmButton: false,
            timer: 4000, // 9 seconds
            timerProgressBar: true,
            customClass: {
              popup: 'swal-custom-popup',
              htmlContainer: 'swal-custom-html',
            }
          });
          setApiLoading(true);
          // Navigate to the home page
          setTimeout(() => {
            navigate('/', { state: { from: location }, replace: true });
          }, 2000);
        } else {
          setLoading(false);
          setOtpModalOpen(true);
          setLoginResult(result);
        }
      } else {
        setLoading(false);
        Swal.fire({
          title: 'Error!',
          text: result.message || 'Login failed',
          icon: 'error',
          confirmButtonText: 'Ok',
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: `Error: ${error.response?.data?.message || error.message}`,
        icon: 'error',
        confirmButtonText: 'Ok',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Submission
  const handleOtpSubmit = async (otp) => {
    setLoading(true);
    const { username } = input;

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, otp }),
    };

    try {
      const response = await fetch('https://api.screeningstar.co.in/admin/verify-two-factor', requestOptions);
      const result = await response.json();

      if (result.status) {
        const { adminData, token } = result; // Use the result from the response

        // Store admin data and token in local storage
        localStorage.setItem('admin', JSON.stringify(adminData));
        localStorage.setItem('_token', token);
        const adminImage = JSON.parse(localStorage.getItem("admin"))?.profile_picture;
        setOtpModalOpen(false);
        Swal.fire({
          title: '',
          html: `
            <div style="text-align: center;">
              <!-- Image at the top -->
              <img src="${adminImage || 'default-image-url.jpg'}" 
                   alt="Admin Image" 
                   style="width: 100px; height: 100px; border-radius: 50%; margin: 0 auto; margin-bottom: 15px;" />
              
              <!-- Welcome text -->
              <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">
                Welcome, ${adminData.name || 'Admin'}!
              </div>
        
              <!-- Admin details -->
              <p style="font-size: 16px; margin-bottom: 5px;">
                <strong>Role:</strong> ${formatRole(adminData.role) || 'N/A'}
              </p>
              <p style="font-size: 16px; margin-bottom: 15px;">
                <strong>Designation:</strong> ${formatRole(adminData.designation) || 'N/A'}
              </p>
            </div>
          `,
          showConfirmButton: false,
          timer: 4000, // 9 seconds
          timerProgressBar: true,
          customClass: {
            popup: 'swal-custom-popup',
            htmlContainer: 'swal-custom-html',
          }
        });

        // Navigate to the home page
        setTimeout(() => {
          navigate('/', { state: { from: location }, replace: true });
        }, 2000);
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
    <>
      <div className="admin-login login-page flex items-center  bg-white`  w-full h-full md:p-[100px]"
        style={{
          backgroundImage: `url(${adminBG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
        <div
          className="relative  rounded-[18px] md:p-[50px] md:pb-[20px]   p-5 bg-cover bg-center md:w-1/2 m-auto"
          style={{
            backgroundImage: `url(${loginImg})`,
            border: "10px solid #004290",
          }}

        >
          <div className="absolute inset-0 backdrop-blur-[4px] rounded-[18px] bg-gray-300 bg-opacity-50"></div>

          <div className="max-w-[700px] mx-auto relative z-999 md:pb-5 md:pt-5">
            <img
              src={Logo}
              className="text-[45px] font-medium md:mb-[40px] md:mt-[10px] mb-8 mt-3 text-center w-[600px] mx-auto"
              alt="Logo"
            />

            <form className="md:flex flex-col mb-4" onSubmit={handleAdminSubmit}>
              <div className="md:flex items-center">
                <div className="mr-2 md:flex-1 mb-3 w-full">
                  <input
                    className="shadow appearance-none border rounded w-full py-3 px-3 text-gray-800 leading-tight focus:outline-none focus:shadow-outline"
                    id="email"
                    type="email"
                    name="username"
                    placeholder="Email"
                    onChange={handleChange}
                    value={input.username}
                  />
                  {error.username && (
                    <p className="text-red-500 text-xs italic">{error.username}</p>
                  )}
                </div>
                <div className="mr-2 md:flex-1 mb-3 w-full relative">
                  <input
                    className="shadow appearance-none border rounded w-full py-3 px-3 text-gray-800 leading-tight focus:outline-none focus:shadow-outline"
                    id="password"
                    type={passwordVisible ? "text" : "password"} // Change input type based on visibility
                    name="password"
                    placeholder="Password"
                    onChange={handleChange}
                    value={input.password}
                  />
                  <span
                    className="absolute right-3 top-3 cursor-pointer"
                    onClick={() => setPasswordVisible(!passwordVisible)} // Toggle password visibility
                  >
                    {passwordVisible ? <FaEyeSlash className="text-gray-400 mt-1 mr-1" /> : <FaEye FaEyeSlash className="text-gray-400 mt-1 mr-1" />} {/* Show/hide icon */}
                  </span>
                  {error.password && (
                    <p className="text-red-500 text-xs italic">{error.password}</p>
                  )}
                </div>
                <div className="md:flex-1 mb-3 w-full">
                  <button
                    className={`bg-pink-500 hover:bg-pink-700 text-white font-bold md:py-3 md:px-4 py-2 rounded focus:outline-none focus:shadow-outline w-full ${loading ? 'opacity-80 cursor-not-allowed' : ''}`}
                    type="submit"
                    disabled={loading} // Disable the button if loading
                  >
                    {loading ? 'Please wait...' : 'Login'}
                  </button>

                </div>
              </div>
              <div className="flex justify-between items-center mb-4">
                <label className="flex items-center text-gray-500 text-[10px] md:text-base">
                  <input type="checkbox" className="mr-2 " />
                  Stay signed in
                </label>
                <Link
                  to="/admin-forgot-password"
                >
                  <span className="text-[#073d88] cursor-pointer text-[10px] md:text-base">

                    Forgot password?

                  </span>

                </Link>
              </div>

              {error.api && (
                <p className="text-red-500 text-xs italic mb-4">{error.api}</p>
              )}
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



    </>
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
        console.error('Submission error:', err);
      } finally {
        localStorage.setItem('inHome', 'yes');
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

export default AdminLogin;
