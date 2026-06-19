import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useApiLoading } from '../ApiLoadingContext';
import { EyeIcon, EyeOffIcon } from "lucide-react"; // Using Lucide icons for toggle
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO } from "date-fns";
const CreateUser = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [showSections, setShowSections] = useState(false);
  const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
  const [formData, setFormData] = useState({
    employeePhoto: '',
    employeeName: '',
    employeeMobile: '',
    employeeId: '',
    email: '',
    password: '',
    date_of_joining: '',
    designation: '',
    role: selectedRole,
    permissions: [],
    services: []

  });
  const [fileName, setFileName] = useState('');

  const [services, setServices] = useState([]);

  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState('');
  const [files, setFiles] = useState({});
  const [adminRoles, setAdminRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [responseError, setResponseError] = useState(null);


  const handleRoleChange = (e) => {
    const role = e.target.value;
    setSelectedRole(role);
    setShowSections(role && role !== "admin_user"); // Hide when "Admin User" or empty
  };

  const fetchAdminRoleList = useCallback(() => {
    setLoading(true);
    setApiLoading(true);
    const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
    const token = localStorage.getItem('_token');

    const requestOptions = {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: "follow"
    };

    fetch(`https://api.screeningstar.co.in/admin/create-listing?admin_id=${adminId}&_token=${token}`, requestOptions)
      .then((response) => {
        return response.json().then((result) => {
          // Check if the API response status is false
          if (result.status === false) {
            // Log the message from the API response
            console.error('API Error:', result.message);
            Swal.fire('Error!', `${result.message}`, 'error');
            setResponseError(result.message);

            // Optionally, you can throw an error here if you want to halt the further execution
            throw new Error(result.message);
          }
          return result;
        });
      })
      .then((result) => {
        const newToken = result.token || result._token || token || '';
        if (newToken) {
          localStorage.setItem("_token", newToken);
        }
        const roles = result.data.roles?.map(roleObj => roleObj.role) || [];
        const services = result.data.services?.map(service => ({ id: service.id, title: service.title })) || [];
        setAdminRoles(roles);
        setServices(services);
      })
      .catch((error) => console.error(error)).finally(() => {
        setLoading(false);
        setApiLoading(false);
      });
  }, []);

  console.log(`service_groups`, services);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (apiLoading == false) {
          await validateAdminLogin();
          await fetchAdminRoleList();
        }
      } catch (error) {
        console.error(error.message);
        navigate('/admin-login');
      }
    };

    initialize();
  }, [navigate, fetchAdminRoleList]);


  const handleChange = (e) => {
    const { name, value, options, multiple } = e.target;

    // Handle multiple selection for "services"
    if (name === "services" && multiple) {
      const selectedValues = Array.from(options)
        .filter((option) => option.selected)
        .map((option) => option.value);

      setFormData({
        ...formData,
        [name]: selectedValues, // Update services as an array
      });
      return;
    }

    // Validation for specific fields during input
    if (name === "employeeName" || name === "designation") {
      const regex = /^[a-zA-Z\s]*$/;
      if (!regex.test(value)) return;
    }

    if (name === "employeeMobile") {
      const regex = /^[0-9]*$/;
      if (!regex.test(value)) return;
    }

    // Update form data
    setFormData({ ...formData, [name]: value });

    // Clear error for the current field if it's now valid
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };

      if (name === "employeeMobile" && /^\d{10}$/.test(value)) {
        delete newErrors.employeeMobile;
      }
      if (name === "email" && /\S+@\S+\.\S+/.test(value)) {
        delete newErrors.email;
      }
      if (name === "password" && value.length >= 6) {
        delete newErrors.password;
      }
      if (value.trim()) {
        delete newErrors[name];
      }
      return newErrors;
    });
  };


  const validateForm = () => {
    const newErrors = {};
    if (!files["profile-picture"]) { newErrors.employeePhoto = "Employee Photo is required." }
    if (!formData.employeeName) newErrors.employeeName = "Employee Name is required.";
    if (!formData.employeeMobile) newErrors.employeeMobile = "Employee Mobile is required.";
    if (!formData.employeeId) {
      newErrors.employeeId = "Employee ID is required.";
    } else if (/[^a-zA-Z0-9_-]/.test(formData.employeeId)) {
      newErrors.employeeId = "Employee ID must not contain special characters or spaces ";
    } else if (/\s/.test(formData.employeeId)) {
      newErrors.employeeId = "Employee ID must not contain spaces.";
    }
    if (!formData.services) newErrors.services = "services is required.";
    if (!/^\d{10}$/.test(formData.employeeMobile)) newErrors.employeeMobile = "Mobile must be 10 digits.";
    if (!formData.email) newErrors.email = "Email is required.";
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid.";
    if (!formData.password) newErrors.password = "Password is required.";
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters.";
    if (!formData.designation) newErrors.designation = "Designation is required.";
    if (!formData.date_of_joining) newErrors.date_of_joining = "Date is required.";
    // if (!formData.role) newErrors.role = "Role is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Validate files
    const validFiles = selectedFiles.filter(file => {
      if (!file.type.startsWith("image/")) {
        setErrors(prevErrors => ({
          ...prevErrors,
          employeePhoto: "Only image files are allowed."
        }));
        return false;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setErrors(prevErrors => ({
          ...prevErrors,
          employeePhoto: "File size should not exceed 2MB."
        }));
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setErrors(prevErrors => ({ ...prevErrors, employeePhoto: null }));
      setFiles(prevFiles => ({ ...prevFiles, ["profile-picture"]: validFiles }));
    }
  };


  const uploadAdminProfilePicture = async (insertedId, password, adminId, token) => {
    const fileCount = Object.keys(files).length;
    console.log(`File count: ${fileCount}`);

    if (fileCount > 0) {
      for (const [key, value] of Object.entries(files)) {
        console.log(`Processing files for key: ${key}`);

        const formData = new FormData();
        formData.append("admin_id", adminId); // Ensure adminId is defined
        formData.append("_token", token); // Ensure token is defined
        formData.append("id", insertedId);
        formData.append("password", password); // Replace with actual password value
        formData.append("send_mail", 1);

        for (const file of value) {
          formData.append('images', file);
        }

        try {
          console.log("Sending POST request to upload files...");
          const response = await axios.post(`https://api.screeningstar.co.in/admin/upload`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          console.log("Upload response:", response.data);
          const token = localStorage.getItem("_token");
          // Save the new token if present in the response
          const newToken = response.data._token || response.data.token || token;
          if (newToken) {
            console.log('token is saved ', newToken)
            localStorage.setItem("_token", newToken);
          }
          return;
        } catch (err) {
          console.error("Error occurred:", err);
          Swal.fire('Error!', `An error occurred while uploading profile picture: ${err.message}`, 'error');
          const token = localStorage.getItem("_token");

          // Save the new token even in case of failure
          const newToken = err.response?.data._token || err.response?.data.token || token;
          if (newToken) {
            localStorage.setItem("_token", newToken);
          }
        }
      }
    } else {
      console.warn(`Upload image first`);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('validateForm', validateForm)
    if (!validateForm()) {
      Swal.fire({
        icon: "warning",
        title: "Validation Failed",
        text: "Please ensure all fields are filled out correctly.",
      });
      return;
    }
    setLoading(true); // Set loading to true when the form is submitted
    setLoadingBtn(true); // Set loading to true when the form is submitted

    const adminData = JSON.parse(localStorage.getItem("admin")) || {};
    const token = localStorage.getItem("_token");
    const adminId = adminData.id;
    const fileCount = Object.keys(files).length;
    const isFileUploading = fileCount > 0;
    const allPermissions = [
      "client_overview",
      "team_management",
      "tickets",
      "human_resource",
      "application_document",
      "tat_reminder",
      "employee_credentials",
      "admin_manager",
      "candidate_manager",
      "report_master",
      "billing_dashboard",
      "data_management",
      "acknowledgement",
      "case_allocation",
      "user_history",
      "trash",
      "internal_storage",
      "developers",
    ];
    const permissionObject = allPermissions.reduce((acc, permission) => {
      acc[permission] = formData.permissions.includes(permission);
      return acc;
    }, {});
    const formPayload = {
      admin_id: adminId,
      _token: token,
      name: formData.employeeName,
      mobile: formData.employeeMobile,
      employee_id: formData.employeeId,
      email: formData.email,
      password: formData.password,
      date_of_joining: formData.date_of_joining,
      designation: formData.designation,
      role: selectedRole,
      permissions: JSON.stringify(permissionObject), // Convert to JSON string
      service_ids: formData.services.join(','),
      employeePhoto: formData.employeePhoto,
      send_mail: isFileUploading ? 0 : 1,
    };

    try {
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formPayload),
        redirect: "follow",
      };

      const response = await fetch(
        "https://api.screeningstar.co.in/admin/create",
        requestOptions
      );

      const result = await response.json();
      const newToken = result._token || result.token || token;
      if (newToken) {
        localStorage.setItem("_token", newToken);
      }

      console.log('result create ', result)
      if (result.status) {
        setSubmitMessage("User created successfully!");
        setFormData({
          employeePhoto: "",
          employeeName: "",
          employeeMobile: "",
          employeeId: "",
          email: "",
          password: "",
          date_of_joining: "",
          designation: "",
          role: "",
        });

        const insertId = result?.result?.insertId;
        console.log('result indise', result)

        console.log('insertId', insertId)
        if (insertId) {
          if (isFileUploading) {
            await uploadAdminProfilePicture(insertId, formData.password, adminId, token);
          }
          setFileName("");
          Swal.fire({
            icon: "success",
            title: "User Created",
            text: " Admin has been created successfully!",
          }).then(() => {
            navigate("/admin-existing-users");
          });
        } else {
          throw new Error("Failed to retrieve insertId.");
        }
      } else {
        setSubmitMessage("Failed to create user.");
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result.message || result.error,
        });
      }
    } catch (error) {
      console.error("Error uploading user data:", error);
      setSubmitMessage("Failed to create user.");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create user. Please try again later.",
      });
    } finally {
      setLoading(false); // Set loading to false after the operation completes
      setLoadingBtn(false); // Set loading to false after the operation completes
    }
  };


  const formatRole = (role) => {
    return role
      .replace(/[^a-zA-Z0-9\s]/g, " ") // Replace special characters with spaces
      .split(" ") // Split into words
      .filter(Boolean) // Remove empty strings from the array
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
      .join(" "); // Join words with spaces
  };
  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      services: checked
        ? [...prevData.services, value]  // Add service if checked
        : prevData.services.filter((id) => id !== value)  // Remove service if unchecked
    }));
  };
  const handleCheckboxChangeRole = (e) => {
    const { value, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      permissions: checked
        ? [...prevData.permissions, value]  // Add if checked
        : prevData.permissions.filter((perm) => perm !== value)  // Remove if unchecked
    }));
  };


  return (
    <div className="w-full  border border-black overflow-hidden">
      <div className="bg-white text-left md:p-12 p-6 w-full mx-auto">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="employeePhoto" className="block mb-1 ">
              Employee Photo <span className="text-red-500 text-xl">*</span>
            </label>
            <div className="relative mb-[20px]">
              <input
                type="file"
                name="employeePhoto"
                id="employeePhoto"
                accept="image/*"
                className={`border ${errors.employeePhoto ? 'border-red-500' : 'border-gray-300'} w-full capitalize rounded-md p-2 mt-2 outline-none`}
                onChange={(e) => handleFileChange(e)}
              />
            </div>

            {errors.employeePhoto && <p className="text-red-500 text-sm">{errors.employeePhoto}</p>}
          </div>
          <div>
            <label htmlFor="employeeName" className="block mb-1 ">
              Employee Name <span className="text-red-500 text-xl">*</span>
            </label>
            <input
              type="text"
              name="employeeName"
              placeholder="Employee Name"
              value={formData.employeeName}
              onChange={handleChange}
              className={`w-full p-3 mb-[20px] border ${errors.employeeName ? 'border-red-500' : 'border-gray-300'} rounded-md`}
            />
            {errors.employeeName && <p className="text-red-500 text-sm">{errors.employeeName}</p>}
          </div>
          <div>
            <label htmlFor="employeeId" className="block mb-1 ">
              Employee ID <span className="text-red-500 text-xl">*</span>
            </label>
            <input
              type="text"
              name="employeeId"
              placeholder="Employee Id"
              value={formData.employeeId}
              onChange={handleChange}
              className={`w-full p-3 mb-[20px] border ${errors.employeeId ? 'border-red-500' : 'border-gray-300'} rounded-md`}
            />
            {errors.employeeId && <p className="text-red-500 text-sm">{errors.employeeId}</p>}
          </div>
          <div>
            <label htmlFor="employeeMobile" className="block mb-1 ">
              Employee Mobile <span className="text-red-500 text-xl">*</span>
            </label>
            <input
              type="text"
              name="employeeMobile"
              placeholder="Employee Mobile"
              value={formData.employeeMobile}
              onChange={handleChange}
              className={`w-full p-3 mb-[20px] border ${errors.employeeMobile ? 'border-red-500' : 'border-gray-300'} rounded-md`}
            />
            {errors.employeeMobile && <p className="text-red-500 text-sm">{errors.employeeMobile}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block mb-1 ">
              Email <span className="text-red-500 text-xl">*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full p-3 mb-[20px] border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md`}
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>
          <div className="relative">
            <label htmlFor="password" className="block mb-1">
              Password <span className="text-red-500 text-xl">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full p-3 pr-10 mb-[20px] border ${errors.password ? "border-red-500" : "border-gray-300"
                  } rounded-md`}
              />
              <button
                type="button"
                className="absolute right-3 top-[25px] transform -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOffIcon size={25} /> : <EyeIcon size={25} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
          </div>
          <div>
            <label htmlFor="designation" className="block mb-1 ">
              Designation <span className="text-red-500 text-xl">*</span>
            </label>
            <input
              type="text"
              name="designation"
              placeholder="Designation"
              value={formData.designation}
              onChange={handleChange}
              className={`w-full p-3 mb-[20px] border ${errors.designation ? 'border-red-500' : 'border-gray-300'} rounded-md`}
            />
            {errors.designation && <p className="text-red-500 text-sm">{errors.designation}</p>}
          </div>
          <div>
            <label htmlFor="dateofJoining" className="block mb-1 ">
              Date of Joining <span className="text-red-500 text-xl">*</span>
            </label>
            <DatePicker
  selected={formData.date_of_joining ? parseISO(formData.date_of_joining) : null}
  onChange={(date) => {
    if (!date) {
      // If date is cleared
      setFormData({ ...formData, date_of_joining: "" });
      return;
    }

    const formatted = format(date, "yyyy-MM-dd"); // format for saving
    setFormData({ ...formData, date_of_joining: formatted });

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      if (formatted.trim()) {
        delete newErrors.date_of_joining;
      }
      return newErrors;
    });
  }}
  dateFormat="dd-MM-yyyy"
  placeholderText="DD-MM-YYYY"
  className={`uppercase w-full p-3 mb-[20px] border ${
    errors.date_of_joining ? "border-red-500" : "border-gray-300"
  } rounded-md`}
