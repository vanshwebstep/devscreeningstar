import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";
import { useService } from "./ServiceContext";
const GenerateReportServiceForm = () => {
    const { selectedService } = useService();
    console.log("Submitting Service Data:", selectedService);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [disableAdinput, setDisableAdinput] = useState(null);
    const [formData, setFormData] = useState(() => {
        // Check if selectedService exists and has a valid json property
        const hasServiceData = selectedService?.json;

        if (hasServiceData) {
            let serviceArray;
            try {
                // Attempt to parse the JSON if available
                serviceArray = JSON.parse(selectedService.json);
            } catch (error) {
                // If JSON parsing fails, log the error and fall back to default
                console.error('Error parsing JSON:', error);
                return {
                    heading: '',
                    db_table:'',
                    headers: [''],
                    rows: [],
                };
            }

            // Check if serviceArray was parsed successfully
            if (serviceArray) {
                return {
                    heading: serviceArray.heading || '',
                    db_table:serviceArray.heading  ? serviceArray.heading.toLowerCase().replace(/\s+/g, '_')
                    : ''|| '',
                    headers: serviceArray.headers?.filter(header => header !== 'PARTICULARS') || [''],
                    rows: serviceArray.rows?.map(row => ({
                        label: row.label || '',
                        inputs: row.inputs?.map(input => ({
                            name: input.name || '',
                            type: input.type || 'text', // defaulting type to 'text' if not provided
                            options: input.options || [], // Default empty array for options if not present
                            multiple: input.multiple || false, // default to false for file inputs
                            required: input.required || false // default to false if required is not specified
                        })) || [] // default empty array if inputs is undefined
                    })) || [] // default empty array for rows
                };
            }
        }

        // Fallback to default values if any condition fails
        return {
            heading: '',
            headers: [''],
            rows: [],
        };
    });




    const handleHeadingChange = (e) => {
        setFormData({ ...formData, heading: e.target.value });
    };

    // Update headers
    const handleHeaderChange = (e, index) => {
        const newHeaders = [...formData.headers];
        newHeaders[index] = e.target.value;
        setFormData({ ...formData, headers: newHeaders });
    };

    // Add new header
    const handleAddHeader = () => {
        if (formData.headers.length < 2) {
            setFormData({ ...formData, headers: [...formData.headers, ''] });
        }
    };

    const handleRemoveHeader = (index) => {
        const newHeaders = formData.headers.filter((_, i) => i !== index);
        setFormData({ ...formData, headers: newHeaders });
    };

    // Add new row (label + inputs)
    const handleAddRow = () => {
        let isValid = true;
        let alertTriggered = false;
        let invalidOptions = []; // To capture invalid options for the alert message

        // Validate existing rows for "select" inputs with no options or invalid options
        formData.rows.forEach(row => {
            row.inputs.forEach(input => {
                if (
                    input.type === "dropdown" &&
                    (!input.options ||
                        input.options.length <= 0 ||
                        !input.options.every(
                            (option) => {
                                // Only validate if showText is present
                                if (!option.showText) {
                                    invalidOptions.push(option); // Store invalid options
                                    return false; // Mark as invalid
                                }
                                return true; // Valid option
                            }
                        ))
                ) {
                    isValid = false;
                    if (!alertTriggered) {
                        // Create an alert message with the invalid options' details
                        const invalidOptionsDetails = invalidOptions.map(option => `ShowText: ${option.showText}`).join("\n");

                        Swal.fire({
                            icon: 'error',
                            title: 'Incomplete Form',
                            text: `Please fill options for all dropdowns, and ensure option values are null or not provided! Invalid options:\n${invalidOptionsDetails}`,
                        });
                        alertTriggered = true;
                    }
                }
            });
        });

        // Only add a new row if the form is valid
        if (isValid) {
            const newRow = {
                label: '',
                inputs: [],
            };

            setFormData({ ...formData, rows: [...formData.rows, newRow] });
        }
    };





    // Remove row
    const handleRemoveRow = (rowIndex) => {
        const newRows = formData.rows.filter((_, i) => i !== rowIndex);
        setFormData({ ...formData, rows: newRows });
    };

    // Update label
    const handleLabelChange = (e, rowIndex) => {
        const newRows = [...formData.rows];
        newRows[rowIndex].label = e.target.value;
        setFormData({ ...formData, rows: newRows });
    };
    // Add input to a row
    const handleAddInput = (rowIndex) => {
        const newRows = [...formData.rows];
        const row = newRows[rowIndex];
        const currentInputs = row.inputs.length;
        const totalHeaders = formData.headers.length;

        if (currentInputs < totalHeaders) {
            let headerName = formData.headers[currentInputs].toLowerCase().replace(/\s+/g, '_');
            let labelName = row.label.toLowerCase().replace(/\s+/g, '_');
            let headingName = formData.heading.toLowerCase().replace(/\s+/g, '_');

            // Ensure only a single underscore between parts
            headerName = headerName.replace(/_+/g, '_');
            labelName = labelName.replace(/_+/g, '_');
            headingName = headingName.replace(/_+/g, '_');

            const newInput = {
                type: 'text',
                name: `${headerName}_${labelName}_${headingName}`,
                options: [], // Only for select/dropdown
                multiple: false, // Only for file input
            };
            row.inputs.push(newInput);
            setFormData({ ...formData, rows: newRows });
        } else {
            setDisableAdinput(rowIndex); // Add a new label when inputs reach the number of headers
        }
    };
    const handleInputChange = (e, rowIndex, inputIndex, field) => {
        const newRows = [...formData.rows];
        const input = newRows[rowIndex].inputs[inputIndex];
        input[field] = e.target.value;
        setFormData({ ...formData, rows: newRows });
    };
    // Remove input
    const handleRemoveInput = (rowIndex, inputIndex) => {
        const newRows = [...formData.rows];
        newRows[rowIndex].inputs = newRows[rowIndex].inputs.filter((_, i) => i !== inputIndex);
        newRows[rowIndex].currentInputIndex = Math.max(0, newRows[rowIndex].inputs.length - 1);
        setFormData({ ...formData, rows: newRows });
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
        input?.options?.push({ value: '', showText: '' });
        setFormData({ ...formData, rows: newRows });
    };
    const handleRemoveOption = (rowIndex, inputIndex, optionIndex) => {
        const newRows = [...formData.rows];
        const input = newRows[rowIndex].inputs[inputIndex];
        input.options.splice(optionIndex, 1);
        setFormData({ ...formData, rows: newRows });
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleNext = () => {
        let isValid = true;
        let alertTriggered = false;

        // Skip validation for step 1 to step 2
        if (step !== 1) {
            // Validate existing rows for "select" inputs with no options
            formData.rows.forEach(row => {
                row.inputs.forEach(input => {
                    if (
                        input.type === "dropdown" &&
                        (!input.options ||
                            input.options.length <= 0 ||
                            !input.options.every(
                                (option) => option.showText // Only check if showText is provided
                            ))
                    ) {
                        isValid = false;
                        if (!alertTriggered) {
                            Swal.fire({
                                icon: 'error',
                                title: 'Incomplete Form',
                                text: 'Please fill options for all dropdowns!',
                            });
                            alertTriggered = true;
                        }
                    }
                });
            });
        }

        // Only proceed to the next step if the form is valid
        if (isValid && step < 3) {
            setStep(step + 1);
        }
    };



    const handleSubmit = () => {
        setLoading(true);
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const _token = localStorage.getItem("_token");
    
        if (!admin_id || !_token) {
            console.error("Missing admin_id or _token in localStorage.");
            setLoading(false);
            return;
        }
    
        const cleanedFormData = {
            ...formData,
            headers: ["PARTICULARS", ...(formData.headers || [])],
            rows: formData.rows.map((row) => ({
                ...row,
                inputs: row.inputs.map((input) => {
                    if (input.options && input.options.length === 0) {
                        delete input.options;
                    }
                    if (input.multiple === false) {
                        delete input.multiple;
                    }
                    if (input.required === false) {
                        delete input.required;
                    }
                    return input;
                }),
            })),
        };
    
        const jsonString = JSON.stringify(cleanedFormData);
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
    
        fetch("https://api.screeningstar.co.in/json-form/generate-report/update", requestOptions)
            .then((response) => response.json().catch(() => ({}))) // Prevent JSON parsing errors
            .then((result) => {
                console.log("Submission Response:", result);
                   Swal.fire('Success', 'Form data submitted!', 'success');
                                navigate('/admin-ServiceReportForm');
                return result; // Pass result to finally block
            })
            .catch((error) => {
                console.error("Submission Error:", error);
                return {}; // Ensure result is always an object
            })
            .finally((result) => {
                const newToken = result?.token || result?._token || _token; // Use old token if new one is unavailable
                localStorage.setItem("_token", newToken);
                setLoading(false);
            });
    };
    const handleGoBack = () => navigate('/admin-ServiceReportForm');
    


    console.log('headinggggg', formData.heading)
    return (
        <div className="bg-[#f7fafc] border border-gray-300 p-6 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold py-3 text-center text-[#2d3b44] mb-4">
                GENERATE REPORT SERVICE FORM
            </h2>

            {step === 1 && (
                <div className="bg-white p-6 w-full border-t border-gray-300 mx-auto rounded-lg">


                    <h3 className="text-lg font-semibold mb-3">Step 1: Define Heading and Headers</h3>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Heading:</label>
                        <input
                            type="text"
                            value={formData.heading}
                            onChange={handleHeadingChange}
                            className="border px-4 py-2 w-full rounded-lg mt-2"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Headers:</label>
                        {formData.headers.filter(header => header !== "PARTICULARS").map((header, index) => (
                            <div key={index} className="flex items-center space-x-2 mb-2">
                                <input
                                    type="text"
                                    value={header}
                                    onChange={(e) => handleHeaderChange(e, index)}
                                    className="border px-4 py-2 rounded-lg w-3/4"
                                />

                                <button
                                    onClick={() => handleRemoveHeader(index)}
                                    className="bg-red-500 text-white px-2 py-1 rounded"
                                >
                                    -
                                </button>
                            </div>
                        ))}
                        {formData.headers.length < 2 && (
                            <button
                                onClick={handleAddHeader}
                                className="bg-blue-500 text-white px-2 py-1 rounded-lg"
                            >
                                +
                            </button>
                        )}
                    </div>
                    <div className="flex justify-between  mt-6">
                    <button onClick={handleGoBack} className="flex items-center justify-center w-24 space-x-3 p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer">    <span className="font-semibold text-lg">Cancel</span> </button>

                        <div
                            onClick={handleNext}
                            className="flex items-center justify-center w-24 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                        >
                            <span className="font-semibold text-lg">Next</span>
                            <FaChevronRight className="text-xl text-white" />
                        </div>
                    </div>
                </div>
            )}
            {step === 2 && (
                <div className="bg-white p-6 w-full border-t border-gray-300 mx-auto rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Step 2: Define Labels and Inputs</h3>

                    {formData.rows.map((row, rowIndex) => (
                        <div key={rowIndex} className=" p-4 mb-4  border border-black">
                            <button
                                className="text-red-500 text-end  w-full  hover:text-gray-700 focus:outline-none"
                                onClick={() => handleRemoveRow(rowIndex)}
                            >
                                ✖
                            </button>
                            <div className=" p-6 rounded-md  space-y-2">

                                <div >
                                    <label className="block text-sm font-medium text-gray-700">Label:</label>
                                    <input
                                        type="text"
                                        value={row.label}
                                        onChange={(e) => handleLabelChange(e, rowIndex)}
                                        className="border px-4 py-2 w-full rounded-lg"
                                    />
                                </div>
                                <div >
                                    {row.inputs.map((input, inputIndex) => (
                                        <div key={inputIndex} className="flex flex-col gap-4 p-4 border mb-4 rounded-lg shadow-sm">
                                            {/* Input heading rendered from formData.headers */}
                                            {formData.headers[inputIndex] && (
                                                <h4 className="text-sm font-medium text-gray-800">
                                                    {formData.headers[inputIndex] || `Header ${inputIndex + 1}`}
                                                </h4>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <select
                                                    value={input.type}
                                                    onChange={(e) => handleInputChange(e, rowIndex, inputIndex, 'type')}
                                                    className="border border-gray-300 rounded-lg p-2 w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                >
                                                    <option value="text">Text</option>
                                                    <option value="dropdown">Dropdown</option>
                                                    <option value="checkbox">Check Box</option>
                                                    <option value="file">File</option>
                                                    <option value="datepicker">datepicker</option>
                                                    <option value="email">Email</option>
                                                    <option value="number">Number</option>
                                                </select>

                                                <button
                                                    onClick={() => handleRemoveInput(rowIndex, inputIndex)}
                                                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                                                >
                                                    Remove
                                                </button>
                                            </div>

                                            {/* Show options for select/dropdown */}
                                            {input.type === 'dropdown' && (
                                                <div className="mt-4">
                                                    <h4 className="text-lg font-semibold mb-2">Options</h4>
                                                    {input.options?.map((option, optionIndex) => (
                                                        <div key={optionIndex} className="md:flex items-center gap-4 mb-2">
                                                            <div className="flex-1">
                                                                <input
                                                                    type="text"
                                                                    value={option.value}
                                                                    onChange={(e) =>
                                                                        handleOptionChange(e, rowIndex, inputIndex, optionIndex, 'value')
                                                                    }
                                                                    placeholder="Option value"
                                                                    className="border border-gray-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <input
                                                                    type="text"
                                                                    value={option.showText}
                                                                    onChange={(e) =>
                                                                        handleOptionChange(e, rowIndex, inputIndex, optionIndex, 'showText')
                                                                    }
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
                                                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 mt-4"
                                                    >
                                                        Add Option
                                                    </button>
                                                </div>
                                            )}

                                            {/* Show file options (single/multiple) */}
                                            {input.type === 'file' && (
                                                <div className="mt-4">
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={input.multiple}
                                                            onChange={(e) =>
                                                                handleInputChange(e, rowIndex, inputIndex, 'multiple')
                                                            }
                                                            className="focus:ring-2 focus:ring-blue-400"
                                                        />
                                                        Allow multiple files
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                </div>
                                <button
                                    onClick={() => handleAddInput(rowIndex)}
                                    className={`bg-green-500 text-white px-3 py-1 rounded-lg : ""
                                        }`} >
                                    Add Input
                                </button>
                            </div>
                        </div>

                    ))}
                    <div className="mb-4">
                        <button
                            onClick={handleAddRow}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg mb-4"
                        >
                            Add Label
                        </button>
                    </div>
                    <div className="flex justify-between mt-6">
                        <div
                            onClick={handleBack}
                            className="flex items-center w-24 justify-center space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                        >
                            <FaChevronLeft className="text-xl text-white" />
                            <span className="font-semibold text-lg">Back</span>
                        </div>

                        <div
                            onClick={handleNext}
                            className="flex items-center justify-center w-24 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                        >
                            <span className="font-semibold text-lg">Next</span>
                            <FaChevronRight className="text-xl text-white" />
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="bg-white p-6 w-full border-t border-gray-300 mx-auto rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Step 3: Preview</h3>
                    <div className="py-3">
                        <div className='bg-[#c1dff2] border  border-black rounded-t-md p-4'>
                            <h3 className="text-center text-2xl font-semibold ">{formData.heading}</h3>
                        </div>
                        <table className="border-[#c1dff2] overflow-x-auto  border border-t-0 rounded-md w-full">
                            <thead>
                                <tr className='bg-gray-100'>
                                    <th className="py-2 px-4 border border-gray-300 text-left">
                                        PARTICULARS
                                    </th>
                                    {formData.headers
                                        .filter(header => header !== "PARTICULARS")
                                        .map((header, index) => (
                                            <th key={index} className="py-2 px-4 border border-gray-300 text-left">
                                                {header}
                                            </th>
                                        ))}

                                </tr>
                            </thead>
                            <tbody>
                                {formData?.rows?.map((row, rowIndex) => (
                                    <tr key={rowIndex} >
                                        <td className="py-2 px-4 border border-gray-300">{row.label}</td>
                                        {row.inputs.map((input, inputIndex) => (

                                            <td key={inputIndex} className={"py-2  px-4 border border-gray-300"}>
                                                {
                                                    input.type === 'text' ? (
                                                        <input type="text" name={input.name} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" readOnly />
                                                    ) : input.type === 'checkbox' ? (
                                                        <input type="checkbox" name={input.name} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" readOnly />
                                                    ) : input.type === 'email' ? (
                                                        <input type="email" name={input.name} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" readOnly />
                                                    ) : input.type === 'dropdown' ? (
                                                        <select name={input.name} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" readOnly>
                                                            <option value="">Select an option</option>
                                                            {input.options.map((option, index) => (
                                                                <option key={index} value={option.value}>{option.showText}</option>
                                                            ))}
                                                        </select>
                                                    ) 
                                                    : input.type === 'file' ? (
                                                        <input type="file" name={input.name} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" readOnly />
                                                    ) : input.type === 'datepicker' ? (
                                                        <input type="datepicker" name={input.name} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" readOnly />
                                                    ) : input.type === 'number' ? (
                                                        <input type="number" name={input.name} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" readOnly />
                                                    ) : null
                                                }
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>

                        </table>

                    </div>
                    <div className="flex justify-between mt-6">


                    </div>
                    <div className="flex justify-between mt-6">
                        <div
                            onClick={handleBack}
                            className="flex items-center w-24 justify-center space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                        >
                            <FaChevronLeft className="text-xl text-white" />
                            <span className="font-semibold text-lg">Back</span>
                        </div>

                        <button
                            className={`bg-green-500 text-white px-4 py-2 rounded-lg ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : 'Submit'}
                        </button>

                    </div>
                </div>
            )}
        </div>
    );
};

export default GenerateReportServiceForm;
