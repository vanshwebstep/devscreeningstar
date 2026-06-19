import React, { useState, useEffect, useCallback, useRef } from 'react';
import Swal from "sweetalert2";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { FaChevronLeft } from 'react-icons/fa';
import JSZip from "jszip";
import { saveAs } from "file-saver";
import "swiper/css";
import { Navigation, Thumbs } from 'swiper';
import { jsPDF } from 'jspdf';
import { useApiLoading } from '../ApiLoadingContext';
import PDFuser from "../../imgs/PDFuser.png"
import Select from "react-select";

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO, isValid } from 'date-fns';
const MultiSelect = ({ id, name, value, onChange, options }) => {
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
            placeholder="NA" // Set custom placeholder
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
const TeamManagementGenerateReport = () => {
    const [customerInfo, setCustomerInfo] = useState([]);

    const parseDate = (value) => {
        if (!value) return null;
        try {
            const date = parseISO(value);
            return isValid(date) ? date : null;
        } catch {
            return null;
        }
    };
    const [errors, setErrors] = useState({});
    const [serviceImages, setServiceImages] = useState([]);

    const inputRefs = useRef({});
    const parseAndValidateDate = (value) => {
        if (!value) return null;
        const date = typeof value === 'string' ? parseISO(value) : new Date(value);
        return isValid(date) ? date : null;
    };
    const [isAllCompleted, setIsAllCompleted] = useState(false);

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
    const navigate = useNavigate();
    const [filesBulk, setFilesBulk] = useState([]);
    const [formData, setFormData] = useState({
        updated_json: {
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
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const [statusChanged, setStatusChanged] = useState({});
    const [filesUploaded, setFilesUploaded] = useState({});
    const [loading, setLoading] = useState(true);
    const [servicesDataInfo, setServicesDataInfo] = useState([]);
    const [serviceImagesState, setServiceImagesState] = useState([]);

    const [branchInfo, setBranchInfo] = useState({});
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [componentStatus, setComponentStatus] = useState(0); // Default to 0 (unchecked)
    const [selectedImages, setSelectedImages] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState(""); // "selected" or "preselected"
    const openModal = (type) => {
        setModalType(type);
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setIsModalOpen(false);
    };

    const [files, setFiles] = useState({});
    const [applicationRefID, setApplicationRefID] = useState("");
    const [clientCode, setClientCode] = useState("");
    console.log('servicesDataInfo', servicesDataInfo)
    const applicationId = new URLSearchParams(window.location.search).get("applicationId");
    const branchid = new URLSearchParams(window.location.search).get("branchid");

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
    } const fetchApplicationData = useCallback(() => {
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem("_token");

        fetch(
            `https://api.screeningstar.co.in/team-management/application-by-id?application_id=${applicationId}&branch_id=${branchid}&admin_id=${adminId}&_token=${token}`
        )
            .then((response) => response.json())
            .then((result) => {
                setLoading(false);
                setBranchInfo(result.branchInfo || {});
                setServicesDataInfo(result.results?.filter(Boolean) || []);
                const applicationData = result.application;
                setCustomerInfo(result.customerInfo);

                setComponentStatus(result.CMTData?.component_status)
                setClientCode(result.customerInfo?.client_unique_id || "");
                setApplicationRefID(result.application?.application_id || "");
                setSelectedStatuses(
                    result.results?.map((serviceData) => serviceData?.annexureData?.status || "") || []
                );
                setSelectedImages(
                    result.results?.map((serviceData) => serviceData?.annexureData?.team_management_docs || "") || []
                )
                const cmtData = result.CMTData || [];
                if (!cmtData.deadline_date) {
                    cmtData.deadline_date = cmtData.new_deadline_date;
                }
                setCmtData(cmtData);

                let newdob = cmtData.dob;
                let newInitiationDate = cmtData.initiation_date;
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    updated_json: {
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
                        }

                    }
                }));
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
                setLoading(false);
            });
    }, [applicationId, branchid]);

    useEffect(() => {
        fetchApplicationData();
    }, [fetchApplicationData]);

    useEffect(() => {
        if (servicesDataInfo) {
            const annexureMap = {};

            servicesDataInfo
                .filter(serviceData => serviceData?.serviceStatus)
                .forEach(serviceData => {
                    const serviceName = serviceData?.heading; // or serviceData?.serviceName, adjust if needed
                    const images = serviceData?.annexureData?.team_management_docs?.split(",") || [];

                    const validImages = images.filter(Boolean).map(img => img.trim());

                    if (validImages.length) {
                        annexureMap[serviceName] = [
                            {
                                "Annexure:": validImages.join(", "),
                            },
                        ];
                    }
                });

            console.log("Formatted Annexure Map:", annexureMap);
            setServiceImagesState(annexureMap); // Update your state with this formatted data
        }
    }, [servicesDataInfo]);

    const [cmtData, setCmtData] = useState([]);
    const [cmdDates, setCmdDates] = useState({
        dob: "",
        initiationDate: "",
    });



    const handleStatusChange = (e, dbTable, index) => {
        const updatedStatuses = [...selectedStatuses];
        updatedStatuses[index] = e.target.value;

        setSelectedStatuses(updatedStatuses);

        // Track that this index has changed status
        setStatusChanged((prev) => ({
            ...prev,
            [index]: true,
        }));
    };


    const handleFileChange = (index, dbTable, heading, e) => {
        const selectedFiles = Array.from(e.target.files);
        const updatedStatuses = [...selectedStatuses];
        updatedStatuses[index] = e.target.value;

        setSelectedStatuses(updatedStatuses);

        // Track that this index has changed status
        setStatusChanged((prev) => ({
            ...prev,
            [index]: true,
        }));
        setFiles((prevFiles) => ({
            ...prevFiles,
            [dbTable]: { selectedFiles, fileName: heading },
        }));

        // Mark that a file has been uploaded for this index
        setFilesUploaded((prev) => ({
            ...prev,
            [index]: selectedFiles.length > 0,
        }));
    };


    const uploadCustomerLogo = async () => {
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!admin_id || !storedToken) {
            console.error("Admin ID or token not found in local storage.");
            return false;
        }

        const uploadPromises = [];

        for (const [dbTable, value] of Object.entries(files)) {
            const formData = new FormData();
            formData.append("admin_id", admin_id);
            formData.append("_token", storedToken);
            formData.append("client_application_id", applicationId);
            formData.append("branch_id", branchid);
            formData.append("customer_code", clientCode);
            formData.append("application_code", applicationRefID);
            formData.append("db_table", dbTable);

            if (value.selectedFiles?.length > 0) {
                value.selectedFiles.forEach((file) => {
                    if (file instanceof File) {
                        formData.append("images", file);
                    }
                });

                formData.append("db_column", value.fileName);
            }

            const uploadPromise = axios.post(
                "https://api.screeningstar.co.in/team-management/upload",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            )
                .then((response) => {
                    const data = response.data;
                    if (data.token || data._token) {
                        localStorage.setItem("_token", data.token || data._token);
                    }
                })
                .catch((err) => {
                    console.error("Error uploading file:", err.message || err);
                    throw err; // Ensures Promise.all fails if any upload fails
                });

            uploadPromises.push(uploadPromise);
        }

        try {
            await Promise.all(uploadPromises);
            return true; // All uploads succeeded
        } catch (err) {
            return false; // At least one upload failed
        }
    };

    const formatServiceName = (dbTable) => {
        if (!dbTable) return "";
        return dbTable
            .replace(/_/g, " ")  // Replace underscores with spaces
            .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize each word
    }; const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        const fileCount = Object.keys(files).length;
        const isFileUploading = fileCount > 0;

        // Ensure files are uploaded if status is changed
        for (let index = 0; index < selectedStatuses.length; index++) {
            const TeamDocs = servicesDataInfo[index]?.annexureData?.team_management_docs;

            // Check if TeamDocs is a non-empty string after trimming
            if (typeof TeamDocs === 'string' && TeamDocs.trim().length > 0) {
                continue; // TeamDocs exists, skip to next
            }

            // if (statusChanged[index] && !filesUploaded[index]) {
            //     const dbTable = servicesDataInfo[index]?.reportFormJson?.json
            //         ? JSON.parse(servicesDataInfo[index].reportFormJson.json).db_table
            //         : "";
            //     const serviceName = dbTable ? formatServiceName(dbTable) : `Row ${index + 1}`;

            //     console.log('team_management_docs---', TeamDocs);
            //     Swal.fire("Error", `Please upload a file for "${serviceName}" before submission.`, "error");
            //     setLoading(false);
            //     return;
            // }           
        }



        try {
            const adminData = JSON.parse(localStorage.getItem("admin"));
            const token = localStorage.getItem("_token");

            const statuses = servicesDataInfo
                .map((serviceData, index) => {
                    console.log(serviceData);
                    const jsonData = serviceData?.reportFormJson?.json
                        ? JSON.parse(serviceData.reportFormJson.json)
                        : null;

                    const dbTable = jsonData?.db_table;
                    return selectedStatuses[index]
                        ? {
                            db_table: dbTable,
                            service_id: serviceData.service_id,
                            status: selectedStatuses[index],
                        }
                        : null;
                })
                .filter(Boolean);
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
            setFormData({
                ...modifiedFormData,
                updated_json: {
                    ...modifiedFormData.updated_json,
                    insuffDetails: {
                        ...modifiedFormData.updated_json.insuffDetails,
                    },
                },
            });
            const payload = JSON.stringify({
                admin_id: adminData?.id,
                _token: token,
                branch_id: branchid,
                customer_id: branchInfo.customer_id,
                application_id: applicationId,
                statuses,
                ...modifiedFormData,
                component_status: componentStatus,
                send_mail: 0,
            });

            const response = await fetch(
                "https://api.screeningstar.co.in/team-management/generate-report",
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: payload,
                }
            );
            const newToken = response.token || response._token || localStorage.getItem("_token");

            if (newToken) {
                console.log("Saving token:", newToken);
                localStorage.setItem("_token", newToken);
            }
            if (!response.ok) throw new Error("Failed to submit data");

            const branchidFromUrl = new URLSearchParams(window.location.search).get('branchid');
            const clientIdFromUrl = new URLSearchParams(window.location.search).get('clientId');

            // Wait for all images to be uploaded before proceeding
            const uploadSuccess = await uploadCustomerLogo();
            if (!uploadSuccess) {
                Swal.fire("Error", "Failed to upload files. Submission aborted.", "error");
                setLoading(false);
                return;
            }

            // Show success only after all images are uploaded
            Swal.fire("Success", "Service Status updated Successfully!", "success");

            const branchId = branchidFromUrl;
            const customerId = clientIdFromUrl;
            navigate(`/admin-TeamManagementCheckin?clientId=${customerId}&branchId=${branchId}`);
        } catch (err) {
            console.error("Error during submission:", err);
            Swal.fire("Error", "Failed to submit data.", "error");
        } finally {
            setLoading(false);
        }
    };




    const handleGoBack = () => {
        const branchidFromUrl = new URLSearchParams(window.location.search).get('branchid');
        const clientIdFromUrl = new URLSearchParams(window.location.search).get('clientId');

        const branchId = branchidFromUrl;
        const customerId = clientIdFromUrl;

        navigate(`/admin-TeamManagementCheckin?clientId=${customerId}&branchId=${branchId}`);
    }
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
    const fetchImageToBase = async (imageUrls) => {
        try {
            const response = await axios.post(
                "https://api.screeningstar.co.in/utils/image-to-base",
                { image_urls: imageUrls },
                { headers: { "Content-Type": "application/json" } }
            );

            // Return the images array directly
            return Array.isArray(response.data.images) ? response.data.images : [];
        } catch (error) {
            console.error("Error fetching images:", error);
            return [];
        }
    };

    const handleDownloadFile = async (fileUrl, event) => {
        event.preventDefault(); // Prevent default anchor behavior

        if (!fileUrl) return;

        try {
            const response = await fetchImageToBase(fileUrl); // Ensure this function works correctly
            console.log(`response - `, response);
            console.log(`fileUrl - `, fileUrl);
            const imageData = response.find(img => decodeURIComponent(img.imageUrl.trim()) === decodeURIComponent(fileUrl.trim()));

            if (!imageData) {
                throw new Error("Image data not found");
            }

            const base64Data = imageData.base64.split(",")[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Uint8Array(byteCharacters.length);

            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            const blob = new Blob([byteNumbers], { type: `image/${imageData.type}` });
            const blobUrl = window.URL.createObjectURL(blob);

            const fileName = fileUrl.split("/").pop() || `image.${imageData.type}`;

            const anchor = document.createElement("a");
            anchor.href = blobUrl;
            anchor.download = fileName;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);

            // Cleanup
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Error downloading file:", error);
            alert("Download failed! Try opening the image and saving it manually.");
        }
    };
    const handleDownloadDocuments = (fileUrl, fileType, e) => {
        e.preventDefault();

        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', '');
        link.setAttribute('target', '_blank'); // Ensures no redirection
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const fetchImageToBaseNew = async (urls) => {
        const results = await Promise.all(
            urls.map(async (url) => {
                const res = await fetch(url);
                const blob = await res.blob();

                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve({ base64: reader.result });
                    };
                    reader.readAsDataURL(blob); // <-- THIS is the key
                });
            })
        );
        return results;
    };

    const FileViewer = ({ fileUrl }) => {
        if (!fileUrl) {
            return <p>No file provided</p>; // Handle undefined fileUrl
        }

        const getFileExtension = (url) => url.split('.').pop().toLowerCase();

        const renderIframe = (url) => (
            <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
                width="100%"
                height="100%"
                title="File Viewer"
                onError={() => alert('Unable to load document.')}
            />
        );


        const fileExtension = getFileExtension(fileUrl);

        // Determine the type of file and render accordingly
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(fileExtension)) {
            return <img src={fileUrl} alt="Image File" style={{}} />;

        }

        if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(fileExtension)) {
            return renderIframe(fileUrl);
        }

        return <p>Unsupported file type</p>;
    };

    const base64ToBlob = (base64StringWithHeader) => {
        try {
            if (!base64StringWithHeader || typeof base64StringWithHeader !== "string") {
                throw new Error("Input is not a valid base64 string");
            }

            // Check if it's already split
            const [header, base64Data] = base64StringWithHeader.includes(',')
                ? base64StringWithHeader.split(',')
                : [null, base64StringWithHeader];

            if (!base64Data) {
                throw new Error("Base64 data is missing.");
            }

            // Get MIME type from header, or default to image/jpeg
            const mimeMatch = header ? header.match(/data:(.*);base64/) : null;
            const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

            const byteCharacters = atob(base64Data);
            const byteArrays = [];

            for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                const slice = byteCharacters.slice(offset, offset + 512);
                const byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                byteArrays.push(new Uint8Array(byteNumbers));
            }

            return new Blob(byteArrays, { type: mimeType });

        } catch (error) {
            console.error("❌ Error converting base64 to blob:", error);
            return null;
        }
    };





    const handleDownloadViaProxy = async (originalUrl, e) => {
        e.preventDefault();
        try {
            const cleanedUrl = encodeURI(originalUrl.trim());
            console.log('Encoded URL:', cleanedUrl);

            const images = await fetchImageToBase([cleanedUrl]);

            const imageData = images.find(img => img.url === cleanedUrl);
            if (!imageData || !imageData.base64) {
                alert("File not found or invalid base64 data.");
                return;
            }

            const [prefix, base64Data] = imageData.base64.split(",");
            const mimeMatch = prefix.match(/data:(.*);base64/);

            if (!mimeMatch) {
                alert("Invalid base64 data format.");
                return;
            }

            const mimeType = mimeMatch[1];
            const byteCharacters = atob(base64Data);
            const byteArrays = [];

            for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                const slice = byteCharacters.slice(offset, offset + 512);
                const byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                byteArrays.push(new Uint8Array(byteNumbers));
            }

            const blob = new Blob(byteArrays, { type: mimeType });
            const fileName = imageData.fileName || "downloaded-file";
            saveAs(blob, fileName);

            console.log("✅ File downloaded:", fileName);
        } catch (error) {
            console.error("❌ Download failed:", error);
            alert("Download failed. Please try again.");
        }
    };



    const handleImageRemove = (indexToRemove) => {
        setServiceImages((prevImages) =>
            prevImages.filter((_, i) => i !== indexToRemove)
        );
    };

    // const filesBulks = () => {
    //     // Simulating a function that generates URLs
    //     const newUrl = filesBulk; 

    //     // Add to state only if it's not already present
    //     setFilesBulk((prevUrls) => {
    //       if (!prevUrls.includes(newUrl)) {
    //         return [...prevUrls, newUrl];
    //       }
    //       return prevUrls;
    //     });
    //   };
    const downloadAllImages = async (imageUrls) => {
        const zip = new JSZip();
        const folder = zip.folder("service-images");

        // Fetch all images and add to zip
        const fetchPromises = imageUrls.map(async (url, index) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                folder.file(`image_${index + 1}.jpg`, blob);
            } catch (error) {
                console.error(`Failed to fetch image ${url}`, error);
            }
        });

        // Wait for all images to be added
        await Promise.all(fetchPromises);

        // Generate and download ZIP
        zip.generateAsync({ type: "blob" }).then((zipBlob) => {
            saveAs(zipBlob, "service-images.zip");
        });
    };


    const base64ToBlobNew = (base64, mimeType) => {
        const byteCharacters = atob(base64);
        const byteArrays = [];

        for (let i = 0; i < byteCharacters.length; i += 512) {
            const slice = byteCharacters.slice(i, i + 512);
            const byteNumbers = new Array(slice.length);
            for (let j = 0; j < slice.length; j++) {
                byteNumbers[j] = slice.charCodeAt(j);
            }
            byteArrays.push(new Uint8Array(byteNumbers));
        }

        return new Blob(byteArrays, { type: mimeType });
    };

    // const handleDownloadAllFiles = async (attachments) => {
    //     const zip = new JSZip();
    //     let allUrls = [];

    //     try {
    //         // Step 1: Collect all image URLs
    //         for (const [category, files] of Object.entries(attachments)) {
    //             for (const attachment of files) {
    //                 const label = Object.keys(attachment)[0];
    //                 const fileUrls = attachment[label]?.split(",").map(url => url.trim());

    //                 if (fileUrls && fileUrls.length > 0) {
    //                     allUrls.push({ category, label, urls: fileUrls });
    //                 }
    //             }
    //         }

    //         if (allUrls.length === 0) {
    //             console.warn("No valid image URLs found.");
    //             return;
    //         }

    //         // Step 2: Fetch Base64 for all image URLs
    //         const allImageUrls = allUrls.flatMap(item => item.urls);
    //         const base64Response = await fetchImageToBase(allImageUrls);
    //         const base64Images = base64Response || [];

    //         if (base64Images.length === 0) {
    //             console.error("No images received from API.");
    //             return;
    //         }

    //         // Step 3: Add each image to ZIP
    //         let imageIndex = 0;
    //         for (const { category, label, urls } of allUrls) {
    //             for (const url of urls) {
    //                 const imageData = base64Images.find(img => img.imageUrl === url);

    //                 if (imageData && imageData.base64.startsWith("data:image")) {
    //                     const base64Data = imageData.base64.split(",")[1];
    //                     const blob = base64ToBlob(base64Data, imageData.type);

    //                     if (blob) {
    //                         const fileName = `${category}/${label}/image_${imageIndex + 1}.${imageData.type}`;
    //                         zip.file(fileName, blob);
    //                     }
    //                 } else {
    //                     console.warn(`Skipping invalid Base64 data for URL: ${url}`);
    //                 }
    //                 imageIndex++;
    //             }
    //         }

    //         // Step 4: Generate and trigger ZIP download
    //         const zipContent = await zip.generateAsync({ type: "blob" });
    //         saveAs(zipContent, "attachments.zip");
    //         console.log("✅ ZIP file downloaded successfully!");

    //     } catch (error) {
    //         console.error("❌ Error generating ZIP:", error);
    //     }
    // };
    const handleDownloadAllFiles = async (attachments) => {
        const zip = new JSZip();
        console.log("📁 Initialized new JSZip instance.", attachments);

        try {
            // Step 1: Extract URLs from structured attachments object
            const fileUrls = [];
Object.entries(attachments).forEach(([section, files]) => {
    files.forEach(file => {
        Object.entries(file).forEach(([label, url]) => {
            if (url) {
                // Split multiple URLs in one string
                const urlList = url.split(',').map(u => u.trim()).filter(u => u.length > 0);

                urlList.forEach(singleUrl => {
                    fileUrls.push({
                        url: singleUrl,
                        fileName: `${section.replace(/\s+/g, "_")}_${label.replace(/[:\s]+/g, "_")}_${singleUrl.split('/').pop()}`
                    });
                });
            }
        });
    });
});


            console.log("🔗 Extracted file URLs with names:", fileUrls);

            if (fileUrls.length === 0) {
                console.warn("⚠️ No valid image URLs found.");
                return;
            }

            // Step 2: Fetch Base64 for all image URLs
            console.log("📡 Fetching Base64 representations of images...");
            const base64Response = await fetchImageToBase(fileUrls.map(f => f.url));
            const base64Images = base64Response || [];
            console.log("🖼️ Received Base64 images:", base64Images);

            if (base64Images.length === 0) {
                console.error("❌ No images received from API.");
                return;
            }

            // Step 3: Add each image to ZIP
            for (const fileObj of fileUrls) {
                const imageData = base64Images.find(img => img.url === fileObj.url);

                console.log(`🔍 Processing - ${fileObj.fileName}`);
                console.log("📦 Matched image data:", imageData);

                if (imageData && imageData.base64) {
                    const base64Data = imageData.base64.split(",")[1];
                    const blob = base64ToBlob(base64Data, imageData.type);

                    if (blob) {
                        zip.file(fileObj.fileName, blob);
                        console.log(`✅ Added to ZIP: ${fileObj.fileName}`);
                    } else {
                        console.warn(`⚠️ Failed to create blob for: ${fileObj.url}`);
                    }
                } else {
                    console.warn(`⚠️ Skipping invalid or missing Base64 data for URL: ${fileObj.url}`);
                }
            }

            // Step 4: Generate and trigger ZIP download
            console.log("🛠️ Generating ZIP file...");
            const zipContent = await zip.generateAsync({ type: "blob" });
            saveAs(zipContent, "attachments.zip");
            console.log("✅ ZIP file downloaded successfully!");

        } catch (error) {
            console.error("❌ Error generating ZIP:", error);
        }
    };

    console.log('serviceImagesState', serviceImagesState)
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
            }
            // console.log('updatedFormData', updatedFormData)
            return updatedFormData;
        });
    };

    return (
        <div className="bg-[#c1dff2] border border-black">
            <h2 className="text-2xl font-bold py-3 text-left text-[#4d606b] px-3 border">
                VERIFICATION STATUS
            </h2>
            <div className="bg-white md:p-12 p-0 w-full border-t border-black mx-auto">

                <div
                    onClick={handleGoBack}
                    className="flex items-center m-4 w-36 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                >
                    <FaChevronLeft className="text-xl  text-white" />
                    <span className="font-semibold text-lg">Go Back</span>
                </div>
                <div className=" md:p-12 md:pt-0 p-6">
                    {loading ? (
                        <div className="flex w-full justify-center items-center h-20">
                            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                        </div>
                    ) : (
                        <form className="space-y-4" autoComplete="off" >
                            <div className="p-4 rounded-xl shadow-md border border-blue-400 w-fit mx-auto my-4">
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Reference ID: <span className="text-blue-800">{applicationRefID}</span>
                                </h2>
                            </div>


                            <div className="SelectedServices border border-black p-5 rounded-md">
                                <h1 className="text-center text-2xl">
                                    SELECTED SERVICES<span className="text-red-500 text-xl">*</span>
                                </h1>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleDownloadAllFiles(serviceImagesState);
                                    }}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md"
                                >
                                    Download All
                                </button>
                                {servicesDataInfo.length > 0 && servicesDataInfo.some(serviceData => serviceData.serviceStatus) ? (
                                    servicesDataInfo.map((serviceData, index) => {
                                        if (serviceData.serviceStatus) {
                                            const formJson = JSON.parse(serviceData.reportFormJson.json);
                                            const preselectedStatus = selectedStatuses[index] || "";
                                            const preselectedImage = selectedImages[index] || "";
                                            const dbTable = formJson.db_table;

                                            // Extract images from the serviceData.annexureData.team_management_docs
                                            const serviceImages = serviceData.annexureData?.team_management_docs?.split(",") || [];

                                            return (
                                                <>

                                                    <div key={index} className="mb-6 md:flex items-center  justify-between mt-5">
                                                        {formJson.heading && (
                                                            <>
                                                                <span className="md:w-3/12 w-full mb-2 font-semibold">{formJson.heading}</span>
                                                                <select
                                                                    className="border mb-2 p-2 md:w-4/12  w-full rounded-md"
                                                                    value={preselectedStatus}
                                                                    onChange={(e) => handleStatusChange(e, dbTable, index)}
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
                                                                    <option value="completed_pink">COMPLETED PINK</option>
                                                                    <option value="stopcheck">STOPCHECK</option>
                                                                    <option value="active_employment">ACTIVE EMPLOYMENT</option>
                                                                    <option value="not_doable">NOT DOABLE</option>
                                                                    <option value="candidate_denied">CANDIDATE DENIED</option>
                                                                </select>
                                                            </>
                                                        )}

                                                        <div className="flex md:w-3/12 w-full mb-2 items-center gap-5">


                                                            <input
                                                                type="file"
                                                                multiple
                                                                name={formJson.db_table}
                                                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                onChange={(e) =>
                                                                    handleFileChange(index, dbTable, formJson.db_table, e)
                                                                }
                                                            />
                                                        </div>


                                                        {isModalOpen && (
                                                            <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex justify-center items-center z-50">
                                                                <div className="bg-white rounded-lg p-6 w-[80%] max-w-[700px]">
                                                                    <div className="flex justify-between items-center mb-4">
                                                                        <h2 className="text-xl font-bold">
                                                                            {modalType === "selected"
                                                                                ? "Selected Images"
                                                                                : "Preselected Images"}
                                                                        </h2>
                                                                        <button
                                                                            onClick={closeModal}
                                                                            className="text-red-500 text-lg font-bold"
                                                                        >
                                                                            X
                                                                        </button>
                                                                    </div>

                                                                    {/* Render Selected Images */}
                                                                    {modalType === "selected" && files[dbTable]?.selectedFiles?.length > 0 && (
                                                                        <Swiper
                                                                            onSwiper={(swiper) => setThumbsSwiper(swiper)}
                                                                            spaceBetween={10}
                                                                            slidesPerView={4}
                                                                            freeMode
                                                                            watchSlidesProgress
                                                                            modules={[Thumbs]}
                                                                            className="thumbsSwiper"
                                                                        >
                                                                            {/* Render images here */}
                                                                        </Swiper>
                                                                    )}

                                                                    {/* Render Preselected Images */}
                                                                    {modalType === "preselected" && preselectedImage && (
                                                                        <Swiper
                                                                            spaceBetween={10}
                                                                            slidesPerView={4}
                                                                            freeMode
                                                                            watchSlidesProgress
                                                                            modules={[Thumbs]}
                                                                            className="thumbsSwiper"
                                                                        >
                                                                            {preselectedImage.split(",").map((imgPath, idx) => (
                                                                                <SwiperSlide key={idx}>
                                                                                    <img
                                                                                        src={`${imgPath}`}
                                                                                        alt={`Preselected ${idx + 1}`}
                                                                                        className="w-20 h-20 object-cover rounded-md"
                                                                                    />
                                                                                </SwiperSlide>
                                                                            ))}
                                                                        </Swiper>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {serviceImages.length > 0 && (
                                                        <div className="mt-4 mb-8 pb-12 border-b border-b-black">
                                                            <h3 className="pb-2">{formJson.heading} IMAGES</h3>

                                                            <div className="flex flex-wrap gap-2">
                                                                <table className="w-full border-collapse border border-gray-300 mt-4">
                                                                    <thead>
                                                                        <tr className="bg-gray-200">
                                                                            <th className="border border-gray-300 px-4 py-2">Preview</th>
                                                                            <th className="border border-gray-300 px-4 py-2">File Name</th>
                                                                            <th className="border border-gray-300 px-4 py-2">Action</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {serviceImages.map((imgPath, imgIndex) => (
                                                                            <tr key={imgIndex} className='text-center'>
                                                                                <td className="border border-gray-300 px-4 py-2  w-[300px]">
                                                                                    <div className='flex justify-left'>
                                                                                        {/* <img
                                                                                            src={imgPath}
                                                                                            alt={`Preview ${imgIndex}`}
                                                                                            className="w-20 h-20 object-cover rounded-md"
                                                                                        /> */}
                                                                                        <FileViewer fileUrl={imgPath} className=" max-w-30" />
                                                                                    </div>
                                                                                </td>
                                                                                <td className="border border-gray-300 px-4 py-2">
                                                                                    {imgPath.split("/").pop()}
                                                                                </td>
                                                                                <td className="border border-gray-300 px-4 py-2">
                                                                                    {(() => {
                                                                                        const getFileExtension = (url) => url.split('.').pop().toLowerCase();
                                                                                        const fileExtension = getFileExtension(imgPath);

                                                                                        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'svg', 'heif', 'heic', 'avif', 'ico', 'jfif', 'raw', 'psd', 'ai', 'eps'].includes(fileExtension)) {
                                                                                            return (
                                                                                                <button
                                                                                                    className="px-3 py-2 bg-green-500 text-white rounded-md text-sm"
                                                                                                    onClick={(e) => handleDownloadViaProxy(imgPath, e)}
                                                                                                >
                                                                                                    Download Image
                                                                                                </button>
                                                                                            );
                                                                                        } else if (fileExtension === 'pdf') {
                                                                                            return (
                                                                                                <button
                                                                                                    className="px-3 py-2 bg-red-500 text-white rounded-md text-sm"
                                                                                                    onClick={(e) => handleDownloadViaProxy(imgPath, e)}
                                                                                                >
                                                                                                    Download PDF
                                                                                                </button>
                                                                                            );
                                                                                        } else if (['doc', 'docx', 'xls', 'xlsx'].includes(fileExtension)) {
                                                                                            return (
                                                                                                <button
                                                                                                    className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm"
                                                                                                    onClick={(e) => handleDownloadViaProxy(imgPath, e)}
                                                                                                >
                                                                                                    Open Document
                                                                                                </button>
                                                                                            );
                                                                                        } else if (fileExtension === 'zip') {
                                                                                            return (
                                                                                                <button
                                                                                                    className="px-3 py-2 bg-yellow-500 text-white rounded-md text-sm"
                                                                                                    onClick={(e) => handleDownloadViaProxy(imgPath, e)}
                                                                                                >
                                                                                                    Download ZIP
                                                                                                </button>
                                                                                            );
                                                                                        } else {
                                                                                            return <span className="text-red-500">Unsupported file type</span>;
                                                                                        }
                                                                                    })()}
                                                                                </td>

                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}

                                                </>

                                            );
                                        }
                                        return null;
                                    })
                                ) : (
                                    <div className="text-center text-gray-500 mt-5">
                                        No services available
                                    </div>
                                )}

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
                                    <DatePicker
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
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="first_insuff_reopened_date">First Insuff Cleared Date / Re-Opened date</label>
                                    <DatePicker
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
                                    />
                                    {errors.first_insuff_reopened_date && (
                                        <p className="text-red-500 text-sm">{errors.first_insuff_reopened_date}</p>
                                    )}
                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="second Level Insufficiency Remarks">Second Level Insufficiency Remarks</label>
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
                                    {/* <MultiSelect
                                        id="second_insufficiency_marks"
                                        name="second_insufficiency_marks"
                                        className="w-full p-3 mb-4 border border-gray-300 rounded-md"
                                        value={formData.updated_json?.insuffDetails?.second_insufficiency_marks || []}
                                        onChange={handleMultiSelectChange}
                                        options={optionsData}
                                    /> */}



                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="second Insuff Raised Date:">Second Insuff Raised Date:</label>
                                    <DatePicker
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
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="second Insuff Cleared Date / Re-Opened date">Second Insuff Cleared Date / Re-Opened date</label>
                                    <DatePicker
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
                                    />

                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="third Level Insufficiency Remarks">third Level Insufficiency Remarks</label>
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
                                    {/* <MultiSelect
                                        id="third_insufficiency_marks"
                                        name="third_insufficiency_marks"
                                        className="w-full p-3 mb-4 border border-gray-300 rounded-md"
                                        value={formData.updated_json?.insuffDetails?.third_insufficiency_marks || []}
                                        onChange={handleMultiSelectChange}
                                        options={optionsData}
                                    /> */}

                                </div>
                                <div className='flex grid md:grid-cols-2  gap-2'>
                                    <div className="mb-4">
                                        <label className='capitalize text-gray-500' htmlFor="third Insuff Raised Date:">third Insuff Raised Date:</label>
                                        <DatePicker
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
                                        />

                                    </div>
                                    <div className="mb-4">
                                        <label className='capitalize text-gray-500' htmlFor="third Insuff Cleared Date / Re-Opened date">third Insuff Cleared Date / Re-Opened date</label>
                                        <DatePicker
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
                                        />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="capitalize text-gray-500" htmlFor="component_status">
                                        TEAM MANAGEMENT
                                        <span className="text-red-500 text-xl">*</span>
                                    </label>
                                    <div className="flex items-center mt-2">
                                        <input
                                            type="checkbox"
                                            name="component_status"
                                            id="component_status"
                                            checked={componentStatus === 1}
                                            onChange={(e) => setComponentStatus(e.target.checked ? 1 : 0)}
                                            className="w-5 h-5 border rounded-md mr-2"
                                        />

                                        <label htmlFor="component_status" className="text-gray-700">
                                            Yes / No
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                onClick={handleSubmit}
                                className="p-6 py-3 bg-[#2c81ba] text-white font-bold  transition-all duration-300 ease-in-out transform hover:scale-105 rounded-md hover:bg-[#0f5381] "
                            >
                                Submit
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamManagementGenerateReport;
