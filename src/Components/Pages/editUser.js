import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const EditUser = () => {
    const location = useLocation();
    const [formData, setFormData] = useState({
        employeePhoto: '',
        employeeName: '',
        employeeMobile: '',
        email: '',
        password: '',
        designation: '',
        role: '',
    });

    useEffect(() => {
        if (location.state && location.state.user) {
            const user = location.state.user;
            setFormData({
                employeePhoto: user.employeePhoto,
                employeeName: user.employeeName,
                employeeMobile: user.employeeMobile,
                email: user.email,
                password: '', // Set it empty if you don't want to prefill passwords
                designation: user.designation,
                role: user.role,
            });
        }
    }, [location.state]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`https://api.screeningstar.co.in/Screeningstar/users/${formData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                const result = await response.json();
                const newToken = result.token || result._token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
            } else {
                console.error('Error updating user:', response.statusText);
            }
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    return (
        <div className="bg-[#f7f6fb] p-12">
            <div className="bg-white p-12 rounded-md w-full mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-center">Edit User</h2>
                <form className="space-y-4" onSubmit={handleFormSubmit}>
                    <div>
                        <input
                            type="file"
                            name="employeePhoto"
                             accept="image/*"
                            className="w-full p-3 border border-gray-300 rounded-md text-left appearance-none"
                            onChange={handleInputChange}
                        />
                        {formData.employeePhoto && (
                            <img
                                src={formData.employeePhoto}
                                alt={`${formData.employeeName}'s photo`}
                                className="w-20 h-20 mt-2 rounded-full"
                            />
                        )}
                    </div>
                    <div>
                        <input
                            type="text"
                            name="employeeName"
                            placeholder="Employee Name"
                            className="w-full p-3 mb-[20px] border border-gray-300 rounded-md"
                            value={formData.employeeName}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <input
                            type="text"
                            name="employeeMobile"
                            placeholder="Employee Mobile"
                            className="w-full p-3 mb-[20px] border border-gray-300 rounded-md"
                            value={formData.employeeMobile}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            className="w-full p-3 mb-[20px] border border-gray-300 rounded-md"
                            value={formData.email}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            className="w-full p-3 mb-[20px] border border-gray-300 rounded-md"
                            value={formData.password}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <input
                            type="text"
                            name="designation"
                            placeholder="Designation"
                            className="w-full p-3 mb-[20px] border border-gray-300 rounded-md"
                            value={formData.designation}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <select
                            className="w-full p-3 mb-[20px] border border-gray-300 rounded-md"
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                        >
                            <option value="">Select Role</option>
                            <option value="admin">ADMIN</option>
                            <option value="user">USER</option>
                            <option value="subuser">SUB USER</option>
                            <option value="superuser">SUPER USER</option>
                        </select>
                    </div>
                    <div className='text-left'>
                        <button type="submit" className="p-6 py-3 bg-[#073d88] text-white font-bold rounded-md hover:bg-blue-600">
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUser;
