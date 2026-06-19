import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaGraduationCap, FaBriefcase, FaIdCard } from 'react-icons/fa';
import axios from 'axios';

const BackgroundVerificationForm = () => {
    const [serviceDataImageInputNames, setServiceDataImageInputNames] = useState([]);
    const [errors, setErrors] = useState({});
    const [previousFields, setPreviousFields] = useState({});
    const [activeTab, setActiveTab] = useState(0); // Tracks the active tab (0, 1, or 2)

    const [updatedFields, setUpdatedFields] = useState({});
    const [annexureData, setAnnexureData] = useState({})
    const [files, setFiles] = useState({});
    const [loading, setLoading] = useState(null);
    const [mainLoading, setMainLoading] = useState(true);
    const [companyName, setCompanyName] = useState([]);
    const [applicantName, setApplicantName] = useState([]);

    const [showModal, setShowModal] = useState(false);  // Control modal visibility      
    const refs = useRef({});
    const [apiStatus, setApiStatus] = useState(true);
    const [progress, setProgress] = useState(0);
    const [fileNames, setFileNames] = useState([]);
    const [employmentType, setEmploymentType] = useState("Experienced");
    const [mobileNumber, setMobileNumber] = useState("");
    const [hiddenRows, setHiddenRows] = useState({});
    const [spouseName, setSpouseName] = useState("");
    const [checkedData, setCheckedData] = useState("");

    const [servicesIds, setServicesIds] = useState([]);
    const [cefApp, setCefApp] = useState([]);
    const [changedFields, setChangedFields] = useState({});

    const [dob, setDob] = useState("");
    const [gender, setGender] = useState("");
    const [pan, setPan] = useState("");
    const [aadhar, setAadhar] = useState("");
    const [ssn, setSsn] = useState("");
    const [nationality, setNationality] = useState("");
    const [maritalStatus, setMaritalStatus] = useState("");
    const [resumeFile, setResumeFile] = useState(null);
    const [govtIdFiles, setGovtIdFiles] = useState([]);
    const [isValidApplication, setIsValidApplication] = useState(true);
    const [serviceData, setServiceData] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const location = useLocation();
    const [branchId, setBranchId] = useState("");
    const [customerId, setCustomerId] = useState("");
    const [annexure, setAnnexure] = useState({});


    const [formData, setFormData] = useState({
        personal_information: {
            "full_name": applicantName,
            "former_name": "",
            "mb_no": mobileNumber,
            "father_name": "",
            "husband_name": "",
            "dob": "",
            "gender": "",
            "aadhar_card_number": "",
            "pan_card_number": "",
            "nationality": "",
            "marital_status": "",
            "full_address": "",
            "pin_code": "",
            "current_address_state": "",
            "current_prominent_landmark": "",
            "nearest_police_station": "",
            "current_from_date": "",
            "current_to_date": "",
            "residence_number": "",
            "alternate_mobile_number": ""
        },
    });
    const currentURL = location.pathname + location.search;

    function getValuesFromUrl(currentURL) {
        const result = {};
        const keys = [
            "YXBwX2lk",
            "YnJhbmNoX2lk",
            "Y3VzdG9tZXJfaWQ="
        ];

        keys.forEach(key => {
            const regex = new RegExp(`${key}=([^&]*)`);
            const match = currentURL.match(regex);
            result[key] = match && match[1] ? match[1] : null;
        });

        function isValidBase64(str) {
            const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
            return base64Pattern.test(str) && (str.length % 4 === 0);
        }

        function decodeKeyValuePairs(obj) {
            return Object.entries(obj).reduce((acc, [key, value]) => {
                const decodedKey = isValidBase64(key) ? atob(key) : key;
                const decodedValue = value && isValidBase64(value) ? atob(value) : null;
                acc[decodedKey] = decodedValue;
                return acc;
            }, {});
        }

        return decodeKeyValuePairs(result);
    }
    const handleFileChange = async (dbTable, fileName, e, cef_id, isSubmit) => {
        if (!e.target.files || e.target.files.length === 0) return; // Stop if no files are selected

        const selectedFiles = Array.from(e.target.files); // Convert FileList to an array
        const maxSize = 2 * 1024 * 1024; // 2MB size limit
        const allowedTypes = [
            'image/jpeg', 'image/png', 'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]; // Allowed file types

        let errors = [];
        selectedFiles.forEach((file) => {
            if (file.size > maxSize) errors.push(`${file.name}: File size must be less than 2MB.`);
            if (!allowedTypes.includes(file.type)) errors.push(`${file.name}: Invalid file type.`);
        });

        if (errors.length > 0) {
            setErrors((prevErrors) => ({ ...prevErrors, [fileName]: errors }));
            return;
        }

        // Update state with new files (override old ones)
        setFiles((prevFiles) => ({
            ...prevFiles,
            [dbTable]: { [fileName]: selectedFiles }, // Replace existing file list
        }));

        // Clear previous errors
        setErrors((prevErrors) => {
            const { [fileName]: removedError, ...restErrors } = prevErrors;
            return restErrors;
        });

        e.target.value = ''; // Reset input to allow re-selection

        // Upload only new files
        await uploadCustomerLogo(cef_id, selectedFiles, dbTable, fileName, isSubmit);
    };

    const uploadCustomerLogo = async (cef_id, selectedFiles, dbTable, fileName, isSubmit) => {
        const customerLogoFormData = new FormData();
        customerLogoFormData.append('branch_id', decodedValues.branch_id);
        customerLogoFormData.append('customer_id', decodedValues.customer_id);
        customerLogoFormData.append('candidate_application_id', decodedValues.app_id);
        customerLogoFormData.append('db_table', dbTable);
        customerLogoFormData.append('db_column', fileName);
        customerLogoFormData.append('cef_id', cef_id);
        customerLogoFormData.append('is_submit', isSubmit || decodedValues.customer_id);

        selectedFiles.forEach(file => customerLogoFormData.append('images', file));

        try {
            await axios.post(
                `https://api.screeningstar.co.in/branch/candidate-application/backgroud-verification/upload`,
                customerLogoFormData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            setProgress((prevProgress) => prevProgress + 100 / selectedFiles.length);
            isApplicationExists();
        } catch (err) {
            Swal.fire('Error!', `An error occurred while uploading: ${err.message}`, 'error');
        }
    };


    const decodedValues = getValuesFromUrl(currentURL);

    const isApplicationExists = useCallback(() => {
        setMainLoading(true)
        if (isValidApplication && decodedValues.app_id && decodedValues.branch_id && decodedValues.customer_id) {
            fetch(`https://api.screeningstar.co.in/branch/candidate-application/backgroud-verification/is-application-exist?candidate_application_id=${decodedValues.app_id}&branch_id=${decodedValues.branch_id}&customer_id=${decodedValues.customer_id}`)
                .then(res => res.json()
                )
                .then(result => {
                    const newToken = result.token || result._token;
                    if (newToken) {
                        localStorage.setItem("_token", newToken);
                    }
                    setMainLoading(false)

                    if (!result.status) {


                        setIsValidApplication(false);
                        const form = document.getElementById('bg-form');
                        Swal.fire({
                            title: 'Error',
                            text: result.message,
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                        if (form) form.remove();
                    } else {

                        const services = result.data.application.services.split(',').map(service => service.trim());
                        setServicesIds(services);
                        const flattenedServiceData = Object.values(result.data.serviceData).map(service => service.jsonData);
                        const parsedData = (Object.values(result.data.serviceData) || []);

                        setServiceData(parsedData);

                        let allJsonData = [];
                        let allJsonDataValue = [];

                        for (const key in parsedData) {
                            if (parsedData.hasOwnProperty(key)) {
                                const jsonData = parsedData[key]?.jsonData;  // Safe navigation in case it's null or undefined
                                if (jsonData) {
                                    allJsonData.push(jsonData);  // Store jsonData in the array
                                    ;
                                }

                                const jsonDataValue = parsedData[key]?.data;  // Safe navigation in case it's null or undefined
                                if (jsonDataValue) {
                                    allJsonDataValue.push(jsonDataValue);  // Store jsonData in the array
                                }
                            }
                        }


                        // Constructing the annexureData object
                        allJsonData.forEach(service => {
                            service?.rows?.forEach(row => {  // Check if rows exist before iterating
                                row?.inputs?.forEach(input => {
                                    // Fetch the static inputs dynamically from annexureData

                                    // Fetch the dynamic field value from allJsonDataValue
                                    let fieldValue = allJsonDataValue.find(data => data && data.hasOwnProperty(input.name)); // Check for null or undefined before accessing `hasOwnProperty`
                                    // If fieldValue exists, we set it, otherwise, static value should remain
                                    if (fieldValue && fieldValue.hasOwnProperty(input.name)) {

                                        // Set dynamic value in the correct field in annexureData
                                        if (!annexureData[service.db_table]) {
                                            annexureData[service.db_table] = {}; // Initialize the service table if it doesn't exist
                                        }

                                        // Set the dynamic value in the service table under the input's name
                                        annexureData[service.db_table][input.name] = fieldValue[input.name] || "  ";


                                    } else {

                                    }
                                });
                            });
                        }

                        )


                        setAnnexureData(annexureData);
                        setCompanyName(result.data.application.name || '');
                        setApplicantName(result.data.application.name || '');
                        setMobileNumber(result.data.application.mobile_number || '');

                        const cefApplication = result.data.cefApplication || {};
                        setCefApp(result.data.cefApplication)
                        setFormData(prev => ({
                            ...prev,
                            personal_information: {
                                full_name: cefApplication.full_name || result.data.application.name || "",
                                former_name: cefApplication.former_name || "",
                                mb_no: cefApplication.mb_no || result.data.application.mobile_number || "",
                                father_name: cefApplication.father_name || "",
                                husband_name: cefApplication.husband_name || "",
                                dob: cefApplication.dob || "",
                                gender: cefApplication.gender || "",
                                aadhar_card_number: cefApplication.aadhar_card_number || "",
                                pan_card_number: cefApplication.pan_card_number || "",
                                nationality: cefApplication.nationality || "",
                                marital_status: cefApplication.marital_status || "",
                                full_address: cefApplication.full_address || "",
                                pin_code: cefApplication.pin_code || "",
                                current_address_state: cefApplication.current_address_state || "",
                                current_prominent_landmark: cefApplication.current_prominent_landmark || "",
                                nearest_police_station: cefApplication.nearest_police_station || "",
                                current_from_date: cefApplication.current_from_date || "",
                                current_to_date: cefApplication.current_to_date || "",
                                residence_number: cefApplication.residence_number || "",
                                alternate_mobile_number: cefApplication.alternate_mobile_number || ""
                            }
                        }));
                        parsedData?.forEach((serviceArr, serviceindex) => {
                            const service = serviceArr?.jsonData;
                            if (!service || !service.rows) {
                                console.warn(`Skipping service at index ${serviceindex}: Invalid or missing data`, serviceArr);
                                return; // Skip this iteration if service data is invalid
                            }

                            service.rows.forEach((row, rowindex) => {
                                console.log(`Processing row ${rowindex}:`, row);

                                const checkboxInput = row.inputs?.find(input => input.type === 'checkbox');
                                console.log(`Found checkbox input:`, checkboxInput);

                                const checkboxName = checkboxInput?.name;
                                console.log(`Checkbox name:`, checkboxName);

                                row.inputs?.forEach((input, inputIndex) => {
                                    console.log(`Processing input ${inputIndex}:`, input);

                                    const isCheckbox = input.type === "checkbox";
                                    console.log(`Is checkbox:`, isCheckbox);

                                    const isDoneCheckbox =
                                        isCheckbox &&
                                        (input.name.startsWith("done_or_not") || input.name.startsWith("has_not_done"));
                                    console.log(`Is Done Checkbox:`, isDoneCheckbox);

                                    const annexureValue = annexureData?.[service.db_table]?.[input.name];
                                    console.log(`Annexure value for ${input.name}:`, annexureValue);

                                    const isChecked = ["1", 1, true, "true"].includes(annexureValue);
                                    console.log(`Is checked:`, isChecked);

                                    toggleRowsVisibility(serviceindex, rowindex, isChecked);
                                    console.log(`Toggled visibility for row ${rowindex} with isChecked=${isChecked}`);
                                });
                            });
                        });




                        console.log('parsedData', parsedData)
                        let serviceindex = 1;
                        let rowindex = 1;
                        let isChecked = 1;


                    }
                })
                .catch(err => {
                    Swal.fire({
                        title: 'Error',
                        text: err.message,
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                    setMainLoading(false)

                });
        }
    }, [isValidApplication, decodedValues.app_id, decodedValues.branch_id, decodedValues.customer_id]);

    useEffect(() => {
        isApplicationExists();
    }, [isApplicationExists]);



    const parseJsonSafely = (jsonString) => {
        try {
            const sanitizedString = jsonString.replace(/\\/g, '\\\\');
            return JSON.parse(sanitizedString);
        } catch (error) {
            console.error("Failed to parse JSON", error);
            return null;
        }
    };


    // const handleCheckboxChange = (serviceIndex, serviceKey, inputName, isChecked) => {
    //     console.log("serviceId:", inputName);
    //     console.log("isChecked:", isChecked);
    //     setCheckedData((prevChangedFields) => ({
    //         ...prevChangedFields,
    //         [serviceKey]: {
    //             ...prevChangedFields[serviceKey],
    //             [inputName]: isChecked,
    //         }
    //     }));
    //     setServiceData((prevServiceData) => {
    //         const updatedServiceData = [...prevServiceData];

    //         // Update the checkbox value in the service data
    //         updatedServiceData[serviceIndex] = {
    //             ...updatedServiceData[serviceIndex],
    //             data: {
    //                 ...updatedServiceData[serviceIndex].data,
    //                 [inputName]: isChecked,
    //             },
    //         };

    //         // Store the changed field temporarily


    //         return updatedServiceData;
    //     });
    //     setChangedFields((prevChangedFields) => ({
    //         ...prevChangedFields,
    //         [serviceKey]: {
    //             ...prevChangedFields[serviceKey],
    //             [inputName]: isChecked,
    //         }
    //     }));
    // };


    console.log('annexureData', annexureData)
    const handleCloseForm = (serviceId) => {
        setSelectedServices((prevSelectedServices) =>
            prevSelectedServices.filter((id) => id !== serviceId)
        );

    };

    const handleChange = (e) => {
        const { name, value } = e.target; // No `files` handling for select
        const isAnnexureField = name.startsWith("annexure");

        setFormData((prevFormData) => {
            // Store changed field temporarily before submission
            if (!isAnnexureField) {
                setChangedFields((prev) => ({
                    ...prev,
                    [name]: value, // Track changes for text and select inputs
                }));
            }

            return {
                ...prevFormData,
                personal_information: !isAnnexureField
                    ? { ...prevFormData.personal_information, [name]: value }
                    : prevFormData.personal_information,
                annexure: isAnnexureField
                    ? { ...prevFormData.annexure, [name]: value }
                    : prevFormData.annexure,
            };
        });
    };

    const handleBlur = async (e, servicetable, serviceIndex) => {
        const { name, dataset, type, checked, value } = e.target;

        if (type === "checkbox") {
            console.log(`${name} is a checkbox and is ${checked ? "checked" : "unchecked"}`);
            // Perform checkbox-specific logic here
        } else {
            console.log(`${name} is not a checkbox, value: ${value}`);
            // Handle other input types if necessary
        }

        const serviceKey = dataset.serviceKey; // Get serviceKey from input dataset
        const inputKey = dataset.inputKey; // Get input name from dataset

        console.log("Event target:", e.target);
        console.log("Service table:", servicetable);
        console.log("Service index:", serviceIndex);

        const changedKey = serviceIndex || name;
        console.log(`changedFields - `, changedFields);
        if (serviceIndex !== undefined) {
            console.log("serviceIndex is defined");

            if (changedFields?.[servicetable]?.[serviceIndex] !== undefined) {
                console.log("Using changedFields[servicetable][serviceIndex]");
            } else {
                console.log("changedFields[servicetable][serviceIndex] is undefined, falling back to changedFields[changedKey]");
            }
        } else {
            console.log("serviceIndex is undefined, using changedFields[changedKey]");
        }

        const currentValue = serviceIndex !== undefined && changedFields?.[servicetable]?.[serviceIndex] !== undefined
            ? changedFields[servicetable][serviceIndex]
            : changedFields[changedKey];

        console.log("Changed key:", changedKey);
        console.log("Current value:", currentValue);

        const previousValue = previousFields[changedKey]; // Assuming you store previous values in a state
        console.log("Previous value:", previousValue);

        if (currentValue === previousValue) {
            console.log("No change detected. Skipping API call.");
            return;
        }

        const requestBody = {
            branch_id: decodedValues.branch_id,
            customer_id: decodedValues.customer_id,
            application_id: decodedValues.app_id,
            is_submit: 0,
        };

        if (servicetable) {
            requestBody.annexure = {
                [servicetable]: changedFields[servicetable],
            };
        } else {
            requestBody.personal_information = {
                [name]: changedFields[changedKey],
            };
        }

        console.log("Request body:", requestBody);

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const requestOptions = {
            method: "PUT",
            headers: myHeaders,
            body: JSON.stringify(requestBody),
            redirect: "follow",
        };

        try {
            const response = await fetch(
                "https://api.screeningstar.co.in/branch/candidate-application/backgroud-verification/submit",
                requestOptions
            );
            const data = await response.json();

            console.log("API Response:", data);

            if (!response.ok || !data.status) {
                throw new Error(data.message || "Failed to submit data");
            }

            console.log("Successfully submitted:", data);

            // Update previousFields to match the new values
            setPreviousFields((prev) => ({
                ...prev,
                [changedKey]: currentValue,
            }));
            console.log("Updated previous fields:", previousFields);

            // Remove submitted field from changedFields
            setChangedFields((prev) => {
                const newFields = { ...prev };
                delete newFields[changedKey];
                return newFields;
            });
            console.log("Updated changed fields:", changedFields);

        } catch (error) {
            console.error("Error submitting data:", error);
        }
    };








    const handleSubmit = async (e, isSubmit) => {
        setLoading(isSubmit);
        e.preventDefault();
        const fileCount = Object.keys(files).length;
        const TotalApiCalls = fileCount + 1; // Include the API call for the form data
        const dataToSubmitting = 100 / TotalApiCalls;
        const raw = JSON.stringify({
            branch_id: decodedValues.branch_id,
            customer_id: decodedValues.customer_id,
            application_id: decodedValues.app_id,
            ...formData,
            annexure: annexureData,
            is_submit: isSubmit
        });

        // Set headers
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        // API request options
        const requestOptions = {
            method: "PUT",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        try {
            // Make the API call
            const response = await fetch("https://api.screeningstar.co.in/branch/candidate-application/backgroud-verification/submit", requestOptions);

            // Parse the response data
            const data = await response.json();
            const newToken = data.token || data._token;
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }

            if (!response.ok || !data.status) {
                // Handle error dynamically based on response status
                throw new Error(data.message || 'Failed to submit data');
            }

            // Dynamic success alert based on response message
            let alertTitle = "Success";
            let alertText = data.message || "CEF Application Submitted Successfully.";  // Use response message

            if (fileCount > 0) {
                // Check if files are included and handle upload
                alertText += ` Files will now be uploaded.`;
                await uploadCustomerLogo(data.cef_id, fileCount, TotalApiCalls, isSubmit); // Upload files
                setProgress(100); // Set progress to 100% after file upload
            }

            // Show dynamic success alert
            Swal.fire({
                title: alertTitle,
                text: alertText,
                icon: "success",
                confirmButtonText: "Ok",
            }).then(() => {
                isApplicationExists();
            });

        } catch (error) {
            console.error('Error:', error);
            // Show dynamic error alert
            Swal.fire({
                title: "Error",
                text: error.message || `There was an error submitting the data. Please try again.`,
                icon: "error",
                confirmButtonText: "Ok",
            });
        } finally {
            setLoading(null);
        }
    };

    const handleServiceChange = (serviceIndex, serviceKey, inputName, value) => {

        setAnnexureData((prevData) => {
            const updatedData = {
                ...prevData,
                [serviceKey]: {
                    ...prevData[serviceKey],
                    [inputName]: value,  // Store the value based on serviceKey and inputName
                },
            };

            return updatedData;
        });

        setServiceData((prevServiceData) => {
            const updatedServiceData = [...prevServiceData];

            updatedServiceData[serviceIndex] = {
                ...updatedServiceData[serviceIndex],
                data: {
                    ...updatedServiceData[serviceIndex].data,
                    [inputName]: value, // Update the specific inputName with the new value
                },
            };

            return updatedServiceData;
        });

        // Track changes
        setChangedFields((prevChangedFields) => ({
            ...prevChangedFields,
            [serviceKey]: {
                ...prevChangedFields[serviceKey],
                [inputName]: value,
            }
        }));
    };
    const handleCheckboxChange = (serviceIndex, serviceKey, inputName, e) => {
        const { type, checked, value } = e.target;
        const finalValue = type === "checkbox" ? checked : value; // Ensure correct value handling
    
        // Update Annexure Data
        setAnnexureData((prevData) => ({
            ...prevData,
            [serviceKey]: {
                ...prevData[serviceKey],
                [inputName]: finalValue, // Store the checkbox checked state or value
            },
        }));
    
        // Update Changed Fields
        setChangedFields((prevData) => {
            const updatedFields = {
                ...prevData,
                [serviceKey]: {
                    ...prevData[serviceKey],
                    [inputName]: finalValue,
                },
            };
            console.log("MainChangeFields -", updatedFields); // ✅ Logs correctly inside state update
            return updatedFields;
        });
    
        // Call handleBlur after state updates
        handleBlur(e, serviceKey, serviceIndex);
    };
    

    const handleInputChange = (category, key, value) => {
        setAnnexure(prevAnnexure => ({
            ...prevAnnexure,
            [category]: {
                ...prevAnnexure[category],
                [key]: value
            }
        }));
    };
    const toggleRowsVisibility = (serviceIndex, rowIndex, isChecked) => {
        console.log('serviceIndex, rowIndex, isChecked', serviceIndex, rowIndex, isChecked);

        setHiddenRows((prevState) => {
            const newState = { ...prevState };

            // Validate serviceData[serviceIndex]
            const serviceEntry = serviceData?.[serviceIndex];
            if (!serviceEntry || !serviceEntry.jsonData || !serviceEntry.jsonData.rows) {
                console.error(`Service data missing at index ${serviceIndex}`, serviceData);
                return prevState; // Exit function to avoid errors
            }

            const serviceRows = serviceEntry.jsonData.rows;
            const row = serviceRows?.[rowIndex];
            if (!row) {
                console.error(`Row not found at index ${rowIndex} for service ${serviceIndex}`);
                return prevState;
            }

            console.log("Processing row:", row);

            // Filter inputs safely
            const fileInputs = row?.inputs?.filter(input => input.type === 'file') || [];

            if (isChecked) {
                setServiceDataImageInputNames((prevFileInputs) => {
                    return prevFileInputs.filter(fileInput => {
                        const fileInputName = Object.values(fileInput)[0];
                        const isCurrentServiceFile = fileInputName.startsWith(`${serviceEntry.db_table}_`);

                        return !(isCurrentServiceFile && row.inputs.some(input =>
                            input.type === 'checkbox' &&
                            typeof input.name === 'string' &&
                            (input.name.startsWith('done_or_not') || input.name.startsWith('has_not_done'))
                        ));
                    });
                });

                for (let i = rowIndex + 1; i < serviceRows.length; i++) {
                    const nextRow = serviceRows[i];
                    const hasCheckbox = nextRow.inputs && nextRow.inputs.some(input => input.type === 'checkbox');

                    const isSpecialCheckbox = hasCheckbox && nextRow.inputs.some(input => {
                        return typeof input.name === 'string' &&
                            (input.name.startsWith("done_or_not") || input.name.startsWith("has_not_done"));
                    });

                    if (isSpecialCheckbox) {
                        continue;
                    }

                    newState[`${serviceIndex}-${i}`] = true;
                    console.log(`Row ${i} made visible`);
                }
            } else {
                console.log("Checkbox is unchecked, hiding rows...");

                for (let i = rowIndex + 1; i < serviceRows.length; i++) {
                    const nextRow = serviceRows[i];
                    const hasCheckbox = nextRow.inputs && nextRow.inputs.some(input => input.type === 'checkbox');

                    console.log(`Row ${i} - Has checkbox?:`, hasCheckbox);

                    const isSpecialCheckbox = hasCheckbox && nextRow.inputs.some(input => {
                        return typeof input.name === 'string' &&
                            (input.name.startsWith("done_or_not") || input.name.startsWith("has_not_done"));
                    });

                    console.log(`Row ${i} - Is special checkbox?`, isSpecialCheckbox);

                    if (isSpecialCheckbox) {
                        console.log(`Row ${i} skipped due to special checkbox.`);
                        continue;
                    }

                    delete newState[`${serviceIndex}-${i}`];
                    console.log(`Row ${i} hidden`);
                }
            }

            console.log("Final Hidden Rows State:", newState);
            return newState;
        });
    };



    const FileViewer = ({ fileUrl }) => {
        if (!fileUrl) {
            return <p>No file provided</p>; // Handle undefined fileUrl
        }

        const getFileExtension = (url) => url.split('.').pop().toLowerCase();

        const renderIframe = (url) => (
            <iframe
                src={`https://docs.google.com/gview?url=${url}&embedded=true`}
                width="100%"
                height="100%"
                title="File Viewer"
            />
        );

        const fileExtension = getFileExtension(fileUrl);

        // Handle multiple images (split by commas)
        if (fileUrl.includes(',')) {
            const imageUrls = fileUrl.split(',').map((url) => url.trim());
            return (
                <div
                    className="image-gallery"
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '10px',
                        justifyContent: 'flex-start', // Align images to the left
                    }}
                >
                    {imageUrls.map((url, index) => (
                        <div key={index} style={{ flex: '1 1 200px', maxWidth: '200px', }}>
                            <img src={url} alt={`Image ${index + 1}`} style={{ width: '100%', height: 'auto' }} />
                        </div>
                    ))}
                </div>
            );
        }

        // Render for single image
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(fileExtension)) {
            return <img src={fileUrl} alt="Image File" style={{ maxWidth: '100%' }} />;
        }

        // Render for documents and other types of files
        if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(fileExtension)) {
            return renderIframe(fileUrl);
        }

        return <p>Unsupported file type</p>;
    };

    return (
        <>
            {
                mainLoading ? (
                    <div className='flex justify-center h-full items-center py-6' >

                        <div className="flex w-full  justify-center items-center ">
                            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                        </div>


                    </div>
                ) : (
                    <form className='py-6 bg-[#e5e7eb24]' onSubmit={handleSubmit} id='bg-form' >
                        <h4 className="text-Black md:text-3xl  text-xl md:mb-6 mb-3 text-center  font-bold" > Background Verification Form </h4>
                        < div className="md:p-6 p-3 rounded xl:w-9/12 m-auto " >
                            <div className="md:mb-6 mb-2 p-4 rounded-md" >
                                <h5 className="text-lg font-bold" > Company name: <span className="text-lg font-normal" > {companyName} </span></h5 >
                            </div>

                            < div className="grid grid-cols-1 md:grid-cols-1 bg-white shadow-md gap-4 mb-6 border rounded-md  p-4" >
                                <div className="form-group col-span-2" >
                                    <label>Applicant’s CV: <span className="text-red-500" >* </span></label >
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" // Restrict to specific file types
                                        className="form-control border rounded w-full bg-white p-3 mt-2"
                                        name="resume_file"
                                        id="resume_file"
                                        onChange={(e) => handleFileChange("cef_applications", "resume_file", e)}
                                        ref={(el) => (refs.current["resume_file"] = el)} // Attach ref here
                                        onBlur={(e) =>
                                            handleFileChange(
                                                "cef_applications",
                                                "resume_file",
                                                e,// Pass the necessary cef_id here
                                                false // For onBlur, pass false to indicate it's not a submit action
                                            )
                                        }
                                    />

                                    {errors.resume_file && <p className="text-red-500" > {errors.resume_file} </p>}
                                    <p className="text-gray-500 text-sm mt-2" >
                                        Only JPG, PNG, PDF, DOCX, and XLSX files are allowed.Max file size: 2MB.
                                    </p>

                                    {cefApp && cefApp.resume_file && (
                                        <div className="mt-2 object-cover rounded-md">
                                            <FileViewer fileUrl={cefApp.resume_file} className="" />
                                        </div>
                                    )}

                                </div>
                                < div className="form-group col-span-2" >
                                    <label>Attach Govt.ID Proof: <span className="text-red-500" >* </span></label >
                                    <input


                                        type="file"
                                        accept=".jpg,.jpeg,.png" // Restrict to image files
                                        className="form-control border rounded w-full bg-white p-3 mt-2"
                                        name="govt_id"
                                        onChange={(e) => handleFileChange("cef_applications", "govt_id", e)}
                                        onBlur={(e) =>
                                            handleFileChange(
                                                "cef_applications",
                                                "govt_id",
                                                e,// Pass the necessary cef_id here
                                                false // For onBlur, pass false to indicate it's not a submit action
                                            )
                                        }
                                        multiple // Allow multiple file selection
                                        ref={(el) => (refs.current["cef_applications"] = el)} // Attach ref here
                                    />
                                    {errors.govt_id && <p className="text-red-500" > {errors.govt_id} </p>}
                                    <p className="text-gray-500 text-sm mt-2" >
                                        Only JPG, PNG, PDF, DOCX, and XLSX files are allowed.Max file size: 2MB.
                                    </p>
                                    {cefApp && cefApp.govt_id && (
                                        <div className='mt-2 object-cover rounded-md'>
                                            <div className="">
                                                <FileViewer fileUrl={cefApp.govt_id} className=" max-h-20 flex gap-3" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            < div className='border bg-white shadow-md  p-4 rounded-md' >
                                <h4 className="md:text-center text-start md:text-2xl text-sm my-6 font-bold " > Personal Information </h4>

                                < div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6 " >
                                    <div className="form-group" >
                                        <label htmlFor="full_name" > Full Name as per Govt ID Proof(first, middle, last): <span className="text-red-500" >* </span></label >
                                        <input
                                            onBlur={handleBlur}
                                            onChange={handleChange}
                                            value={formData.personal_information.full_name || applicantName}
                                            type="text"
                                            className="form-control border rounded w-full p-2 mt-2"
                                            id="full_name"
                                            name="full_name"
                                            ref={(el) => (refs.current["full_name"] = el)}
                                        />

                                        {errors.full_name && <p className="text-red-500" > {errors.full_name} </p>}
                                    </div>
                                    < div className="form-group" >
                                        <label htmlFor="former_name" > Former Name / Maiden Name(if applicable)<span className="text-red-500" >* </span></label >
                                        <input
                                            onBlur={handleBlur}
                                            onChange={handleChange}
                                            value={formData.personal_information.former_name}
                                            type="text"
                                            className="form-control border rounded w-full p-2 mt-2"
                                            id="former_name"
                                            ref={(el) => (refs.current["former_name"] = el)} // Attach ref here
                                            name="former_name"
                                        />
                                        {errors.former_name && <p className="text-red-500"> {errors.former_name} </p>}
                                    </div>
                                    < div className="form-group" >
                                        <label htmlFor="mob_no" > Mobile Number: <span className="text-red-500" >* </span></label >
                                        <input
                                            onBlur={handleBlur}
                                            onChange={handleChange}
                                            value={formData.personal_information.mb_no}
                                            type="tel"
                                            className="form-control border rounded w-full p-2 mt-2"
                                            name="mb_no"
                                            id="mob_no"
                                            minLength="10"
                                            maxLength="10"
                                            ref={(el) => (refs.current["mob_no"] = el)} // Attach ref here

                                        />
                                        {errors.mb_no && <p className="text-red-500" > {errors.mb_no} </p>}
                                    </div>
                                </div>
                                < div className="grid grid-cols-1 md:grid-cols-3 gap-4" >

                                    <div className="form-group" >
                                        <label htmlFor="father_name" > Father's Name: <span className="text-red-500">*</span></label>
                                        < input
                                            onBlur={handleBlur}
                                            onChange={handleChange}
                                            value={formData.personal_information.father_name}
                                            type="text"
                                            className="form-control border rounded w-full p-2 mt-2"
                                            id="father_name"
                                            name="father_name"
                                            ref={(el) => (refs.current["father_name"] = el)} // Attach ref here

                                        />
                                        {errors.father_name && <p className="text-red-500" > {errors.father_name} </p>}
                                    </div>
                                    < div className="form-group" >
                                        <label htmlFor="husband_name" > Spouse's Name</label>
                                        < input
                                            onBlur={handleBlur}
                                            onChange={handleChange}
                                            value={formData.personal_information.husband_name}
                                            type="text"
                                            className="form-control border rounded w-full p-2 mt-2"
                                            id="husband_name"
                                            ref={(el) => (refs.current["husband_name"] = el)} // Attach ref here
                                            name="husband_name"
                                        />
                                    </div>

                                    < div className="form-group" >
                                        <label htmlFor="dob" > DOB: <span className="text-red-500" >* </span></label >
                                        <input
                                            onBlur={handleBlur}
                                            onChange={handleChange}
                                            value={formData.personal_information.dob}
                                            type="date"
                                            className="uppercase form-control border rounded w-full p-2 mt-2"
                                            name="dob"
                                            id="dob"
                                            ref={(el) => (refs.current["dob"] = el)} // Attach ref here

                                        />
                                        {errors.dob && <p className="text-red-500" > {errors.dob} </p>}
                                    </div>
                                </div>
                                < div className="grid grid-cols-1 md:grid-cols-1 gap-4" >

                                    <div className="form-group my-4" >
                                        <label htmlFor="gender" >
                                            Gender: <span className="text-red-500" >* </span>
                                        </label>
                                        < select
                                            onBlur={handleBlur}
                                            onChange={handleChange}
                                            value={formData.personal_information.gender}
                                            className="form-control border rounded w-full p-2 mt-2"
                                            name="gender"
                                            id="gender"
                                            ref={(el) => (refs.current["gender"] = el)} // Attach ref here
                                        >
                                            <option value="" disabled >
                                                Select gender
                                            </option>
                                            < option value="male" > Male </option>
                                            < option value="female" > Female </option>
                                            < option value="other" > Other </option>
                                        </select>
                                        {errors.gender && <p className="text-red-500" > {errors.gender} </p>}
                                    </div>
                                </div>
                                < div className="grid grid-cols-1 md:grid-cols-3 gap-4" >

                                    <div className='form-group' >
                                        <label>Aadhar card No </label>
                                        < input
                                            onBlur={handleBlur}
                                            type="text"
                                            name="aadhar_card_number"
                                            value={formData.personal_information.aadhar_card_number}
                                            onChange={handleChange}

                                            className="form-control border rounded w-full p-2 mt-2"
                                        />

                                    </div>

                                    <div className='form-group' >
                                        <label>Pan card No </label>
                                        < input
                                            onBlur={handleBlur}
                                            type="text"
                                            name="pan_card_number"
                                            value={formData.personal_information.pan_card_number}
                                            onChange={handleChange}

                                            className="form-control border rounded w-full p-2 mt-2"
                                        />

                                    </div>
                                </div>




                                < div className="grid grid-cols-1 md:grid-cols-2 gap-4" >
                                    <div className="form-group" >
                                        <label htmlFor="nationality" > Nationality: <span className="text-red-500" >* </span></label >
                                        <input
                                            onBlur={handleBlur}
                                            onChange={handleChange}
                                            value={formData.personal_information.nationality}
                                            type="text"
                                            className="form-control border rounded w-full p-2 mt-2"
                                            name="nationality"
                                            id="nationality"
                                            ref={(el) => (refs.current["nationality"] = el)} // Attach ref here

                                        />
                                        {errors.nationality && <p className="text-red-500" > {errors.nationality} </p>}
                                    </div>
                                    < div className="form-group" >
                                        <label htmlFor="marital_status" > Marital Status: <span className="text-red-500" >* </span></label >
                                        <select
                                            onBlur={handleBlur}
                                            ref={(el) => (refs.current["marital_status"] = el)}
                                            className="form-control border rounded w-full p-2 mt-2"
                                            name="marital_status"
                                            id="marital_status"
                                            onChange={handleChange}

                                        >
                                            <option value="" > SELECT Marital STATUS </option>
                                            < option value="Dont wish to disclose" > Don't wish to disclose</option>
                                            < option value="Single" > Single </option>
                                            < option value="Married" > Married </option>
                                            < option value="Widowed" > Widowed </option>
                                            < option value="Divorced" > Divorced </option>
                                            < option value="Separated" > Separated </option>
                                        </select>
                                        {errors.marital_status && <p className="text-red-500" > {errors.marital_status} </p>}
                                    </div>
                                </div>
                                < div className='border bg-white shadow-md border-gray-300 p-6 rounded-md mt-5 hover:transition-shadow duration-300' >

                                    <h3 className='md:text-center text-start md:text-2xl text-sm font-bold my-5' > Current Address </h3>
                                    < div className="grid grid-cols-1 md:grid-cols-3 gap-4" >

                                        <div className="form-group" >
                                            <label htmlFor="full_name" > Full Address < span className="text-red-500" >* </span></label >
                                            <input
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                value={formData.personal_information.full_address}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="full_address"
                                                name="full_address"
                                                ref={(el) => (refs.current["full_address"] = el)} // Attach ref here

                                            />
                                            {errors.full_address && <p className="text-red-500" > {errors.full_address} </p>}
                                        </div>
                                        < div className="form-group" >
                                            <label htmlFor="pin_code" > Pin Code < span className="text-red-500" >* </span></label >
                                            <input
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                value={formData.personal_information.pin_code}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="pin_code"
                                                name="pin_code"
                                                ref={(el) => (refs.current["pin_code"] = el)} // Attach ref here

                                            />
                                            {errors.pin_code && <p className="text-red-500" > {errors.pin_code} </p>}
                                        </div>

                                        < div className="form-group" >
                                            <label htmlFor="current_address_state" > State < span className="text-red-500" >* </span></label >
                                            <input
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                value={formData.personal_information.current_address_state}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="current_address_state"
                                                name="current_address_state"
                                                ref={(el) => (refs.current["current_address_state"] = el)} // Attach ref here

                                            />
                                            {errors.current_address_state && <p className="text-red-500" > {errors.current_address_state} </p>}
                                        </div>
                                        < div className="form-group" >
                                            <label htmlFor="current_prominent_landmark" > Prominent Landmark < span className="text-red-500" >* </span></label >
                                            <input
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                value={formData.personal_information.current_prominent_landmark}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="current_prominent_landmark"
                                                name="current_prominent_landmark"
                                                ref={(el) => (refs.current["current_prominent_landmark"] = el)} // Attach ref here

                                            />
                                            {errors.current_prominent_landmark && <p className="text-red-500" > {errors.current_prominent_landmark} </p>}
                                        </div>
                                        < div className="form-group" >
                                            <label htmlFor="nearest_police_station" > Nearest Police Station.< span className="text-red-500" >* </span></label >
                                            <input
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                value={formData.personal_information.nearest_police_station}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="nearest_police_station"
                                                name="nearest_police_station"
                                                ref={(el) => (refs.current["nearest_police_station"] = el)} // Attach ref here

                                            />
                                            {errors.nearest_police_station && <p className="text-red-500" > {errors.nearest_police_station} </p>}
                                        </div>
                                    </div>
                                    <div className='my-10 mb-6'>
                                        <label htmlFor="" className='font-bold' >Period Of Stay < span className="text-red-500" >*</span></label >
                                    </div>
                                    < div className="grid grid-c ols-1 md:grid-cols-2 gap-4" >
                                        < div className="form-group" >
                                            <label htmlFor="current_from_date"> From Date< span className="text-red-500" >* </span></label >
                                            <input
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                value={formData.personal_information.current_from_date}
                                                type="date"
                                                className="uppercase form-control border rounded w-full p-2 mt-2"
                                                id="current_from_date"
                                                name="current_from_date"
                                                ref={(el) => (refs.current["current_from_date"] = el)} // Attach ref here

                                            />
                                            {errors.current_from_date && <p className="text-red-500" > {errors.current_from_date} </p>}
                                        </div>
                                        <div className="form-group" >
                                            <label htmlFor="current_to_date" > To Date < span className="text-red-500" >* </span></label >
                                            <input
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                value={formData.personal_information.current_to_date}
                                                type="date"
                                                className="uppercase form-control border rounded w-full p-2 mt-2"
                                                id="current_to_date"
                                                name="current_to_date"
                                                ref={(el) => (refs.current["current_to_date"] = el)} // Attach ref here

                                            />
                                            {errors.current_to_date && <p className="text-red-500" > {errors.current_to_date} </p>}
                                        </div>
                                        < div className="form-group" >
                                            <label htmlFor="residence_number"> Residence Number< span className="text-red-500" >* </span></label >
                                            <input
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                value={formData.personal_information.residence_number}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="residence_number"
                                                name="residence_number"
                                                ref={(el) => (refs.current["residence_number"] = el)} // Attach ref here

                                            />
                                            {errors.residence_number && <p className="text-red-500" > {errors.residence_number} </p>}
                                        </div>
                                        < div className="form-group" >
                                            <label htmlFor="alternate_mobile_number" > Alternate Mobile Number < span className="text-red-500" >* </span></label >
                                            <input
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                value={formData.personal_information.alternate_mobile_number}
                                                type="number"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="alternate_mobile_number"
                                                name="alternate_mobile_number"
                                                ref={(el) => (refs.current["alternate_mobile_number"] = el)} // Attach ref here

                                            />
                                            {errors.alternate_mobile_number && <p className="text-red-500" > {errors.alternate_mobile_number} </p>}
                                        </div>
                                    </div>
                                </div>




                            </div>
                            {
                                serviceData?.length > 0 ? (
                                    serviceData.map((serviceArr, serviceIndex) => {
                                        const service = serviceArr?.jsonData;
                                        return (
                                            <div
                                                key={serviceIndex}
                                                className="border bg-white shadow-md border-gray-300 p-6 rounded-md mt-5 hover:transition-shadow duration-300"
                                            >
                                                <h2 className="md:text-center text-start py-4 md:text-2xl text-sm font-bold mb-6 text-black">
                                                    {service.heading}
                                                </h2>
                                                <div className="space-y-6">
                                                    {service.rows.map((row, rowIndex) => {
                                                        if (hiddenRows[`${serviceIndex}-${rowIndex}`]) {
                                                            return null;
                                                        }

                                                        return (
                                                            <div key={rowIndex}>
                                                                {row.row_heading && (
                                                                    <h3 className="text-lg font-semibold mb-4">{row.row_heading}</h3>
                                                                )}

                                                                {row.inputs && row.inputs.length > 0 ? (
                                                                    <div className="space-y-4">
                                                                        <div
                                                                            className={`md:grid grid-cols-${row?.inputs?.length === 1
                                                                                ? "1"
                                                                                : row.inputs.length === 2
                                                                                    ? "2"
                                                                                    : "3"
                                                                                } gap-3`}
                                                                        >
                                                                            {row.inputs.map((input, inputIndex) => {
                                                                                const isCheckbox = input.type === "checkbox";
                                                                                const isDoneCheckbox =
                                                                                    isCheckbox &&
                                                                                    (input.name.startsWith("done_or_not") ||
                                                                                        input.name.startsWith("has_not_done"));
                                                                                const isChecked = ["1", 1, true, "true"].includes(annexureData[service.db_table]?.[input.name] ?? false);

                                                                                if (isDoneCheckbox && isChecked) {
                                                                                    // Hide all rows except the one with the checked checkbox
                                                                                    service.rows.forEach((otherRow, otherRowIndex) => {
                                                                                        if (otherRowIndex !== rowIndex) {
                                                                                            hiddenRows[`${serviceIndex}-${otherRowIndex}`] = true; // Hide other rows
                                                                                        }
                                                                                    });
                                                                                    hiddenRows[`${serviceIndex}-${rowIndex}`] = false;// Ensure current row stays visible
                                                                                }

                                                                                const inputName = input.name;

                                                                                return (
                                                                                    <div
                                                                                        key={inputIndex}
                                                                                        className={`flex flex-col space-y-2 ${row.inputs.length === 1
                                                                                            ? "col-span-1"
                                                                                            : row.inputs.length === 2
                                                                                                ? "col-span-1"
                                                                                                : ""
                                                                                            }`}
                                                                                    >
                                                                                        <label className="block text-sm font-medium mb-2 text-gray-700 capitalize">
                                                                                            {input.label.replace(/[\/\\]/g, "")}
                                                                                        </label>

                                                                                        {/* Input types (text, textarea, datepicker, etc.) */}
                                                                                        {input.type === "input" && (
                                                                                            <input
                                                                                                onBlur={(e) =>
                                                                                                    handleBlur(e, service.db_table, input.name,)
                                                                                                }
                                                                                                name={input.name}
                                                                                                value={annexureData[service.db_table]?.[input.name] || ''}

                                                                                                className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                onChange={(e) =>
                                                                                                    handleServiceChange(
                                                                                                        serviceIndex,
                                                                                                        service.db_table,
                                                                                                        input.name,
                                                                                                        e.target.value
                                                                                                    )
                                                                                                }
                                                                                            />
                                                                                        )}
                                                                                        {input.type === "textarea" && (
                                                                                            <textarea
                                                                                                onBlur={(e) =>
                                                                                                    handleBlur(e, service.db_table)
                                                                                                }
                                                                                                name={input.name}
                                                                                                value={annexureData[service.db_table]?.[input.name] || ''}

                                                                                                rows={1}
                                                                                                className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                onChange={(e) =>
                                                                                                    handleServiceChange(
                                                                                                        serviceIndex,
                                                                                                        service.db_table,
                                                                                                        input.name,
                                                                                                        e.target.value
                                                                                                    )
                                                                                                }
                                                                                            />
                                                                                        )}
                                                                                        {input.type === "datepicker" && (
                                                                                            <input
                                                                                                onBlur={(e) =>
                                                                                                    handleBlur(e, service.db_table)
                                                                                                }
                                                                                                type="date"
                                                                                                name={input.name}
                                                                                                value={annexureData[service.db_table]?.[input.name] || ''}

                                                                                                className="uppercase mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                onChange={(e) =>
                                                                                                    handleServiceChange(
                                                                                                        serviceIndex,
                                                                                                        service.db_table,
                                                                                                        input.name,
                                                                                                        e.target.value
                                                                                                    )
                                                                                                }
                                                                                            />
                                                                                        )}
                                                                                        {input.type === "number" && (
                                                                                            <input
                                                                                                onBlur={(e) =>
                                                                                                    handleBlur(e, service.db_table)
                                                                                                }
                                                                                                type="number"
                                                                                                name={input.name}
                                                                                                value={annexureData[service.db_table]?.[input.name] || ''}

                                                                                                className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                onChange={(e) =>
                                                                                                    handleServiceChange(
                                                                                                        serviceIndex,
                                                                                                        service.db_table,
                                                                                                        input.name,
                                                                                                        e.target.value
                                                                                                    )
                                                                                                }
                                                                                            />
                                                                                        )}
                                                                                        {input.type === "email" && (
                                                                                            <input
                                                                                                onBlur={(e) =>
                                                                                                    handleBlur(e, service.db_table)
                                                                                                }
                                                                                                type="email"
                                                                                                name={input.name}
                                                                                                value={annexureData[service.db_table]?.[input.name] || ''}

                                                                                                className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                onChange={(e) =>
                                                                                                    handleServiceChange(
                                                                                                        serviceIndex,
                                                                                                        service.db_table,
                                                                                                        input.name,
                                                                                                        e.target.value
                                                                                                    )
                                                                                                }
                                                                                            />
                                                                                        )}
                                                                                        {input.type === "select" && (
                                                                                            <select
                                                                                                onBlur={(e) =>
                                                                                                    handleBlur(e, service.db_table)
                                                                                                }
                                                                                                name={input.name}
                                                                                                value={annexureData[service.db_table]?.[input.name] || ''}

                                                                                                className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                onChange={(e) =>
                                                                                                    handleServiceChange(
                                                                                                        serviceIndex,
                                                                                                        service.db_table,
                                                                                                        input.name,
                                                                                                        e.target.value
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                {Object.entries(input.options).map(
                                                                                                    ([key, option], optionIndex) => (
                                                                                                        <option key={optionIndex} value={key}>
                                                                                                            {option}
                                                                                                        </option>
                                                                                                    )
                                                                                                )}
                                                                                            </select>
                                                                                        )}
                                                                                        {input.type === "file" && (
                                                                                            <>
                                                                                                <input
                                                                                                    type="file"
                                                                                                    name={input.name}
                                                                                                    multiple
                                                                                                    accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx"
                                                                                                    className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none"
                                                                                                    onChange={(e) =>
                                                                                                        handleFileChange(
                                                                                                            `${service?.db_table}`,
                                                                                                            input.name,
                                                                                                            e
                                                                                                        )
                                                                                                    }
                                                                                                    onBlur={(e) =>
                                                                                                        handleFileChange(
                                                                                                            `${service?.db_table}`,
                                                                                                            input.name,
                                                                                                            e,
                                                                                                            false // For onBlur, you can pass false to indicate it's not a submit action
                                                                                                        )
                                                                                                    }
                                                                                                />

                                                                                                {errors?.[input.name] && (
                                                                                                    <p className="text-red-500">
                                                                                                        {errors[input.name]}
                                                                                                    </p>
                                                                                                )}
                                                                                                {annexureData[service.db_table]?.[input.name]?.startsWith("http") && (
                                                                                                    <div className="mt-2 object-cover flex rounded-md">
                                                                                                        <FileViewer fileUrl={annexureData[service.db_table]?.[input.name]} />
                                                                                                    </div>
                                                                                                )}
                                                                                                <p className="text-gray-500 text-sm mt-2">
                                                                                                    Only JPG, PNG, PDF, DOCX, and XLSX files are allowed. Max file size: 2MB.
                                                                                                </p>
                                                                                            </>
                                                                                        )}
                                                                                        {input.type === "checkbox" && (
                                                                                            <div className="flex items-center space-x-3">
                                                                                                <input
                                                                                                    onBlur={(e) => handleBlur(e, service.db_table)}
                                                                                                    type="checkbox"
                                                                                                    name={input.name}
                                                                                                    checked={["1", 1, true, "true"].includes(annexureData[service.db_table]?.[input.name] ?? false)}
                                                                                                    value={annexureData[service.db_table]?.[input.name] || ""}
                                                                                                    className="h-5 w-5 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                                                                    onChange={(e) => {
                                                                                                        handleCheckboxChange(serviceIndex, service.db_table, input.name, e);
                                                                                                        toggleRowsVisibility(serviceIndex, rowIndex, e.target.checked);
                                                                                                    }}
                                                                                                />


                                                                                                <span className="text-sm text-gray-700">
                                                                                                    {input.label}
                                                                                                </span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <p>No inputs available for this row.</p>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="md:text-center text-start md:text-xl text-sm text-gray-500">
                                        No services available.
                                    </p>
                                )
                            }

                            < h5 className="md:text-center text-start text-lg my-6 font-bold" > Documents(Mandatory) </h5>

                            < div className="grid grid-cols-1 bg-white shadow-md  md:grid-cols-3 gap-4 pt-4  md:p-4 p-1 rounded-md border" >
                                <div className="p-4" >
                                    <h6 className="flex items-center md:text-lg text-sm font-bold mb-2" >
                                        <FaGraduationCap className="mr-3" />
                                        Education
                                    </h6>
                                    < p className='text-sm' > Photocopy of degree certificate and final mark sheet of all examinations.</p>
                                </div>

                                < div className="p-4" >
                                    <h6 className="flex items-center md:text-lg text-sm font-bold mb-2" >
                                        <FaBriefcase className="mr-3" />
                                        Employment
                                    </h6>
                                    < p className='text-sm' > Photocopy of relieving / experience letter for each employer mentioned in the form.</p>
                                </div>

                                < div className="p-4" >
                                    <h6 className="flex items-center md:text-lg text-sm font-bold mb-2" >
                                        <FaIdCard className="mr-3" />
                                        Government ID / Address Proof
                                    </h6>
                                    < p className='text-sm' > Aadhaar Card / Bank Passbook / Passport Copy / Driving License / Voter ID.</p>
                                </div>
                            </div>

                            <div className='flex justify-between gap-5 items-center'>
                                <button
                                    type="submit"
                                    className={`bg-[#2c81ba] p-3 w-1/2 mt-5 rounded-md text-white ${loading == 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={(e) => handleSubmit(e, 1)}
                                    disabled={loading == 1} // Disable the button when loading
                                >
                                    {loading == 1 ? 'Loading...' : 'Submit'}
                                </button>

                                <button
                                    type="submit"
                                    className={`bg-green-500 p-3 w-1/2 mt-5 rounded-md text-white ${loading == 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={(e) => handleSubmit(e, 0)}
                                    disabled={loading == 0} // Disable the button when loading
                                >
                                    {loading == 0 ? 'Saving...' : 'Save Application for later'}
                                </button>

                            </div>
                        </div>
                    </form>
                )

            }

            {
                !apiStatus && (
                    <div className="error-box" >
                        Application not found
                    </div>
                )
            }
bgv backup


        </>
    );
};
export default BackgroundVerificationForm;