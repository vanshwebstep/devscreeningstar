import React, { useEffect, useState, useCallback } from "react";
import Swal from 'sweetalert2';
import swal from 'sweetalert';
import { useNavigate } from 'react-router-dom';
import { useApiLoading } from '../ApiLoadingContext';
import axios from 'axios';

const TimeManagement = () => {
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
    const navigate = useNavigate();
    const [spocs, setSpocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingButton, setLoadingButton] = useState(null); // store the currently loading button
    const [responseError, setResponseError] = useState(null);
    const [filterData, setFilterData] = useState([]);
    const [selectedValue, setSelectedValue] = useState("");

    const [breakTimes, setBreakTimes] = useState([]);
    const [firstLoginTime, setFirstLoginTime] = useState('');
    const [lastLogoutTime, setLastLogoutTime] = useState('');

    const formatDate = (date) => {
        if (!date) return 'null'; // Return null if date is empty, null, or undefined

        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return null; // Return null if the date is invalid

        // Convert to IST (UTC+5:30)
        const utcOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
        const istDateObj = new Date(dateObj.getTime() + utcOffset);

        // Extract IST date components
        const day = String(istDateObj.getUTCDate()).padStart(2, '0');
        const month = String(istDateObj.getUTCMonth() + 1).padStart(2, '0');
        const year = istDateObj.getUTCFullYear();
        let hours = istDateObj.getUTCHours();
        const minutes = String(istDateObj.getUTCMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12; // Convert 24-hour to 12-hour format

        return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
    };
    const storedToken = localStorage.getItem("_token");
    let adminData;
    if (storedToken) {
        adminData = JSON.parse(localStorage.getItem('admin'))
    }
    const [formData, setFormData] = useState({
        ticket_date: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
        photo: adminData.profile_picture,
        employee_name: adminData.name,
        employee_id: adminData.emp_id,
        leave_date: "",
        from_date: "",
        to_date: "",
        purpose_of_leave: "",
        remarks: "",
        personal_manager_id: ""
    });
    console.log('adminData---', adminData)

    const fetchLogin = useCallback(() => {
        setLoading(true);
        setApiLoading(true);

        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem('_token');

        const url = new URL("https://api.screeningstar.co.in/personal-manager/break");
        url.searchParams.append("admin_id", adminId);
        url.searchParams.append("_token", token);

        fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.json())
            .then((result) => {
                if (result.status === false) {
                    console.error('API Error:', result.message);
                    Swal.fire('Error!', `${result.message}`, 'error');
                    setResponseError(result.message);
                    throw new Error(result.message);
                }

                const newToken = result.token || result._token || token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }

                setBreakTimes(result?.result?.break_times);
                setFirstLoginTime(result?.result?.first_login_time || "");
                setLastLogoutTime(result?.result?.last_logout_time || "");

            })
            .catch((error) => console.error(error))
            .finally(() => {
                setApiLoading(false);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        const initialize = async () => {
            try {
                await validateAdminLogin(); // Ensure admin is validated
                fetchLogin(); // Then fetch data
            } catch (error) {
                console.error(error.message);
                navigate('/admin-login'); // Redirect on error
            }
        };

        initialize();
    }, [navigate, fetchLogin]);


    // const fetchData = useCallback(() => {
    //     setLoading(true);
    //     setApiLoading(true);

    //     const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    //     const storedToken = localStorage.getItem("_token");

    //     // Check if admin_id or storedToken is missing
    //     if (!admin_id || !storedToken) {
    //         console.error('Missing admin_id or _token');
    //         setLoading(false);
    //         setApiLoading(false); // Ensure loading is stopped if missing data
    //         return;
    //     }

    //     // Construct the URL with query parameters
    //     const url = `https://api.screeningstar.co.in/personal-manager/list?admin_id=${admin_id}&_token=${storedToken}`;

    //     // Request options for GET request (no body required)
    //     const requestOptions = {
    //         method: "GET", // GET method does not need a body
    //         redirect: "follow",
    //     };

    //     fetch(url, requestOptions)
    //         .then((response) => {
    //             const newToken = response.token || response._token || storedToken || '';
    //             if (newToken) {
    //                 localStorage.setItem("_token", newToken); // Store new token if available
    //             }
    //             if (!response.ok) {
    //                 throw new Error('Network response was not ok');
    //             }
    //             return response.json(); // Parse response body as JSON
    //         })
    //         .then((result) => {

    //             const newToken = result.token || result._token || storedToken || '';
    //             if (newToken) {
    //                 localStorage.setItem("_token", newToken); // Store new token if available
    //             }

    //             // Assuming result.billing_spocs is an array
    //             try {
    //                 setSpocs(result.services);
    //             } catch (error) {
    //                 console.error('Failed to parse JSON:', error);
    //             }
    //         })
    //         .catch((error) => {
    //             console.error('Fetch error:', error);
    //         })
    //         .finally(() => {
    //             setLoading(false);
    //             setApiLoading(false);// Stop loading
    //         });

    // }, []);

    // useEffect(() => {
    //     const initialize = async () => {
    //         try {
    //             if (apiLoading == false) {
    //                 await validateAdminLogin(); // Verify admin first
    //                 await fetchData(); // Fetch data after verification
    //             }
    //         } catch (error) {
    //             console.error(error.message);
    //             navigate('/admin-login'); // Redirect if validation fails
    //         }
    //     };

    //     initialize(); // Execute the sequence
    // }, [navigate, fetchData]);

    const handleClick = (ButtonName) => {
        setLoadingButton(ButtonName); // Set loading state

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        const raw = JSON.stringify({
            type: ButtonName,
            admin_id: admin_id,
            _token: storedToken,
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
        };

        fetch("https://api.screeningstar.co.in/personal-manager/break", requestOptions)
            .then((response) => response.json()) // <-- FIXED: parse JSON
            .then((result) => {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: result.message || "Action completed successfully.",
                });
                console.log(result);
                fetchLogin();
                setTimeout(() => {
                    console.log(`${ButtonName} action completed`);
                    setLoadingButton(null); // Reset loading
                }, 1000);
            })
            .catch((error) => {
                console.error("Error occurred:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Something went wrong. Please try again.',
                });
                setLoadingButton(null); // Reset loading on error as well
            });
    };


    const Loader = () => (
        <div className="flex w-full justify-center items-center h-20">
            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
    );
    const buttons = [
        {
            label: "LOGIN",
            color: "bg-blue-500",
            hover: "hover:bg-blue-600",
            disabled: true,
            extra: "opacity-50 cursor-not-allowed pointer-events-none"
        },
        {
            label: "TEA BREAK IN-1",
            color: "bg-green-500",
            hover: "hover:bg-green-600"
        },
        {
            label: "TEA BREAK OUT-1",
            color: "bg-yellow-500",
            hover: "hover:bg-yellow-600"
        },
        {
            label: "LUNCH BREAK IN",
            color: "bg-purple-500",
            hover: "hover:bg-purple-600"
        },
        {
            label: "LUNCH BREAK OUT",
            color: "bg-purple-500",
            hover: "hover:bg-purple-600"
        },
        {
            label: "TEA BREAK IN-2",
            color: "bg-yellow-500",
            hover: "hover:bg-yellow-600"
        },
        {
            label: "TEA BREAK OUT-2",
            color: "bg-green-500",
            hover: "hover:bg-green-600"
        },
        {
            label: "LOGOUT",
            color: "bg-red-500",
            hover: "hover:bg-red-600",
            disabled: true,
            extra: "opacity-50 cursor-not-allowed pointer-events-none"
        }
    ]
    console.log('breakTimes', breakTimes)
    console.log('firstLoginTime', firstLoginTime)
    console.log('lastLogoutTime', lastLogoutTime)
    return (

        <div className="bg-white md:p-12 p-6 border border-black w-full mx-auto rounded-2xl shadow-lg">
            <h2 className="text-xl font-semibold mb-6 text-center">Time Management</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                {buttons.map((btn, index) => {
                    const labelLower = btn.label.toLowerCase();
                    const isLoading = loadingButton === btn.label;
                    const teaBreak2Started = !!breakTimes["tea break in-2"];
                    const lunchBreakStarted = !!breakTimes["lunch break in"] || !!breakTimes["lunch break out"];
                    const isLunchBreakButton = btn.label === "LUNCH BREAK IN" || btn.label === "LUNCH BREAK OUT";
                    const isTeaBreak1Button = btn.label === "TEA BREAK IN-1" || btn.label === "TEA BREAK OUT-1";
                    // Check if this button has been clicked
                    const hasBeenClicked =
                        btn.label === "LOGIN"
                            ? !!firstLoginTime
                            : btn.label === "LOGOUT"
                                ? !!lastLogoutTime
                                : !!breakTimes[labelLower];

                    // Break-in/out flow controls
                    const teaBreak1In = !!breakTimes["tea break in-1"];
                    const teaBreak1Out = !!breakTimes["tea break out-1"];
                    const lunchBreakIn = !!breakTimes["lunch break in"];
                    const lunchBreakOut = !!breakTimes["lunch break out"];
                    const teaBreak2In = !!breakTimes["tea break in-2"];
                    const teaBreak2Out = !!breakTimes["tea break out-2"];

                    const teaBreak1Active = teaBreak1In && !teaBreak1Out;
                    const lunchBreakActive = lunchBreakIn && !lunchBreakOut;
                    const teaBreak2Active = teaBreak2In && !teaBreak2Out;

                    const isPermanentlyDisabled = btn.label === "LOGIN" || btn.label === "LOGOUT";

                    const onlyAllowed =
                        (teaBreak1Active && btn.label === "TEA BREAK OUT-1") ||
                        (lunchBreakActive && btn.label === "LUNCH BREAK OUT") ||
                        (teaBreak2Active && btn.label === "TEA BREAK OUT-2");
                        const labelKey = btn.label.toLowerCase();
                      
                    const isDisabled =
                        isPermanentlyDisabled ||
                        isLoading ||
                        hasBeenClicked ||
                        ((teaBreak1Active || lunchBreakActive || teaBreak2Active) && !onlyAllowed) ||
                        (isLunchBreakButton && teaBreak2Started) ||          // disable lunch if tea break 2 exists
                        (isTeaBreak1Button && (teaBreak2Started || lunchBreakStarted)); // disable tea break 1 if lunch or tea2 exists
                        const hasValue = breakTimes[labelKey] || (btn.label === "LOGIN" ? firstLoginTime : btn.label === "LOGOUT" ? lastLogoutTime : null);
                        const showSkipped = isDisabled && !hasValue;
                        const buttonLabel = `${btn.label}${hasValue ? ` (${formatDate(hasValue)})` : showSkipped ? " (Skipped)" : ""}`;

                    // Time display
                    let timestampText = "";
                    if (btn.label === "LOGIN" && firstLoginTime) {
                        timestampText = ` (${formatDate(firstLoginTime)})`;
                    } else if (btn.label === "LOGOUT" && lastLogoutTime) {
                        timestampText = ` (${formatDate(lastLogoutTime)})`;
                    } else if (breakTimes[labelLower]) {
                        timestampText = ` (${formatDate(breakTimes[labelLower])})`;
                    }

                    return (
                        <button
                            key={index}
                            disabled={isDisabled}
                            className={`${btn.color} text-white w-full py-3 px-4 ${btn.hover} ${isDisabled
                                ? "opacity-50 cursor-not-allowed pointer-events-none"
                                : "transform hover:scale-105 transition-transform duration-200"
                                } rounded-xl shadow transition`}
                            onClick={() => {
                                if (isDisabled) return;

                                // Prevent break-out before break-in
                                const breakOutErrors = {
                                    "TEA BREAK OUT-1": "Please take Tea Break In-1 first",
                                    "LUNCH BREAK OUT": "Please take Lunch Break In first",
                                    "TEA BREAK OUT-2": "Please take Tea Break In-2 first"
                                };

                                if (
                                    btn.label === "TEA BREAK OUT-1" && !teaBreak1In ||
                                    btn.label === "LUNCH BREAK OUT" && !lunchBreakIn ||
                                    btn.label === "TEA BREAK OUT-2" && !teaBreak2In
                                ) {
                                    alert(breakOutErrors[btn.label]);
                                    return;
                                }

                                handleClick(btn.label);
                            }}
                        >
                            {buttonLabel}
                        </button>
                    );
                })}





            </div>
        </div>


    );
};

export default TimeManagement;