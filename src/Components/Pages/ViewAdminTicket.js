import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApiLoading } from '../ApiLoadingContext';
import { FaChevronLeft } from 'react-icons/fa';

const ViewAdminTicket = () => {
    const location = useLocation();
    const [adminData, setAdminData] = useState(null);
    const [loading, setLoading] = useState(true);
           const {validateAdminLogin,setApiLoading,apiLoading} = useApiLoading();

    
    const [loadingExist, setLoadingExist] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ticketRemarks, setTicketRemarks] = useState('');
    const [ticketStatus, setTicketStatus] = useState('OPEN');
    const [loadingBtn, setLoadingBtn] = useState(false);
    const [messages, setMessages] = useState([]);
    const [ticketData, setTicketData] = useState(null);

    const [formDataa, setFormDataa] = useState({
        title: '',
        remarks: '',
        status: ''
    });
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search); // Parse the query string
    const ticketNumber = queryParams.get('ticket_number');
    const [formData, setFormData] = useState({
        message: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const adminInfo = JSON.parse(localStorage.getItem('admin'));
        if (adminInfo) {
            setAdminData(adminInfo);
        }
    }, []);

    const fetchData = async () => {
        if (!setLoadingExist(true)) {
            setLoading(true);
            setApiLoading(true);
        }
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        const requestOptions = {
            method: 'GET',
            redirect: 'follow',
        };

        try {
            const response = await fetch(
                `https://api.screeningstar.co.in/ticket/view?ticket_number=${ticketNumber}&sub_user_id=&admin_id=${admin_id}&_token=${storedToken}`,
                requestOptions // Correctly pass requestOptions as the second argument
            );
            const result = await response.json();
            const newToken = result.token || result._token || storedToken || "";
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }
            if (result.status) {
                const conversations = result.branches?.conversations || [];
                const ticket = result.branches?.ticket || [];
                setTicketData(ticket);
                setFormDataa({
                    title: ticket.title,
                    remarks: ticket.remarks,
                    status: ticket.status
                });
                setMessages(conversations.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
            } else {
                Swal.fire('Error', result.message || 'Failed to fetch tickets.', 'error');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            Swal.fire('Error', 'Failed to fetch data.', 'error');
        } finally {
            setApiLoading(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        const initialize = async () => {
            try {
                if (apiLoading == false) {
                await validateAdminLogin();
                await fetchData();
                }
            } catch (error) {
                console.error(error.message);
                navigate('/admin-login');
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
        e.preventDefault(); // Prevent form refresh
        setLoadingBtn(true); // Show loading state
        
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");
        const newErrors = {};
    
        if (!formData.message) {
            newErrors.message = 'Message is required';
        }
    
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setLoadingBtn(false); // Stop loading if validation fails
            return;
        }
    
        setErrors({}); // Clear errors
    
        try {
            const response = await fetch('https://api.screeningstar.co.in/ticket/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticket_number: ticketNumber,
                    message: formData.message,
                    admin_id: admin_id,
                    sub_user_id: null,
                    _token: storedToken,
                }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send message.');
            }
    
            // Reset form and refresh data
            setFormData({ message: '' });
            fetchData();
            setLoadingExist(true);
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
            console.error('Error:', error);
        } finally {
            setLoadingBtn(false); // Ensure loading state is reset at the end
        }
    };
    
    const handleGoBack = () => {
        navigate('/admin-createTicket');
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormDataa({
            ...formDataa,
            [name]: value
        });
    };
    const handleModalSubmit = () => {
        const token = localStorage.getItem('_token');
        const adminData = localStorage.getItem('admin');
      
        // Parse the admin data if it exists
        const admin = adminData ? JSON.parse(adminData) : null;
        console.log('Ticket Updated:', { ticketRemarks, ticketStatus });

        // Ensure that ticketRemarks and ticketStatus have the correct values
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        // Use dynamic values for remarks and status from the state
        const raw = JSON.stringify({
            "ticket_number": ticketNumber,   // Ensure this is dynamically set if needed
            "remarks": formDataa.remarks,  // Use the value from state or props
            "status": formDataa.status,   
            "admin_id": admin.id,          // Replace this with dynamic value if needed
            "_token": token 
        });

        const requestOptions = {
            method: "PUT",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        fetch("https://api.screeningstar.co.in/ticket/update", requestOptions)
            .then((response) => response.json())  // Use response.json() to parse JSON responses
            .then((result) => console.log(result))  // Log the result of the response
            .catch((error) => console.error("Error:", error));  // Proper error handling

        setIsModalOpen(false); // Close the modal after the request
    };

    return (

        <div className="bg-white border-black border p-6 w-full mx-auto flex flex-col md:h-screen">
            <div className='flex justify-between mb-2'>
                <div
                    onClick={handleGoBack}
                    className="flex items-center w-36 mb-2  space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                >
                    <FaChevronLeft className="text-xl text-white" />
                    <span className="font-semibold text-lg">Go Back</span>
                </div>
                <div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-green-500 text-white md:p-4 p-3 rounded-lg hover:bg-green-600 transition-all"
                    >
                        Update Ticket
                    </button>
                </div>
            </div>
            <div className="flex-1  md:border-none border-t border-t-gray-500 flex flex-col-reverse space-y-4 overflow-auto  p-4">
                {/* Chat Messages */}
                <div className="flex flex-col  overflow-y-scroll space-y-2 md:max-h-fit max-h-48">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.from === 'branch' ? 'justify-start' : 'justify-end'}`}
                        >
                            <div
                                className={`p-4 rounded-lg max-w-xs ${message.from === 'branch' ? 'bg-gray-200 text-black' : 'bg-blue-500 text-white'}`}
                            >
                                <p>{message.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

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
                    className={`bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 ${loadingBtn ? 'cursor-not-allowed opacity-50' : ''}`}
                    disabled={loadingBtn}
                >
                    {loadingBtn ? 'Sending...' : 'Send'}
                </button>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-999">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                        <h2 className="text-2xl font-semibold mb-4">Update Ticket</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Remarks</label>
                            <input
                                type="text"
                                name='remarks'
                                value={formDataa.remarks}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Status</label>
                            <select
                              value={formDataa.status}
                              onChange={handleInputChange}
                                 name='status'
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">SELECT STATUS</option>
                                <option value="OPEN">OPEN</option>
                                <option value="WIP">WIP</option>
                                <option value="CLOSED">CLOSED</option>
                                <option value="YET TO ATTEND">YET TO ATTEND</option>
                            </select>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="bg-gray-300 text-black p-2 rounded-lg hover:bg-gray-400 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleModalSubmit}
                                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-all"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewAdminTicket;
