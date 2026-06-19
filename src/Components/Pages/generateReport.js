import React, { useState, useEffect, forwardRef, useCallback, useRef } from 'react';
import Swal from 'sweetalert2'
import axios from 'axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css'; // Correct import path for CSS
import { Navigation, Thumbs } from 'swiper'; // Import modules directly
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaLaptopHouse } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import { useApiLoading } from '../ApiLoadingContext';
import Select from "react-select";
import logo3 from "../../imgs/3.png"
import logo4 from "../../imgs/4.png"
import logo5 from "../../imgs/5.png"
import logo6 from "../../imgs/6.png"
import logo9 from "../../imgs/8.png"
import aadhaarIcon from "../../imgs/1.png"
import logo8 from "../../imgs/7.png"
import emblemIcon from "../../imgs/2.png";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO, parse, isValid } from 'date-fns';
import colored from "../../imgs/colored.png";
import greenShield from "../../imgs/greenShield.png";
import yellowShield from "../../imgs/yellowShield.png";
import orangeShield from "../../imgs/orangeShield.png";
import emailIconGreen from "../../imgs/emailIconGreen.png";

const optionsData = [
    { label: "Category 1", options: [{ value: "option1", text: "Option 1" }, { value: "option2", text: "Option 2" }] },
    { label: "Category 2", options: [{ value: "option3", text: "Option 3" }, { value: "option4", text: "Option 4" }] },
];

const MultiSelect = ({ id, name, value, onChange, options, isDisabled }) => {
    const groupedOptions = options.map((group) => ({
        label: group.label,
        options: group.options.map((option) => ({
            value: option.value,
            label: option.text,
        })),
    }));

    const handleChange = (selectedOptions) => {
        const values = selectedOptions ? selectedOptions.map((option) => option.value) : [];
        onChange(name, values);
    };


    return (
        <Select
            isMulti
            id={id}
            name={name}
            options={groupedOptions}
            value={groupedOptions.flatMap((group) =>
                group.options.filter((option) => value.includes(option.value))
            )}
            onChange={handleChange}
            isDisabled={isDisabled} // <-- Add this line
            placeholder="NA"
            classNamePrefix="react-select text-xl"
            styles={{
                control: (base) => ({
                    ...base,
                    border: "1px solid #D1D5DB",
                    borderRadius: "6px",
                    padding: "8px",
                    boxShadow: "none",
                    fontSize: "20px"
                }),
            }}
        />
    );
};