/>
 
            {errors.date_of_joining && <p className="text-red-500 text-sm">{errors.date_of_joining}</p>}
          </div>
          <div>
            <div>
              <label htmlFor="role" className="block mb-1">
                Role <span className="text-red-500 text-xl">*</span>
              </label>
              {loading ? (
                <select
                  className="w-full p-3 mb-[20px] border rounded-md opacity-50 bg-gray-200 cursor-not-allowed"
                  name="role"
                  disabled
                >
                  <option value="">Loading...</option>
                </select>
              ) : (
                <select
                  className={`w-full p-3 mb-[20px] border ${errors.role ? "border-red-500" : "border-gray-300"} rounded-md`}
                  name="role"
                  value={selectedRole}
                  onChange={handleRoleChange}
                >
                  <option value="">Select Role</option>
                  {adminRoles.map((role, index) => (
                    <option key={index} value={role}>
                      {formatRole(role)}
                    </option>
                  ))}
                </select>
              )}
              {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}
            </div>

            {showSections && (
              <>
                <div className="border rounded-lg mb-4 p-2 border-black">
                  <label className="block text-xl font-bold mb-1">
                    Permissions <span className="text-red-500 text-xl">*</span>
                  </label>
                  <div className="grid md:grid-cols-4 gap-2">
                    {[
                      "Client Overview",
                      "Admin Manager",
                      "Acknowledgement",
                      "Tickets",
                      "Data Management",
                      "Team Management",
                      "Application Document",
                      "Candidate Manager",
                      "Tat Reminder",
                      "Report Master",
                      "Case Allocation",
                      "Human Resource",
                      "Employee Credentials",
                      "Billing Dashboard",
                      "User History",
                      "Trash",
                      "Internal Storage",
                      "Developers",
                    ].map((permission) => {
                      const formattedValue = permission.toLowerCase().replace(/\s+/g, "_");

                      return (
                        <label key={formattedValue} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            disabled={loadingBtn}
                            value={formattedValue}
                            checked={formData.permissions?.includes(formattedValue) || false} // Safe check
                            onChange={handleCheckboxChangeRole}
                            className={`w-5 h-5 `}
                          />

                          <span>{permission}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="border rounded-lg p-2 border-black">
                  <label className="block text-xl font-bold mb-1">
                    Services <span className="text-red-500 text-xl">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    {services.map((service) => (
                      <label key={service.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="services"
                          className={`w-5 h-5 `}
                          disabled={loadingBtn}
                          value={service.id.toString()}
                          checked={formData.services?.includes(service.id.toString())}
                          onChange={handleCheckboxChange}
                        />
                        <span>{service.title}</span>
                      </label>
                    ))}
                  </div>
                  {errors.services && <p className="text-red-500 text-sm">{errors.services}</p>}
                </div>
              </>
            )}
          </div>


          <div className='text-left'>
            <button type="submit" className={`p-6 py-3 bg-[#2c81ba]  hover:scale-105 text-white font-bold rounded-md hover:bg-[#0f5381] ${loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loadingBtn ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
