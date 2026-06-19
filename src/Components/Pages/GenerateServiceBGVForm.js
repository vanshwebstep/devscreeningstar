import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useService } from "./ServiceContext";
import { Navigate } from 'react-router-dom';
import { useNavigate } from "react-router-dom";

const GenerateServiceBGVForm = () => {
    const [step, setStep] = useState(1);
    const { selectedService } = useService();
    const [clientData, setClientData] = useState([]); // Changed to an array to handle multiple entries
    const [loading, setLoading] = useState(true);
    const hasServiceData = selectedService?.json;
    console.log('selectedService', selectedService)
    console.log('hasServiceData', hasServiceData);
    const navigate = useNavigate();

    const [formData, setFormData] = useState(() => {
        console.log("Initializing form data...");

        // Check if selectedService exists and has a valid json property
        const hasServiceData = selectedService?.json;
        console.log("Has selectedService.json:", hasServiceData);

        if (hasServiceData) {
            let serviceArray;
            try {
                // Attempt to parse the JSON if available
                console.log("Parsing selectedService.json...");
                const fixedJson = selectedService?.json.replace(/\\'/g, "'"); // Fix bad escape
                serviceArray = JSON.parse(fixedJson);
                console.log("Parsed serviceArray:", serviceArray);
            } catch (error) {
                console.error("Error parsing JSON:", error);
                return {
                    heading: '',
                    db_table: '',
                    headers: [''],
                    rows: [],
                };
            }

            // Check if serviceArray is valid
            if (serviceArray) {
                console.log("Valid serviceArray detected, processing data...", serviceArray.rows);
                const processedData = {
                    heading: serviceArray.heading || '',
                    db_table: serviceArray.heading
                        ? serviceArray.heading.toLowerCase().replace(/\s+/g, '_')
                        : '',
                    headers: serviceArray.headers?.filter(header => header !== 'PARTICULARS') || [''],
                    rows: serviceArray.rows?.map((row, rowIndex) => {
                        console.log(`Processing row ${rowIndex + 1}:`, row);
                        return {
                            row_heading: row.row_heading?.replace(/[:*]/g, '') || '',
                            inputs: row.inputs?.map((input, inputIndex) => {
                                console.log(`Processing input ${inputIndex + 1}:`, input);
                                return {
                                    label: input.label?.replace(/[:*]/g, '') || '',
                                    name: input.name?.replace(/[:*]/g, '') || '',
                                    type: input.type || 'text', // Default type to 'text' if not provided
                                    options: Array.isArray(input.options) ? input.options.map(option => option.replace(/[:*]/g, '')) : [],
                                    multiple: input.multiple || false, // Default to false for file inputs
                                    required: input.required || false, // Default to false if required is not specified
                                };
                            }) || [], // Default empty array if inputs are undefined
                        };
                    }) || [], // Default empty array for rows
                };
                console.log("Final processed formData:", processedData);
                return processedData;
            }

        }

        // Fallback to default values if any condition fails
        console.log("No valid service data found, using default values.");
        return {
            heading: '',
            db_table: '',
            headers: [''],
            rows: [],
        };
    });

    const [errors, setErrors] = useState([]);

    useEffect(() => {
        setFormData((prevData) => ({
            ...prevData,
            db_table: prevData?.heading?.toLowerCase().replace(/\s+/g, '_')
        }));
    }, [formData.heading]);

    const handleHeadingChange = (e) => {
        setFormData({ ...formData, heading: e.target.value });
    };

    const handleAddRow = () => {
        setFormData({
            ...formData,
            rows: [...formData.rows, { row_heading: '', inputs: [] }]
        });
    };

    const handleRemoveRow = (index) => {
        const updatedRows = formData.rows.filter((_, i) => i !== index);
        setFormData({ ...formData, rows: updatedRows });
    };

    const handleAddInput = (rowIndex) => {
        const updatedRows = [...formData.rows];
        updatedRows[rowIndex].inputs.push({ label: '', name: '', type: 'text', required: false });
        setFormData({ ...formData, rows: updatedRows });
    };

    const handleRowHeadingChange = (e, rowIndex) => {
        setFormData((prevState) => {
            const updatedRows = [...prevState.rows];

            // Ensure the row exists before modifying it
            if (!updatedRows[rowIndex]) {
                console.error(`Row at index ${rowIndex} is undefined.`);
                return prevState;
            }

            updatedRows[rowIndex] = { ...updatedRows[rowIndex], row_heading: e.target.value };
            return { ...prevState, rows: updatedRows };
        });
    };

    const handleRemoveInput = (rowIndex, inputIndex) => {
        const updatedRows = [...formData.rows];
        updatedRows[rowIndex].inputs.splice(inputIndex, 1);
        setFormData({ ...formData, rows: updatedRows });
    };

    const handleChange = (rowIndex, inputIndex, field, value) => {
        const updatedRows = [...formData.rows];

        if (field === 'type' && value !== 'select') {
            // If the type is changed from 'select' to something else, remove the options
            updatedRows[rowIndex].inputs[inputIndex].options = undefined;
        }

        if (field === 'label') {
            if (!value.trim()) {
                updatedRows[rowIndex].inputs[inputIndex].name = "";
            } else {
                const generatedName = `${value.toLowerCase().replace(/\s+/g, '_')}_${formData.db_table}`;
                updatedRows[rowIndex].inputs[inputIndex].name = generatedName;
            }
        }

        // Handle the required field
        if (field === 'required') {
            updatedRows[rowIndex].inputs[inputIndex].required = value;
        } else {
            updatedRows[rowIndex].inputs[inputIndex][field] = value;
        }

        setFormData({ ...formData, rows: updatedRows });
    };
    const handleOptionChange = (e, rowIndex, inputIndex, optionIndex, field) => {
        const newRows = [...formData.rows];
        const option = newRows[rowIndex].inputs[inputIndex].options[optionIndex];
        option[field] = e.target.value;
        setFormData({ ...formData, rows: newRows });
    };

    const handleAddOption = (rowIndex, inputIndex) => {
        const newRows = [...formData.rows];
        const input = newRows[rowIndex].inputs[inputIndex];
        if (!input.options) {
            input.options = [];
        }
        input.options.push({ value: '', showText: '' }); // Add empty option
        setFormData({ ...formData, rows: newRows });
    };

    const handleRemoveOption = (rowIndex, inputIndex, optionIndex) => {
        const newRows = [...formData.rows];
        const input = newRows[rowIndex].inputs[inputIndex];
        input.options.splice(optionIndex, 1);
        setFormData({ ...formData, rows: newRows });
    };

    const validateForm = () => {
        let newErrors = [];
        let errorFields = {};
        let labelMap = {}; // Track duplicate labels
        let nameMap = {}; // Track duplicate names

        if (!formData.heading.trim()) newErrors.push('Heading is required');

        formData.rows.forEach((row, rowIndex) => {
            row.inputs.forEach((input, inputIndex) => {
                const fieldKey = `${rowIndex}-${inputIndex}`;

                // Check if label is empty
                if (!input.label.trim()) {
                    newErrors.push(`Row ${rowIndex + 1}, Input ${inputIndex + 1}: Label is required`);
                    errorFields[fieldKey] = true;
                }

                // Check if required fields are empty
                if (input.required && !input.name.trim()) {
                    errorFields[fieldKey] = true;
                }

                // Check for duplicate labels
                if (input.label) {
                    if (labelMap[input.label.toLowerCase()]) {
                        const errorMsg = `You cannot have duplicate labels ${input.label} `;
                        newErrors.push(errorMsg);
                        errorFields[fieldKey] = true;
                        errorFields[labelMap[input.label.toLowerCase()]] = true;
                        console.error(errorMsg);
                    } else {
                        labelMap[input.label.toLowerCase()] = fieldKey;
                    }
                }

                // Check for duplicate names
                if (input.name) {
                    if (nameMap[input.name]) {
                        const errorMsg = ``;
                        newErrors.push(errorMsg);
                        errorFields[fieldKey] = true;
                        errorFields[nameMap[input.name]] = true;
                        console.error(errorMsg);
                    } else {
                        nameMap[input.name] = fieldKey;
                    }
                }
            });
        });

        setErrors(errorFields);

        if (newErrors.length > 0) {
            Swal.fire('Error', newErrors.join('<br>'), 'error');
        }

        return newErrors.length === 0;
    };

    const handleNext = () => {
        setStep(step + 1)
    };

    const handleBack = () => setStep(step - 1);
    const handleGoBack = () => navigate('/admin-ServiceBGVForm');

    const handleSubmit = () => {
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const _token = localStorage.getItem("_token");

        if (!admin_id || !_token) {
            console.error("Missing admin_id or _token in localStorage.");
            setLoading(false);
            return;
        }
        if (validateForm()) {
            const finalData = {
                ...formData,
                rows: formData.rows.map(row => ({
                    ...row,
                    inputs: row.inputs.map(input => ({
                        ...input,
                        options: input.type === 'select' && input.options
                            ? input.options.reduce((acc, option) => {
                                if (option.value && option.showText) {
                                    acc[option.value] = option.showText;
                                }
                                return acc;
                            }, {})
                            : undefined
                    }))
                }))
            };
            const jsonString = JSON.stringify(finalData)
            const raw = JSON.stringify({
                service_id: selectedService?.id,
                json: jsonString,
                admin_id: parseInt(admin_id),
                _token,
            });
            const requestOptions = {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: raw,
                redirect: "follow",
            };
            fetch("https://api.screeningstar.co.in/json-form/background-verification/update", requestOptions)
                .then((response) => response.json().catch(() => ({}))) // Prevent JSON parsing errors
                .then((result) => {
                    console.log("Submission Response:", result);
                    Swal.fire('Success', 'Form data submitted!', 'success');
                    navigate('/admin-ServiceBGVForm');
                    return result;
                })
                .catch((error) => {
                    console.error("Submission Error:", error);
                    return {}; // Ensure result is always an object
                })
                .finally((result) => {
                    const newToken = result?.token || result?._token || _token; // Use old token if new one is unavailable
                    localStorage.setItem("_token", newToken);
                    setLoading(false);
                })


        } else {
            console.error("You cannot have duplicate labels or empty required fields.");
        }
    };


    console.log('this is formdata', formData)
    return (
        <div className="p-6 bg-gray-100 border border-gray-300 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-center mb-4">GENERATE SERVICE BGV FORM</h2>
            {errors.length > 0 && (
                <div className="bg-red-200 text-red-700 p-4 rounded mb-4">
                    <ul>
                        {errors.map((error, index) => <li key={index}>- {error}</li>)}
                    </ul>
                </div>
            )}
            {step === 1 && (
                <div className="bg-white p-6 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Step 1: Define Heading</h3>
                    <input
                        type="text"
                        value={formData.heading}
                        onChange={handleHeadingChange}
                        placeholder="Enter heading"
                        className="border px-4 py-2 w-full rounded-lg"
                    />
                    <div className="flex justify-between mt-6">
                        <button onClick={handleGoBack} className="flex items-center justify-center w-24 space-x-3 p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer">    <span className="font-semibold text-lg">Cancel</span> </button>
                        <button onClick={handleNext} className="flex items-center justify-center w-24 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer">    <span className="font-semibold text-lg">Next</span> <FaChevronRight className="text-xl text-white" /></button>
                    </div>
                </div>
            )}
            {step === 2 && (
                <div className="bg-white p-6 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Step 2: Define Labels and Inputs</h3>
                    {formData.rows.map((row, rowIndex) => (
                        <div key={rowIndex} className="border p-4 mb-4 rounded-lg">
                            <div className='flex gap-2 align-middle items-center'>
                                <label className='tex-lg  whitespace-nowrap'>Row Heading :</label>
                                <input
                                    type="text"
                                    value={row.row_heading}
                                    onChange={(e) => handleRowHeadingChange(e, rowIndex)}
                                    placeholder="Row Heading"
                                    className="border px-4 py-2 w-full rounded-lg mb-2"
                                />
                            </div>
                            {row.inputs.map((input, inputIndex) => (
                                <div key={inputIndex} className='mb-8' >
                                    <div className=" space-x-2 mb-2">
                                        <div className='flex gap-2 items-start'>
                                            <input
                                                type="text"
                                                value={input.label}
                                                onChange={(e) => handleChange(rowIndex, inputIndex, 'label', e.target.value)}
                                                placeholder="Label"
                                                className={`border border-gray-300 rounded-lg p-2 w-full mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors[`${rowIndex}-${inputIndex}`] ? 'border-red-500' : ''}`}
                                            />
                                            <div className='text-red-600 flex gap-2'>
                                                <input
                                                    type="checkbox"
                                                    checked={input.required || false}
                                                    onChange={(e) => handleChange(rowIndex, inputIndex, 'required', e.target.checked)}
                                                    className="form-checkbox h-5 w-5 text-blue-600"
                                                />  required?</div>


                                        </div>
                                        <div className='w-full m-0 flex gap-2 items-center'>
                                            <select
                                                value={input.type}
                                                onChange={(e) => handleChange(rowIndex, inputIndex, 'type', e.target.value)}
                                                className="border border-gray-300 m-0 rounded-lg p-2 w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            >
                                                <option value="text">Text</option>
                                                <option value="checkbox">Checkbox</option>
                                                <option value="select">Select</option>
                                                <option value="textarea">Textarea</option>
                                                <option value="datepicker">Datepicker</option>
                                                <option value="file">File</option>
                                            </select>
                                            <button
                                                onClick={() => handleRemoveInput(rowIndex, inputIndex)}
                                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                    {/* Render options for select input */}
                                    {input.type === 'select' && (
                                        <div className="my-4">
                                            <h4 className="text-lg font-semibold mb-2">Options</h4>
                                            {input.options && input.options.map((option, optionIndex) => (
                                                <div key={optionIndex} className="md:flex items-center gap-4 mb-2">
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            value={option.value}
                                                            onChange={(e) => handleOptionChange(e, rowIndex, inputIndex, optionIndex, 'value')}
                                                            placeholder="Option value"
                                                            className="border border-gray-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            value={option.showText}
                                                            onChange={(e) => handleOptionChange(e, rowIndex, inputIndex, optionIndex, 'showText')}
                                                            placeholder="Option text"
                                                            className="border border-gray-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveOption(rowIndex, inputIndex, optionIndex)}
                                                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                                                    >
                                                        Remove Option
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => handleAddOption(rowIndex, inputIndex)}
                                                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                                            >
                                                Add Option
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <button
                                onClick={() => handleAddInput(rowIndex)}
                                className="bg-green-500 text-white px-4 py-2 mr-3 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                                Add Input
                            </button>
                            <button
                                onClick={() => handleRemoveRow(rowIndex)}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                                Remove Row
                            </button>
                        </div>
                    ))}

                    <button onClick={handleAddRow} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-green-400">Add Row</button>
                    <div className="flex justify-between mt-6">
                        <div
                            onClick={handleBack}
                            className="flex items-center w-24 justify-center space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                        >
                            <FaChevronLeft className="text-xl text-white" />
                            <span className="font-semibold text-lg">Back</span>
                        </div>
                        <button
                            className={`bg-green-500 text-white flex items-center w-24 justify-center space-x-3 p-2 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer   px-4 py-2 rounded-lg`}
                            onClick={handleSubmit}
                           
                        >
                           Submit 
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GenerateServiceBGVForm;