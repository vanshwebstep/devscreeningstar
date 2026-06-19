import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApiLoadingBranch } from '../BranchApiLoadingContext';

import { FaChevronLeft } from 'react-icons/fa';

const ViewUserTicket = () => {
    const location = useLocation();
    const [branchData, setBranchData] = useState(null);
    const { validateBranchLogin, setApiLoadingBranch, apiLoadingBranch } = useApiLoadingBranch();
    const [loading, setLoading] = useState(false);
    const [loadingBtn, setLoadingBtn] = useState(false);
    const [messages, setMessages] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');
    const [totalResults, setTotalResults] = useState(0);
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search); // Parse the query string
    const ticketNumber = queryParams.get('ticket_number');
    const [formData, setFormData] = useState({
        message: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const branchInfo = JSON.parse(localStorage.getItem('branch'));
        if (branchInfo) {
            setBranchData(branchInfo);
        }
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setApiLoadingBranch(true);
        const branch_id = JSON.parse(localStorage.getItem('branch'))?.branch_id;
        const branchData = JSON.parse(localStorage.getItem('branch'));

        const branch_token = localStorage.getItem('branch_token');


        const requestOptions = {
            method: 'GET',
            redirect: 'follow',
        };
        let url;
        if (branchData?.type == "sub_user" && branchData.id) {
            url = `https://api.screeningstar.co.in/branch/ticket/view?ticket_number=${ticketNumber}&branch_id=${branch_id}&_token=${branch_token}&sub_user_id=${branchData.id}`;
        }
        else {
            url = `https://api.screeningstar.co.in/branch/ticket/view?ticket_number=${ticketNumber}&branch_id=${branch_id}&_token=${branch_token}`
        }

        try {
            const response = await fetch(
                `${url}`,
                requestOptions // Correctly pass requestOptions as the second argument
            );
            const result = await response.json();

            if (result.status) {
                const conversations = result.branches?.conversations || [];
                setMessages(conversations.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
            } else {
                Swal.fire('Error', result.message || 'Failed to fetch tickets.', 'error');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            Swal.fire('Error', 'Failed to fetch data.', 'error');
        } finally {
            setLoading(false);
            setApiLoadingBranch(false);
        }
    };

    useEffect(() => {
        const initialize = async () => {
            try {
               if (apiLoadingBranch == false) {
                await validateBranchLogin();
                await fetchData();
               }
            } catch (error) {
                console.error(error.message);
                navigate('/userLogin');
            }
        };
        initialize();
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
        setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors[name];
            return newErrors;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadingBtn(true);
        const branch_id = branchData?.branch_id;
        const branch_token = localStorage.getItem('branch_token');
        const newErrors = {};

        if (!formData.message) newErrors.message = 'Message is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setLoadingBtn(false);
            return;
        }

        setErrors({});
        try {
            const myHeaders = new Headers();
            myHeaders.append('Content-Type', 'application/json');

            const rawData = {
                ticket_number: ticketNumber,
                message: formData.message,
                branch_id: branch_id,
                sub_user_id: null,
                _token: branch_token,
            };

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


            const response = await fetch('https://api.screeningstar.co.in/branch/ticket/chat', requestOptions);

            if (response.ok) {
                setFormData({ message: '' });
                fetchData(); // Refresh the list
            } else {
                const errorData = await response.json();
                Swal.fire('Error', errorData.message || 'Failed to send message.', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'An error occurred. Please try again.', 'error');
            console.error('Error:', error);
        } finally {
            setLoadingBtn(false);
        }
    };
    const handleGoBack = () => {
        navigate('/user-createTickets');
    };
    return (
        <div className="bg-white border-black border p-6 w-full mx-auto flex flex-col h-screen">
            <div
                onClick={handleGoBack}
                className="flex items-center mb-4 w-36 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
            >
                <FaChevronLeft className="text-xl text-white " />
                <span className="font-semibold text-lg">Go Back</span>
            </div>
            <div className="flex-1 flex flex-col-reverse md:border-none border-t border-t-gray-500  space-y-4 overflow-auto p-4">
                {/* Chat Messages */}
                <div className="flex flex-col  space-y-2">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.from === 'branch' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`p-4 rounded-lg max-w-xs ${message.from === 'branch' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
                                    }`}
                            >
                                <p>{message.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Text Area and Submit Button */}
            <div className="flex items-center space-x-4 p-4 border-t border-gray-300">
                <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full p-4 border rounded-lg bg-gray-100 resize-none"
                    rows="3"
                    placeholder="Type a message"
                ></textarea>
                <button
                    onClick={handleSubmit}
                    className={`bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 ${loadingBtn || loading ? 'cursor-not-allowed opacity-50' : ''}`}
                    disabled={loading} // Disable the button when loading
                >
                    {loadingBtn ? 'Sending...' : 'Send'}
                </button>
            </div>
        </div>
    );
};

export default ViewUserTicket;
