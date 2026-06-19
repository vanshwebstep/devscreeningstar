import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const UserCreate = () => {
  const [branchData, setBranchData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const branchInfo = JSON.parse(localStorage.getItem('branch'));
    if (branchInfo) {
      setBranchData(branchInfo);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update the formData state
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear the specific field error dynamically
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[name]; // Remove the error for the current field
      if (name === 'confirmPassword' && formData.password !== value) {
        newErrors.passwordMatch = 'Your passwords do not match';
      } else {
        delete newErrors.passwordMatch; // Clear the password match error if resolved
      }
      return newErrors;
    });
  };
console.log('localstorage',localStorage);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const branch_id = branchData?.branch_id;
    const sub_user_id = branchData?.id;
    const branch_token = localStorage.getItem('branch_token');
    const newErrors = {};

    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.passwordMatch = 'Your passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    setErrors({});
    try {
      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');

      const rawData = {
        branch_id: branch_id,
        _token: branch_token,
        email: formData.email,
        password: formData.password,
      };
      
      // Add sub_user_id conditionally
      if (branchData?.type === "sub_user" && branchData.id) {
        rawData.sub_user_id = `${branchData.id}`;
      }
      
      const raw = JSON.stringify(rawData);
      

      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow',
      };

      const response = await fetch('https://api.screeningstar.co.in/branch/sub-user/create', requestOptions);

      const newToken = response.token || response._token || branch_token ||'';
      if (newToken) {
        localStorage.setItem("branch_token", newToken);
      }
      if (response.ok) {
        const result = await response.json();
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'User created successfully!',
        });
        setFormData({
          title: '',
          email: '',
          password: '',
          confirmPassword: ''
        });

        console.log(result);
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorData.message || 'Failed to create user.',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred. Please try again.',
      });
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-[#c1dff2]">
      <div className="bg-white md:p-12 p-6 w-full mx-auto border border-black">
        <form className="space-y-4 w-full text-center" onSubmit={handleSubmit}>
          
          <div className="w-full text-left">
            <label htmlFor="email" className="block mb-1 text-sm font-medium">
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
          <div className="w-full text-left">
            <label htmlFor="password" className="block mb-1 text-sm font-medium">
              Password <span className="text-red-500 text-xl">*</span>
            </label>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full p-3 mb-[20px] border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md`}
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
          </div>
          <div className="w-full text-left">
            <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium">
              Confirm Password <span className="text-red-500 text-xl">*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full p-3 mb-[20px] border ${errors.confirmPassword || errors.passwordMatch ? 'border-red-500' : 'border-gray-300'} rounded-md`}
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
          </div>
          {errors.passwordMatch && <p className="text-red-500 text-sm">{errors.passwordMatch}</p>}
          <div className="text-left">
            <button type="submit" className={`p-6 py-3 bg-[#2c81ba] hover:scale-105   transition duration-200  text-white font-bold rounded-md hover:bg-[#0f5381] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserCreate;
