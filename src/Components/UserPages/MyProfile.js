import { React, useCallback, useEffect, useState, useRef } from 'react';
// import PulseLoader from 'react-spinners/PulseLoader';
import Swal from 'sweetalert2';
import { useApiLoadingBranch } from '../BranchApiLoadingContext';
import { State } from "country-state-city";

const MyProfile = () => {
    const branchEmail = JSON.parse(localStorage.getItem("branch"))?.email;
    const { apiLoadingBranch, setApiLoadingBranch } = useApiLoadingBranch();
    const storedBranchData = JSON.parse(localStorage.getItem("branch"));
    const branch_token = localStorage.getItem("branch_token");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const tableScrollRef = useRef(null);
    const topScrollRef = useRef(null);
    const [scrollWidth, setScrollWidth] = useState("100%");

    // 🔹 Sync scroll positions
    const syncScroll = (e) => {
        if (e.target === topScrollRef.current) {
            tableScrollRef.current.scrollLeft = e.target.scrollLeft;
        } else {
            topScrollRef.current.scrollLeft = e.target.scrollLeft;
        }
    };

    const [rowsPerPageOne, setRowsPerPageOne] = useState(10);
    const [currentPageOne, setCurrentPageOne] = useState(1);
    const states = State.getStatesOfCountry("IN");


    const branch = storedBranchData;
    const customer_id = storedBranchData?.customer_id;
    const [services, setServices] = useState([]);
    const [customer, setCustomer] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    console.log('storedBranchData', storedBranchData)

    const fetchServicePackage = useCallback(async () => {
        if (!customer_id || !branch?.id || !branch_token) {
            setError('Missing required data to fetch services.');
            setLoading(false);
            return;
        }

        setApiLoadingBranch(true);
        setLoading(true);

        const payLoad = {
            branch_id: branch.branch_id,
            customer_id: customer_id,
            branch_token: branch_token,
            ...(branch?.type === "sub_user" && { sub_user_id: branch.id }),
        };

        // Zet het object om naar een query string
        const queryString = new URLSearchParams(payLoad).toString();

        try {
            const response = await fetch(`https://api.screeningstar.co.in/branch/customer-info?${queryString}`, {
                method: "GET",
                redirect: "follow",
            });
            // Check if response is not ok (non-2xx status code)
            if (!response.ok) {
                const data = await response.json();

                // Check for session expiration (invalid token)
                if (data.message && data.message.toLowerCase().includes("invalid") && data.message.toLowerCase().includes("token")) {
                    Swal.fire({
                        title: "Session Expired",
                        text: "Your session has expired. Please log in again.",
                        icon: "warning",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        // Redirect to customer login page in the current tab
                        window.location.href = `/userLogin`;
                    });
                    return; // Stop execution after redirect
                }

                // Show error message from API response
                const errorMessage = data?.message || 'Network response was not ok';
                throw new Error(errorMessage);
            }

            // If response is OK, parse the response JSON
            const data = await response.json();

            // Store new token if available
            const newToken = data?._token || data?.token;
            if (newToken) {
                localStorage.setItem("branch_token", newToken);
            }

            if (data.customers) {
                const customers = data.customers;
                setCustomer(customers);

                const servicesData = data.customers.services;

                try {
                    const parsedServices = JSON.parse(servicesData);
                    const extractedServices = parsedServices.flatMap(group => group.services);
                    setServices(extractedServices || []);
                } catch (parseError) {
                    console.error('Failed to parse services data:', parseError);
                    setError('Failed to parse service data.');
                }
            } else {
                setError('No customer data found.');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            // Show the API error message in the Swal alert
            Swal.fire({
                title: 'Error!',
                text: err.message || 'Failed to fetch services.',
                icon: 'error',
                confirmButtonText: 'Ok'
            });
            setError('Failed to fetch services.');
        } finally {
            setLoading(false);
            setApiLoadingBranch(false);
        }
    }, [customer_id, branch?.id, branch_token]);

    useEffect(() => {
        if (!apiLoadingBranch) {
            fetchServicePackage();
        }
    }, [fetchServicePackage]);
    console.log('services', services)

    const totalPages = Math.ceil(services.length / rowsPerPage);
    const displayedServices = services.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    useEffect(() => {
        if (tableScrollRef.current) {
            setScrollWidth(tableScrollRef.current.scrollWidth + "px");
        }
    }, [customer, loading]);


    const handleRowsChange = (e) => {
        setRowsPerPageOne(Number(e.target.value));
        setCurrentPageOne(1); // Reset to first page
    };

    return (
        <>
            <div className=' border border-black'>
                <h2 className='text-center md:text-4xl text-2xl font-bold pb-8 md:pt-7 md:pb-4'>MY PROFILE</h2>
                {loading ? (
                    <div className="flex justify-center items-center py-5">
                        <div className="flex justify-center items-center">
                            <div className="flex w-full justify-center items-center h-20">
                                <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="table-container rounded-lg">
                            {/* Top Scroll */}
                            <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
                                <div className="top-scroll-inner" style={{ width: scrollWidth }} />
                            </div>

                            {/* Actual Table Scroll */}
                            <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>


                                <table className="min-w-full border bg-white overflow-auto shadow-md rounded-md p-3 ">

                                    <tbody>

                                        <tr className='bg-[#c1dff2] text-[#4d606b]'>
                                            <th className="py-2 px-4 border border-black  whitespace-nowrap text-center font-bold">PARTICULARS</th>
                                            <td className="py-2 px-4 border border-black text-center  whitespace-nowrap uppercase font-bold">INFORMATION</td>
                                        </tr>

                                        <tr>
                                            <th className="py-2 px-4 border border-black  whitespace-nowrap text-left">Name of the Organization</th>
                                            <td className="py-2 px-4 border border-black text-left  whitespace-nowrap">{customer?.name || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black  whitespace-nowrap text-left">Client Unique Code</th>
                                            <td className="py-2 px-4 border border-black text-left  whitespace-nowrap">{customer?.client_unique_id || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Registered Address</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.address || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">State</th>
                                            <td className={`py-2 px-4 border border-black text-left whitespace-nowrap`}>
                                                {customer?.state || 'null'}

                                            </td>
                                        </tr>

                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">State Code</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.state_code || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">GSTIN</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.gst_number || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">TAT</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.tat_days || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Agreement Date </th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.agreement_date || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">
                                                Client Logo
                                            </th>
                                            <td className="py-2 px-4 border border-black text-left">
                                                {customer?.logo ? (
                                                    <img src={customer?.logo} alt="Company Logo" className="h-16 w-auto" />
                                                ) : (
                                                    <span className="text-gray-500 italic">Not Available</span>
                                                )}
                                            </td>
                                        </tr>


                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Standard Process</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.client_standard || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Agreement Period</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.agreement_duration || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">
                                                Uploaded Agreement
                                            </th>
                                            <td className="py-2 px-4 border border-black text-left">
                                                {customer?.agreement ? (
                                                    <img src={customer?.agreement} alt="Company Logo" className="h-16 w-auto" />
                                                ) : (
                                                    <span className="text-gray-500 italic">Not Available</span>
                                                )}
                                            </td>
                                        </tr>


                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Client SPOC Name</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.first_level_matrix_name || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Client SPOC Email</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.emails && JSON.parse(customer?.emails).join(", ")}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Client SPOC Mobile</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.mobile || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Client SPOC Designation</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.first_level_matrix_designation || 'NA'}</td>
                                        </tr>

                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Escalation Manager Name</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.esc_manager_name || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Escalation Manager Email</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.esc_manager_email || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Escalation Manager Mobile</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.esc_manager_mobile || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Escalation Manager Designation</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.esc_manager_desgn || 'NA'}</td>
                                        </tr>

                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Billing SPOC Name</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.billing_spoc_name || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Billing SPOC Email</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.billing_spoc_email || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Billing SPOC Mobile</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.billing_spoc_mobile || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Billing SPOC Designation</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.billing_spoc_desgn || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Billing Escalation Name</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.billing_escalation_name || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Billing Escalation Email</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.billing_escalation_email || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Billing Escalation Mobile</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.billing_escalation_mobile || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Billing Escalation Designation</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.billing_escalation_desgn || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Authorized Detail Name</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.authorized_detail_name || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Authorized Detail Email</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.authorized_detail_email || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Authorized Detail Mobile</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.authorized_detail_mobile || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Authorized Detail Designation</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.authorized_detail_desgn || 'NA'}</td>
                                        </tr>


                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Key Account Name</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.client_spoc_name || 'NA'}</td>
                                        </tr>

                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left  whitespace-nowrap">Key Account Email</th>
                                            <td className="py-2 px-4 border border-black text-left  whitespace-nowrap">
                                                {customer?.client_spoc_email ? JSON.parse(customer?.client_spoc_email).join(', ') || 'NA' : 'NA'}
                                            </td>
                                        </tr>

                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Key Account Mobile</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.client_spoc_mobile || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Key Account Designation</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.client_spoc_desgn || 'NA'}</td>
                                        </tr>

                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Visible Feilds</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">  {customer?.visible_fields ? JSON.parse(customer?.visible_fields).join(', ') || 'NA' : 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Secondary Credentials (Username)</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.username || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">
                                                Custom Logo
                                            </th>
                                            <td className="py-2 px-4 border border-black text-left">
                                                {customer?.custom_logo ? (
                                                    <img src={customer?.custom_logo} alt="Company Logo" className="h-16 w-auto" />
                                                ) : (
                                                    <span className="text-gray-500 italic">Not Available</span>
                                                )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">PDF Footer</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.custom_address || 'NA'}</td>
                                        </tr>

                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Disclaimer Emails</th>
                                            <td className="py-2 px-4 border border-black text-left whitespace-nowrap">{customer?.disclaimer_emails || 'NA'}</td>
                                        </tr>
                                        <tr>
                                            <th className="py-2 px-4 border border-black text-left whitespace-nowrap">Status</th>
                                            <td className={`py-2 px-4 border border-black text-left whitespace-nowrap ${customer?.status == 1 ? "text-green-500" : customer?.status == 0 ? "text-red-500" : null} }`}>
                                                {customer?.status == 1 ? "Active" : customer?.status == 0 ? "Inactive" : null}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <h2 className='text-center md:text-4xl text-2xl font-bold pb-8 pt-7 md:pb-4'>Scope Of Services</h2>

                        <div className="overflow-x-auto bg-white shadow-md rounded-md md:m-10 md:mt-4 m-3 h-full">

                            {error && <p className="text-center text-red-500 p-6">{error}</p>}
                            {!loading && !error && (
                                <>
                                    <select
                                        value={rowsPerPage}
                                        onChange={(e) => {
                                            setRowsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="border rounded-lg px-3 py-1 text-gray-700 bg-white mb-4  shadow-sm focus:ring-2 focus:ring-blue-400"
                                    >
                                        {[10, 20, 50, 100].map((num) => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
                                    <table className="min-w-full border border-collapse">
                                        <thead>
                                            <tr className='bg-[#c1dff2] text-[#4d606b]'>
                                                <th className="py-3 px-4 border border-black text-center uppercase">SL NO</th>
                                                <th className="py-3 px-4 border border-black text-center uppercase">SERVICES</th>
                                                <th className="py-3 px-4 border border-black text-center uppercase">PRICING</th>
                                                <th className="py-3 px-4 border border-black text-center uppercase">PACKAGES</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayedServices.length > 0 ? (
                                                displayedServices.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="py-2 px-4 border border-black text-center">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                                                        <td className="py-2 px-4 border border-black">{item.serviceTitle}</td>
                                                        <td className="py-2 px-4 border border-black text-center">{item.price} RS</td>
                                                        <td className="py-2 px-4 border border-black text-left">
                                                            {item.packages.length > 0 ? item.packages.map(pkg => pkg.name).join(", ") : "No Packages"}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className='text-center py-5 text-lg'>No data found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </>
                            )}

                        </div>
                        <div className="mt-4 flex justify-center items-center gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(currentPage - 1)}
                                className="px-3 py-1 border bg-gray-200 disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <span>Page {currentPage} of {totalPages}</span>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(currentPage + 1)}
                                className="px-3 py-1 border bg-gray-200 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </>)}
            </div>

        </>
    );
};
export default MyProfile