import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const AdminUpdatePassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false); // Loading state
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Check if the passwords match
        if (newPassword !== confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Passwords do not match.',
            });
            return;
        }

        // Retrieve admin_id and _token from localStorage
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem('_token');

        if (!adminId || !token) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Missing admin ID or token.',
            });
            return;
        }

        // Prepare the request body
        const myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');

        const raw = JSON.stringify({
            new_password: newPassword,
            admin_id: adminId,
            _token: token,
        });

        const requestOptions = {
            method: 'PUT',
            headers: myHeaders,
            body: raw,
            redirect: 'follow',
        };

        // Set loading state to true while making the request
        setLoading(true);

        // Make the API request to update the password
        try {
            const response = await fetch('https://api.screeningstar.co.in/admin/update-password', requestOptions);
            const result = await response.text();
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Password Updated',
                    text: 'Your password has been updated successfully.',
                });
                const newToken = result.token || result._token || token ||'';
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                // Redirect to the home page after successful update
                navigate('/');
            } else {
                const newToken = result.token || result._token || token || '';
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result,
                });
            }
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred while updating the password.',
            });
        } finally {
            // Set loading state back to false after request completes
            setLoading(false);
        }
    };
    const handleGoBack = () => {
        navigate('/');  // Navigate to the /adminjkd path
    };
    return (
        <div className="overflow-x-auto py-6 px-0 bg-white mt-10 m-auto">
            <div className="bg-white p-6 border md:w-1/2 mx-auto">
                <h2 className="text-4xl font-bold text-center text-[#4d606b] px-3">Update Password</h2>
                <h4 className="text-xl py-3 text-center text-[#4d606b] px-3">Enter Strong Password</h4>

                <form onSubmit={handleSubmit}>
                    <div>
                        <label className="py-1"> New Password:</label>
                        <input
                            type="password"
                            name="new_password"
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full my-3 rounded-md p-2.5 border border-gray-300"
                        />
                    </div>
                    <div>
                        <label className="py-1">Confirm Password:</label>
                        <input
                            type="password"
                            name="confirm_password"
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Enter your password again"
                            className="w-full my-3 rounded-md p-2.5 border border-gray-300"
                        />
                    </div>
                    <div className='md:flex gap-2'>
                        <button
                            type="submit"
                            className={`w-full my-3 rounded-md text-white p-2.5 border ${loading ? 'bg-gray-400 opacity-50 cursor-not-allowed' : 'bg-[#2c81ba]'} border-gray-300`}
                            disabled={loading} // Disable button when loading
                        >
                            {loading ? 'Updating...' : 'Reset Password'}
                        </button>
                        <button
                            type="submit"
                            className={`w-full my-3 rounded-md text-white p-2.5 border ${loading ? 'bg-gray-400 opacity-50 cursor-not-allowed' : 'bg-red-500'} border-gray-300`}
                            disabled={loading} 
                            onClick={handleGoBack}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminUpdatePassword;
