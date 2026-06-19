import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiLoading } from '../ApiLoadingContext';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import moment from 'moment';

const CaseAllocation = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();

    const [loadingBtn, setLoadingBtn] = useState(false);

    const [referenceIds, setReferenceIds] = useState([]);
    const [services, setServices] = useState([]);
    const [formData, setFormData] = useState({
        month: '',
        initiationDate: '',
        employeeId: '',
        referenceId: '',
        applicantName: '',
        dateOfBirth: '',
        gender: '',
        mobileNumber: '',
        alternateNumber: '',
        fatherOrSpouseName: '',
        address: '',
        scopeOfService: [],
        colorCode: '',
        vendorName: '',
        deadlineDate: '',
        reportDate: '',
        caseAging: '',
        remarks: '',
    });
    const [errors, setErrors] = useState({});
    const [applications, setApplications] = useState([]);

    // Fetch Applications
    const fetchApplication = useCallback(() => {
        setLoading(true);
        setApiLoading(true);
        const token = localStorage.getItem('_token');
        let apiResult = null; // Define a variable to store the result
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;

        fetch(`https://api.screeningstar.co.in/client-allocation/applications?admin_id=${adminId}&_token=${token}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then((result) => {
                apiResult = result; // Store result in apiResult

                if (result.token) {
                    localStorage.setItem('_token', result.token);
                }

                const data = result.data || {};
                const { applications = [], services = [] } = data;

                setApplications(applications);

                const referenceOptions = applications.map((app, index) => ({
                    value: app.application_id,
                    label: app.application_id,
                    key: `${app.application_id}-${index}` // Ensure key is unique
                }));

                const serviceOptions = services.map((service, index) => ({
                    value: service.id,
                    label: service.title,
                    key: `${service.title}-${index}` // Ensure key is unique
                }));

                setReferenceIds(referenceOptions);
                setServices(serviceOptions);
            })
            .catch((error) => console.error('Error fetching applications:', error))
            .finally(() => {
                // Always save the token using apiResult
                const newToken = apiResult?.token || apiResult?._token || token || "";
                if (newToken) {
                    localStorage.setItem('_token', newToken);
                }
                setLoading(false);
                setApiLoading(false);
            });
    }, [setApplications, setReferenceIds, setServices, setLoading,]);





    const handleChange = (e) => {
        const { name, value } = e.target;

        console.log('e ---', name, 'value ---', value);
        console.log('applications', applications);

        const formatDate = (dateString) => {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
            const year = String(date.getFullYear()).slice(2); // Extract last two digits of the year

            return `${day}-${month}-${year}`;
        };

        setFormData((prev) => {
            if (name === 'referenceId') {
                console.log('Comparing:', value);
                const selectedService = applications.find(app => app.application_id === String(value));
                console.log('Selected Service:', selectedService);

                if (selectedService) {
                    return {
                        ...prev,
                        month: selectedService.month_year || '',
                        initiationDate: selectedService.created_at
                            ? new Date(selectedService.created_at).toISOString().split('T')[0]
                            : '',
                        employeeId: selectedService.employee_id || '',
                        referenceId: selectedService.application_id || '',
                        applicantName: selectedService.name || '',
                        dateOfBirth: selectedService.dob
                            ? new Date(selectedService.dob).toISOString().split('T')[0]
                            : '',
                        gender: selectedService.gender || '',
                        mobileNumber: selectedService.contact_number || '',
                        alternateNumber: selectedService.contact_number2 || '',
                        fatherOrSpouseName: selectedService.father_name || selectedService.spouse_name || '',
                        address: [
                            selectedService.permanent_address_house_no,
                            selectedService.permanent_address_floor,
                            selectedService.permanent_address_cross,
                            selectedService.permanent_address_street,
                            selectedService.permanent_address_main,
                            selectedService.permanent_address_area,
                            selectedService.permanent_address_locality,
                            selectedService.permanent_address_city,
                            selectedService.permanent_address_landmark,
                            selectedService.permanent_address_taluk,
                            selectedService.permanent_address_district,
                            selectedService.permanent_address_state,
                            selectedService.permanent_address_pin_code
                        ].filter(Boolean).join(', '),
                        colorCode: '',
                        vendorName: '',
                        deadlineDate: selectedService.deadline_date
                            ? formatDate(selectedService.deadline_date)
                            : '',
                        reportDate: selectedService.report_date ? new Date(selectedService.report_date).toISOString().split('T')[0]
                            : '',
                        caseAging: '',
                        remarks: '',
                    };
                } else {
                    console.log('No service found for this application ID');
                }
            }

            // Handle multiple selection case for scopeOfService
            if (name === 'scopeOfService') {
                const { checked, value } = e.target;
            
                return {
                    ...prev,
                    scopeOfService: Array.isArray(prev.scopeOfService) 
                        ? checked
                            ? [...prev.scopeOfService, value] // add value
                            : prev.scopeOfService.filter((v) => v !== value) // remove value
                        : [value], // fallback to a new array if undefined
                };
            }
            



            // Default case for other fields
            return { ...prev, [name]: value };
        });
    };
    console.log('formData.scopeOfService--',formData)
    const handleDateChange = (date, fieldName) => {
        if (!date) {
            setFormData((prev) => ({
                ...prev,
                [fieldName]: '',
            }));
            return;
        }

        // Set time to noon to avoid timezone offset issues
        const localDate = new Date(date);
        localDate.setHours(12, 0, 0, 0);

        const formattedDate = localDate.toISOString().split('T')[0]; // yyyy-mm-dd
        setFormData((prev) => ({
            ...prev,
            [fieldName]: formattedDate,
        }));
    };






    const handleSubmit = (e) => {
        e.preventDefault();
        setLoadingBtn(true);
        const newErrors = {};
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");
        // Form validation
        // Add similar validation for other fields

        // If there are errors, return early without making the API call
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setLoadingBtn(false);
            return;
        }

        // If no errors, prepare and send the data
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
            "application_id": formData.referenceId,
            "service_ids": JSON.stringify(formData.scopeOfService),
            "employee_id": formData.employeeId,
            "name": formData.applicantName,
            "month_year": formData.month,
            "created_at": formData.initiationDate,
            "dob": formData.dateOfBirth,
            "gender": formData.gender,
            "contact_number": formData.mobileNumber,
            "contact_number2": formData.alternateNumber,
            "father_name": formData.fatherOrSpouseName,
            "spouse_name": formData.fatherOrSpouseName,
            "permanent_address": formData.address,
            "deadline_date": formData.deadlineDate,
            "report_date": formData.reportDate,
            "color_code": formData.colorCode,
            "vendor_name": formData.vendorName,
            "case_aging": formData.caseAging,
            "remarks": formData.remarks,
            "admin_id": admin_id,
            "_token": storedToken
        });

        const requestOptions = {
            method: "POST",  // Corrected from GET to POST
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        fetch("https://api.screeningstar.co.in/client-allocation/create", requestOptions)
            .then((response) => response.json()) // Assuming the response is JSON
            .then((result) => {
                const newToken = result?.token || result?._token || storedToken || "";
                if (newToken) {
                    localStorage.setItem('_token', newToken);
                }


                if (result.status == true) {
                    console.log('empty')
                    setFormData({
                        month: '',
                        initiationDate: '',
                        employeeId: '',
                        referenceId: '',
                        applicantName: '',
                        dateOfBirth: '',
                        gender: '',
                        mobileNumber: '',
                        alternateNumber: '',
                        fatherOrSpouseName: '',
                        address: '',
                        scopeOfService: '',
                        colorCode: '',
                        vendorName: '',
                        deadlineDate: '',
                        reportDate: '',
                        caseAging: '',
                        remarks: '',
                    });


                    setLoadingBtn(false);


                    Swal.fire({
                        title: "Success!",
                        text: result.message || "Client allocation created successfully.",
                        icon: "success",
                        confirmButtonText: "OK"
                    });
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth',
                    });
                } else {
                    setLoadingBtn(false);

                    Swal.fire({
                        title: "Error!",
                        text: result.message || "Failed to create client allocation.",
                        icon: "error",
                        confirmButtonText: "Try Again"
                    });
                }
            })
            .catch((error) => {
                setLoadingBtn(false);

                console.error(error);
                Swal.fire({
                    title: "Error!",
                    text: "An unexpected error occurred. Please try again later.",
                    icon: "error",
                    confirmButtonText: "OK"
                });
            });

        setLoadingBtn(false);

        console.log('Form submitted:', formData);  // This can be removed once form is successfully submitted
    };


    // Initialization
    useEffect(() => {
        const initialize = async () => {
            try {
                if (apiLoading == false) {
                    await validateAdminLogin();
                    await fetchApplication();
                }
            } catch (error) {
                console.error('Error during initialization:', error.message);
                navigate('/admin-login');
            }
        };

        initialize();
    }, [navigate, fetchApplication]);
    const handleMonthChange = (date) => {
        if (date) {
            const formatted = date.toISOString().slice(0, 7); // "YYYY-MM"
            setFormData({ ...formData, month: formatted });
        }
    };
console.log('services',services)
    return (
        <div className="w-full border border-black overflow-hidden">
            <div className="bg-white text-left md:p-12 p-6 w-full mx-auto">
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Month</label>
                        <DatePicker
    selected={
        formData.month
            ? moment(formData.month, "YYYY-MM").toDate() // Convert to Date
            : null
    }
    onChange={(date) => {
        const formatted = moment(date).format("YYYY-MM"); // Format the date
        setFormData({ ...formData, month: formatted });
    }}
    dateFormat="MM-yyyy"
    showMonthYearPicker
    placeholderText="Select Month"
    className="w-full p-2 border rounded"
/>



                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium">Date of Initiation </label>
                        <DatePicker
                            selected={formData.initiationDate ? new Date(formData.initiationDate) : null}
                            onChange={(date) => handleDateChange(date, 'initiationDate')}
                            dateFormat="dd-MM-yyyy" // shown to the user
                            placeholderText="Select Initiation Date"
                            className="uppercase w-full p-2 border rounded"
                        />

                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Employee ID </label>
                        <input
                            type="text"
                            name="employeeId"
                            required
                            value={formData.employeeId}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Reference ID</label>
                        <select
                            name="referenceId"
                            required
                            value={formData.referenceId}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        >
                            <option value="">Select Reference ID</option>
                            {referenceIds.map((ref) => (
                                <option key={ref.value} value={ref.value}>
                                    {ref.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Name of the Applicant</label>
                        <input
                            type="text"
                            name="applicantName"
                            required
                            value={formData.applicantName}
                            onChange={handleChange}

                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Date of Birth</label>
                        <DatePicker
                            selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
                            onChange={(date) => handleDateChange(date, 'dateOfBirth')}
                            dateFormat="dd-MM-yyyy"
                            placeholderText="Select Date of Birth"
                            className="uppercase w-full p-2 border rounded"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium">Gender</label>
                        <select
                            name="gender"
                            required
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Transgender">Transgender</option>
                        </select>

                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Mobile Number</label>
                        <input
                            type="tel"
                            name="mobileNumber"
                            required
                            value={formData.mobileNumber}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Alternate Number</label>
                        <input
                            type="tel"
                            name="alternateNumber"
                            required
                            value={formData.alternateNumber}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Father Name / Spouse Name</label>
                        <input
                            type="text"
                            name="fatherOrSpouseName"
                            required
                            value={formData.fatherOrSpouseName}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Address</label>
                        <textarea
                            name="address"
                            required
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        ></textarea>
                    </div>

                    {/* Scope of Service */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Scope of Service</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {services.map((service) => (
                                <label key={service.value} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        name="scopeOfService"
                                        value={service.value}
                                        onChange={handleChange}
                                        checked={formData?.scopeOfService.includes(String(service?.value))}
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm">{service.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="mb-4">
                        <label for="colorCode" className="block text-sm font-medium">Color Code</label>
                        <select
                            name="colorCode"
                            required
                            value={formData.colorCode}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        >
                            <option value="">Select Color</option>
                            <option value="green">Green</option>
                            <option value="red">Red</option>
                            <option value="yellow">Yellow</option>
                            <option value="orange">Orange</option>
                            <option value="pink">Pink</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label for="vendorName" className="block text-sm font-medium">Name of the Vendor</label>
                        <input
                            type="text"
                            name="vendorName"
                            value={formData.vendorName}
                            required
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Deadline Date</label>
                        <DatePicker
                            selected={formData.deadlineDate ? new Date(formData.deadlineDate) : null}
                            onChange={(date) => handleDateChange(date, 'deadlineDate')}
                            dateFormat="dd-MM-yyyy"
                            placeholderText="Select Deadline Date"
                            className="uppercase w-full p-2 border rounded"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="reportDate" className="block text-sm font-medium">Report Date</label>
                        <DatePicker
                            selected={formData.reportDate ? new Date(formData.reportDate) : null}
                            onChange={(date) => handleDateChange(date, 'reportDate')}
                            dateFormat="dd-MM-yyyy"
                            placeholderText="Select Report Date"
                            className="uppercase w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Case Aging</label>
                        <input
                            type="text"
                            name="caseAging"
                            required
                            value={formData.caseAging}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Remarks</label>
                        <textarea
                            name="remarks"
                            value={formData.remarks}
                            required
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        ></textarea>
                    </div>

                    <div className='flex items-center gap-7'>
                        <div className="text-left">
                            <button
                                type="submit"
                                className="p-6 py-3 bg-[#2c81ba] hover:scale-105 text-white font-bold rounded-md hover:bg-[#0f5381]"
                                disabled={loadingBtn}
                            >
                                {loadingBtn ? "Submitting" : "Submit"}
                            </button>

                        </div>
                        <div>
                            <h3 className='text-xl font-bold'>OR</h3>
                        </div>
                        <button
                            onClick={() => navigate('/admin-CaseAllocationBulk')}
                            disabled={loading}
                            className={`p-6 py-3 bg-[#2c81ba] text-white hover:scale-105 font-bold  transition duration-200  rounded-md hover:bg-[#0f5381] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Bulk Upload
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CaseAllocation;