const GenerateReport = () => {
    const tableScrollRef = useRef(null);
    const topScrollRef = useRef(null);
    const [scrollWidth, setScrollWidth] = useState("100%");
    const [valuePitchSubmitLoading, setValuePitchSubmitLoading] = useState(null);

    function formatDateSafe(dateValue) {
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
    }
    // 🔹 Sync scroll positions
    const syncScroll = (e) => {
        if (e.target === topScrollRef.current) {
            tableScrollRef.current.scrollLeft = e.target.scrollLeft;
        } else {
            topScrollRef.current.scrollLeft = e.target.scrollLeft;
        }
    };

    const [isAllEmpty, setIsAllEmpty] = useState(false);
    const parseDate = (value) => {
        if (!value) return null;
        try {
            const date = parseISO(value);
            return isValid(date) ? date : null;
        } catch {
            return null;
        }
    };
    const parseAndValidateDate = (value) => {
        if (!value) return null;
        const date = typeof value === 'string' ? parseISO(value) : new Date(value);
        return isValid(date) ? date : null;
    };
    const [isAllCompleted, setIsAllCompleted] = useState(false);

    const [selectedCheckbox, setSelectedCheckbox] = useState('')
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
    const [checkboxState, setCheckboxState] = useState({});

    const navigate = useNavigate();
    const [submittedData, setSubmittedData] = useState(null); // State to hold submitted data
    const [files, setFiles] = useState([]);
    const [serpreviewfiles, setSerpreviewfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [adminNamesNew, setAdminNamesNew] = useState([]);
    const [servicesForm, setServicesForm] = useState('');
    const [genrateReportType, setGenrateReportType] = useState('');
    const [applicationRefID, setApplicationRefID] = useState('');
    const [servicesDataInfo, setServicesDataInfo] = useState('');
    const [servicesData, setServicesData] = useState([]);
    const [branchInfo, setBranchInfo] = useState([]);
    const [customerInfo, setCustomerInfo] = useState([]);
    const [visibleFeilds, setVisibleFeilds] = useState([]);
    const [referenceId, setReferenceId] = useState("");
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [adminDataList, setAdminDataList] = useState([]);
    const [adminNames, setAdminNames] = useState([]);
    const [errors, setErrors] = useState({});
    const [applicantImage, setApplicantImage] = useState({});

    const inputRefs = useRef({});
    const [myDataQc, setMyDataQc] = useState("");
    const [cmtData, setCmtData] = useState([]);
    const [cmdDates, setCmdDates] = useState({
        dob: "",
        initiationDate: "",
    });
    const [isNotMandatory, setIsNotMandatory] = useState(false);
    const [formData, setFormData] = useState({
        client_organization_name: '',
        client_applicant_name: '',
        client_applicant_gender: '',
        client_organization_code: '',
        updated_json: {
            month_year: '',
            initiation_date: '',
            organization_name: '',
            verification_purpose: '',
            employee_id: '',
            client_code: '',
            applicant_name: '',
            contact_number: '',
            contact_number2: '',
            father_name: '',
            spouse_name: '',
            dob: '',
            gender: '',
            marital_status: '',
            nationality: '',
            QC_Date: '',
            QC_Analyst_Name: '',
            data_entry_analyst_name: '',
            date_of_data: '',
            insuff: '',
            address: {
                address_house_no: "",
                address_floor: " ",
                address_cross: " ",
                address_street: "",
                address_main: "",
                address_area: " ",
                address_locality: "",
                address_city: "",
                address_landmark: " ",
                address_taluk: "",
                address_district: "",
                address_state: "",
                address_pin_code: ""
            },

            permanent_address: {
                permanent_address: "",
                permanent_address_house_no: "",
                permanent_address_floor: "",
                permanent_address_cross: "",
                permanent_address_street: "",
                permanent_address_main: "",
                permanent_address_area: "",
                permanent_address_locality: "",
                permanent_address_city: "",
                permanent_address_landmark: "",
                permanent_address_taluk: "",
                permanent_address_district: "",
                permanent_address_state: "",
                permanent_address_pin_code: ""
            },
            insuffDetails: {
                first_insufficiency_marks: [],
                first_insuff_date: '',
                first_insuff_reopened_date: '',
                second_insufficiency_marks: [],
                second_insuff_date: '',
                second_insuff_reopened_date: '',
                third_insufficiency_marks: [],
                third_insuff_date: '',
                third_insuff_reopened_date: '',
                overall_status: '',
                report_date: '',
                interim_date: '',
                report_status: '',
                report_type: '',
                final_verification_status: '',
                is_verify: 'no',
                deadline_date: '',
                insuff_address: '',
                basic_entry: '',
                education: '',
                case_upload: '',
                batch_no: '',
                case_id: '',
                check_id: '',
                ticket_id: '',
                sub_client: '',
                photo: '',
                location: '',
                emp_spoc: '',
                report_generate_by: '',
                qc_done_by: '',
                qc_date: '',
                delay_reason: [],
            },
        },
    });


    const openModal = (image) => {
        setSelectedImage(`${image.trim()}`);
        setModalOpen(true);
    };

    // Close the modal
    const closeModal = () => {
        setModalOpen(false);
        setSelectedImage(null);
    };
    const [selectedStatuses, setSelectedStatuses] = useState([]);

    //console.log('servicesDataInfo', servicesDataInfo, selectedStatuses)
    useEffect(() => {
        if (servicesDataInfo && servicesDataInfo.length > 0) {
            // Check if selectedStatuses has been initialized already to avoid resetting
            if (selectedStatuses.length === 0 || selectedStatuses.length !== servicesDataInfo.length) {
                const initialStatuses = servicesDataInfo.map((serviceData) => {
                    // Get status or fallback to an empty string
                    return serviceData?.annexureData?.status || '';
                });
                setSelectedStatuses(initialStatuses);
            }
        }
    }, [servicesDataInfo]); // Only trigger when `servicesDataInfo` changes
    const handleStatusChange = (e, index) => {
        const value = e.target.value;
        if (value.trim() === "") return; // Ignore empty values

        const updatedStatuses = [...selectedStatuses];
        updatedStatuses[index] = value;
        setSelectedStatuses(updatedStatuses);

        // Check if there are any non-empty values
        const allEmpty = updatedStatuses.every(status => status === '');
        setIsAllEmpty(allEmpty);
    };


    //console.log('statusss', selectedStatuses);
    //console.log('isAllEmpty', isAllEmpty);

    useEffect(() => {
        const allCompleted = selectedStatuses.every(status =>
            status === '' || status.includes('completed') || status.includes('nil')
        ) && !selectedStatuses.every(status => status === '');

        setIsAllCompleted(allCompleted);
    }, [selectedStatuses]);


    //console.log('allCompleted', isAllCompleted)
    const handleFileChange = async (index, dbTable, fileName, e) => {
        const selectedFiles = Array.from(e.target.files);

        // Convert files to base64 format for preview
        const base64Promises = selectedFiles.map((file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(file);
            });
        });

        try {
            const base64Files = await Promise.all(base64Promises);

            // Update the state with the new selected files
            setFiles((prevFiles) => ({
                ...prevFiles,
                [dbTable]: { selectedFiles, fileName },
            }));

            // Update the preview state
            setSerpreviewfiles((prevPreviewFiles) => ({
                ...prevPreviewFiles,
                [dbTable]: base64Files,
            }));
        } catch (error) {
            console.error("Error converting files to base64:", error);
        }
    };


    const applicationId = new URLSearchParams(window.location.search).get('applicationId');
    const branchid = new URLSearchParams(window.location.search).get('branchid');
    const ClientId = new URLSearchParams(window.location.search).get('clientId');


    const fromTat = new URLSearchParams(window.location.search).get('from-tat');
    const redirectAfterSuccess = () => {
        const searchParams = new URLSearchParams(window.location.search);

        const branchidFromUrl = searchParams.get('branchid');
        const clientIdFromUrl = searchParams.get('clientId');
        const by = searchParams.get('by');

        const branchId = branchidFromUrl || cmtData.branch_id;
        const customerId = clientIdFromUrl || cmtData.customer_id;

        if (by === 'valuepitch') {
            return navigate(
                `/admin-valuepitch-checkin?clientId=${customerId}&branchId=${branchId}&BranchName=${encodeURIComponent(
                    cmtData?.branch_name || 'TESTING ORG'
                )}&by=valuepitch`
            );
        }

        if (fromTat == 1) {
            return navigate("/admin-tat-reminder");
        }

        return navigate(
            `/admin-chekin?clientId=${customerId}&branchId=${branchId}`
        );
    };
    // Set referenceId only once when applicationId changes
    useEffect(() => {
        if (applicationId) setReferenceId(applicationId);
    }, [applicationId]); // Only rerun when applicationId changes

    const fetchServicesJson = useCallback(async (servicesList) => {
        setLoading(true);
        setApiLoading(true);
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem("_token");

        // Return an empty array if servicesList is empty or undefined
        if (!servicesList || servicesList.length === 0) {
            setApiLoading(false);
            setLoading(false);
            console.warn("Services list is empty.");
            return [];
        }

        try {
            const requestOptions = {
                method: "GET",
                redirect: "follow",
            };

            // Construct the URL with service IDs
            const url = `https://api.screeningstar.co.in/client-master-tracker/services-annexure-data?service_ids=${servicesList}&application_id=${applicationId}&admin_id=${adminId}&_token=${token}`;

            const response = await fetch(url, requestOptions);

            if (response.ok) {
                setLoading(false);
                setApiLoading(false);

                const result = await response.json();

                // Update the token if a new one is provided
                const newToken = result.token || result._token || localStorage.getItem("_token") || "";
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }

                // Filter out null or invalid items
                const filteredResults = result.results.filter((item) => item !== null && item.serviceStatus !== false);
                setServicesDataInfo(filteredResults);


                if (result?.results?.length) {
                    const newCheckboxState = {};

                    result.results.forEach((item) => {
                        if (item.annexureData) {
                            Object.keys(item.annexureData).forEach((key) => {
                                if (key.startsWith("checkbox_annexure_")) {
                                    newCheckboxState[key] = item.annexureData[key];
                                }
                            });
                        }
                    });

                    setCheckboxState(newCheckboxState);
                }
                return filteredResults;
            } else {
                setApiLoading(false);

                setLoading(false);
                console.error("Failed to fetch service data:", response.statusText);
                return [];
            }
        } catch (error) {
            setApiLoading(false);

            setLoading(false);
            console.error("Error fetching service data:", error);
            return [];
        }


    },
        []);

    //console.log('checkboxState', checkboxState)
    function parseAndConvertDate(inputDate) {
        // Try parsing with the built-in Date constructor
        let parsedDate = new Date(inputDate);

        // If the input date is invalid, attempt to handle common date formats manually
        if (isNaN(parsedDate)) {
            // Handle potential formats manually
            if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(inputDate)) {
                // ISO 8601 format (e.g., "2024-11-19T14:54:38.000Z")
                parsedDate = new Date(inputDate);
            } else if (/\d{4}\/\d{2}\/\d{2}/.test(inputDate)) {
                // "YYYY/MM/DD" format (e.g., "2023/12/11")
                parsedDate = new Date(inputDate.replace(/\//g, '-'));
            } else if (/\d{2}-\d{2}-\d{4}/.test(inputDate)) {
                // "DD-MM-YYYY" format (e.g., "13-11-2024")
                const [day, month, year] = inputDate.split('-');
                parsedDate = new Date(`${year}-${month}-${day}`);
            } else {
                // If it's still not valid, return fallback date
                parsedDate = 'N/A';
            }
        }

        // Format the date to 'YYYY-MM-DD' format
        const formattedDate = parsedDate.toISOString().split('T')[0]; // Extracts only the date portion
        return formattedDate;
    }

    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const formatDateDDMMYY = (date) => {
        if (!date) return null;

        const d = new Date(date);
        if (isNaN(d)) return null; // Handles invalid date strings

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        return `${day}-${month}-${year}`;
    };

    const fetchApplicationData = useCallback(() => {
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem('_token');

        const requestOptions = {
            method: "GET",
            redirect: "follow"
        };

        fetch(`https://api.screeningstar.co.in/client-master-tracker/application-by-id?application_id=${applicationId}&branch_id=${branchid}&admin_id=${adminId}&_token=${token}`, requestOptions)
            .then((response) => response.json())
            .then((result) => {
                const newToken = result.token || result._token || localStorage.getItem("_token") || '';
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                const applicationData = result.application;
                setGenrateReportType(applicationData.generate_report_type)
                const cmtData = result.CMTData || [];
                if (!cmtData.deadline_date) {
                    cmtData.deadline_date = cmtData.new_deadline_date;
                }
                const services = applicationData.services;
                setApplicantImage(applicationData.photo);
                fetchServicesJson(services);
                setServicesForm(services);
                setServicesData(result);
                const uniqueNames = [...new Set(result.admins.map(admin => admin.name))];
                setAdminNamesNew(uniqueNames);
                setBranchInfo(result.branchInfo);
                setCustomerInfo(result.customerInfo);
                const visiblefeilds = JSON.parse(result.customerInfo.visible_fields);
                setVisibleFeilds(visiblefeilds);
                setApplicationRefID(applicationData.application_id);
                setCmtData(cmtData);

                let newdob = cmtData.dob;
                let newInitiationDate = cmtData.initiation_date;

                // Convert to simple date format (YYYY-MM-DD)


                const formattedDob = formatDate(newdob);
                const formattedInitiationDate = formatDate(newInitiationDate);

                setCmdDates((prevState) => ({
                    ...prevState,
                    dob: formattedDob,
                    initiationDate: formattedInitiationDate,
                }));
                // It's essential to track the most updated `cmdDates`
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    client_organization_name: applicationData.customer_name || result.branchInfo.name || prevFormData.client_organization_name || '',
                    client_applicant_name: applicationData.name || prevFormData.updated_json.name || '',
                    client_applicant_gender: applicationData.gender || prevFormData.client_applicant_gender || '',
                    client_organization_code: result.customerInfo.client_unique_id || cmtData.client_code || prevFormData.updated_json.client_code || '',
                    updated_json: {
                        month_year: cmtData.month_year || applicationData.month_year || prevFormData.updated_json.month_year || '',
                        verification_purpose: cmtData.verification_purpose || prevFormData.updated_json.verification_purpose || '',
                        employee_id: cmtData.employee_id || applicationData.employee_id || prevFormData.updated_json.employee_id || '',
                        contact_number: cmtData.contact_number || prevFormData.updated_json.contact_number || '',
                        contact_number2: cmtData.contact_number2 || prevFormData.updated_json.contact_number2 || '',
                        spouse_name: cmtData.spouse_name || prevFormData.updated_json.spouse_name || '',
                        nationality: cmtData.nationality || prevFormData.updated_json.nationality || '',
                        QC_Date: cmtData?.QC_Date
                            ? new Date(cmtData.QC_Date).toISOString().split('T')[0]
                            : (prevFormData?.updated_json?.QC_Date
                                ? new Date(prevFormData.updated_json.QC_Date).toISOString().split('T')[0]
                                : ''),
                        QC_Analyst_Name: cmtData.QC_Analyst_Name || prevFormData.updated_json.QC_Analyst_Name || '',
                        data_entry_analyst_name: cmtData.data_entry_analyst_name || prevFormData.updated_json.data_entry_analyst_name || '',
                        date_of_data: cmtData.date_of_data || prevFormData.updated_json.date_of_data || '',
                        father_name: cmtData.father_name || prevFormData.updated_json.father_name || '',
                        initiation_date: cmtData?.initiation_date
                            ? new Date(cmtData.initiation_date).toISOString().split('T')[0]
                            : (prevFormData?.updated_json?.insuffDetails?.initiation_date
                                ? new Date(prevFormData.updated_json.insuffDetails.initiation_date).toISOString().split('T')[0]
                                : ''),
                        dob: formatDateSafe(cmtData?.dob || prevFormData?.updated_json?.insuffDetails?.dob),
                        marital_status: cmtData.marital_status || prevFormData.updated_json.marital_status || '',
                        insuff: cmtData.insuff || prevFormData.updated_json.insuff || '',
                        address: {
                            address: cmtData.address || prevFormData.updated_json.address.address || '',
                            address_floor: cmtData.address_floor || prevFormData.updated_json.address.address_floor || '',
                            address_cross: cmtData.address_cross || prevFormData.updated_json.address.address_cross || '',
                            address_street: cmtData.address_street || prevFormData.updated_json.address.address_street || '',
                            address_main: cmtData.address_main || prevFormData.updated_json.address.address_main || '',
                            address_area: cmtData.address_area || prevFormData.updated_json.address.address_area || '',
                            address_locality: cmtData.address_locality || prevFormData.updated_json.address.address_locality || '',
                            address_city: cmtData.address_city || prevFormData.updated_json.address.address_city || '',
                            address_landmark: cmtData.address_landmark || prevFormData.updated_json.address.address_landmark || '',
                            address_taluk: cmtData.address_taluk || prevFormData.updated_json.address.address_taluk || '',
                            residence_mobile_number: cmtData.residence_mobile_number || prevFormData.updated_json.address.residence_mobile_number || '',
                            address_state: cmtData.address_state || prevFormData.updated_json.address.address_state || '',
                            address_pin_code: cmtData.address_pin_code || prevFormData.updated_json.address.address_pin_code || '',
                        },
                        permanent_address: {
                            permanent_sender_name: cmtData.permanent_sender_name || prevFormData.updated_json.permanent_address.permanent_sender_name || '',
                            permanent_receiver_name: cmtData.permanent_receiver_name || prevFormData.updated_json.permanent_address.permanent_receiver_name || '',
                            permanent_address: cmtData.permanent_address || prevFormData.updated_json.permanent_address.permanent_address || '',
                            permanent_address_street: cmtData.permanent_address_street || prevFormData.updated_json.permanent_address.permanent_address_street || '',
                            permanent_address_main: cmtData.permanent_address_main || prevFormData.updated_json.permanent_address.permanent_address_main || '',
                            permanent_address_area: cmtData.permanent_address_area || prevFormData.updated_json.permanent_address.permanent_address_area || '',
                            permanent_address_locality: cmtData.permanent_address_locality || prevFormData.updated_json.permanent_address.permanent_address_locality || '',
                            permanent_address_city: cmtData.permanent_address_city || prevFormData.updated_json.permanent_address.permanent_address_city || '',
                            permanent_address_landmark: cmtData.permanent_address_landmark || prevFormData.updated_json.permanent_address.permanent_address_landmark || '',
                            permanent_address_taluk: cmtData.permanent_address_taluk || prevFormData.updated_json.permanent_address.permanent_address_taluk || '',
                            permanent_address_district: cmtData.permanent_address_district || prevFormData.updated_json.permanent_address.permanent_address_district || '',
                            permanent_address_state: cmtData.permanent_address_state || prevFormData.updated_json.permanent_address.permanent_address_state || '',
                            permanent_address_pin_code: cmtData.permanent_address_pin_code || prevFormData.updated_json.permanent_address.permanent_address_pin_code || '',
                        },
                        insuffDetails: {
                            first_insufficiency_marks: cmtData.first_insufficiency_marks || prevFormData.updated_json.insuffDetails.first_insufficiency_marks || '',
                            first_insuff_date: (cmtData.first_insuff_date && !isNaN(new Date(cmtData.first_insuff_date).getTime()))
                                ? new Date(cmtData.first_insuff_date).toISOString().split('T')[0] // Format as YYYY-MM-DD
                                : (prevFormData.updated_json.insuffDetails.first_insuff_date
                                    ? new Date(prevFormData.updated_json.insuffDetails.first_insuff_date).toISOString().split('T')[0]
                                    : null),
                            first_insuff_reopened_date: (cmtData.first_insuff_reopened_date && !isNaN(new Date(cmtData.first_insuff_reopened_date).getTime()))
                                ? parseAndConvertDate(cmtData.first_insuff_reopened_date)
                                : (prevFormData.updated_json.insuffDetails.first_insuff_reopened_date
                                    ? parseAndConvertDate(prevFormData.updated_json.insuffDetails.first_insuff_reopened_date)
                                    : null),

                            second_insufficiency_marks: cmtData.second_insufficiency_marks
                                ? cmtData.second_insufficiency_marks
                                : (prevFormData.updated_json.insuffDetails.second_insufficiency_marks
                                    ? prevFormData.updated_json.insuffDetails.second_insufficiency_marks
                                    : null),

                            second_insuff_date: (cmtData.second_insuff_date && !isNaN(new Date(cmtData.second_insuff_date).getTime()))
                                ? parseAndConvertDate(cmtData.second_insuff_date)
                                : (prevFormData.updated_json.insuffDetails.second_insuff_date
                                    ? parseAndConvertDate(prevFormData.updated_json.insuffDetails.second_insuff_date)
                                    : null),

                            second_insuff_reopened_date: (cmtData.second_insuff_reopened_date && !isNaN(new Date(cmtData.second_insuff_reopened_date).getTime()))
                                ? parseAndConvertDate(cmtData.second_insuff_reopened_date)
                                : (prevFormData.updated_json.insuffDetails.second_insuff_reopened_date
                                    ? parseAndConvertDate(prevFormData.updated_json.insuffDetails.second_insuff_reopened_date)
                                    : null),

                            third_insufficiency_marks: cmtData.third_insufficiency_marks
                                ? cmtData.third_insufficiency_marks
                                : (prevFormData.updated_json.insuffDetails.third_insufficiency_marks
                                    ? prevFormData.updated_json.insuffDetails.third_insufficiency_marks
                                    : null),

                            third_insuff_date: (cmtData.third_insuff_date && !isNaN(new Date(cmtData.third_insuff_date).getTime()))
                                ? parseAndConvertDate(cmtData.third_insuff_date)
                                : (prevFormData.updated_json.insuffDetails.third_insuff_date
                                    ? parseAndConvertDate(prevFormData.updated_json.insuffDetails.third_insuff_date)
                                    : null),

                            third_insuff_reopened_date: (cmtData.third_insuff_reopened_date && !isNaN(new Date(cmtData.third_insuff_reopened_date).getTime()))
                                ? parseAndConvertDate(cmtData.third_insuff_reopened_date)
                                : (prevFormData.updated_json.insuffDetails.third_insuff_reopened_date
                                    ? parseAndConvertDate(prevFormData.updated_json.insuffDetails.third_insuff_reopened_date)
                                    : null),

                            overall_status: cmtData.overall_status ? cmtData.overall_status : prevFormData.updated_json.insuffDetails.overall_status,

                            report_date: (cmtData.report_date && !isNaN(new Date(cmtData.report_date).getTime()))
                                ? parseAndConvertDate(cmtData.report_date)
                                : (prevFormData.updated_json.insuffDetails.report_date
                                    ? parseAndConvertDate(prevFormData.updated_json.insuffDetails.report_date)
                                    : null),
                            interim_date: (cmtData.interim_date && !isNaN(new Date(cmtData.interim_date).getTime()))
                                ? parseAndConvertDate(cmtData.interim_date)
                                : (prevFormData.updated_json.insuffDetails.interim_date
                                    ? parseAndConvertDate(prevFormData.updated_json.insuffDetails.interim_date)
                                    : null),

                            report_status: cmtData.report_status ? cmtData.report_status : prevFormData.updated_json.insuffDetails.report_status || 'open',

                            report_type: cmtData.report_type ? cmtData.report_type : prevFormData.updated_json.insuffDetails.report_type || '',

                            final_verification_status: cmtData.final_verification_status ? cmtData.final_verification_status : prevFormData.updated_json.insuffDetails.final_verification_status || 'green',

                            is_verify: cmtData.is_verify ? cmtData.is_verify : prevFormData.updated_json.insuffDetails.is_verify || 'no',


                            deadline_date: (cmtData.deadline_date && !isNaN(new Date(cmtData.deadline_date).getTime()))
                                ? parseAndConvertDate(cmtData.deadline_date)
                                : (prevFormData.updated_json.insuffDetails.deadline_date
                                    ? parseAndConvertDate(prevFormData.updated_json.insuffDetails.deadline_date)
                                    : null),

                            insuff_address: cmtData.insuff_address ? cmtData.insuff_address : prevFormData.updated_json.insuffDetails.insuff_address,

                            basic_entry: cmtData.basic_entry ? cmtData.basic_entry : prevFormData.updated_json.insuffDetails.basic_entry,

                            education: cmtData.education ? cmtData.education : prevFormData.updated_json.insuffDetails.education,

                            case_upload: cmtData.case_upload ? cmtData.case_upload : prevFormData.updated_json.insuffDetails.case_upload,
                            batch_no: cmtData.batch_no ? cmtData.batch_no : prevFormData.updated_json.insuffDetails.batch_no,
                            case_id: cmtData.case_id ? cmtData.case_id : prevFormData.updated_json.insuffDetails.case_id,
                            check_id: cmtData.check_id ? cmtData.check_id : prevFormData.updated_json.insuffDetails.check_id,
                            ticket_id: cmtData.ticket_id ? cmtData.ticket_id : prevFormData.updated_json.insuffDetails.ticket_id,
                            sub_client: cmtData.sub_client ? cmtData.sub_client : prevFormData.updated_json.insuffDetails.sub_client,
                            photo: cmtData.photo ? cmtData.photo : prevFormData.updated_json.insuffDetails.photo,
                            location: cmtData.location ? cmtData.location : prevFormData.updated_json.insuffDetails.location,
                            emp_spoc: cmtData.emp_spoc ? cmtData.emp_spoc : prevFormData.updated_json.insuffDetails.emp_spoc,

                            report_generate_by: cmtData.report_generate_by ? cmtData.report_generate_by : prevFormData.updated_json.insuffDetails.report_generate_by,

                            qc_done_by: cmtData.qc_done_by ? cmtData.qc_done_by : prevFormData.updated_json.insuffDetails.qc_done_by,

                            qc_date: (cmtData.qc_date && !isNaN(new Date(cmtData.qc_date).getTime()))
                                ? parseAndConvertDate(cmtData.qc_date)
                                : (prevFormData.updated_json.insuffDetails.qc_date
                                    ? parseAndConvertDate(prevFormData.updated_json.insuffDetails.qc_date)
                                    : null),

                            delay_reason: cmtData.delay_reason ? cmtData.delay_reason : prevFormData.updated_json.insuffDetails.delay_reason




                            // Repeat for the rest of insuffDetails...
                            // Add additional fields similarly...
                        }

                    }
                }));
                setMyDataQc(applicationData.is_data_qc || myDataQc)
            })
            .catch((error) => {
                setApiLoading(false);

                setLoading(false);
                console.error('Error fetching application data:', error);
            });

    }, [applicationId, branchid, fetchServicesJson, setApiLoading, setServicesForm, setServicesData, setBranchInfo, setCustomerInfo, setFormData, setLoading]);

    const handleChange = (e) => {
        const { name, value, type, options } = e.target;

        setFormData((prevFormData) => {
            const updatedFormData = { ...prevFormData };

            // Handle `select-multiple` fields
            if (type === 'select-multiple') {
                const selectedValues = Array.from(options)
                    .filter((option) => option.selected)
                    .map((option) => option.value);

                // Address field
                if (name.startsWith('updated_json.address.')) {
                    const addressField = name.replace('updated_json.address.', '');
                    updatedFormData.updated_json.address[addressField] = selectedValues;
                }
                // Permanent address field
                else if (name.startsWith('updated_json.permanent_address.')) {
                    const permanentField = name.replace('updated_json.permanent_address.', '');
                    updatedFormData.updated_json.permanent_address[permanentField] = selectedValues;
                }
                // Insufficiency details field
                else if (name.startsWith('updated_json.insuffDetails.')) {
                    const insuffField = name.replace('updated_json.insuffDetails.', '');
                    updatedFormData.updated_json.insuffDetails[insuffField] = selectedValues;
                }
                // Top-level field
                else if (name.startsWith('updated_json.')) {
                    const topLevelField = name.replace('updated_json.', '');
                    updatedFormData.updated_json[topLevelField] = selectedValues;
                }
            }
            // Handle regular fields (e.g., text, radio, checkbox)
            else {
                // Address field
                if (name.startsWith('updated_json.address.')) {
                    const addressField = name.replace('updated_json.address.', '');
                    updatedFormData.updated_json.address[addressField] = value;
                }
                // Permanent address field
                else if (name.startsWith('updated_json.permanent_address.')) {
                    const permanentField = name.replace('updated_json.permanent_address.', '');
                    updatedFormData.updated_json.permanent_address[permanentField] = value;
                }
                // Insufficiency details field
                else if (name.startsWith('updated_json.insuffDetails.')) {
                    const insuffField = name.replace('updated_json.insuffDetails.', '');
                    updatedFormData.updated_json.insuffDetails[insuffField] = value;
                }
                // Top-level field
                else if (name.startsWith('updated_json.')) {
                    const topLevelField = name.replace('updated_json.', '');
                    updatedFormData.updated_json[topLevelField] = value;
                }
                else {
                    setFormData((prevData) => ({
                        ...prevData,
                        [name]: value,
                    }));
                }
            }
            //console.log('updatedFormData', updatedFormData)
            return updatedFormData;
        });
    };




    const fetchAdminList = useCallback(() => {
        setLoading(true);
        setApiLoading(true);
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!admin_id || !storedToken) {
            setApiLoading(false);
            setLoading(false);
            console.error("Admin ID or token not found in local storage");
            return;
        }


        // Construct the URL with query parameters
        const url = `https://api.screeningstar.co.in/admin/list?admin_id=${admin_id}&_token=${storedToken}`;

        const requestOptions = {
            method: 'GET',
            redirect: 'follow',
        };

        fetch(url, requestOptions)
            .then((response) => {
                if (!response.ok) {
                    setApiLoading(false);
                    setLoading(false);
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                setApiLoading(true);
                setLoading(true);
                return response.json(); // Parse response JSON
            })
            .then((data) => {
                const newToken = data.token || data._token || storedToken;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }

                if (data.status && Array.isArray(data.client_spocs)) {
                    // Map through the `client_spocs` array to get the names
                    const spocsWithIds = data.client_spocs.map((spoc) => ({
                        id: spoc.id,
                        name: spoc.name,
                    }));
                    setAdminNames(spocsWithIds);
                } else {
                    setLoading(false);
                    setApiLoading(false);

                    console.error("Error:", data.message || "Invalid response structure");
                }
            })
            .catch((error) => {
                setLoading(false);
                setApiLoading(false);

                console.error("Fetch error:", error.message);
            })
            .finally(() => {
                setLoading(true);
                setApiLoading(false);

            });
    }, []);

    useEffect(() => {
        const initialize = async () => {
            try {
                await fetchApplicationData();

                await fetchAdminList();

            } catch (error) {
                console.error(error.message);
            }
        };

        initialize(); // Execute the sequence
    }, [fetchApplicationData, fetchAdminList]);



    const uploadCustomerLogo = async (email_status) => {
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!admin_id || !storedToken) {
            console.error("Admin ID or token not found in local storage.");
            return;
        }

        const fileEntries = Object.entries(files);
        const fileCount = fileEntries.length;

        for (const [rawKey, value] of fileEntries) {
            const key = rawKey.replace("[]", ""); // Sanitize key
            const customerLogoFormData = new FormData();

            customerLogoFormData.append("admin_id", admin_id);
            customerLogoFormData.append("_token", storedToken);
            customerLogoFormData.append("application_id", applicationId);
            customerLogoFormData.append("email_status", email_status || 0);
            customerLogoFormData.append("branch_id", branchid);
            customerLogoFormData.append("customer_code", customerInfo.client_unique_id);
            customerLogoFormData.append("application_code", applicationId);

            if (value.selectedFiles?.length > 0) {
                for (const file of value.selectedFiles) {
                    if (file instanceof File) {
                        customerLogoFormData.append("images", file);
                    } else {
                        console.warn("Invalid file object skipped:", file);
                    }
                }

                // Append sanitized file name and table
                const sanitizedFileName = value.fileName.replace(/\[\]$/, "");
                customerLogoFormData.append("db_column", sanitizedFileName);
                customerLogoFormData.append("db_table", key);
            }

            // Append 'send_mail' only in the last iteration
            if (fileEntries.indexOf([rawKey, value]) === fileCount - 1) {
                customerLogoFormData.append("send_mail", 1);
            }

            try {
                const response = await axios.post(
                    "https://api.screeningstar.co.in/client-master-tracker/upload",
                    customerLogoFormData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                const data = response.data; // Axios automatically parses JSON responses
                const newToken = data.token || data._token || storedToken;

                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
            } catch (err) {
                console.error("Error uploading logo:", err.message || err);
            }
        }
    };

    const handleDataQCChange = (e) => {
        const value = e.target.value;
        setMyDataQc(value);

        // Update errors and clear the specific field's error if it's valid

    };


    const validate = () => {
        const newErrors = {};

        // Validate overall_status
        if (!formData.updated_json.insuffDetails.overall_status) {
            newErrors.overall_status = "Overall Status is required.";
        }
        var myDataQc = document.getElementById("myData_qc").value;
        if (!myDataQc) {
            newErrors.myData_qc = "Data QC is required.";
        }

        if (Array.isArray(servicesDataInfo)) {
            servicesDataInfo.forEach((serviceData, index) => {
                if (serviceData.serviceStatus) {
                    const formJson = JSON.parse(serviceData?.reportFormJson?.json);
                    const selectedStatus = selectedStatuses[index];

                    // Check if status is selected
                    if (!selectedStatus) {
                        newErrors[`serviceStatus_${index}`] = `Status for ${formJson.heading} is required.`;
                    }
                }
            });
        } else {
            console.error('servicesDataInfo is not an array', servicesDataInfo);
        }


        setErrors(newErrors);
        //console.log('errrors', errors)


        if (Object.keys(newErrors).length > 0) {
            const firstErrorField = Object.keys(newErrors)[0];
            inputRefs.current[firstErrorField]?.focus();
        }

        return Object.keys(newErrors).length === 0;
    };
    const formatAddress = (address, groupSize = 3) => {
        if (!address?.trim()) return ""; // Return empty string if no address

        const parts = address.split(",").map(part => part.trim());
        let formattedAddress = [];

        for (let i = 0; i < parts.length; i += groupSize) {
            formattedAddress.push(parts.slice(i, i + groupSize).join(", "));
        }

        return formattedAddress.join("<br>"); // Join with line breaks for HTML
    };

    const getAddressHTML = (customerInfo) => {
        const customAddress = customerInfo?.custom_address?.trim();
        const hasCustomAddress = !!customAddress;

        return hasCustomAddress
            ? formatAddress(customAddress) // If custom address exists, format it
            : ` 
                <div class="sspltd" style="text-align: left; margin-top:10px; font-size: 16px; font-weight: bold;">
                     ${cmtData.organization_name || "Screeningstar Solutions Pvt Ltd"}
                </div>
                <div class="address" style="text-align: left;margin-top: 5px; font-size: 18px; font-weight: bold;">
                    No 93/9, Varthur Main Road, Marathahalli, Bangalore, Karnataka
                </div>
                <div class="address" style="text-align: left;margin-top: 5px; font-size: 18px; font-weight: bold;margin-bottom: 50px;">
                    India, Pin Code - 560037
                </div>
            `;
    };


    const handleSubmit = useCallback(async (e) => {
        //console.log("Submission triggered");
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
        const fileEntries = Object.entries(files);
        const fileCount = fileEntries.length;
        if (isNotMandatory || validate()) {
            //console.log("Validation passed");
            setApiLoading(true);
            setLoading(true);
            setSubmitLoading(true);
            try {
                const adminData = JSON.parse(localStorage.getItem("admin"));
                const token = localStorage.getItem("_token");
                const validServicesDataInfo = Array.isArray(servicesDataInfo) ? servicesDataInfo : [];
                //console.log('servicesDataInfo', servicesDataInfo)
                //console.log("Admin Data:", adminData);
                //console.log("Token:", token);
                //console.log("Services Data Info:", validServicesDataInfo);
                const submissionData = validServicesDataInfo
                    .map((serviceData, index) => {
                        if (serviceData.serviceStatus) {
                            //console.log(`Processing service at index ${index}`);

                            const formJson = serviceData.reportFormJson?.json
                                ? JSON.parse(serviceData.reportFormJson.json)
                                : null;
                            //console.log('Form JSON:', formJson);

                            if (!formJson) {
                                console.warn(`Invalid formJson for service at index ${index}`);
                                return null;
                            }

                            const annexure = {};
                            //console.log('Initial annexure:', annexure);

                            formJson.rows.forEach((row) => {
                                //console.log('Processing row:', row);
                                row.inputs.forEach((input) => {
                                    //console.log('Processing input:', input);
                                    let fieldName = input.name;
                                    const fieldValue =
                                        serviceData.annexureData && serviceData.annexureData.hasOwnProperty(fieldName)
                                            ? serviceData.annexureData[fieldName]
                                            : "";
                                    //console.log(`Field name: ${fieldName}, Field value: ${fieldValue}`);

                                    const tableKey = formJson.db_table;
                                    //console.log('Table key:', tableKey);

                                    if (fieldName.endsWith("[]")) {
                                        fieldName = fieldName.slice(0, -2);
                                        //console.log('Trimmed field name:', fieldName);
                                    }

                                    if (fieldName.startsWith("annexure_")) {
                                        const annexureCheckboxName = `checkbox_${fieldName}`;
                                        //console.log("Generated annexureCheckboxName:", annexureCheckboxName);

                                        const annexureCheckboxValue =
                                            serviceData.annexureData &&
                                                serviceData.annexureData.hasOwnProperty(annexureCheckboxName) &&
                                                [1, "1", true].includes(serviceData.annexureData[annexureCheckboxName])
                                                ? true
                                                : false;

                                        //console.log(`Determined annexureCheckboxValue for ${annexureCheckboxName}:`, annexureCheckboxValue);

                                        annexure[tableKey][annexureCheckboxName] = annexureCheckboxValue;
                                        //console.log(`Stored annexureCheckboxValue under annexure[${tableKey}][${annexureCheckboxName}]`);
                                    } else {
                                        if (!annexure[tableKey]) annexure[tableKey] = {};
                                        annexure[tableKey][fieldName] = fieldValue;
                                    }
                                });
                            });


                            const category = formJson.db_table;
                            const status = selectedStatuses?.[index] || "";

                            const checkboxStatus = selectedCheckbox?.[index] || 0;

                            if (annexure[category]) {
                                annexure[category].status = status;
                                //console.log(`Added status to annexure[${category}]:`, annexure[category].status);
                            }

                            return {
                                annexure,
                                service_id: serviceData.service_id
                            };
                        }

                        //console.log(`Skipping service at index ${index} due to serviceStatus being false`);
                        return null;
                    })
                    .filter((service) => service !== null);

                //console.log('Final submissionData:', submissionData);

                //console.log("Submission Data:", submissionData);
                const rawFilteredSubmissionData = submissionData.filter((item) => item !== null);
                const filteredSubmissionData = rawFilteredSubmissionData.reduce((acc, item) => {
                    Object.keys(item.annexure).forEach((key) => {
                        acc[key] = {
                            ...item.annexure[key],
                            service_id: item.service_id
                        };
                    });
                    return acc;
                }, {});

                Object.keys(filteredSubmissionData).forEach((key) => {
                    const data = filteredSubmissionData[key];
                    Object.keys(data).forEach((subKey) => {
                        if (subKey.startsWith("Annexure")) {
                            delete data[subKey];
                        }
                    });
                });

                //console.log("Filtered Submission Data:", filteredSubmissionData);

                const replaceEmptyWithNull = (obj) => {
                    for (let key in obj) {
                        if (obj[key] && typeof obj[key] === "object") {
                            replaceEmptyWithNull(obj[key]);
                        } else {
                            if (obj[key] === "") {
                                obj[key] = null;
                            }
                        }
                    }
                    return obj;
                };
                const isStringified = (value) =>
                    typeof value === "string" && (value.startsWith("{") || value.startsWith("["));

                const safeStringify = (value) =>
                    isStringified(value) ? value : JSON.stringify(value ?? ""); // Handle null/undefined safely

                const modifiedFormData = {
                    ...formData,
                    updated_json: {
                        ...formData.updated_json,
                        insuffDetails: {
                            ...formData.updated_json.insuffDetails,
                            first_insufficiency_marks: typeof formData.updated_json.insuffDetails.first_insufficiency_marks === 'string'
                                ? formData.updated_json.insuffDetails.first_insufficiency_marks
                                : JSON.stringify(formData.updated_json.insuffDetails.first_insufficiency_marks),
                            second_insufficiency_marks: typeof formData.updated_json.insuffDetails.second_insufficiency_marks === 'string'
                                ? formData.updated_json.insuffDetails.second_insufficiency_marks
                                : JSON.stringify(formData.updated_json.insuffDetails.second_insufficiency_marks),
                            third_insufficiency_marks: typeof formData.updated_json.insuffDetails.third_insufficiency_marks === 'string'
                                ? formData.updated_json.insuffDetails.third_insufficiency_marks
                                : JSON.stringify(formData.updated_json.insuffDetails.third_insufficiency_marks),
                            delay_reason: typeof formData.updated_json.insuffDetails.delay_reason === 'string'
                                ? formData.updated_json.insuffDetails.delay_reason
                                : JSON.stringify(formData.updated_json.insuffDetails.delay_reason),
                        }
                    }
                };
                //console.log('modifiedFormData', modifiedFormData);


                // Use 'wip' as the default value if `overall_status` is not present in `insuffDetails`.
                const overall_status =
                    modifiedFormData.updated_json?.insuffDetails?.overall_status || 'wip';


                setFormData({
                    ...modifiedFormData,
                    overall_status: undefined, // Explicitly remove `overall_status` from the outer object
                    updated_json: {
                        ...modifiedFormData.updated_json,
                        insuffDetails: {
                            ...modifiedFormData.updated_json.insuffDetails,
                            overall_status: overall_status, // Make sure this gets assigned properly
                        },
                    },
                });
                const myDataQc = document.getElementById("myData_qc")?.value || null;
                if (!myDataQc) {
                    console.error("myData_qc value is missing!");
                    throw new Error("myData_qc value is required.");
                }


                //console.log('modifiedFormData(jhrkwserweertwe', modifiedFormData);

                const raw = JSON.stringify({
                    admin_id: adminData?.id,
                    _token: token,
                    branch_id: branchid,
                    customer_id: branchInfo.customer_id,
                    application_id: applicationId,
                    data_qc: myDataQc,
                    ...modifiedFormData,
                    annexure: filteredSubmissionData || {},
                    send_mail: Object.keys(files).length === 0 ? 1 : 0,
                });

                const requestOptions = {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: raw,
                };
                const response = await fetch(
                    `https://api.screeningstar.co.in/client-master-tracker/generate-report`,
                    requestOptions
                );

                //console.log("Response Status:", response.status);

                let result;
                if (!response.ok) {
                    try {
                        // Attempt to parse error response
                        result = await response.json();
                        throw new Error(result.message || "An unknown error occurred.");
                    } catch (jsonError) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                }

                result = await response.json();
                //console.log("API Response:", result);

                const newToken = result._token || result.token || localStorage.getItem("_token");
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }

                if (fileCount === 0) {
                    Swal.fire("Success!", "Application updated successfully.", "success").then(() => {
                        redirectAfterSuccess();
                    });
                }

                if (fileCount > 0) {
                    await uploadCustomerLogo(result.email_status);
                    Swal.fire("Success!", "Application updated successfully.", "success").then(() => {
                        redirectAfterSuccess();
                    });
                }
                
            } catch (error) {
                console.error("Error during submission:", error);

                // Show API error message dynamically if available
                Swal.fire("Error", error.message || "Failed to submit the application. Please try again.", "error");
            } finally {
                setApiLoading(false);
                setSubmitLoading(false);
                setLoading(false);
            }

        } else {
            //console.log("Validation failed");
        }

    }, [isNotMandatory, validate, servicesDataInfo, branchid, branchInfo, applicationId, formData, selectedStatuses, files, navigate]);

    function changeLabel(label) {

        if (genrateReportType !== 'VENDOR CONFIDENTIAL SCREENING REPORT') {
            return label;
        }

        const labelChangeAsPerVendorOrBGV = {
            "name of the applicant:": "Name of the Organization:",
            "date of birth:": "Date of Incorporation:",
            "applicant details": "ORGANISATION DETAILS"
        };

        if (label && typeof label === "string" && label.trim() !== "") {
            const lowerLabel = label.trim().toLowerCase();
            if (labelChangeAsPerVendorOrBGV.hasOwnProperty(lowerLabel)) {
                return labelChangeAsPerVendorOrBGV[lowerLabel];
            }
        }
        return label;
    }

    const colorNames = [
        'red', 'green', 'blue', 'yellow', 'pink', 'purple', 'orange', 'black', 'white', 'gray', 'brown', 'cyan', 'magenta'
    ];
    const handlePreview = useCallback(async (e) => {
        //console.log("Preview triggered");
        e.preventDefault();
        const fileEntries = Object.entries(files);
        const fileCount = fileEntries.length;

        if (isNotMandatory || validate()) {
            //console.log("Validation passed");

            const adminData = JSON.parse(localStorage.getItem("admin"));
            const token = localStorage.getItem("_token");
            const validServicesDataInfo = Array.isArray(servicesDataInfo) ? servicesDataInfo : [];

            //console.log("Admin Data:", adminData);
            //console.log("Token:", token);
            //console.log("Services Data Info:", validServicesDataInfo);

            const submissionData = validServicesDataInfo
                .map((serviceData, index) => {
                    if (serviceData.serviceStatus) {
                        const formJson = serviceData.reportFormJson?.json
                            ? JSON.parse(serviceData.reportFormJson.json)
                            : null;
                        if (!formJson) {
                            console.warn(`Invalid formJson for service at index ${index}`);
                            return null;
                        }

                        const annexure = {};

                        formJson.rows.forEach((row) => {
                            row.inputs.forEach((input) => {
                                let fieldName = input.name;
                                const fieldValue =
                                    serviceData.annexureData && serviceData.annexureData.hasOwnProperty(fieldName)
                                        ? serviceData.annexureData[fieldName]
                                        : "";

                                const tableKey = formJson.db_table;

                                if (fieldName.endsWith("[]")) {
                                    fieldName = fieldName.slice(0, -2);
                                }

                                if (fieldName.startsWith("annexure.")) {
                                    const [, category, key] = fieldName.split(".");
                                    if (!annexure[category]) annexure[category] = {};
                                    annexure[category][key] = fieldValue;
                                } else {
                                    if (!annexure[tableKey]) annexure[tableKey] = {};
                                    annexure[tableKey][fieldName] = fieldValue;
                                }
                            });
                        });

                        const category = formJson.db_table;
                        const status = selectedStatuses?.[index] || "";
                        if (annexure[category]) {
                            annexure[category].status = status;
                            annexure[category].heading = formJson.heading; // ✅ Add heading
                        }

                        return { annexure };
                    }
                    return null;
                })
                .filter((service) => service !== null);



            const rawFilteredSubmissionData = submissionData.filter((item) => item !== null);
            const filteredSubmissionData = rawFilteredSubmissionData.reduce(
                (acc, item) => ({ ...acc, ...item.annexure }),
                {}
            );


            Object.keys(filteredSubmissionData).forEach((key) => {
                const data = filteredSubmissionData[key];
                Object.keys(data).forEach((subKey) => {
                    if (subKey.startsWith("annexurae")) {
                        delete data[subKey];
                    }
                });
            });

            //console.log("Filtered Submission Data:", filteredSubmissionData);

            const replaceEmptyWithNull = (obj) => {
                for (let key in obj) {
                    if (obj[key] && typeof obj[key] === "object") {
                        replaceEmptyWithNull(obj[key]);
                    } else {
                        if (obj[key] === "") {
                            obj[key] = null;
                        }
                    }
                }
                return obj;
            };

            const modifiedFormData = replaceEmptyWithNull({ ...formData });
            //console.log("Modified Form Data:", modifiedFormData);
            //console.log(applicantImage)
            // Array of common color names


            // Function to check for color names
            const checkColorInStatus = (status) => {
                // Check if any color name is in the status
                for (let color of colorNames) {
                    if (status.toLowerCase().includes(color)) {
                        return color;  // Return the found color name
                    }
                }
                return status;  // Return the original status if no color name is found
            };

            const finalStatus = (formData.updated_json.insuffDetails.final_verification_status || "N/A").toUpperCase();
            const statusLower = finalStatus.toLowerCase();

            let statusImage = "";
            if (statusLower === "green") statusImage = "/green.png";
            else if (statusLower === "red") statusImage = "/red.png";
            else if (statusLower === "orange") statusImage = "/orange.png";
            else if (statusLower === "yellow") statusImage = "/yellow.png";
            const screeningLogo = "/screeningLogoNew.png"

            let headerTableData;

            if (genrateReportType == 'CONFIDENTIAL BACKGROUND SCREENING REPORT') {
                headerTableData = [
                    ["REFERENCE ID", String(applicationRefID).toUpperCase(), "DATE OF BIRTH", formatDate(cmdDates.dob) || "N/A"],
                    ["EMPLOYEE ID", String(cmtData.employee_id || "N/A").toUpperCase(), "INSUFF CLEARED", formatDate(formData.updated_json.insuffDetails.first_insuff_reopened_date) || "N/A"],
                    ["VERIFICATION INITIATED", formatDate(cmdDates.initiationDate).toUpperCase() || "N/A", "FINAL REPORT DATE", formatDate(formData.updated_json.insuffDetails.report_date) || "N/A"],
                    // ["VERIFICATION PURPOSE", (formData.updated_json.insuffDetails.final_verification_status || "EMPLOYMENT").toUpperCase(), "VERIFICATION STATUS", (formData.updated_json.insuffDetails.final_verification_status || "N/A").toUpperCase()],
                    ["REPORT TYPE", (formData.updated_json.insuffDetails.report_type || "EMPLOYMENT").replace(/_/g, " ").toUpperCase(), "REPORT STATUS", (formData.updated_json.insuffDetails.report_status || "N/A").toUpperCase()]
                ];
            } else if (genrateReportType == 'VENDOR CONFIDENTIAL SCREENING REPORT') {
                headerTableData = [
                    ["REFERENCE ID", String(applicationRefID).toUpperCase(), "DATE OF INCORPORATION", formatDate(cmdDates.dob) || "N/A"],
                    ["EMPLOYEE ID", String(cmtData.employee_id || "N/A").toUpperCase(), "INSUFF CLEARED", formatDate(formData.updated_json.insuffDetails.first_insuff_reopened_date) || "N/A"],
                    ["VERIFICATION INITIATED", formatDate(cmdDates.initiationDate).toUpperCase() || "N/A", "FINAL REPORT DATE", formatDate(formData.updated_json.insuffDetails.report_date) || "N/A"],
                    // This row has only 2 cells (spans full row)
                    // ["VERIFICATION STATUS", (formData.updated_json.insuffDetails.final_verification_status || "N/A").toUpperCase(), "REPORT STATUS", (formData.updated_json.insuffDetails.report_status || "N/A").toUpperCase()],
                    ["REPORT TYPE", (formData.updated_json.insuffDetails.report_type || "EMPLOYMENT").replace(/_/g, " ").toUpperCase()]
                ];
            }
            const safeHeaderTableData = Array.isArray(headerTableData) ? headerTableData : [];

            const header = `
<div class="preview-section mb-5 p-4 border border-gray-300 rounded-lg bg-white shadow-md">
    <div class="grid md:grid-cols-2 gap-3 mb-5">
        <div class="preview-field" style="margin-bottom: 15px; display: flex; justify-content:center; align-items: center; gap: 10px;">
            <img
                class="headerImage"
                src="${customerInfo.custom_template == "yes" ? customerInfo.custom_logo : screeningLogo}" 
                alt="Customer Logo"
                style="max-width: 350px;margin: 20px;" 
            />
        </div>
    </div>

    <div class="w-full h-12 border-b-4 border-black mb-8"></div>

    <div class="mb-12">
        <div class="header text-xl font-semibold mb-4">${genrateReportType || "CONFIDENTIAL BACKGROUND SCREENING REPORT"}</div>
     
       <div style="margin-bottom: 1.5rem;
    padding: 1rem 0;
    border-radius: 0.5rem;
    display: flex
;
    align-items: end;">
        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; width: 100%;">
            
           
            <div style="display: flex;
    align-items: center;
    gap: 0;
    min-height: 120px;
    margin-bottom: 3.5rem;
    width: 100%;">
            <div style="width: 50%;">
            <div 
            style="max-width: 263px;
    border-radius: 0;
    align-items: center;
    justify-content: center;
    display: flex
;
    margin: 0 auto">
                <img 
                src="${applicantImage ? applicantImage : "/no-image.png"}" 
                alt="Profile Picture" 
                style="width: 100%; height: 100%; object-fit: cover;"
                />
            </div>
            </div>
            <div style="    width: 50%;
    text-align: left;
    display: flex
;
    align-items: center;
    justify-content: center;">
          
            ${statusImage
                    ? `<img src="${statusImage}" alt="${finalStatus} status" style="width: 50%; height: 300px; margin-top: 8px;" />`
                    : ""
                }
        

            </div>
            </div>

            <div style="
  display: flex;
    justify-content: space-between;
    min-height: 100px;
    background: #3b82f6;
    color: #ffffff;
    padding: 0;
    text-align: right;
    width: 100%;">
                    <h2 style="font-size: 30px;
    font-weight: bold;
    margin: 0;
    width: 50%;
    text-align: center;
    display: flex
;
    align-items: center;
    justify-content: center;">${formData.client_applicant_name || 'N/A'}</h2>

           <div style="width: 50%;
    background: #a1c2fa;
    height: auto;
    padding: 0 10px;
    display: flex;
    align-items: center;
    justify-content: center;">

            <p style="font-size: 25px; text-align:center; font-weight: 600; margin: 0; padding-left: 20px;">
                ${formData.client_organization_name || 'N/A'}
            </p></div>
            </div>

        </div>
        </div>


        <table class="report-container w-full border-collapse border border-blue-500 text-sm">
  ${safeHeaderTableData.map(row => `
    <tr>
        ${row.map((cell, i) => {
                    const safeCell = (cell === null || cell === undefined || cell === '') ? 'N/A' : cell;

                    // Default styling
                    let cellStyle = `font-weight: ${i % 2 === 0 ? 'bold' : 'normal'};`;

                    // Check if this is the Verification Status column
                    if (row[i - 1] && row[i - 1].toString().toLowerCase().includes("verification status")) {
                        const value = safeCell.toUpperCase();
                        if (value === "GREEN") {
                            cellStyle += " color: green; font-weight: bold;";
                        } else if (value === "RED") {
                            cellStyle += " color: red; font-weight: bold;";
                        } else if (value === "YELLOW") {
                            cellStyle += " color: orange; font-weight: bold;";
                        }
                    }

                    return `
                <td 
                    class="border border-blue-500 px-2 py-1" 
                    style="${cellStyle}"
                >
                    ${safeCell}
                </td>
            `;
                }).join('')}
    </tr>
`).join('')}


        </table>
    </div>
</div>
`;


            const images = [
                { src: aadhaarIcon, width: 12, height: 10 },
                { src: emblemIcon, width: 9, height: 11 },
                { src: logo3, width: 12, height: 11 },
                { src: logo4, width: 12, height: 13 },
                { src: logo5, width: 13, height: 11 },
                { src: logo6, width: 11, height: 11 },
                { src: logo8, width: 13, height: 14 },
                { src: logo9, width: 12, height: 13 },
            ];

            const photos = `
  <div style="display:grid; grid-template-columns:repeat(8, 12%); gap:15px; margin:30px 0;">
    ${images
                    .map(
                        (img) => `
        <div style="display:flex; justify-content:center;">
        <div style="border: 2px solid #2e5cab;
    height: 75px;
    width: 75px;
    border-radius: 100%;
    padding: 1px;
    display: flex;
    align-items: center;
    justify-content: center;">
          <img src="${img.src}" alt="" width="${img.width * 5}" height="${img.height * 5}" />
        </div>
        </div>
      `
                    )
                    .join("")}
  </div>
`;
            const imageArray = [colored, yellowShield, orangeShield, greenShield];

            const staticTopOneSection = `

                 <div style="margin-bottom: 2rem;">
                 <div class="header text-xl font-semibold" style="border-bottom: 0px;
    margin-bottom: 0px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;">COLOR CODE / ADJUDICATION MATRIX</div>
                            <table style="width: 100%; border-collapse: collapse; border: 2px solid #3b82f6; background:#fff; text-align: center;">
                                <tr style="background-color: #f5f5f5">
                                    <th style="border: 2px solid #3b82f6; background:#fff; padding: 10px 0"><div style="height: 47px;display: flex;align-items: center;justify-content: center;">MAJOR DISCREPANCY</div></th>
                                    <th style="border: 2px solid #3b82f6; background:#fff;"> <div style="height: 47px;display: flex;align-items: center;justify-content: center;">MINOR DISCREPANCY</div></th>
                                    <th style="border: 2px solid #3b82f6; background:#fff;"><div style="height: 47px;display: flex;align-items: center;justify-content: center;">UNABLE TO VERIFY</div></th>
                                    <th style="border: 2px solid #3b82f6; background:#fff;"><div style="height: 47px;display: flex;align-items: center;justify-content: center;">ALL CLEAR</div></th>
                                </tr>
                                <tr>
                            ${imageArray
                    .map(
                        (src) => `
                                <td style="padding:5px; text-align:center; border: 2px solid #3b82f6">
                                <img src="${src}" alt="" style="max-width:50px; width:100%; height:auto;" />
                                </td>
                            `
                    )
                    .join("")}
                        </tr>
                            </table>
                        </div>
                <div class="mb-8">
                    <div class="header text-xl font-semibold">SUMMARY OF THE VERIFICATION CONDUCTED</div>
                    <table class="report-container w-full">
                    <thead>
                    <tr>
                    <th style="background:#fff;">SCOPE OF SERVICES / COMPONENT</th>
                    <th style="background:#fff;">INFORMATION VERIFIED BY</th>
                    <th style="background:#fff;">VERIFIED DATE</th>
                    <th style="background:#fff;">VERIFICATION STATUS</th>
                    </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(filteredSubmissionData).map(([section, fields]) => {
                        const reportFormJson = fields.reportFormJson?.json ? JSON.parse(fields.reportFormJson.json) : {};
                        //console.log('reportFormJson',reportFormJson);
                        //console.log('section',section);
                        const headers = reportFormJson.headers || [];

                        return `
                                    <tr>
                                        <td>${section.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}</td>
                                        <td>${fields[`information_source_${section}`] || ''}</td>
                                        <td>${formatDate(fields[`date_of_verification_${section}`] || '')}</td>
                                    <td 
                                    style="font-weight: 600; color: ${checkColorInStatus(fields.status)}"
                                    >
                                    ${(fields.status
                                ? fields.status
                                    .replace(/completed/gi, "")   // remove "completed" (case-insensitive)
                                    .replace(/_/g, " ")           // replace underscores with spaces
                                    .trim()                       // remove extra spaces
                                    .toUpperCase()
                                : ""
                            )}
                            </td>
                            
                            </tr>
                            `;
                    }).join('')}
                        </tbody>
                        </table>
                        </div>
            
                        `;
            const previewData = Object.entries(filteredSubmissionData).map(([section, fields]) => {
                // Extract heading from fields
                const sectionHeading = fields.heading || section;

                // Create a map to store merged rows
                const mergedFields = {};
                const annexures = [];
                const mysection = section;

                Object.entries(fields).forEach(([fieldName, fieldValue]) => {
                    // Clean the label
                    const baseFieldName = fieldName.replace(new RegExp(`_${section}$`), "");
                    const formattedLabel = baseFieldName
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, char => char.toUpperCase())
                        .replace(/Verified /i, "");

                    const isVerified = fieldName.startsWith("verified_");

                    if (fieldName.startsWith("annexure_")) {
                        annexures.push(fieldValue || "");
                    } else if (fieldName !== "heading") { // 🚀 skip heading row
                        if (!mergedFields[formattedLabel]) {
                            mergedFields[formattedLabel] = { applicantDetails: "", verifiedDetails: "" };
                        }

                        if (isVerified) {
                            mergedFields[formattedLabel].verifiedDetails = fieldValue || "N/A";
                        } else {
                            mergedFields[formattedLabel].applicantDetails = fieldValue || "N/A";
                        }
                    }
                });

                // Generate the table structure
                const tableHtml = `
        <div class="header text-xl font-semibold" style="margin-bottom: 0px; text-transform: uppercase; margin-top:20px;">
            ${sectionHeading} <!-- ✅ print heading -->
        </div>
        <table class="preview-table report-container" style="width: 100%; margin-top:0px; margin-bottom: 20px; border-collapse: collapse; border: 1px solid #ddd; background-color: #fff; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
            <thead>
                <tr>
                    <th style="text-align: left; font-size: 18px; font-weight: bold; color: #333; padding: 15px; border-bottom: 1px solid #ddd;">PARTICULARS</th>
                    <th style="text-align: left; font-size: 18px; font-weight: bold; color: #333; padding: 15px; border-bottom: 1px solid #ddd;">APPLICANT DETAILS</th>
                    <th style="text-align: left; font-size: 18px; font-weight: bold; color: #333; padding: 15px; border-bottom: 1px solid #ddd;">VERIFIED DETAILS</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(mergedFields).map(([label, values]) => {
                    return `
                        <tr>
                            <td style="padding: 10px; white-space:nowrap; font-weight: 500; color: #4a4a4a; text-transform: capitalize;">
                                ${changeLabel(label.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()))}
                            </td>
                            ${values.verifiedDetails
                            ? `
                                        <td style="padding: 10px; background-color: #f8f8f8;">
                                            ${values.applicantDetails.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                                        </td>
                                        <td style="padding: 10px; background-color: #fff; text-align:left;">
                                            ${values.verifiedDetails.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                                        </td>
                                    `
                            : `
                                        <td colspan="2" style="padding: 10px; background-color: #f8f8f8; text-align:left;">
                                            ${values.applicantDetails.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                                        </td>
                                    `
                        }
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;


                const annexureHtml = annexures.length
                    ? `
                    ${(() => {
                        const annexureEntries = Object.entries(fields).filter(([fieldName]) => fieldName.startsWith("annexure"));

                        // Check if there are any valid annexures
                        const hasAnnexures = annexureEntries.some(([fieldName, fieldValue]) => {
                            const previewFiles = serpreviewfiles[mysection] || null;
                            //console.log('fieldValue', fieldValue)
                            const values = previewFiles ? previewFiles : fieldValue?.split(",");
                            return values?.some(value => value?.trim() !== "");
                        });

                        if (!hasAnnexures) return ""; // Hide the entire section if no annexures exist

                        return `
                          <div class="annexures-section" style="margin-top: 20px; margin-bottom: 50px;">
                            <h3 style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px;">
                              Annexures:
                            </h3>
                            ${annexureEntries.map(([fieldName, fieldValue]) => {
                            const previewFiles = serpreviewfiles[mysection] || null;
                            const values = previewFiles ? previewFiles : fieldValue.split(",");

                            return values.map(value => `
                                <div style="padding: 10px; border: 2px solid #4285f5; text-align: center; margin-bottom: 30px;">
                                  <img 
                                    src="${value.trim()}" 
                                    alt="${fieldName}" 
                                    style="max-width: 80%; min-width: 50%; border-radius: 5px; object-fit: cover;" 
                                  />
                                </div>
                              `).join('');
                        }).join('')}
                          </div>
                        `;
                    })()}
                      
                `
                    : "";

                // Combine table and annexures
                return tableHtml + annexureHtml;



            }).join("");


            const Statictop2Section = `
                 <div class="header">DISCLAIMER</div>
            <p style="padding-bottom:10px;">
                This is a computer-generated document issued by <b>Screeningstar Solutions Private Limited</b> and does not require a physical or digital signature.
                </p>

                <p style="padding-bottom:10px;">
                This report is strictly for internal use by the client for purposes such as employment verification, vendor assessment, or due diligence. It is not a replacement for statutory checks or legal procedures mandated by government authorities.
                </p>

                <p style="padding-bottom:10px;">
                All data has been sourced from publicly accessible records, educational institutions, ex-employers, online portals, verbal confirmations, and government databases such as
                <a href="https://ecourts.gov.in" style="color:blue; text-decoration:underline;">https://ecourts.gov.in</a>. Solutions is not the originator of this data and cannot guarantee its completeness or accuracy.
                </p>

                <p style="padding-bottom:10px;">
                While all efforts are made to ensure accuracy, this report is provided on an <b>“as is, where is”</b> basis. Final responsibility for decisions based on this report rests solely with the client.
                </p>

                <p style="padding-bottom:10px;">
                All verification checks are conducted with proper authorization from the individual or with written approval from the client where applicable. PAN and Aadhaar checks are conducted through authorized system integrations; screenshots may not always be available.
                </p>

                <p style="padding-bottom:10px;">
                The content of this report is <b>confidential</b> and must be stored securely in compliance with data privacy regulations including the <b>IT Act 2000</b>. Misuse, redistribution, or unauthorized disclosure of this report is strictly prohibited.
                </p>

                <p style="padding-bottom:10px;">For queries or customizations, please contact:</p>

                <p style="padding-bottom:10px; dispay:flex; gap:2px;">
                <img src="${emailIconGreen}"alt ="email" style="max-width:20px;"/>
                <a href="mailto:compliance@screeningstar.com" style="color:blue; text-decoration:underline;">compliance@screeningstar.com</a> | 
                <a href="mailto:bgv@screeningstar.com" style="color:blue; text-decoration:underline;">bgv@screeningstar.com</a>
                </p>
               

    
             



        `;
            const previewWindow = window.open('', '_blank');
            previewWindow.document.write(`
                <html>
                    <head>
                        <style>
                        th{
                        background:#fff;
                        }
                            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; color: #333; background-color: #fff; }
                            h1 { text-align: center; color: #333; font-size: 24px; margin-bottom: 20px; }
                            .preview-section {  margin-bottom: 15px; }
                            .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px; }
                          
                            .field-label { font-weight: 500; color: #4a4a4a; font-size: 15px; text-transform: capitalize; margin-right: 15px; }
                            .field-value { font-size: 14px; color: #7f8c8d; padding: 5px 10px; border-radius: 5px; background-color: #f8f8f8; width: 60%; word-wrap: break-word; }
                             .field-image { max-width: 150px; max-height: 150px; border-radius: 5px; object-fit: cover; }
                             .headerImage { max-width: 100%; max-height: 8rem; border-radius: 5px; object-fit: cover; }
                            .footer { text-align: center; font-size: 12px; margin-top: 20px; color: #7f8c8d; }
                             .report-container {width: 100%; border-collapse: collapse;  margin: 30px 0;font-size: 16px; text-align: left; }
        .report-container th, .report-container td {
            border: 2px solid #4285f5;
            padding: 8px;
        }
        .report-container th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
     .header {
    background-color: #4285f5; /* Fixed background-color property */
    border: 1px solid #2e5cab; /* Fixed border syntax */
    text-align: center;
    font-size: 20px;
    margin-bottom: 20px;
    font-weight: bold;
    color:#fff;
    padding-top: 13px;
    padding-bottom: 13px;

}
        .colorcode {
    background-color: #f5f5f5; /* Fixed background-color property */
    border: 2px solid #4285f5; /* Fixed border syntax */
    text-align: center;
    font-size: 20px;
    font-weight: bold;
}

                        </style>
                    </head>
                    <body>
                        <h1>Form Preview</h1>
                        
                        ${header}
                        ${photos}
                        ${staticTopOneSection}
                        ${previewData}
                        ${Statictop2Section}
                    </body>
                </html>
            `);
            previewWindow.document.close();
        } else {
            //console.log("Validation failed");
        }
    }, [isNotMandatory, validate, servicesDataInfo, branchid, branchInfo, applicationId, formData, selectedStatuses, files]);

    const handleBlur = useCallback((e, label, inputColumn) => {
        const { value, name } = e.target;
        //console.log('--- Blur Event Triggered ---');
        //console.log('Input Value:', value);
        //console.log('Input Name:', name);
        //console.log('Label:', label);
        //console.log('Input Column:', inputColumn);

        // Only proceed if label is in the allowed list
        const normalize = (str) =>
            str.trim().replace(/:/g, '').toLowerCase();

        const allowedLabels = [
            "name of the applicant",
            "father name",
            "date of birth",
            "address"
        ];

        const normalizedLabel = normalize(label);

        if (!allowedLabels.includes(normalizedLabel)) {
            //console.log(`Label "${label}" is not in the allowed list. Skipping update.`);
            return;
        }

        const trimmedLabel = label
            .replace(/:/g, '')
            .replace(/\s+/g, '_')
            .toLowerCase();
        //console.log('Trimmed Label (Snake Case):', trimmedLabel);

        setServicesDataInfo((prev) => {
            const updatedServicesDataInfo = [...prev];
            //console.log('--- Current State (Before Update) ---');
            //console.log(updatedServicesDataInfo);

            updatedServicesDataInfo.forEach((item, index) => {
                //console.log(`Processing item at index ${index}:`, item);

                if (item.reportFormJson && item.reportFormJson.json) {
                    const formJson = JSON.parse(item.reportFormJson.json);

                    formJson.rows.forEach((row) => {
                        if (row.label.trim().toLowerCase() === label.trim().toLowerCase()) {
                            row.inputs.forEach((input, inputIndex) => {
                                if (inputIndex !== inputColumn) return;

                                const inputName = input.name;
                                if (item.annexureData && item.annexureData[inputName]) {
                                    const inputCurrentValue = item.annexureData[inputName];
                                    if (inputCurrentValue) return;
                                }

                                if (!item.annexureData) {
                                    item.annexureData = {};
                                }

                                updatedServicesDataInfo[index] = {
                                    ...updatedServicesDataInfo[index],
                                    annexureData: {
                                        ...updatedServicesDataInfo[index].annexureData,
                                        [inputName]: value || '',
                                    },
                                };

                                //console.log('Updated annexureData:', updatedServicesDataInfo[index].annexureData);
                            });
                        }
                    });
                } else {
                    //console.log('No valid reportFormJson found for this item.');
                }
            });

            //console.log('--- Updated State (After Update) ---');
            //console.log(updatedServicesDataInfo);

            return updatedServicesDataInfo;
        });
    }, []);



    //console.log('select-jkdgfhsdf', selectedCheckbox)
    const handleInputChange = useCallback((e, index) => {
        let { name, type, value, checked } = e.target;

        // Log the initial values of the inputs
        //console.log("Initial values: ", { name, type, value, checked });

        // Check if the name starts with "checkbox_"
        if (name.startsWith("checkbox_")) {
            value = checked;
            //console.log("Checkbox value updated: ", value);
        }

        // Update the selectedCheckbox array with the new value
        const updatedStatuses = [...selectedCheckbox];
        updatedStatuses[index] = value; // Use `value` instead of `e.target.value` directly, since `value` might be updated for checkboxes
        //console.log("Updated selectedCheckbox array: ", updatedStatuses);

        // Update the services data with the new value
        setServicesDataInfo((prev) => {
            const updatedServicesDataInfo = [...prev];

            updatedServicesDataInfo[index] = {
                ...updatedServicesDataInfo[index],
                annexureData: {
                    ...updatedServicesDataInfo[index].annexureData,
                    // Log before setting the updated values
                    [name]: type === "checkbox" ? checked : value || "",
                    [`${name}`]: type === "checkbox" ? checked : value || "", // Ensure checkbox is stored properly
                },
            };

            //console.log("Updated services data: ", updatedServicesDataInfo);

            return updatedServicesDataInfo;
        });

        // Log after the state update
        //console.log("State after update: ", selectedCheckbox);
    }, []);
    function changeLabel(label) {
        //console.log('genrateReportType',genrateReportType)

        if (genrateReportType !== 'VENDOR CONFIDENTIAL SCREENING REPORT') {
            return label;
        }

        const labelChangeAsPerVendorOrBGV = {
            "name of the applicant:": "Name of the Organization:",
            "date of birth:": "Date of Incorporation:",
            "applicant details": "ORGANISATION DETAILS"
        };

        if (label && typeof label === "string" && label.trim() !== "") {
            const lowerLabel = label.trim().toLowerCase();
            if (labelChangeAsPerVendorOrBGV.hasOwnProperty(lowerLabel)) {
                return labelChangeAsPerVendorOrBGV[lowerLabel];
            }
        }

        return label;
    }


    const renderInput = (index, dbTable, input, annexureImagesSplitArr, label, inputColumn) => {
        const isRequired = !isNotMandatory && (input.type === 'file' && annexureImagesSplitArr.length === 0 || (input.type === 'annexure' && annexureImagesSplitArr.length === 0));
        function convertLabelToSnakeCase(label) {
            return label
                .replace(/:/g, '')  // Remove colons
                .replace(/\s+/g, '_') // Replace spaces with underscores
                .toLowerCase(); // Convert to lowercase
        }

        const snakeCaseLabel = convertLabelToSnakeCase(label) + `_class` + inputColumn;



        let inputValue = '';

        const inputName = input.name.toLowerCase();
        if (
            servicesDataInfo[index]?.annexureData?.hasOwnProperty(input.name) &&
            servicesDataInfo[index].annexureData[input.name] !== ''
        ) {
            // User-entered value
            inputValue = servicesDataInfo[index].annexureData[input.name];
        } else if (
            inputName.includes('name_of_the_applicant') &&
            cmtData?.applicant_name
        ) {
            // Prefill with applicant_name
            inputValue = cmtData.applicant_name;

            // ✅ Prefill servicesDataInfo as well
            setServicesDataInfo((prev) => {
                const updated = [...prev];
                if (!updated[index]) updated[index] = { annexureData: {} };
                if (!updated[index].annexureData) updated[index].annexureData = {};
                updated[index].annexureData[input.name] = cmtData.applicant_name;
                return updated;
            });
        } else if (
            inputName.includes('date_of_birth') &&
            cmtData?.dob
        ) {
            // Prefill with date_of_birth
            inputValue = cmtData.dob;

            // ✅ Prefill servicesDataInfo as well
            setServicesDataInfo((prev) => {
                const updated = [...prev];
                if (!updated[index]) updated[index] = { annexureData: {} };
                if (!updated[index].annexureData) updated[index].annexureData = {};
                updated[index].annexureData[input.name] = cmtData.dob;
                return updated;
            });
        }
        const parseAndValidateDate = (value) => {
            if (!value) return null;
            const parsed = parse(value, "yyyy-MM-dd", new Date());
            return isNaN(parsed) ? null : parsed;
        };

        switch (input.type) {
            case "text":
            case "email":
            case "tel":
                return (
                    <input
                        type="text"
                        name={input.name}
                        value={inputValue}
                        className={`w-full p-2 border border-gray-300 ${snakeCaseLabel} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        onChange={(e) => handleInputChange(e, index, snakeCaseLabel)}
                        onBlur={(e) => handleBlur(e, label, inputColumn)}
                    />
                    // Date Of Exit:
                );
            case "datepicker": {
                const isDateOfExit = label === "Date Of Exit:";

                if (isDateOfExit) {
                    const CustomInput = forwardRef(({ value, onClick, onChange }, ref) => (
                        <input
                            type="text"
                            ref={ref}
                            value={value}
                            onClick={onClick} // opens calendar on click
                            onChange={(e) => {
                                handleInputChange(
                                    { target: { name: input.name, value: e.target.value, type: "text" } },
                                    index,
                                    snakeCaseLabel
                                );
                            }}
                            placeholder="Type text or pick a date"
                            className={`w-full p-2 border border-gray-300 ${snakeCaseLabel} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            onBlur={(e) => handleBlur(e, label, inputColumn)}
                        />
                    ));

                    return (
                        <DatePicker
                            selected={parseAndValidateDate(inputValue)}
                            onChange={(date) => {
                                const formatted = date ? format(date, "yyyy-MM-dd") : "";
                                handleInputChange(
                                    { target: { name: input.name, value: formatted, type: "date" } },
                                    index,
                                    snakeCaseLabel
                                );
                            }}
                            customInput={<CustomInput value={inputValue} />}
                            placeholderText="Type text or pick a date"
                            dateFormat="dd-MM-yyyy"
                            isClearable
                        />
                    );
                }

                // Normal datepickers (not "Date Of Exit")
                return (
                    <DatePicker
                        selected={parseAndValidateDate(inputValue)}
                        onChange={(date) => {
                            const formatted = date ? format(date, "yyyy-MM-dd") : "";
                            handleInputChange(
                                { target: { name: input.name, value: formatted, type: "date" } },
                                index,
                                snakeCaseLabel
                            );
                        }}
                        onChangeRaw={(e) => {
                            const rawValue = e.target.value;
                            handleInputChange(
                                { target: { name: input.name, value: rawValue, type: "text" } },
                                index,
                                snakeCaseLabel
                            );
                        }}
                        className="w-full p-2 border border-gray-300 uppercase rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        dateFormat="dd-MM-yyyy"
                        placeholderText="Select a date"
                    />
                );
            } case "dropdown":
                return (
                    <select
                        name={input.name}
                        value={inputValue}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => handleInputChange(e, index, snakeCaseLabel)}
                        onBlur={(e) => handleBlur(e, label, inputColumn)}
                    >
                        {input.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.showText}
                            </option>
                        ))}
                    </select>
                );
            case "file":
                let inputCheckboxValue = false;
                //console.log("Initial inputCheckboxValue:", inputCheckboxValue);

                if (servicesDataInfo[index]?.annexureData?.hasOwnProperty(`checkbox_${input.name}`)) {
                    let value = servicesDataInfo[index].annexureData[`checkbox_${input.name}`];
                    //console.log("Retrieved value:", value, "Type:", typeof value);

                    // Convert string/number values to boolean
                    if (value === true || value === "1" || value === 1) {
                        inputCheckboxValue = true; // "1" -> true (ON)
                        //console.log("Value is TRUE or '1' or 1, setting inputCheckboxValue to:", inputCheckboxValue);
                    } else {
                        inputCheckboxValue = false; // "0" -> false (OFF)
                        //console.log("Value is not '1' or 1, setting inputCheckboxValue to:", inputCheckboxValue);
                    }
                } else {
                    //console.log(`Property checkbox_${input.name} not found in annexureData`);
                }

                //console.log("Final inputCheckboxValue:", inputCheckboxValue);


                return (
                    <div className="flex flex-wrap items-center gap-4">
                        <input
                            type="file"
                            name={input.name}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            multiple={input.multiple}
                            accept="image/*"
                            required={isRequired}
                            onChange={(e) => handleFileChange(index, dbTable, input.name, e)}
                        />
                        <div className='flex items-center gap-2'>
                            <input
                                type="checkbox"
                                name={`checkbox_${input.name}`}
                                className="w-5 h-5"
                                onChange={(e) => handleInputChange(e, index, `checkbox_${snakeCaseLabel}`)}
                                checked={inputCheckboxValue}
                            />
                            <span className='font-bold'>Show In Full Page</span>
                        </div>


                        {annexureImagesSplitArr.length > 0 && (
                            <Swiper
                                onSwiper={setThumbsSwiper}
                                spaceBetween={10}
                                slidesPerView={4}
                                freeMode
                                watchSlidesProgress
                                modules={[Thumbs]}
                                className="thumbsSwiper"
                            >
                                {annexureImagesSplitArr.map((image, index) => (
                                    <SwiperSlide key={index}>
                                        <img
                                            src={`${image.trim()}`}
                                            alt={`Thumbnail ${index + 1}`}
                                            className="cursor-pointer"
                                            onClick={() => openModal(image)}
                                        />
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        )}
                    </div>
                );
            default:
                return (
                    <input
                        type="text"
                        name={input.name}
                        value={inputValue}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => handleInputChange(e, index, snakeCaseLabel)}
                        onBlur={(e) => handleBlur(e, label, inputColumn)}
                    />
                );
        }
    };




    const handleGoBack = () => {
        const searchParams = new URLSearchParams(window.location.search);

        const branchidFromUrl = searchParams.get('branchid');
        const clientIdFromUrl = searchParams.get('clientId');
        const by = searchParams.get('by');

        const branchId = branchidFromUrl || cmtData.branch_id;
        const customerId = clientIdFromUrl || cmtData.customer_id;

        if (by === 'valuepitch') {
            navigate(
                `/admin-valuepitch-checkin?clientId=${customerId}&branchId=${branchId}&BranchName=${encodeURIComponent(cmtData?.branch_name || 'TESTING ORG')}`
            );
        } else if (fromTat == 1) {
            navigate("/admin-tat-reminder");
        } else {
            navigate(`/admin-chekin?clientId=${customerId}&branchId=${branchId}`);
        }
    };

    const optionsData = [
        {
            label: "ADDRESS",
            options: [
                {
                    value: "applicant_declined_no_explanation",
                    text: "The applicant declined the address verification process and did not provide an explanation.",
                },
                { value: "untraceable_address", text: "The address provided was untraceable and could not be located despite visiting the candidate's specified location." },
                { value: "contact_not_responding", text: "Unable to complete the address verification as the candidate is not answering calls, the phone is switched off, incoming calls are barred, or the number is no longer in use. Kindly provide an alternate contact number to proceed." },
                { value: "mobile_number_switched_off", text: "The candidate's mobile number is switched off. Kindly provide an alternate contact number for address verification." },
                { value: "no_response_at_address", text: "Upon reaching the candidate's address, there was no response to the calls made. As a result, the verification check is being closed as 'Unable to Verify'." },
                { value: "address_verified_successfully", text: "Address verification has been successfully completed within the TAT." },
                { value: "candidate_shifted_new_address", text: "The candidate has shifted to a new address. Kindly provide the updated address to re-initiate the verification process." },
                { value: "candidate_declined_address_verification", text: "The candidate has declined the offer and has expressed no interest in completing the address verification process." },
                { value: "candidate_left_job_not_interested", text: "The candidate has left the job and is not interested in utilizing the verification services." },
                { value: "address_verified_within_tat", text: "The address verification has been successfully completed within the turnaround time (TAT)." },
                { value: "digital_address_verification_pending", text: "The digital address verification link has been sent to the candidate and is pending completion from their side." },
                { value: "unable_to_verify_location", text: "We do not serve the candidate's location, making the verification unfeasible. Kindly confirm if you'd like to proceed with the DAV (Digital Address Verification) instead." },
                { value: "candidate_denied_verification", text: "The candidate has denied the verification." },
            ],
        },
        {
            label: "EDUCATION",
            options: [
                { value: "incomplete_documents", text: "The submitted documents are incomplete for verification. Please provide the Convocation Certificate along with all semester mark sheets." },
                { value: "university_not_recognized", text: "The 12th Standard - University/Board is not recognized as genuine, making the verification process Not doable." },
                { value: "uncut_documents_rejected", text: "The documents received for the 12th Standard are unclear or uncut copies, leading to rejection by the university/board. Kindly provide clear copies of the documents to proceed." },
                { value: "board_not_recognized", text: "The 10th Standard - The state or central board is not recognized as genuine, making the verification process Not doable." },
                { value: "uncut_documents_10th_rejected", text: "The documents received for the 10th Standard are unclear or uncut copies, leading to rejection by the university/board. Kindly provide clear copies of the documents to proceed." },
                { value: "unclear_diploma_documents", text: "The diploma documents received are unclear. Kindly provide clear or uncut copies to proceed." },
                { value: "unclear_graduation_documents", text: "The graduation documents received are unclear or uncut copies, resulting in rejection by the university. Kindly provide clear copies of the documents to proceed." },
                { value: "unclear_post_graduation_documents", text: "The post-graduation documents received are unclear or uncut copies, leading to rejection by the university. Kindly provide clear copies of the documents to proceed." },
                { value: "unrecognized_graduation_university", text: "Graduation - The university is not recognized, suspected to be non-genuine, or not approved by UGC, making the verification process Not doable." },
                { value: "delay_in_education_insufficiency", text: "There is a delay in addressing the educational insufficiency by the client." },
                { value: "unavailable_spoc_at_university", text: "The concerned SPOC was unavailable at the university for verifying the education check, causing a delay in the process." },
                { value: "unclear_documents_rejected", text: "The documents shared via email/folder are unclear and have been rejected by the university/school. Kindly provide clear copies of the same to proceed with the verification." },
                { value: "delay_in_ex_employment_insufficiency", text: "There is a delay in addressing the ex-employment insufficiency by the client." }
            ],
        },
        {
            label: "EMPLOYMENT",
            options: [
                { value: "employer_not_responding", text: "Ex-Employment: The employer is responding to calls but has not been replying to emails." },
                { value: "candidate_absconded_employer_denied", text: "The candidate has absconded, and the employer has refused to provide verification." },
                { value: "no_official_email_for_verification", text: "According to the employer, they do not have an official email ID for verification and can only provide a verbal confirmation or respond via a Gmail ID, if necessary." },
                { value: "centralized_verification_no_calls", text: "Latest Employment-1: The verification process is centralized, with no option for calls, despite multiple reminders. There is no commitment to a specific turnaround time (TAT)." },
                { value: "centralized_ex_employment_no_calls", text: "Ex-Employment-2: The verification process is centralized, with no option for calls, despite multiple reminders. There is no commitment to a specific turnaround time (TAT)." },
                { value: "centralized_previous_employment_no_calls", text: "Previous Employment-3: The verification process is centralized, with no option for calls, despite multiple reminders. There is no commitment to a specific turnaround time (TAT)." },
                { value: "centralized_previous_employment_no_calls_4", text: "Previous Employment-4: The verification process is centralized, with no option for calls, despite multiple reminders. There is no commitment to a specific turnaround time (TAT)." },
                { value: "centralized_previous_employment_no_calls_5", text: "Previous Employment-5: The verification process is centralized, with no option for calls, despite multiple reminders. There is no commitment to a specific turnaround time (TAT)." },
                { value: "spoc_unavailable_due_to_leave", text: "The concerned SPOC is unavailable due to personal leave and has requested additional time to respond to the email." },
                { value: "exit_formalities_not_completed", text: "Latest Employment-1: The candidate has not completed the exit formalities, and as a result, the employer has denied the verification." },
                { value: "ex_employment_pending_verification", text: "Ex-Employment-2: The candidate has not completed the exit formalities, leading the employer to deny the verification." },
                { value: "previous_employment_pending_verification", text: "Previous Employment-3: The candidate has not completed the exit formalities, resulting in the employer denying the verification." },
                { value: "previous_employment_pending_verification_4", text: "Previous Employment-4: The candidate has not completed the exit formalities, resulting in the employer denying the verification." },
                { value: "previous_employment_pending_verification_5", text: "Previous Employment-5: The candidate has not completed the exit formalities, resulting in the employer denying the verification." },
                { value: "active_employee_verification_pending", text: "Active Employment: The candidate is still an active employee in the organization. The employer has requested that the verification be initiated once the candidate has been relieved." },
                { value: "verification_complete_ex_employment_pending", text: "All verification services have been completed, and only the Ex-Employment verification is pending. Kindly advise on the next steps for closure." },
                { value: "employer_not_responding_email", text: "The ex-employer is not responding to the emails. Kindly confirm if we should proceed with UAN (Universal Account Number) as an alternate option to close the employment verification." },
                { value: "employer_not_responding_auditing", text: "After multiple attempts, the employer has not responded. Therefore, the verification is being closed as it cannot be verified due to auditing reasons." },
                { value: "ex_employer_details_not_found", text: "The ex-employer details could not be found. Kindly provide the correct point of contact details to proceed with the employment check." },
                { value: "ex_employer_no_longer_exists", text: "The ex-employer no longer exists and has been closed (shut down)." },
                { value: "uan_required_for_verification", text: "The UAN number is mandatory for the verification process. Kindly provide the UAN number to proceed with the verification." },
                { value: "spoc_not_responding_employer_denied", text: "The concerned HR/Manager/team have not responded to the ex-employment verification despite multiple attempts through emails and calls. They are also avoiding the calls." },
                { value: "ex_employment_site_visit", text: "The ex-employment verification has been initiated for a physical site visit." },
                { value: "digital_ex_employment_pending", text: "The digital ex-employment verification has been initiated and is currently pending completion from the candidate." },
                { value: "ex_employment_negative_remarks", text: "The ex-employment remarks are negative. Kindly advise on how to proceed further." }
            ]
        }
        ,
        {
            label: "GLOBAL WORLD CHECK",
            options: [
                { value: "provide_candidate_details", text: "Kindly provide the following complete details of the candidate for the global database: Name of the Candidate, Father Name, DOB, Marital Status, Gender & Full Address." },
            ],
        },
        {
            label: "DRUG TEST",
            options: [
                { value: "drug_test_initiated_kit_in_transit", text: "The drug test has been initiated, and the kit is currently in transit. The delay was due to the unavailability of the courier service." },
                { value: "candidate_not_available_for_drug_test", text: "The candidate was not available at the address to complete the drug test." },
                { value: "candidate_not_cooperating_drug_test", text: "The candidate is not cooperating with the drug test, and it remains pending." }
            ],
        },
        {
            label: "PROFESSIONAL REFERENCE",
            options: [
                { value: "professional_reference_denied", text: "Professional Reference: The concerned person has denied the verification." },
                { value: "incorrect_contact_details", text: "Professional Reference: The contact details provided are incorrect. Kindly provide an alternate point of contact number." }
            ],
        },
        {
            label: "COURT VERIFICATION",
            options: [
                {
                    value: "provide_details_for_court_verification",
                    text: "To proceed with the court verification, we require the complete details of the candidate, including their full name, father's name, date of birth (DOB), marital status, gender, and complete address (including state and pincode). Kindly share these requested details to initiate the verification process."
                }
            ],
        },
        {
            label: "POLICE VERIFICATION",
            options: [
                {
                    value: "provide_details_for_police_verification",
                    text: "To proceed with the police verification, we require the complete details of the candidate, including their full name, father's name, date of birth (DOB), marital status, gender, and full address (including state and pincode). Kindly share these requested details to initiate the verification process."
                }
            ],
        },
        {
            label: "CIBIL VERIFICATION",
            options: [
                {
                    value: "cibil_verification",
                    text: "For the CIBIL verification, we require the complete details of the candidate, including their full name, father's name, date of birth (DOB), full address (including state and pincode). Kindly share these requested details to proceed with the verification."
                }
            ],
        },
        {
            label: "PAN CARD",
            options: [
                {
                    value: "pan_card",
                    text: "The PAN number is mandatory for the Form 26 AS verification. Kindly provide the PAN number to proceed with the verification."
                }
            ],
        },
        {
            label: "BANK STATEMENT VERIFICATION",
            options: [
                {
                    value: "missing_bank_statement",
                    text: "Kindly provide the bank statement for the verification process."
                }
            ],
        },
        {
            label: "NATIONAL IDENTITY CHECK",
            options: [
                {
                    value: "missing_identity_document",
                    text: "Kindly provide one of the following documents for the national identity check: Aadhaar, PAN card, Passport, Driving License (DL), or Voter ID."
                }
            ],
        }
        ,
        {
            label: "OTHER REMARKS",
            options: [
                {
                    value: "insufficiency_not_cleared_by_hr",
                    text: "Insufficiency was not cleared by the HR Team within the TAT, so closing the check with unable to verify."
                },
                {
                    value: "nil",
                    text: "NIL"
                },
                {
                    value: "manual_update_required",
                    text: "Other - Give option to enter manually to update post fill the new comment which is not added in the following list of remarks."
                },
                {
                    value: "not_applicable",
                    text: "Not Applicable"
                },
                {
                    value: "candidate_unaware_of_bgv_process",
                    text: "The candidate is unaware of the background verification process and will follow up after consulting with the HR team."
                },
                {
                    value: "bgv_form_not_submitted",
                    text: "The online background verification (BGV) form was shared with the candidate but has not yet been filled out and submitted by them."
                },
                {
                    value: "client_requested_to_hold_verification",
                    text: "Client requested to hold the verification."
                },
                {
                    value: "interim_report_shared_tat_exceeded",
                    text: "An interim report was shared as the TAT was exceeded, and the insufficiency was not resolved."
                },
                {
                    value: "interim_report_shared_final_report_pending",
                    text: "Interim report shared and yet to share the Final report."
                },
                {
                    value: "verification_completed_final_report_pending",
                    text: "Verification has been completed, and the final report is yet to be generated."
                },
                {
                    value: "unable_to_verify_due_to_insufficiency",
                    text: "The insufficiency was not resolved by the HR team within the TAT, so the check is being closed as 'unable to verify'."
                },
                {
                    value: "closure_advice_pending_from_hr",
                    text: "Closure advice was pending from the HR team; hence, the case is being closed with a valid reason as per the adjudication matrix."
                },
                {
                    value: "closure_advice_pending_from_hr_team",
                    text: "Closure Advice is pending from HR Team."
                },
                {
                    value: "pricing_approval_pending",
                    text: "Pricing Approval is pending."
                },
                {
                    value: "pricing_approval_for_abroad_employment",
                    text: "Pricing approval for abroad employment, amounting to $25, is pending."
                },
                {
                    value: "abroad_services_not_doable",
                    text: "Abroad Services are not doable."
                },
                {
                    value: "server_issues_generating_final_report",
                    text: "Facing the server issues to generate the Final report."
                },
                {
                    value: "abroad_services_tat_30_business_days",
                    text: "Abroad Services TAT will be 30 Business Days."
                },
                {
                    value: "documents_do_not_align_with_email_or_excel",
                    text: "The received documents do not align with the details provided in the email, Excel file, or Bulk folder."
                },
                {
                    value: "candidate_cv_and_documents_required",
                    text: "Please provide the candidate's CV along with all supporting documents, such as educational qualifications, experience certificates, and any other relevant documents, for CV validation and gap verification."
                }
            ],
        },



    ];
    const handleMultiSelectChange = (field, values) => {
        setFormData((prev) => ({
            ...prev,
            updated_json: {
                ...prev.updated_json,
                insuffDetails: {
                    ...prev.updated_json.insuffDetails,
                    [field]: values,
                },
            },
        }));
    };
    console.log("servicesDataInfo:", servicesDataInfo);
    const isValuePitch = (sd) => {
        console.log("isValuePitch:", sd);
        return sd.service_type?.toLowerCase().split(",").map(t => t.trim()).includes("valuepitch");
    };
    const isAlreadySubmitted = (sd) =>
        isValuePitch(sd) && sd.screeningstar_response?.statusCode === 200 && sd.verifyId;
    const reportColorClass = (status) => {
        // Check if any color name is in the status
        for (let color of colorNames) {
            if (status.toLowerCase().includes(color)) {
                return color;  // Return the found color name
            }
        }
        return status;  // Return the original status if no color name is found
    };
    const isReportReady = (sd) => sd.valuePitchReport?.statusCode === 201;

    const addresses = [
        {
            address: [
                // Permanent
                formData.updated_json?.permanent_address?.permanent_address,
                formData.updated_json?.permanent_address?.permanent_address_landmark,
                formData.updated_json?.permanent_address?.permanent_address_state,
                formData.updated_json?.permanent_address?.permanent_address_pin_code,

                // Current
                formData.updated_json?.address?.address,
                formData.updated_json?.address?.address_landmark,
                formData.updated_json?.address?.address_state,
            ]
                .filter((val) => val && val.toString().trim() !== "")
                .join(" "),

            periodOfStay: [
                formData.updated_json?.permanent_address?.permanent_sender_name,
                formData.updated_json?.permanent_address?.permanent_receiver_name,
            ]
                .filter((val) => val && val.toString().trim() !== "")
                .join(" - "),
        },
    ];
    const handleValuePitchSubmit = useCallback(async (serviceData, dbTable) => {
        const adminData = JSON.parse(localStorage.getItem("admin"));
        const token = localStorage.getItem("_token");
        setValuePitchSubmitLoading(dbTable);
        const subJson = {};
        const formJson = JSON.parse(serviceData.reportFormJson.json);
        formJson.rows.forEach(row => {
            row.inputs.forEach(input => {
                if (input.type !== "file") {
                    subJson[input.name] = serviceData.annexureData?.[input.name] || "";
                }
            });
        });

        const raw = JSON.stringify({
            admin_id: adminData?.id,
            _token: token,
            branch_id: branchid,
            customer_id: branchInfo.customer_id,
            application_id: applicationId,
            service_id: serviceData.service_id,
            db_table: dbTable,
            // ✅ annexure me sirf ye hi rahe
            annexure: {
                [dbTable]: subJson,
            },
            // ✅ ye sab ab bahar
            name_of_applicant: formData.client_applicant_name,
            father_name: formData.updated_json?.father_name,
            dob: formData.updated_json?.dob,
            applicantId: applicationRefID,
            addresses: addresses,
        });

        const res = await fetch(`https://api.screeningstar.co.in/client-master-tracker/submit-valuepitch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: raw,
        });
        const result = await res.json();

        if (result.token) localStorage.setItem("_token", result.token);
        Swal.fire(result.status ? "Success!" : "Error", result.message, result.status ? "success" : "error");
        await fetchApplicationData();

        await fetchAdminList();
        setValuePitchSubmitLoading(null);
    }, [branchid, branchInfo, applicationId]);










    useEffect(() => {
        if (tableScrollRef.current) {
            setScrollWidth(tableScrollRef.current.scrollWidth + "px");
        }
    }, [servicesDataInfo, loading]);

    return (
        <div className="bg-[#c1dff2] border border-black">
            <h2 className="text-2xl font-bold py-3 text-left text-[#4d606b] px-3 border">GENERATE REPORT</h2>
            <div className='bg-white p-4 w-full border-t border-black mx-auto'>
                <div
                    onClick={handleGoBack}
                    className="flex items-center w-36 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                >
                    <FaChevronLeft className="text-xl text-white" />
                    <span className="font-semibold text-lg">Go Back</span>
                </div>
                <div className=" md:p-12 p-0 my-2 ">

                    {loading ? (
                        <>
                            <div className="flex w-full justify-center items-center h-20">
                                <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                            </div>
                            <div className="flex justify-center items-center h-20">
                                {submitLoading ? <p className="text-lg font-semibold text-[#2c81ba]">Please wait while report is getting generated</p> : null}
                            </div>
                        </>
                    ) : (
                        <form className="space-y-4" autoComplete="off" onSubmit={handleSubmit}>

                            <div>
                                <label htmlFor="apid" className="block text-gray-700">Reference ID</label>
                                <input
                                    type="text"
                                    name="application_id"
                                    id="apidoo"
                                    value={applicationRefID}
                                    readOnly
                                    className="w-full p-3 mb-4 border border-gray-300 rounded-md"
                                />
                                <input type="hidden" name="apid" id="apid" value={referenceId} />
                            </div>
                            <div className=" form start space-y-4 md:py-[30px]  bg-white rounded-md" id="client-spoc">
                                <div>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        <div className="mb-4">
                                            <label htmlFor="month_year">Month - Year<span className="text-red-500 text-xl" >*</span></label>
                                            <input
                                                type="month"
                                                name="updated_json.month_year"
                                                id="month_year"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.month_year || ''}
                                                onChange={handleChange}
                                            />


                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="initiation_date">Initiation Date</label>
                                            <DatePicker
                                                id="initiation_date"
                                                selected={parseDate(formData.updated_json.initiation_date)}
                                                onChange={(date) => {
                                                    const formattedDate = date ? format(date, "yyyy-MM-dd") : ""; // ✅ prevents crash
                                                    handleChange({
                                                        target: {
                                                            name: "updated_json.initiation_date",
                                                            value: formattedDate,
                                                            type: "date"
                                                        }
                                                    });
                                                }}

                                                dateFormat="dd-MM-yyyy"
                                                className="w-full border p-2 outline-none uppercase rounded-md mt-2"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-3">
                                        <div className="mb-4">
                                            <label htmlFor="organization_name">Name of the Client Organization</label>
                                            <input
                                                type="text"
                                                name="client_organization_name"
                                                id="organization_name"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.client_organization_name}
                                                // disabled={formData.client_organization_name}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="verification_purpose">Verification Purpose<span className="text-red-500 text-xl" >*</span></label>
                                            <select
                                                name="updated_json.verification_purpose"
                                                id="verification_purpose"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.verification_purpose}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select Verification Purpose</option>
                                                <option value="Employment">Employment</option>
                                                <option value="Discreet">Discreet</option>
                                                <option value="Vendor/Company Screening">Vendor/Company Screening</option>
                                                <option value="Personal">Personal</option>
                                                <option value="Official">Official</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-3">
                                        <div className="mb-4">
                                            <label htmlFor="employee_id">Applicant Employee ID</label>
                                            <input
                                                type="text"
                                                name="updated_json.employee_id"
                                                id="employee_id"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.employee_id}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="client_code">Client Code</label>
                                            <input
                                                type="text"
                                                name="client_organization_code"
                                                id="client_code"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.client_organization_code}
                                                // disabled={formData.client_organization_code}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-3">
                                        <div className="mb-4">
                                            <label htmlFor="applicant_name">Name of the Applicant<span className="text-red-500 text-xl" >*</span></label>
                                            <input
                                                // ref={(el) => (inputRefs.current['applicant_name'] = el)} // Add ref
                                                type="text"
                                                name="client_applicant_name"
                                                id="applicant_name"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.client_applicant_name}
                                                // disabled={formData.client_applicant_name}
                                                onChange={handleChange}
                                            />
                                            {errors.applicant_name && (
                                                <p className="text-red-500 text-sm">{errors.applicant_name}</p>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="contact_number">Contact Number</label>
                                            <input
                                                type="tel"
                                                name="updated_json.contact_number"
                                                id="contact_number"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.contact_number}

                                                onChange={handleChange}
                                            />
                                            {errors.contact_number && (
                                                <p className="text-red-500 text-sm">{errors.contact_number}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-3">
                                        <div className="mb-4">
                                            <label htmlFor="contact_number2">Contact Number 2:</label>
                                            <input
                                                type="tel"
                                                name="updated_json.contact_number2"
                                                id="contact_number2"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.contact_number2}

                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="father_name">Father's Name:</label>
                                            <input
                                                type="text"
                                                name="updated_json.father_name"
                                                id="father_name"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.father_name}

                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="contact_number2">Spouse Name</label>
                                            <input
                                                type="test"
                                                name="updated_json.spouse_name"
                                                id="spouse_name"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.spouse_name}

                                                onChange={handleChange}
                                            />
                                            {errors.spouse_name && (
                                                <p className="text-red-500 text-sm">{errors.spouse_name}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className={`grid md:grid-cols-3 gap-3`}>
                                        <div className="mb-4">
                                            <label htmlFor="gender">Gender</label>
                                            <select
                                                name="client_applicant_gender"
                                                id="gender"
                                                className="border w-full rounded-md p-2 mt-2"
                                                value={formData.client_applicant_gender}

                                                onChange={handleChange}
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Transgender">Transgender</option>

                                            </select>
                                            {errors.gender && (
                                                <p className="text-red-500 text-sm">{errors.gender}</p>
                                            )}
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="dob">{genrateReportType.toLowerCase() == "vendor confidential screening report" ? "Date of Incorporation" : "Date Of Birth"}</label>
                                            <DatePicker
                                                id="dob"
                                                selected={parseDate(formData.updated_json.dob)}
                                                onChange={(date) => {
                                                    const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
                                                    handleChange({
                                                        target: {
                                                            name: "updated_json.dob",
                                                            value: formattedDate,
                                                            type: "date"
                                                        }
                                                    });
                                                }}
                                                dateFormat="dd-MM-yyyy"
                                                className="w-full border uppercase p-2 outline-none rounded-md mt-2"
                                            />
                                            {errors.dob && (
                                                <p className="text-red-500 text-sm">{errors.dob}</p>
                                            )}
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="marital_status">Marital Status</label>
                                            <select
                                                name="updated_json.marital_status"
                                                id="marital_status"
                                                className="border w-full rounded-md p-2 mt-2"
                                                value={formData.updated_json.marital_status}

                                                onChange={handleChange}
                                            >
                                                <option value="">Select Marital Status</option>
                                                <option value="Single">Single</option>
                                                <option value="Married">Married</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-3 gap-3">
                                        <div className="mb-4">
                                            <label htmlFor="nationality">Nationality</label>
                                            <input
                                                type="text"
                                                name="updated_json.nationality"
                                                id="nationality"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.nationality}

                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="date_of_data ">Date of Data Entry </label>
                                            <DatePicker
                                                id="date_of_data"
                                                selected={parseDate(formData.updated_json.date_of_data)}
                                                onChange={(date) => {
                                                    const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
                                                    handleChange({
                                                        target: {
                                                            name: "updated_json.date_of_data",
                                                            value: formattedDate,
                                                            type: "date"
                                                        }
                                                    });
                                                }}
                                                dateFormat="dd-MM-yyyy"
                                                className="border w-full rounded-md p-2 mt-2 uppercase"
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="data_entry_analyst_name">Data Entry Analyst Name</label>

                                            <select name="updated_json.data_entry_analyst_name"
                                                value={formData.updated_json.data_entry_analyst_name}
                                                onChange={handleChange}
                                                id="" className="border w-full rounded-md p-2 mt-2 uppercase">
                                                <option value="">Select NAME </option>
                                                {adminNamesNew.map((spoc) => (
                                                    <option value={spoc}>{spoc}</option>
                                                ))}

                                            </select>
                                        </div>
                                    </div>

                                </div>

                                <div className='permanentaddress '>
                                    <div className='my-4 font-semibold text-xl '>Permanent Address</div>
                                    <div className="form-group border border-black p-3 rounded-md">
                                        <div className="mb-4">
                                            <label htmlFor="permanent_address">Full Address:</label>
                                            <input
                                                type="text"
                                                name="updated_json.permanent_address.permanent_address"
                                                id="permanent_address"
                                                className="border w-full rounded-md p-2 mt-2 capitalize overflow-x-auto whitespace-nowrap"
                                                value={formData.updated_json.permanent_address.permanent_address || ''}
                                                onChange={handleChange}
                                            />


                                        </div>

                                        <div className="form-group">
                                            <h3 className="font-medium text-lg mb-3">Period of Stay</h3>
                                            <div className="grid md:grid-cols-2 gap-3">
                                                <div className="mb-4">
                                                    <label htmlFor="permanent_sender_name">From:</label>
                                                    <input
                                                        type="text"
                                                        name="updated_json.permanent_address.permanent_sender_name"
                                                        id="permanent_sender_name"
                                                        className="border w-full rounded-md p-2 mt-2 capitalize"
                                                        value={formData.updated_json.permanent_address.permanent_sender_name}
                                                        onChange={handleChange}
                                                    />
                                                </div>

                                                <div className="mb-4">
                                                    <label htmlFor="permanent_receiver_name">To:</label>
                                                    <input
                                                        type="text"
                                                        name="updated_json.permanent_address.permanent_receiver_name"
                                                        id="permanent_receiver_name"
                                                        className="w-full border p-2 outline-none rounded-md mt-2 capitalize"
                                                        value={formData.updated_json.permanent_address.permanent_receiver_name}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-3">
                                                <div className="mb-4">
                                                    <label htmlFor="permanent_address_landmark">Landmark:</label>
                                                    <input
                                                        type="text"
                                                        name="updated_json.permanent_address.permanent_address_landmark"
                                                        id="permanent_address_landmark"
                                                        className="border w-full rounded-md p-2 mt-2 capitalize"
                                                        value={formData.updated_json.permanent_address.permanent_address_landmark}
                                                        onChange={handleChange}
                                                    />
                                                </div>

                                                <div className="mb-4">
                                                    <label htmlFor="permanent_address_pin_code">Pin Code:</label>
                                                    <input
                                                        type="text" // Keep as text to handle leading zeros
                                                        name="updated_json.permanent_address.permanent_address_pin_code"
                                                        id="permanent_address_pin_code"
                                                        className="w-full border p-2 outline-none rounded-md mt-2 capitalize"
                                                        value={formData.updated_json.permanent_address.permanent_address_pin_code}
                                                        onChange={handleChange}

                                                    />
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <label htmlFor="permanent_address_state">State:</label>
                                                <input
                                                    type="text"
                                                    name="updated_json.permanent_address.permanent_address_state"
                                                    id="permanent_address_state"
                                                    className="w-full border p-2 outline-none rounded-md mt-2 capitalize"
                                                    value={formData.updated_json.permanent_address.permanent_address_state}
                                                    onChange={handleChange}

                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='currentaddress '>
                                    <div className='my-4 font-semibold text-xl'>Current Address </div>
                                    <div className="form-group border border-black rounded-md p-3">
                                        <div className="mb-4">
                                            <label htmlFor="address">Full Address:</label>
                                            <input
                                                type="text"
                                                name="updated_json.address.address"
                                                id="address"
                                                className="border w-full rounded-md p-2 mt-2 capitalize overflow-x-auto whitespace-nowrap"
                                                value={formData.updated_json.address.address || ''}
                                                onChange={handleChange}
                                            />

                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="address_landmark">Landmark:</label>
                                            <input
                                                type="text"
                                                name="updated_json.address.address_landmark"
                                                id="address_landmark"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.address.address_landmark}
                                                onChange={handleChange}

                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="residence_mobile_number">Residence Mobile No:</label>
                                            <input
                                                type="text"
                                                name="updated_json.address.residence_mobile_number"
                                                id="residence_mobile_number"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.address.residence_mobile_number}
                                                onChange={handleChange}

                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="address_state">State</label>
                                            <input
                                                type="text"
                                                name="updated_json.address.address_state"
                                                id="address_state"
                                                className="w-full border p-2 outline-none rounded-md mt-2 capitalize"
                                                value={formData.updated_json.address.address_state}
                                                onChange={handleChange}

                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="SelectedServices  border border-black rounded-md ">
                                    <div className='bg-[#c1dff2] border-b border-black  rounded-t-md p-4'>
                                        <h1 className="text-center text-2xl">SELECTED SERVICES<span className="text-red-500 text-xl" >*</span></h1>
                                    </div>
                                    <div className='p-5 border '>
                                        {servicesDataInfo && servicesDataInfo.map((serviceData, index) => {
                                            if (serviceData.serviceStatus) {
                                                // Check if reportFormJson and its json exist before attempting to parse
                                                if (!serviceData?.serviceStatus || !serviceData?.reportFormJson || !serviceData?.reportFormJson?.json) {
                                                    return null; // Skip this entry
                                                }

                                                let formJson;
                                                try {
                                                    formJson = JSON.parse(serviceData.reportFormJson.json);
                                                } catch (e) {
                                                    console.error(`Error parsing reportFormJson.json for service ID ${serviceData?.service_id}:`, e);
                                                    return null; // Skip this entry if JSON is invalid
                                                }

                                                const dbTableHeading = formJson?.heading || '';
                                                const dbTable = formJson?.db_table || '';
                                                let status = serviceData?.annexureData?.status || '';
                                                let preselectedStatus = selectedStatuses[index] || status;

                                                return (
                                                    <div key={index} className="mb-6 md:flex justify-between mt-5">
                                                        {formJson.heading && (
                                                            <>
                                                                <span>{formJson.heading}</span>
                                                                <select
                                                                    className="border border-black p-2 md:w-7/12 w-full rounded-md"
                                                                    value={preselectedStatus}
                                                                    onChange={(e) => handleStatusChange(e, index)}
                                                                >
                                                                    <option value="">--Select status--</option>
                                                                    <option value="nil">NIL</option>
                                                                    <option value="initiated">INITIATED</option>
                                                                    <option value="hold">HOLD</option>
                                                                    <option value="closure_advice">CLOSURE ADVICE</option>
                                                                    <option value="wip">WIP</option>
                                                                    <option value="insuff">INSUFF</option>
                                                                    <option value="completed">COMPLETED</option>
                                                                    <option value="completed_green">COMPLETED GREEN</option>
                                                                    <option value="completed_orange">COMPLETED ORANGE</option>
                                                                    <option value="completed_red">COMPLETED RED</option>
                                                                    <option value="completed_yellow">COMPLETED YELLOW</option>
                                                                    <option value="stopcheck">STOPCHECK</option>
                                                                    <option value="active_employment">ACTIVE EMPLOYMENT</option>
                                                                    <option value="not_doable">NOT DOABLE</option>
                                                                    <option value="candidate_denied">CANDIDATE DENIED</option>
                                                                </select>
                                                                {errors[`serviceStatus_${index}`] && (
                                                                    <span className="text-red-500 text-sm">{errors[`serviceStatus_${index}`]}</span>
                                                                )}
                                                            </>

                                                        )}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>

                                <div className="container mx-auto mt-5 py-2">
                                    {servicesDataInfo &&
                                        servicesDataInfo.map((serviceData, index) => {
                                            if (serviceData.serviceStatus) {
                                                // Check if reportFormJson and its json exist before attempting to parse
                                                if (!serviceData?.reportFormJson || !serviceData?.reportFormJson?.json) {
                                                    return null; // Skip this entry
                                                }

                                                let formJson;
                                                try {
                                                    formJson = JSON.parse(serviceData.reportFormJson.json);
                                                } catch (e) {
                                                    console.error(`Error parsing reportFormJson.json for service ID ${serviceData?.service_id}:`, e);
                                                    return null; // Skip this entry if JSON is invalid
                                                }
                                                const isScreeningStarLocked =
                                                    serviceData?.service_type === "valuepitch" &&
                                                    serviceData?.screeningstar_response?.status === true;

                                                const statusMsg =
                                                    serviceData?.screeningstar_response?.data?.statusMsg || "";
                                                const dbTableHeading = formJson?.heading || '';
                                                const dbTable = formJson?.db_table || '';
                                                let annexureData = serviceData?.annexureData || {};
                                                let annexureImagesSplitArr = [];

                                                if (annexureData) {
                                                    const annexureImagesKey = Object.keys(annexureData).find(
                                                        (key) =>
                                                            key.toLowerCase().startsWith("annexure") &&
                                                            !key.includes("[") &&
                                                            !key.includes("]")
                                                    );
                                                    if (annexureImagesKey) {
                                                        const annexureImagesStr = annexureData[annexureImagesKey];
                                                        annexureImagesSplitArr = annexureImagesStr ? annexureImagesStr.split(",") : [];
                                                    }
                                                }

                                                return (
                                                    <div key={index} className="mb-6">
                                                        {selectedStatuses[index] !== "nil" && (
                                                            <>
                                                                <div className="border mt-12 rounded-t-md">

                                                                    {/* Heading */}
                                                                    {dbTableHeading && (
                                                                        <div className="bg-[#c1dff2] border border-black rounded-t-md p-4">
                                                                            <h3 className="text-center text-2xl font-semibold">
                                                                                {dbTableHeading}
                                                                            </h3>
                                                                        </div>
                                                                    )}

                                                                    {/* 🔥 CONDITION */}
                                                                    {isScreeningStarLocked ? (
                                                                        // ✅ BIG MESSAGE INSTEAD OF TABLE
                                                                        <div className="p-10 text-center border border-t-0">
                                                                            <p className="text-2xl font-bold text-green-700">
                                                                                {statusMsg || "Case Submitted Successfully"}
                                                                            </p>
                                                                        </div>
                                                                    ) : (
                                                                        // ✅ NORMAL TABLE
                                                                        <div className="border-[#c1dff2] border overflow-scroll border-t-0 rounded-md">
                                                                            <div className="table-container rounded-lg">

                                                                                <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
                                                                                    <div className="top-scroll-inner" style={{ width: scrollWidth }} />
                                                                                </div>

                                                                                <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>
                                                                                    <table className="w-full table-auto">
                                                                                        <thead>
                                                                                            <tr className="bg-gray-100 whitespace-nowrap">
                                                                                                {formJson.headers.map((header, idx) => (
                                                                                                    <th key={idx} className="py-2 px-4 border border-gray-300 text-left">
                                                                                                        {header}
                                                                                                    </th>
                                                                                                ))}
                                                                                            </tr>
                                                                                        </thead>

                                                                                        <tbody>
                                                                                            {formJson.rows.map((row, idx) => {
                                                                                                // ✅ Filter inputs based on valuepitch
                                                                                              const filteredInputs = row.inputs;

                                                                                                // ✅ Hide row if no inputs left (for valuepitch)
                                                                                                if (filteredInputs.length === 0) return null;

                                                                                                return (
                                                                                                    <tr key={idx} className="odd:bg-gray-50 w-full">
                                                                                                        <td className="py-2 px-4 border md:w-1/3 whitespace-nowrap border-gray-300">
                                                                                                            {changeLabel(row.label)}
                                                                                                        </td>

                                                                                                        {filteredInputs.length === 1 ? (
                                                                                                            <td colSpan={formJson.headers.length - 1} className="py-2 px-4 border">
                                                                                                                {renderInput(
                                                                                                                    index,
                                                                                                                    dbTable,
                                                                                                                    filteredInputs[0],
                                                                                                                    annexureImagesSplitArr,
                                                                                                                    row.label,
                                                                                                                    0
                                                                                                                )}
                                                                                                            </td>
                                                                                                        ) : (
                                                                                                            filteredInputs.map((input, i) => (
                                                                                                                <td key={i} className="py-2 px-4 border">
                                                                                                                    {renderInput(
                                                                                                                        index,
                                                                                                                        dbTable,
                                                                                                                        input,
                                                                                                                        annexureImagesSplitArr,
                                                                                                                        row.label,
                                                                                                                        i
                                                                                                                    )}
                                                                                                                </td>
                                                                                                            ))
                                                                                                        )}
                                                                                                    </tr>
                                                                                                );
                                                                                            })}
                                                                                        </tbody>
                                                                                    </table>
                                                                                </div>
                                                                            </div>
                                                                            {isReportReady(serviceData) && (
                                                                                <div className="mt-5 border-2 border-gray-200 rounded-2xl bg-white shadow-md overflow-hidden">

                                                                                    {/* Top Header */}
                                                                                    <div className="flex items-center justify-between px-6 py-4 bg-gray-100 border-b">
                                                                                        <div className="flex items-center gap-4">
                                                                                            <span className={`px-4 py-1.5 text-sm font-bold rounded-full ${reportColorClass(serviceData.valuePitchReport.report)}`}>
                                                                                                {serviceData.valuePitchReport.report}
                                                                                            </span>
                                                                                            <span className="text-base font-semibold text-gray-700">
                                                                                                {serviceData.valuePitchReport.statusMsg}
                                                                                            </span>
                                                                                        </div>

                                                                                        {serviceData.valuePitchReport.reportUrl && (
                                                                                            <a
                                                                                                href={serviceData.valuePitchReport.reportUrl}
                                                                                                target="_blank"
                                                                                                className="text-sm font-semibold text-blue-600 hover:text-blue-800 underline"
                                                                                            >
                                                                                                Download PDF
                                                                                            </a>
                                                                                        )}
                                                                                    </div>

                                                                                    {/* Main Content - Single Row Boxes */}
                                                                                    <div className="grid grid-cols-3 gap-5 p-6">

                                                                                        {/* Name Box */}
                                                                                        <div className="border-2 rounded-xl p-4 bg-gray-50">
                                                                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                                                                                Name
                                                                                            </p>
                                                                                            <p className="text-lg font-bold text-gray-900">
                                                                                                {serviceData.valuePitchReport.name || "-"}
                                                                                            </p>
                                                                                        </div>

                                                                                        {/* Verified On */}
                                                                                        <div className="border-2 rounded-xl p-4 bg-gray-50">
                                                                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                                                                                Verified On
                                                                                            </p>
                                                                                            <p className="text-lg font-bold text-gray-900">
                                                                                                {formatDate(serviceData.valuePitchReport.dateOfVerification)}
                                                                                            </p>
                                                                                        </div>

                                                                                        {/* Addresses */}
                                                                                        <div className="border-2 rounded-xl p-4 bg-gray-50">
                                                                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                                                                                Addresses
                                                                                            </p>
                                                                                            <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                                                                                                {serviceData.valuePitchReport.addresses?.length
                                                                                                    ? serviceData.valuePitchReport.addresses.map(a => a.address).join(" • ")
                                                                                                    : "-"}
                                                                                            </p>
                                                                                        </div>

                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {isValuePitch(serviceData) && (
                                                                                <div className="flex flex-col gap-3 mt-4 p-4 border rounded-xl bg-white shadow-sm">

                                                                                    {/* Status */}
                                                                                    {isReportReady(serviceData) ? (
                                                                                        <div className="flex justify-between items-center">
                                                                                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                                                                                                Report Ready
                                                                                            </span>
                                                                                        </div>
                                                                                    ) : isAlreadySubmitted(serviceData) ? (
                                                                                        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm font-medium text-center">
                                                                                            Your case has been submitted: {serviceData.valuePitchStatus?.statusMsg}
                                                                                        </div>
                                                                                    ) : null}

                                                                                    {/* Action Button */}
                                                                                    {!isAlreadySubmitted(serviceData) && !isReportReady(serviceData) && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleValuePitchSubmit(serviceData, dbTable)}
                                                                                            className="w-full max-w-fit mx-auto py-3 px-6 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition duration-200 shadow-sm"
                                                                                        >
                                                                                            {valuePitchSubmitLoading === dbTable ? (
                                                                                                <span className="flex items-center">
                                                                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.266 5.883 3.367 7.967l2.633-2.633z"></path>
                                                                                                    </svg>
                                                                                                    Submitting...
                                                                                                </span>
                                                                                            ) : (
                                                                                                "Trigger Valuepitch Api"
                                                                                            )}
                                                                                        </button>
                                                                                    )}

                                                                                </div>
                                                                            )}
                                                                            {errors[`annexure_${index}`] && (
                                                                                <p className="text-red-500 text-sm">{errors[`annexure_${index}`]}</p>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                </div>



                                {/* Modal to show the selected image */}
                                {modalOpen && (
                                    <div
                                        className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
                                        onClick={closeModal} // Close modal when clicked outside
                                    >
                                        <div
                                            className="relative max-w-full max-h-full p-4"
                                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
                                        >
                                            <img
                                                src={selectedImage}
                                                alt="Selected"
                                                className="max-w-full max-h-full object-contain"
                                            />
                                            <button
                                                className="absolute top-2 right-2 bg-white text-black p-2 rounded-full shadow-md hover:bg-gray-300"
                                                onClick={closeModal} // Close the modal on click
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-group border rounded-md p-3">
                                <div className="gap-3">
                                    <div className="mb-4">
                                        <label htmlFor="myData_qc">Data QC</label><span className="text-red-500 text-xl">*</span>
                                        <select
                                            ref={(el) => (inputRefs.current["myData_qc"] = el)}
                                            name="myData_qc"
                                            id="myData_qc"
                                            className={`border w-full rounded-md p-2 mt-2 ${errors.myData_qc ? "border-red-500" : ""}`}
                                            onChange={handleDataQCChange}
                                            value={myDataQc}
                                            aria-label="Select QC Status"
                                        >
                                            <option value="">Select QC</option>
                                            <option value="1">YES</option>
                                            <option value="0">NO</option>
                                        </select>

                                        {errors.myData_qc && (
                                            <p className="text-red-500 text-sm">{errors.myData_qc}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="first_insufficiency_marks">First Level Insufficiency Remarks</label>
                                    {/* <MultiSelect
                                        id="first_insufficiency_marks"
                                        name="first_insufficiency_marks"
                                        className="text-xl"
                                        value={formData.updated_json?.insuffDetails?.first_insufficiency_marks || []}
                                        onChange={handleMultiSelectChange}
                                        options={optionsData}
                                        isDisabled={true}
                                    /> */}
                                    <input
                                        type="text"
                                        id="first_insufficiency_marks"
                                        name="first_insufficiency_marks"
                                        className="w-full p-3 mb-4 border border-gray-300 rounded-md"
                                        value={formData.updated_json?.insuffDetails?.first_insufficiency_marks || ''}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                updated_json: {
                                                    ...prev.updated_json,
                                                    insuffDetails: {
                                                        ...prev.updated_json?.insuffDetails,
                                                        first_insufficiency_marks: e.target.value,
                                                    },
                                                },
                                            }))
                                        }
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="first_insuff_date">First Insuff Raised Date:</label>
                                    {/* <DatePicker
                                        selected={parseDate(formData.updated_json.insuffDetails.first_insuff_date)}
                                        onChange={(date) =>
                                            handleChange({
                                                target: {
                                                    name: 'updated_json.insuffDetails.first_insuff_date',
                                                    value: date ? format(date, 'yyyy-MM-dd') : '',
                                                },
                                            })
                                        }
                                        dateFormat="dd-MM-yyyy"
                                        className="uppercase border w-full rounded-md p-2 mt-2"
                                    /> */}
                                    <input
                                        type="text"
                                        name="first_insuff_date"
                                        className="w-full p-3 mb-4 border border-gray-300 rounded-md"
                                        value={formatDateDDMMYY(formData.updated_json.insuffDetails.first_insuff_date) || ''}
                                        disabled
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="first_insuff_reopened_date">First Insuff Cleared Date / Re-Opened date</label>
                                    {/* <DatePicker
                                        selected={parseDate(formData.updated_json.insuffDetails.first_insuff_reopened_date)}
                                        onChange={(date) =>
                                            handleChange({
                                                target: {
                                                    name: 'updated_json.insuffDetails.first_insuff_reopened_date',
                                                    value: date ? format(date, 'yyyy-MM-dd') : '',
                                                },
                                            })
                                        }
                                        dateFormat="dd-MM-yyyy"
                                        className="uppercase border w-full rounded-md p-2 mt-2"
                                        ref={(el) => (inputRefs.current['first_insuff_reopened_date'] = el)}
                                    /> */}
                                    <input
                                        type="text"
                                        name="first_insuff_date"
                                        className="w-full p-3 mb-4 border border-gray-300 rounded-md"
                                        value={formatDateDDMMYY(formData.updated_json.insuffDetails.first_insuff_reopened_date) || ''}
                                        disabled
                                    />
                                    {errors.first_insuff_reopened_date && (
                                        <p className="text-red-500 text-sm">{errors.first_insuff_reopened_date}</p>
                                    )}
                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="second Level Insufficiency Remarks">Second Level Insufficiency Remarks</label>
                                    {/* <MultiSelect
                                        id="second_insufficiency_marks"
                                        name="second_insufficiency_marks"
                                        value={formData.updated_json?.insuffDetails?.second_insufficiency_marks || []}
                                        onChange={handleMultiSelectChange}
                                        options={optionsData}
                                        isDisabled={true}
                                    /> */}
                                    <input
                                        type="text"
                                        id="second_insufficiency_marks"
                                        name="second_insufficiency_marks"
                                        className="w-full p-3 mb-4 border border-gray-300 rounded-md"
                                        value={formData.updated_json?.insuffDetails?.second_insufficiency_marks || ''}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                updated_json: {
                                                    ...prev.updated_json,
                                                    insuffDetails: {
                                                        ...prev.updated_json?.insuffDetails,
                                                        second_insufficiency_marks: e.target.value,
                                                    },
                                                },
                                            }))
                                        }
                                    />


                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="second Insuff Raised Date:">Second Insuff Raised Date:</label>
                                    {/* <DatePicker
                                        selected={parseDate(formData.updated_json.insuffDetails.second_insuff_date)}
                                        onChange={(date) =>
                                            handleChange({
                                                target: {
                                                    name: 'updated_json.insuffDetails.second_insuff_date',
                                                    value: date ? format(date, 'yyyy-MM-dd') : '',
                                                },
                                            })
                                        }
                                        dateFormat="dd-MM-yyyy"
                                        className="uppercase border w-full rounded-md p-2 mt-2"
                                    /> */}
                                    <input
                                        type="text"
                                        name="second_insuff_date"
                                        className="w-full p-3 mb-4 border border-gray-300 rounded-md"
                                        value={formatDateDDMMYY(formData.updated_json.insuffDetails.second_insuff_date) || ''}
                                        disabled
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="second Insuff Cleared Date / Re-Opened date">Second Insuff Cleared Date / Re-Opened date</label>
                                    {/* <DatePicker
                                        selected={parseDate(formData.updated_json.insuffDetails.second_insuff_reopened_date)}
                                        onChange={(date) =>
                                            handleChange({
                                                target: {
                                                    name: 'updated_json.insuffDetails.second_insuff_reopened_date',
                                                    value: date ? format(date, 'yyyy-MM-dd') : '',
                                                },
                                            })
                                        }
                                        dateFormat="dd-MM-yyyy"
                                        className="uppercase border w-full rounded-md p-2 mt-2"
                                    /> */}
                                    <input
                                        type="text"
                                        name="second_insuff_reopened_date"
                                        className="w-full p-3 mb-4 border border-gray-300 rounded-md"
                                        value={formatDateDDMMYY(formData.updated_json.insuffDetails.second_insuff_reopened_date) || ''}
                                        disabled
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="third Level Insufficiency Remarks">third Level Insufficiency Remarks</label>
                                    {/* <MultiSelect
                                        id="third_insufficiency_marks"
                                        name="third_insufficiency_marks"
                                        value={formData.updated_json?.insuffDetails?.third_insufficiency_marks || []}
                                        onChange={handleMultiSelectChange}
                                        options={optionsData}
                                        isDisabled={true}
                                    /> */}
                                    <input
                                        type="text"
                                        id="third_insufficiency_marks"
                                        name="third_insufficiency_marks"
                                        className="w-full p-3 mb-4 border border-gray-300 rounded-md"
                                        value={formData.updated_json?.insuffDetails?.third_insufficiency_marks || ''}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                updated_json: {
                                                    ...prev.updated_json,
                                                    insuffDetails: {
                                                        ...prev.updated_json?.insuffDetails,
                                                        third_insufficiency_marks: e.target.value,
                                                    },
                                                },
                                            }))
                                        }
                                    />

                                </div>
                                <div className='flex grid md:grid-cols-2  gap-2'>
                                    <div className="mb-4">
                                        <label className='capitalize text-gray-500' htmlFor="third Insuff Raised Date:">third Insuff Raised Date:</label>
                                        {/* <DatePicker
                                            selected={parseDate(formData.updated_json.insuffDetails.third_insuff_date)}
                                            onChange={(date) =>
                                                handleChange({
                                                    target: {
                                                        name: 'updated_json.insuffDetails.third_insuff_date',
                                                        value: date ? format(date, 'yyyy-MM-dd') : '',
                                                    },
                                                })
                                            }
                                            dateFormat="dd-MM-yyyy"
                                            className="uppercase border w-full rounded-md p-2 mt-2"
                                        /> */}
                                        <input
                                            type="text"
                                            name="third_insuff_date"
                                            className="w-full p-3 mb-4 border border-gray-300 rounded-md"
                                            value={formatDateDDMMYY(formData.updated_json.insuffDetails.third_insuff_date) || ''}
                                            disabled
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className='capitalize text-gray-500' htmlFor="third Insuff Cleared Date / Re-Opened date">third Insuff Cleared Date / Re-Opened date</label>
                                        {/* <DatePicker
                                            selected={parseDate(formData.updated_json.insuffDetails.third_insuff_reopened_date)}
                                            onChange={(date) =>
                                                handleChange({
                                                    target: {
                                                        name: 'updated_json.insuffDetails.third_insuff_reopened_date',
                                                        value: date ? format(date, 'yyyy-MM-dd') : '',
                                                    },
                                                })
                                            }
                                            dateFormat="dd-MM-yyyy"
                                            className="uppercase border w-full rounded-md p-2 mt-2"
                                        /> */}
                                        <input
                                            type="text"
                                            name="third_insuff_reopened_date"
                                            className="w-full p-3 mb-4 border border-gray-300 rounded-md"
                                            value={formatDateDDMMYY(formData.updated_json.insuffDetails.third_insuff_reopened_date) || ''}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="mb-4 ">
                                    <label className='capitalize text-gray-500' htmlFor="overall_status">overall status</label>
                                    <select
                                        id='overall_status'
                                        required
                                        ref={(el) => (inputRefs.current['overall_status'] = el)} // Add ref
                                        name="updated_json.insuffDetails.overall_status"
                                        value={
                                            !isAllCompleted && formData.updated_json.insuffDetails.overall_status === 'completed'
                                                ? '' // Reset to default if "COMPLETED" is selected but it's now disabled
                                                : formData.updated_json.insuffDetails.overall_status
                                        }
                                        onChange={handleChange}
                                        className="border rounded-md p-2 mt-2 uppercase w-full"
                                    >
                                        <option value="">Select Overall Status</option>
                                        <option value="initiated">INITIATED</option>
                                        <option value="hold">HOLD</option>
                                        <option value="closure_advice">CLOSURE ADVICE</option>
                                        <option value="wip">WIP</option>
                                        <option value="insuff">INSUFF</option>
                                        <option value="stopcheck">STOPCHECK</option>
                                        <option value="active_employment">ACTIVE EMPLOYMENT</option>
                                        <option value="nil">NIL</option>
                                        <option value="not_doable">NOT DOABLE</option>
                                        <option value="candidate_denied">CANDIDATE DENIED</option>
                                        {isAllCompleted && (
                                            <option value="completed">COMPLETED</option>
                                        )}
                                    </select>

                                    {errors.overall_status && (
                                        <p className="text-red-500 text-sm">{errors.overall_status}</p>
                                    )}
                                </div>
                                <div className="grid md:grid-cols-2 gap-3">
                                    <div className="mb-4">
                                        <label className='capitalize text-gray-500' htmlFor="report date">Final Report Date</label>
                                        <DatePicker
                                            selected={parseDate(formData.updated_json.insuffDetails.report_date)}
                                            onChange={(date) =>
                                                handleChange({
                                                    target: {
                                                        name: 'updated_json.insuffDetails.report_date',
                                                        value: date ? format(date, 'yyyy-MM-dd') : '',
                                                    },
                                                })
                                            }
                                            dateFormat="dd-MM-yyyy"
                                            className="uppercase border w-full rounded-md p-2 mt-2"
                                        />

                                    </div>
                                    <div className="mb-4 cols-2">
                                        <label className='capitalize text-gray-500' htmlFor="interim_date">Interim Date</label>
                                        <DatePicker
                                            selected={parseDate(formData.updated_json.insuffDetails.interim_date)}
                                            onChange={(date) =>
                                                handleChange({
                                                    target: {
                                                        name: 'updated_json.insuffDetails.interim_date',
                                                        value: date ? format(date, 'yyyy-MM-dd') : '',
                                                    },
                                                })
                                            }
                                            dateFormat="dd-MM-yyyy"
                                            className="uppercase border w-full rounded-md p-2 mt-2"
                                        />

                                    </div>

                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="eport status">Report Status:</label>
                                    <select name="updated_json.insuffDetails.report_status" id=""
                                        value={formData.updated_json.insuffDetails.report_status}
                                        onChange={handleChange}
                                        className="border rounded-md p-2 mt-2 uppercase w-full">
                                        <option value="open">Open</option>
                                        <option value="closed">Closed</option>
                                    </select>

                                </div>
                                <div className="grid md:grid-cols-3 gap-3">
                                    <div className="mb-4">
                                        <label className='capitalize text-gray-500' htmlFor="report status">Report Type:</label>
                                        <select name="updated_json.insuffDetails.report_type" id=""
                                            value={formData.updated_json.insuffDetails.report_type}
                                            onChange={handleChange}
                                            className="border rounded-md p-2 mt-2 uppercase w-full">
                                            <option value="">Select Report Type</option>
                                            <option value="interim_report">Interim Report</option>
                                            <option value="final_report">Final Report</option>
                                        </select>

                                    </div>

                                    <div className="mb-4">
                                        <label className='capitalize text-gray-500' htmlFor="Final Verification Status:">Final Verification Status:</label>
                                        <select name="updated_json.insuffDetails.final_verification_status"
                                            value={formData.updated_json.insuffDetails.final_verification_status}
                                            onChange={handleChange}
                                            id="" className="border w-full rounded-md p-2 mt-2 uppercase">
                                            <option value="green">Green</option>
                                            <option value="red">Red</option>
                                            <option value="yellow" >Yellow</option>
                                            <option value="orange">Orange</option>
                                        </select>



                                    </div>
                                    <div className="mb-4">
                                        <label className='capitalize text-gray-500 ' htmlFor="deadline date">deadline date</label>
                                        <DatePicker
                                            selected={parseDate(formData.updated_json.insuffDetails.deadline_date)}
                                            onChange={(date) =>
                                                handleChange({
                                                    target: {
                                                        name: 'updated_json.insuffDetails.deadline_date',
                                                        value: date ? format(date, 'yyyy-MM-dd') : '',
                                                    },
                                                })
                                            }
                                            dateFormat="dd-MM-yyyy"
                                            className="uppercase border w-full rounded-md p-2 mt-2"
                                        />

                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500 ' htmlFor="Address">Address</label>
                                    <select name="updated_json.insuffDetails.insuff_address"
                                        value={formData.updated_json.insuffDetails.insuff_address}
                                        onChange={handleChange}
                                        id="" className="border w-full rounded-md p-2 mt-2 uppercase">
                                        <option value="">Select Spoc</option>
                                        {adminNames.map((spoc, index) => (
                                            <option key={index} value={spoc.id}>{spoc.name}</option>
                                        ))}

                                    </select>

                                </div>
                                <div className="mb-4 ">
                                    <label className='capitalize text-gray-500' htmlFor="basic entry">basic entry</label>
                                    <select name="updated_json.insuffDetails.basic_entry"
                                        value={formData.updated_json.insuffDetails.basic_entry}
                                        onChange={handleChange}
                                        id="" className="border w-full rounded-md p-2 mt-2 uppercase">
                                        <option value="">Select Spoc</option>

                                        {adminNames.map((spoc, index) => (
                                            <option key={index} value={spoc.id}>{spoc.name}</option>
                                        ))}

                                    </select>

                                </div>

                                <div className="mb-4 ">
                                    <label className='capitalize text-gray-500 ' htmlFor="education">education</label>
                                    <select name="updated_json.insuffDetails.education" id=""
                                        value={formData.updated_json.insuffDetails.education}
                                        onChange={handleChange}
                                        className="border w-full rounded-md p-2 mt-2 uppercase">
                                        <option value="">Select Spoc</option>
                                        {adminNames.map((spoc, index) => (
                                            <option key={index} value={spoc.id}>{spoc.name}</option>
                                        ))}

                                    </select>

                                </div>

                                <div className="mb-4 ">
                                    <label className='capitalize text-gray-500 block' htmlFor="Employment Spoc:">Employment Spoc:</label>
                                    <select name="updated_json.insuffDetails.emp_spoc" id=""
                                        value={formData.updated_json.insuffDetails.emp_spoc}
                                        onChange={handleChange}
                                        className="border w-full rounded-md p-2 mt-2 uppercase">
                                        <option value="">Select Spoc</option>
                                        {adminNames.map((spoc, index) => (
                                            <option key={index} value={spoc.id}>{spoc.name}</option>
                                        ))}

                                    </select>

                                </div>
                                <div className="grid md:grid-cols-2 gap-3">
                                    <div className="mb-4">
                                        <label className='capitalize text-gray-500' htmlFor="case upload">case upload</label>

                                        <select name="updated_json.insuffDetails.case_upload" id=""
                                            value={formData.updated_json.insuffDetails.case_upload}
                                            onChange={handleChange}
                                            className="border w-full rounded-md p-2 mt-2 uppercase">
                                            <option value="">Select Spoc</option>
                                            {adminNames.map((spoc, index) => (
                                                <option key={index} value={spoc.id}>{spoc.name}</option>
                                            ))}

                                        </select>

                                    </div>

                                    <div className="mb-4 ">
                                        <label className='capitalize text-gray-500' htmlFor="Report Generated By:">Report Generated By:</label>
                                        <select name="updated_json.insuffDetails.report_generate_by"
                                            value={formData.updated_json.insuffDetails.report_generate_by}
                                            onChange={handleChange}
                                            id="" className="border w-full rounded-md p-2 mt-2 uppercase">
                                            <option value="">Select Admin</option>
                                            {adminNames.map((spoc, index) => (
                                                <option key={index} value={spoc.id}>{spoc.name}</option>
                                            ))}


                                        </select>

                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-3">
                                    <div className="mb-4 ">
                                        <label className='capitalize block text-gray-500' htmlFor="QC Done By:">QC Done By:</label>

                                        <select name="updated_json.insuffDetails.qc_done_by"
                                            value={formData.updated_json.insuffDetails.qc_done_by}
                                            onChange={handleChange}
                                            id="" className="border w-full rounded-md p-2 mt-2 uppercase">
                                            <option value="">Select Admin</option>
                                            {adminNames.map((spoc, index) => (
                                                <option key={index} value={spoc.id}>{spoc.name}</option>
                                            ))}

                                        </select>

                                    </div>
                                    <div className="mb-4 ">
                                        <label className='capitalize block text-gray-500' htmlFor="qc_date">QC Date:</label>
                                        <DatePicker
                                            selected={parseDate(formData.updated_json.insuffDetails.qc_date)}
                                            onChange={(date) =>
                                                handleChange({
                                                    target: {
                                                        name: 'updated_json.insuffDetails.qc_date',
                                                        value: date ? format(date, 'yyyy-MM-dd') : '',
                                                    },
                                                })
                                            }
                                            dateFormat="dd-MM-yyyy"
                                            className="uppercase border w-full rounded-md p-2 mt-2"
                                        />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="Remarks & reason for Delay:">Remarks & reason for Delay:</label>
                                    <input
                                        type="text"
                                        id="delay_reason"
                                        name="delay_reason"
                                        className="uppercase border w-full rounded-md p-2 mt-2"

                                        value={formData.updated_json?.insuffDetails?.delay_reason || ""}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                updated_json: {
                                                    ...prev.updated_json,
                                                    insuffDetails: {
                                                        ...prev.updated_json?.insuffDetails,
                                                        delay_reason: e.target.value,
                                                    },
                                                },
                                            }))
                                        }
                                    />


                                </div>
                                <div className="grid md:grid-cols-2 gap-3">
                                    <div className="mb-4">
                                        <label className="capitalize text-gray-500" htmlFor="is_verified_by_quality_team">
                                            Is verified by quality team
                                            <span className="text-red-500 text-xl">*</span>
                                        </label>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="radio"
                                                name="updated_json.insuffDetails.is_verify"
                                                id="is_verified_yes"
                                                value="yes"
                                                checked={formData.updated_json.insuffDetails.is_verify === "yes"}
                                                onChange={(e) => handleChange({
                                                    target: {
                                                        name: "updated_json.insuffDetails.is_verify",
                                                        value: e.target.value
                                                    }
                                                })}
                                                className="w-4 h-4 border rounded-md mr-2"
                                            />
                                            <span className="uppercase">Yes</span>

                                            <input
                                                type="radio"
                                                name="updated_json.insuffDetails.is_verify"
                                                id="is_verified_no"
                                                value="no"
                                                checked={formData.updated_json.insuffDetails.is_verify === "no" || !formData.updated_json.insuffDetails.is_verify}
                                                onChange={(e) => handleChange({
                                                    target: {
                                                        name: "updated_json.insuffDetails.is_verify",
                                                        value: e.target.value
                                                    }
                                                })}
                                                className="w-4 h-4 border rounded-md ml-4 mr-2"
                                            />
                                            <span className="uppercase">No</span>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div className="text-left mt-4">
                                <div className='notmandatory mb-4 items-center flex gap-2'>
                                    <input
                                        type="checkbox"
                                        name="notMandatory"
                                        id="notMandatory"
                                        className="border rounded-md p-2 w-5 h-5  capitalize"
                                        onChange={(e) => setIsNotMandatory(e.target.checked)}
                                    />
                                    <label className='capitalize text-gray-500'>Not Mandatory Fields</label>
                                </div>

                                <button
                                    type="submit"
                                    className="p-6 py-3 bg-[#2c81ba] text-white font-bold rounded-md hover:bg-[#0f5381] transition duration-200 "
                                >
                                    Submit
                                </button>
                                <button

                                    onClick={handlePreview}
                                    className="p-6 py-3 bg-green-600 text-white ml-5 font-bold rounded-md hover:bg-green-600 transition duration-200 "
                                >
                                    Preview
                                </button>

                            </div>
                        </form>
                    )}
                </div>
            </div >
        </div >
    );
};
export default GenerateReport;