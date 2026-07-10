import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const UserUpdatePassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Add loading state
    const navigate = useNavigate(); // Hook to navigate to other routes

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

        // Retrieve branch_id and _token from localStorage
        const branchId = JSON.parse(localStorage.getItem("branch"))?.id;
        const token = localStorage.getItem('branch_token');
    const branchData = JSON.parse(localStorage.getItem('branch'));
  const branch_type = branchData?.id
        if (!branchId || !token) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Missing admin ID or token.',
            });
            return;
        }

        // Set loading state to true
        setIsLoading(true);

        // Prepare the request body
        const myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');

  let rawData = {
  new_password: newPassword,
  branch_id: branchId,
  _token: token
};

if (branchData?.type === "sub_user") {
  rawData.sub_user_id = branch_type;
}

const raw = JSON.stringify(rawData);

        const requestOptions = {
            method: 'PUT',
            headers: myHeaders,
            body: raw,
            redirect: 'follow',
        };

        // Make the API request to update the password
        try {
            const response = await fetch('https://api.screeningstar.co.in/branch/update-password', requestOptions);
            const result = await response.json();
            const newToken = result.token || result._token || '';
            if (newToken) {
                localStorage.setItem("branch_token", newToken);
            }
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Password Updated',
                    text: 'Your password has been updated successfully.',
                }).then(() => {
                    navigate('/user-dashboard'); // Redirect to user-dashboard
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result.message || 'An error occurred while updating the password.',
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
            // Set loading state to false after the request completes
            setIsLoading(false);
        }
    };
    const handleGoBack = () => {
        navigate('/user-dashboard');
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
                            className={`w-full my-3 rounded-md text-white p-2.5 border bg-[#2c81ba] border-gray-300 ${isLoading ? "opacity-50 cursor-not-allowed" : "bg-[#2c81ba]'} border-gray-300"
                            } `}
                            disabled={isLoading} // Disable button while loading
                        >
                            {isLoading ? (
                                <span>Loading...</span> // Show loading text or spinner
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                        <button
                            type="submit"
                            className={`w-full my-3 rounded-md text-white p-2.5 border ${isLoading ? 'bg-gray-400 opacity-50 cursor-not-allowed' : 'bg-red-500'} border-gray-300`}
                            disabled={isLoading}
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

export default UserUpdatePassword;
