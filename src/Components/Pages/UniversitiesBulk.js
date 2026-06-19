import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MultiSelect } from "react-multi-select-component";
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx'; // Ensure you have xlsx installed
import axios from 'axios';
import { useApiLoading } from '../ApiLoadingContext';
import CustomMultiSelect from '../UserPages/CustomMultiselect';


import { FaChevronLeft } from 'react-icons/fa';

const UniversitiesBulk = () => {
    
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();

    const [fileName, setFileName] = useState("");
    const [isFileValid, setIsFileValid] = useState(false);
    const navigate = useNavigate();
    const [newData, setNewData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const clientEditRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const entriesPerPage = 10; const storedToken = localStorage.getItem('token');
    const [branchData, setBranchData] = useState(null);
    const [errors, setErrors] = useState({});
    const [spocID, setSpocID] = useState('');
    const [spocName, setSpocName] = useState('');
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableData, setTableData] = useState([]);
    const [organisationName, setOrganisationName] = useState('');
    const [handleEditClick, setHandleEditClick] = useState('');
    const [ApplicationId, setCandidateApplicationId] = useState('');
    const [formData, setFormData] = useState({})
    const [data, setData] = useState([]);
    const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
    const token = localStorage.getItem('_token');

    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [modalServices, setModalServices] = React.useState([]);

    
    const allServices = services.map((service, index) => ({
        ...service,
        groupSymbol: service.group_symbol || service.group_name,
        index,
      }));
    // Calculate total pages
    const totalEntries = allServices.length;
    const totalPages = Math.ceil(totalEntries / entriesPerPage);

    // Get current page services
    const startIndex = (currentPage - 1) * entriesPerPage;
    const currentServices = allServices.slice(startIndex, startIndex + entriesPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    const fetchCustomerInfo = useCallback(async () => {
        setLoading(true);
        setApiLoading(true);
        const branchData = JSON.parse(localStorage.getItem("branch"));
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem('_token');
    

        const branch_token = localStorage.getItem("branch_token");
        const url = `https://api.screeningstar.co.in/internal-storage/ex-employment/list?admin_id=${adminId}&_token=${token}`;

        try {
            let response;
            // Assuming branchData is already an object; no need for JSON.parse
                response = await fetch(url);
            if (response.ok) {
                setLoading(false);
                setApiLoading(false);

                const result = await response.json();
                const newToken = data.token || data._token || storedToken;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }

                const services = result.data.services;
                                setServices(services);
             
                setSpocID(result.data.customer.spoc_details[0].id);
                setSpocName(result.data.customer.spoc_details[0].name);
            } else {
                setApiLoading(false);
                setLoading(false);
                console.log('Error fetching data:', response.statusText);
            }
        } catch (error) {
            setApiLoading(false);
            setLoading(false);
            console.error('Error fetching data:', error);
        }
        setApiLoading(false);
        setLoading(false);
    }, [branchData]);


    useEffect(() => {
        const initialize = async () => {
            try {
                if (apiLoading == false) {
                    await validateAdminLogin();
                    await fetchCustomerInfo();
                }
            } catch (error) {
                console.error(error.message);
                navigate('/admin-login');
            }
        };

        initialize();
    }, [fetchCustomerInfo, navigate]);



    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
            const token = localStorage.getItem('_token');

            // Extract selected service IDs
            const selectedServiceIds = services
            .filter((service) => service?.isSelected)
            .map((service) => service?.id)
            .join(",");

            // Validate required data
            if (
                !data ||
                data.length === 0 ||
                !selectedServiceIds
            ) {
                setLoading(false);
                return Swal.fire({
                    icon: "error",
                    title: "Incomplete Data",
                    text: "All required fields must be completed before submitting.",
                });
            }


            let modifiedData = data.map((item) => ({
                ...item,
                scope_of_services: selectedServiceIds, // or any specific value per item
                package: "xyz", // if needed in each object
            }));
            
            let requestBody = {
                admin_id: adminId,
                _token: token,
                data: modifiedData,
            };
            
            

          
            const response = await fetch(
                "https://api.screeningstar.co.in/internal-storage/university/bulk/create",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody),
                    redirect: "follow",
                }
            );

            const result = await response.json();

            // Update token if provided in the response
            const updatedToken = result.token || result._token || "";
            if (updatedToken) {
                localStorage.setItem("branch_token", updatedToken);
            }

            if (response.ok && result.status) {
                Swal.fire({
                    icon: "success",
                    title: "Submission Successful",
                    text: result.message || "The data has been submitted successfully.",
                    confirmButtonText: "OK", // Customize the button text
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Navigate to ClientManager page
                        navigate("/admin-Universities");  // Replace with your route
                    }
                });
                console.log("Submission successful:", result);
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Submission Failed",
                    text: result.message || "Failed to submit the data.",
                });
            }

        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Submission Failed",
                text: `An error occurred during submission: ${error.message}`,
            });
            console.error("Error during submission:", error);
        } finally {
            setLoading(false);
        }
    };




  
      const selectPackageById = (selectedPackageIds) => {
          // Iterate over the services and update isSelected based on selected package IDs
          services.forEach(group => {
              group.services.forEach(service => {
                  // Check if any package within the service matches the selected package ID
                  const matchingPackage = service.packages.some(pkg => selectedPackageIds.includes(pkg.name));
  
                  // Update the service's isSelected based on whether any package matches
                  service.isSelected = matchingPackage;
              });
          });
  
          // Optional: Log the updated services to verify
          console.log(services);
      };
  
      const handlePackageChange = (selectedOptions) => {
        console.log("handlePackageChange triggered");
        console.log("Selected Options:", selectedOptions);

        const selectedPackageIds = selectedOptions?.map(option => option.value) || [];
        console.log("Mapped Selected Package IDs:", selectedPackageIds);

        const isSelectAllSelected = selectedPackageIds.includes("select_all");
        const isCurrentlyAllSelected = formData?.package?.includes("select_all");

        if (isSelectAllSelected && !isCurrentlyAllSelected) {
            console.log('"select_all"',services);
            const groupedServices = {};

            services.forEach(service => {
              if (!groupedServices[service.group_name]) {
                groupedServices[service.group_name] = [];
              }
              service.isSelected = true;
              groupedServices[service.group_name].push(service);
            });
            
            const updatedFormData = {
                ...formData,
                package: ["select_all"]
            };
            setFormData(updatedFormData);
            console.log("FormData updated with select_all");
            return;
        }

        if (isSelectAllSelected && isCurrentlyAllSelected) {
            console.log('"select_all" clicked again. Deselecting all services...');

            // Deselect all services
            services.forEach(service => {
                service.isSelected = false;
                console.log(`Service ${service.title} deselected`);
              });
              

            const updatedFormData = {
                ...formData,
                package: []
            };
            setFormData(updatedFormData);
            console.log("FormData cleared");
            return;
        }

        if (selectedPackageIds.length === 0) {
            console.log("No packages selected. Deselecting all services...");

            services.forEach(group => {
                group.services.forEach(service => {
                    service.isSelected = false;
                    console.log(`Service ${service.name} deselected`);
                });
            });

            setFormData({ ...formData, package: [] });
            return;
        }

        console.log("Specific packages selected. Matching services...");
        selectPackageById(selectedPackageIds);

        const updatedFormData = {
            ...formData,
            package: selectedPackageIds
        };
        setFormData(updatedFormData);
        console.log("FormData updated with specific packages");
    };
  
      const handleCheckboxChange = (index) => {
        console.log('index---',index)
        const updatedServices = [...services];
        updatedServices[index].isSelected = !updatedServices[index].isSelected;
        setServices(updatedServices);
      };
      const uniquePackages = [
          ...new Map(
            services
              .flatMap(service => service.packages || [])
              .map(pkg => [pkg.id, pkg]) // use Map to keep uniqueness by id
          ).values()
        ];
        
  
      const handleFileUpload = (e) => {
          const file = e.target.files[0];
          if (file && file.type === 'text/csv') {
              console.log("File selected:", file.name); // Log file selection
  
              const reader = new FileReader();
              reader.onload = () => {
                  const fileContent = reader.result;
                  console.log("File content loaded:", fileContent); // Log CSV content
                  setFileName(file.name);
                  setIsFileValid(true);
                  const parsedData = parseCSV(fileContent);
                  const csvHeaders = csvHeadings(fileContent); // Ass-uming csvHeadings correctly returns column headers.
                  console.log("Headers:", csvHeaders); // Log headers
  
                  const newData = [];
                  let hasError = false;
  
                  // Validate and process data
                  parsedData.forEach((row, index) => {
                      const values = Object.values(row).map((value) => value.trim());
                      const allEmpty = values.every((val) => val === '');
                      const someEmpty = values.some((val) => val === '') && !allEmpty;
  
                      if (allEmpty) {
                          console.log(`Skipping row ${index + 1}: Empty row.`); // Skip empty rows
                      } else if (someEmpty) {
                          setFileName('');
                          setIsFileValid(false);
                          console.log(`Error in row ${index + 1}: Missing values.`); // Log error for incomplete rows
                          hasError = true;
  
                          // Check which fields are missing
                          const missingFields = csvHeaders.filter((header, i) => !values[i] || values[i] === '');
                          const errorMessage = `Row ${index + 1} is incomplete. Missing fields: ${missingFields.join(', ')}`;
  
                          // Display the error
                          Swal.fire({
                              icon: 'error',
                              title: 'Error',
                              text: errorMessage,
                          });
                      } else {
                          newData.push(cleanFieldNames(row)); // Only add valid rows
                      }
                  });
  
                  if (hasError) {
                      console.log("Errors found. Not processing file further."); // Stop processing on error
                      return;
                  }
  
                  // Set valid data if no errors
                  setData(newData);
                  console.log("Processed and set valid data:", newData); // Log valid data
              };
  
              reader.readAsText(file);
          } else {
              console.log("Invalid file type selected."); // Log invalid file type
              Swal.fire({
                  icon: 'error',
                  title: 'Invalid File',
                  text: 'Please upload a valid CSV file.',
              });
          }
      };
  
      const cleanFieldNames = (row) => {
          const cleanedRow = {};
          Object.keys(row).forEach((key) => {
              const cleanKey = key.replace(/^_+|_+$/g, ''); // Remove leading and trailing underscores
              cleanedRow[cleanKey] = row[key];
          });
          return cleanedRow;
      };
  
      const csvHeadings = (csv) => {
          const rows = csv.split('\n');
          const headers = rows[0].split(','); // Get headers (first row)
          return headers.map((header) => header);
      };
  
      const parseCSV = (csv) => {
          const rows = csv.split('\n');
          const headers = rows[0].split(','); // Get headers (first row)
          const dataArray = rows.slice(1).map((row) => {
              const values = row.split(',');
              let rowObject = {};
              headers.forEach((header, index) => {
                  const formattedHeader = formatKey(header);
                  rowObject[formattedHeader] = values[index] ? values[index].trim() : '';
              });
              return rowObject;
          });
          return dataArray;
      };
  
    const formatKey = (key) => {
        // Convert to lowercase, remove special characters, replace spaces with underscores, and double underscores with a single one
        return key
            .toLowerCase()                    // Convert to lowercase
            .replace(/[^a-z0-9\s_]/g, '')      // Remove special characters
            .replace(/\s+/g, '_')              // Replace spaces with underscores
            .replace(/__+/g, '_');             // Replace double underscores with single
    };
    const Loader = () => (
        <div className="flex w-full justify-center items-center h-20">
            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
    );
    const handleGoBack = () => {
        navigate('/admin-Universities');
    };
    const csvData = `university_name,university_address,contact_name,designation,mobile_number,email_id,pricing,turnaround_time,standard_process,verification_link,remark
telangana university,"21 st,sdj12,d",A,A,1,a@gmail.com,1 rs,1,a,l1,r1
LPU university,"21 st,sdj12,dds",V,V,2,b@gmail.com,2rs,5,b,l2,r12
Chandigarh university,"21 st,sdj12,dqe",G,C,3,c@gmail.com,3rs,9,c,l3,r123`;

    const handleDownload = () => {
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'UNIVERSITIES-SAMPLE.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };
    return (

        <div className="bg-[#c1dff2] border border-black" ref={clientEditRef} id="clientedit" >
            <h2 className="text-2xl font-bold py-3 text-left border-b border-b-black  text-[#4d606b] px-3 border">UNIVERSITIES BULK UPLOAD </h2>
            <div className="bg-white md:p-12 p-6 w-full mx-auto">
                <div
                    onClick={handleGoBack}
                    className="flex items-center mb-8 w-36 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                >
                    <FaChevronLeft className="text-xl text-white" />
                    <span className="font-semibold text-lg">Go Back</span>
                </div>
                <form className="space-y-4 w-full text-center" onSubmit={handleSubmit}>
                    <div className='md:flex space-x-4'>
                        <div className="md:w-2/5">
                            <div className="w-full">
                                <div className="file-upload-wrapper text-left">
                                    {/* Custom Button */}
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById("fileInput").click()}
                                        className="upload-button bg-green-500   transition-all duration-200 hover:bg-green-600 hover:scale-105"
                                    >
                                        Upload CSV
                                    </button>

                                    {/* Hidden Input */}
                                    <input
                                        id="fileInput"
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <button
                                        type='button'
                                        onClick={handleDownload}
                                        className="bg-orange-600 ml-4 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
                                    >
                                        Download Sample CSV
                                    </button>

                                    {/* Display File Name Conditionally */}
                                    <input
                                        type="text"
                                        value={isFileValid ? fileName : ""}
                                        placeholder="No file selected"
                                        readOnly
                                        className="file-name-input mt-4 p-2 border rounded w-full"
                                    />
                                </div>
                                {errors.organizationName && <p className="text-red-500 text-sm">{errors.organizationName}</p>}
                            </div>
                            <div className='flex justify-center gap-5 md:mt-10 mt-4 md:mb-4 mb-10 items-center'>
                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`p-6 py-3 bg-[#2c81ba]  transition-all duration-200 hover:scale-105 text-white font-bold rounded-md hover:bg-[#0f5381] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {handleEditClick ? 'Edit' : 'Submit'}

                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className='md:w-3/5 margin-l'>
                            <div className="space-y-4 m-auto w-full  bg-white rounded-md">
                                <CustomMultiSelect
                                    options={Array.from(new Set(uniquePackages.map(pkg => pkg.name)))
                                        .map(name => ({ label: name, value: name }))
                                    }
                                    value={Array.isArray(formData.package) ? formData.package.map(pkg => ({ label: pkg, value: pkg })) : []}

                                    onChange={handlePackageChange}
                                    placeholder="SELECT SERVICES"
                                />

                            </div>
                            <div className='p-2.5 overflow-x-auto   '>
                            <table className="m-auto w-full border-collapse border border-black rounded-lg">
                                    <thead>
                                        <tr className="bg-[#c1dff2] whitespace-nowrap text-[#4d606b]">
                                            <th className=" uppercase border border-black px-4 py-2">SERVICE</th>
                                            <th className=" uppercase border border-black px-4 py-2">SERVICE NAMES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (

                                            <tr>
                                                <td colSpan={6} className="py-4 text-center text-gray-500">
                                                    <Loader className="text-center" />
                                                </td>
                                            </tr>
                                        ) : (
                                            <>
                                                {currentServices.map((service,index) => (
                                                    <tr className="text-center" key={service.id}>
                                                        <td className="border border-black px-4 py-2">
                                                            <input
                                                                type="checkbox"
                                                                className='w-6 h-6'
                                                                checked={service.isSelected || false}
                                                                name="services[]"
                                                                onChange={() =>
                                                                    handleCheckboxChange(service.index)
                                                                }
                                                            />
                                                        </td>

                                                        <td className="border border-black px-4 text-left py-2 whitespace-nowrap">{service.title}</td>
                                                    </tr>
                                                ))}
                                            </>
                                        )}
                                    </tbody>       
                                </table>
                            </div>
                            <div className="flex justify-center mt-4 space-x-2">
                                <button
                                    type='button'
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                                >
                                    Previous
                                </button>

                                {(() => {
                                    const maxPagesToShow = 3; // Maximum page numbers to display
                                    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
                                    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

                                    // Adjust if we are close to the beginning or end
                                    if (endPage - startPage + 1 < maxPagesToShow) {
                                        startPage = Math.max(1, endPage - maxPagesToShow + 1);
                                    }

                                    const pages = [];
                                    if (startPage > 1) {
                                        pages.push(
                                            <button
                                                type='button'
                                                key={1}
                                                onClick={() => handlePageChange(1)}
                                                className="px-4 py-2 bg-gray-200 rounded"
                                            >
                                                1
                                            </button>
                                        );
                                        if (startPage > 2) {
                                            pages.push(<span key="start-ellipsis">...</span>);
                                        }
                                    }

                                    for (let page = startPage; page <= endPage; page++) {
                                        pages.push(
                                            <button
                                                type='button'
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`px-4 py-2 ${currentPage === page
                                                    ? "bg-[#2c81ba] text-white"
                                                    : "bg-gray-200"
                                                    } rounded`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    }

                                    if (endPage < totalPages) {
                                        if (endPage < totalPages - 1) {
                                            pages.push(<span key="end-ellipsis">...</span>);
                                        }
                                        pages.push(
                                            <button
                                                type='button'
                                                key={totalPages}
                                                onClick={() => handlePageChange(totalPages)}
                                                className="px-4 py-2 bg-gray-200 rounded"
                                            >
                                                {totalPages}
                                            </button>
                                        );
                                    }

                                    return pages;
                                })()}

                                <button
                                    type='button'
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default UniversitiesBulk;