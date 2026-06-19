import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { FaChevronLeft } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from "axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
const CandidateDAV = () => {
    const [davData, setDAVData] = useState([]);
    const navigate = useNavigate();
    const [applicationData, setApplicationData] = useState([]);
    const [companyName, setCompanyName] = useState('');
    const [serviceData, setServiceData] = useState([]);
    const [serviceValueDataForPDF, setServiceValueDataForPDF] = useState([]);
    const [serviceValueData, setServiceValueData] = useState([]);

    const urlParams = new URLSearchParams(window.location.search);

    const [loading, setLoading] = useState(true);

    // Step 2: Get values from localStorage



    const [isValidApplication, setIsValidApplication] = useState(true);

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

        // Determine the type of file and render accordingly
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(fileExtension)) {
            return <img src={fileUrl} alt="Image File" style={{}} />;
        }

        if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(fileExtension)) {
            return renderIframe(fileUrl);
        }

        return <p>Unsupported file type</p>;
    };
    const Loader = () => (
        <div className="flex w-full justify-center items-center h-20">
            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
    );
    const isApplicationExists = useCallback(() => {
        setLoading(true);  // Set loading to true before making the fetch request.

        const applicationId = urlParams.get('applicationId');
        const branchId = urlParams.get('branch_id');
        const token = localStorage.getItem('_token');
        const adminData = JSON.parse(localStorage.getItem('admin'));
        const admin_id = adminData?.id;

        fetch(`https://api.screeningstar.co.in/candidate-master-tracker/dav-application-by-id?application_id=${applicationId}&branch_id=${branchId}&admin_id=${admin_id}&_token=${token}`)
            .then(res => res.json())
            .then(result => {
                setLoading(false);  // Set loading to false when the request is complete.

                if (!result.status) {
                    setIsValidApplication(false);
                    Swal.fire({
                        title: 'Error',
                        text: result.message,
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });

                    const form = document.getElementById('bg-form');
                    if (form) {
                        form.remove();
                    }

                    // Show the error message
                    const errorMessageDiv = document.createElement('div');
                    errorMessageDiv.classList.add(
                        'bg-red-100', 'text-red-800', 'border', 'border-red-400', 'p-6',
                        'rounded-lg', 'max-w-lg', 'mx-auto', 'shadow-lg', 'absolute',
                        'top-1/2', 'left-1/2', 'transform', '-translate-x-1/2', '-translate-y-1/2'
                    );

                    errorMessageDiv.innerHTML = `
                        <h1 class="font-semibold text-2xl">Error</h1>
                        <p class="text-lg">${result.message}</p>
                    `;

                    document.body.appendChild(errorMessageDiv);
                }
                setCompanyName(result.application?.customer_name || 'N/A');
                const serviceDataa = result.serviceData || {};
                const jsonDataArray = Object.values(serviceDataa)?.map(item => item.jsonData) || [];
                const serviceValueDataArray = Object.values(serviceDataa)?.map(item => item.data) || [];
                console.log(`serviceDataa - `, serviceDataa);
                Object.values(serviceDataa).forEach(entry => {
                    const key = entry.jsonData?.db_table;
                    const value = entry.data;
                    if (key) {
                        serviceValueData[key] = value;
                    }
                });
                setServiceValueData(serviceValueDataArray);

                setServiceValueDataForPDF(serviceValueData);
                setServiceData(jsonDataArray);
                setDAVData(result.DEFData);
                setApplicationData(result.application);

            })
            .catch(err => {
                setLoading(false);  // Ensure loading is false even if there's an error.
                Swal.fire({
                    title: 'Error',
                    text: err.message,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            });
    }, []);

    useEffect(() => {
        isApplicationExists();
    }, []);


    const formatDatedmy = (isoString) => {
        if (!isoString || isNaN(new Date(isoString).getTime())) {
            return ;  // Return "nill" if the date is invalid or null
        }
        const date = new Date(isoString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear(); // full year (e.g., 2025)
        return `${day}-${month}-${year}`;
    };
    const homePhotoUrls = davData?.home_photo?.split(',')
        .map(url => url.trim())
        .map(url => url.replace(/\\/g, '/'));

    const identityProofUrls = davData?.identity_proof?.split(',')
        .map(url => url.trim())
        .map(url => url.replace(/\\/g, '/'));

    const localityUrls = davData?.locality?.split(',')
        .map(url => url.trim())
        .map(url => url.replace(/\\/g, '/'));



    const handleGoBack = () => {
        navigate(`/admin-CandidateCheckin?clientId=${davData.customer_id}&branchId=${davData.branch_id}&BranchName=${applicationData.customer_name}`);

    };
    const formatDate = (isoString) => {
        const date = new Date(isoString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    };
    const fullName = davData.full_name;
    const createdDate = formatDate(davData.created_at);
    const generatePdf = async () => {
        const swalLoading = Swal.fire({
            title: 'Generating PDF...',
            text: 'Please wait a moment.',
            showConfirmButton: false,
            allowOutsideClick: false,
            // didOpen: () => {
            //     Swal.showLoading();
            // }
        });

        try {
            // Create a new PDF document
            const doc = new jsPDF({ compress: true });
            let yPosition = 10;
            const gapY = 8; // consistent gap between tables

            // Table 1: Header
            doc.autoTable({
                startY: yPosition,
                head: [[{
                    content: 'Digital Address Verification Form',
                    styles: {
                        halign: 'center',
                        fontSize: 12,
                        fontStyle: 'bold',
                        fillColor: [197, 217, 241],
                        textColor: [80, 80, 80]
                    }
                }]],
                body: [[{
                    content: `Company name: ${companyName}`,
                    styles: { fontStyle: 'bold', halign: 'center' }
                }]],
                theme: 'grid',
                margin: { top: 10, left: 15, right: 15 },
                styles: {
                    cellPadding: 2,
                    fontSize: 10,
                    lineWidth: 0.2,
                    lineColor: [0, 0, 0]
                }
            });
            yPosition = doc.autoTable.previous.finalY + gapY;
            const pageWidth = doc.internal.pageSize.getWidth() - 30;

            console.log('davData', davData);
            const personalBody = [
                [{ content: "Full Name of the Applicant", styles: { fontStyle: 'bold' } }, davData?.name || "N/A"],
                [{ content: "Aadhaar Number", styles: { fontStyle: 'bold' } }, davData?.aadhaar_number || "N/A"],
                [{ content: "Father's Name", styles: { fontStyle: 'bold' } }, davData?.father_name || "N/A"],
                [{ content: "Email Id", styles: { fontStyle: 'bold' } }, davData?.email || "N/A"],
                [{ content: "Employee ID", styles: { fontStyle: 'bold' } }, davData?.employee_id || "N/A"],
                [{ content: "Mobile Number", styles: { fontStyle: 'bold' } }, davData?.mobile_number || "N/A"],
                [{ content: "Gender", styles: { fontStyle: 'bold' } }, davData?.gender || "N/A"],
                [{ content: "Marital Status", styles: { fontStyle: 'bold' } }, davData?.marital_status || "N/A"],
                [{ content: "Date of Birth (dd/mm/yy)", styles: { fontStyle: 'bold' } }, davData?.dob || "N/A"],
                [{ content: "Husband's Name", styles: { fontStyle: 'bold' } }, davData?.husband_name || "N/A"],
                [{ content: "Latitude", styles: { fontStyle: 'bold' } }, davData?.latitude || "N/A"],
                [{ content: "Longitude", styles: { fontStyle: 'bold' } }, davData?.longitude || "N/A"],
                [{ content: "Type of ID Attached", styles: { fontStyle: 'bold' } }, davData?.id_type || "N/A"],
                [{ content: "No of years staying in the address", styles: { fontStyle: 'bold' } }, davData?.years_staying || "N/A"],
          
            ];

            doc.autoTable({
                startY: yPosition,
                head: [[{
                    content: "Personal Information",
                    colSpan: 2,
                    styles: {
                        halign: "center",
                        fontSize: 12,
                        fontStyle: "bold",
                        fillColor: [197, 217, 241],
                        textColor: [80, 80, 80],
                        cellPadding: 2
                    }
                }]],
                body: personalBody,
                theme: 'grid',
                margin: { top: 10, left: 15, right: 15 },
                styles: {
                    fontSize: 10,
                    font: 'helvetica',
                    textColor: [80, 80, 80],
                    lineWidth: 0.2,
                    lineColor: [0, 0, 0],
                    cellPadding: 2
                },
                headStyles: {
                    fillColor: [197, 217, 241],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    fontSize: 11
                },
                columnStyles: {
                    0: { cellWidth: pageWidth * 0.4 },
                    1: { cellWidth: pageWidth * 0.6 }
                }
            });
            yPosition = doc.autoTable.previous.finalY + gapY;

            // Table 3: Current Address
            doc.autoTable({
                startY: yPosition,
                head: [[{
                    content: 'Current Address',
                    colSpan: 2,
                    styles: {
                        halign: 'center',
                        fontSize: 12,
                        fontStyle: 'bold',
                        fillColor: [197, 217, 241],
                        textColor: [80, 80, 80]
                    }
                }]],
                body: [
                    [
                        { content: 'Current Address', styles: { fontStyle: 'bold' } },
                        davData.candidate_address || 'N/A'
                    ],
                    [
                        { content: 'Pin Code', styles: { fontStyle: 'bold' } },
                        davData.pin_code || 'N/A'
                    ],
                  
                    [
                        { content: 'Current State', styles: { fontStyle: 'bold' } },
                        davData.state || 'N/A'
                    ],
                    [
                        { content: 'Current Landmark', styles: { fontStyle: 'bold' } },
                        davData.landmark || 'N/A'
                    ],    
                    [
                        { content: 'Period of Stay', styles: { fontStyle: 'bold' } },
                        `${davData.from_date} to ${davData.to_date || 'N/A'}`

                    ]   , 
                    [
                        { content: 'Nearest Police Station', styles: { fontStyle: 'bold' } },
                        davData.police_station || 'N/A'
                    ]
                ],
                theme: 'grid',
                margin: { top: 10, left: 15, right: 15 },
                styles: {
                    fontSize: 10,
                    cellPadding: 2,
                    lineWidth: 0.2,
                    lineColor: [0, 0, 0]
                },
                columnStyles: {
                    0: { cellWidth: pageWidth * 0.4 },
                    1: { cellWidth: pageWidth * 0.6 }
                }
            });


            yPosition = doc.autoTable.previous.finalY - 2;
            (async () => {
                let newYPosition = 20
                // doc.addPage();
                const disclaimerButtonHeight = 8; // Button height (without padding)
                const disclaimerButtonWidth = doc.internal.pageSize.width - 20; // Full width minus margins

                // Constants for additional spacing
                const buttonBottomPadding = 5; // Padding below the button
                const backgroundColor = '#c5d9f1';

                let disclaimerY = 10; // Starting position
                const adjustedDisclaimerButtonHeight = disclaimerButtonHeight + buttonBottomPadding;
                const disclaimerButtonXPosition = (doc.internal.pageSize.width - disclaimerButtonWidth) / 2;

                doc.setDrawColor(0, 0, 0); // Set border color to black
                doc.setFillColor(backgroundColor); // Fill color
                // doc.rect(disclaimerButtonXPosition, disclaimerY, disclaimerButtonWidth, disclaimerButtonHeight, 'F'); // Fill
                // doc.rect(disclaimerButtonXPosition, disclaimerY, disclaimerButtonWidth, disclaimerButtonHeight, 'D'); // Border

                doc.setTextColor(80, 80, 80); // Black text
                doc.setFontSize(13);

                // Calculate center Y of button for vertical alignment
                const disclaimerTextYPosition = disclaimerY + (disclaimerButtonHeight / 2) + (doc.getFontSize() / 8);
                doc.setFont('helvetica', 'bold'); // Set font to Helvetica Bold
                // doc.text('Declaration and Authorization', doc.internal.pageSize.width / 2, disclaimerTextYPosition, {
                //     align: 'center',
                // });


                const disclaimerTextPart1 = `I hereby authorize Screeningstar Solutions Private Limited and its representative to verify the information provided in my application for employment and this employee background verification form, and to conduct enquiries as may be necessary, at the company’s discretion.
                
                I authorize all persons who may have information relevant to this enquiry to disclose it to ScreeningStar HR Services Pvt Ltd or its representative. I release all persons from liability on account of such disclosure. I confirm that the above information is correct to the best of my knowledge. I agree that in the event of my obtaining employment, my probationary appointment, confirmation as well as continued employment in the services of the company are subject to clearance of medical test and background verification check done by the company.`;

                const disclaimerLinesPart1 = doc.splitTextToSize(disclaimerTextPart1, disclaimerButtonWidth);
                const lineHeight = 5
                const disclaimerTextHeight =
                    disclaimerLinesPart1.length * lineHeight +
                    lineHeight; // Extra space for anchor // Extra space for anchor
                const disclaimerTextTopMargin = 5; // Margin from top of the disclaimer text

                const totalContentHeight = adjustedDisclaimerButtonHeight + disclaimerTextHeight + disclaimerTextTopMargin;
                let currentY = disclaimerY + adjustedDisclaimerButtonHeight + disclaimerTextTopMargin;
                let maxLineWidth = 0;
                // disclaimerLinesPart1.forEach((line) => {
                //     const lineWidth = doc.getTextWidth(line);
                //     if (lineWidth > maxLineWidth) {
                //         maxLineWidth = lineWidth;
                //     }
                // });
                const paragraphX = (doc.internal.pageSize.width - maxLineWidth - 14);
                const paragraphGap = 2; // smaller gap between paragraphs
                const paragraphs = disclaimerTextPart1.trim().split(/\n\s*\n/); // split into paragraphs
                doc.setFont('helvetica', 'normal'); // Reset to normal for following text

                // paragraphs.forEach(paragraph => {
                //     const lines = doc.splitTextToSize(paragraph.trim(), disclaimerButtonWidth);

                //     lines.forEach((line, index) => {
                //         doc.setFontSize(13);
                //         doc.setFont('helvetica', 'normal'); // Reset to normal for following text

                //         const words = line.trim().split(' ');
                //         const lineWidth = doc.getTextWidth(line);
                //         const spaceWidth = doc.getTextWidth(' ');
                //         const extraSpace = disclaimerButtonWidth - lineWidth;
                //         const spacesToAdd = words.length - 1;

                //         let spacing = 0;

                //         // Apply spacing only if it's not the last line and enough words to space
                //         if (index !== lines.length - 1 && spacesToAdd > 0) {
                //             spacing = extraSpace / spacesToAdd;

                //             // 👌 Control it — don’t let it stretch too much
                //             const maxSpacing = 1.5; // You can tweak this to 1 or 2
                //             spacing = Math.min(spacing, maxSpacing);
                //         }

                //         let x = paragraphX;
                //         words.forEach((word, wordIndex) => {
                //             doc.text(word, x, currentY);
                //             x += doc.getTextWidth(word) + spaceWidth + (wordIndex < words.length - 1 ? spacing : 0);
                //         });

                //         currentY += lineHeight;
                //     });

                //     currentY += paragraphGap;
                // });
                newYPosition = doc.autoTable.previous.finalY - 70; // Adjusting for space from the last table


                const newPageWidth = pageWidth + 10;
                // Create a single row table
                const tableWidth = newPageWidth * 0.9; // Adjust this value for the desired table width
                const tableMargin = (newPageWidth - tableWidth) / 2; // Calculate the left margin to center the table

                // doc.autoTable({
                //     startY: newYPosition - 70,
                //     margin: { left: tableMargin }, // Apply the margin to center the table
                //     body: [
                //         [
                //             {
                //                 content: 'Full Name of Applicant',
                //                 styles: { fontStyle: 'bold', halign: 'center' } // Center align the first column
                //             },
                //             {
                //                 content: fullName,
                //                 styles: { fontStyle: 'normal', halign: 'center' } // Center align the second column
                //             },
                //             {
                //                 content: 'Date',
                //                 styles: { fontStyle: 'bold', halign: 'center' } // Center align the third column
                //             },
                //             {
                //                 content: createdDate,
                //                 styles: {
                //                     fontStyle: 'normal',
                //                     fillColor: [255, 255, 255], // white background
                //                     halign: 'center' // Center align the fourth column
                //                 }
                //             }
                //         ]
                //     ],
                //     theme: 'grid',
                //     styles: {
                //         fontSize: 12,
                //         halign: 'center', // Center align the entire table content
                //         lineWidth: 0.2,
                //         lineColor: [0, 0, 0],
                //         cellPadding: 2,
                //     },
                //     columnStyles: {
                //         0: { cellWidth: newPageWidth * 0.3 },
                //         1: { cellWidth: newPageWidth * 0.2 },
                //         2: { cellWidth: newPageWidth * 0.3 },
                //         3: { cellWidth: newPageWidth * 0.2 },
                //     }
                // });



                doc.save(`${applicationData?.employee_id}-${applicationData?.customer_name}`);
                console.log('davData', davData)
                swalLoading.close();

                // Optionally, show a success message
                Swal.fire({
                    title: 'PDF Generated!',
                    text: 'Your PDF has been successfully generated.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
            })();
        } catch (error) {
            console.log('error', error)
            swalLoading.close();
            Swal.fire({
                title: 'Error!',
                text: 'Something went wrong while generating the PDF.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    };
 
    return (
        <>
            <form action="" className='p-4 border border-black' id='bg-form'>
                {
                    loading ? (
                        <div className='flex justify-center items-center py-6 ' >
                            <Loader className="text-center" />
                        </div >
                    ) : (
                        <>
                            <div
                                onClick={handleGoBack}
                                className="flex items-center w-36 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                            >
                                <FaChevronLeft className="text-xl text-white" />
                                <span className="font-semibold text-lg">Go Back</span>
                            </div>
                            <h3 className="text-center py-3 font-bold text-2xl">Digital Address Verification</h3>
                            <div className="border md:w-7/12 m-auto p-4 ">
                                <div className="md:grid grid-cols-1 md:grid-cols-3 mb-2 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">Company Name:</label>
                                        <input type="text" value={davData?.company_name} readOnly className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="company_name" name="company_name" />
                                    </div>

                                    <div className=" my-3 form-group">
                                        <label htmlFor="candidate_name" className="block text-sm font-medium text-gray-700">Candidate Name:</label>
                                        <input type="text" value={davData?.name} readOnly className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="candidate_name" name="candidateName" />
                                    </div>

                                    <div className=" my-3 form-group">
                                        <label className="block text-sm font-medium text-gray-700">Employee ID:</label>
                                        <input type="text" value={davData?.employee_id} readOnly className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="employee_id" />
                                    </div>
                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-2 mb-2 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="mob_no" className="block text-sm font-medium text-gray-700">Mobile No:</label>
                                        <input type="text" value={davData?.mobile_number} readOnly className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="mob_no" name="mobNo" />
                                    </div>

                                    <div className=" my-3 form-group">
                                        <label htmlFor="email_id" className="block text-sm font-medium text-gray-700">Email ID:</label>
                                        <input type="email" value={davData?.email} readOnly className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="email_id" name="emailId" />
                                    </div>
                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                                        <textarea className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="address" name="candidate_address" rows="2">{davData?.candidate_address}</textarea>
                                    </div>

                                    <div className=" my-3 form-group">
                                        <label htmlFor="candidate_location" className="block text-sm font-medium text-gray-700">Location:</label>
                                        <input type="text" value={davData?.candidate_location} className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="candidate_location" name="candidate_location" />
                                    </div>

                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-2 mb-2 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">Latitude:</label>
                                        <input type="text" value={davData?.latitude} className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="latitude" name="latitude" />
                                    </div>
                                    <div className=" my-3 form-group">
                                        <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">Longitude:</label>
                                        <input type="text" value={davData?.longitude} className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="longitude" name="longitude" />
                                    </div>

                                </div>
                                <div className="col-span-2 mt-5 mb-2">
                                    <h4 className="text-center text-lg font-semibold">Personal Information</h4>
                                </div>


                                <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="aadhaar_number" className="block text-sm font-medium text-gray-700">Aadhaar Number:</label>
                                        <input type="text" value={davData?.aadhaar_number} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="aadhaar_number" />
                                    </div>

                                    <div className=" my-3 form-group">
                                        <label htmlFor="dob" className="block text-sm font-medium text-gray-700">Date of Birth:</label>
                                        <input type="text" value={formatDatedmy(davData?.dob)} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="dob" id="dob" />
                                    </div>
                                </div>
                                <div className="form-group mb-2">
                                    <label htmlFor="father_name" className="block text-sm font-medium text-gray-700">Father's Name:</label>
                                    <input type="text" value={davData?.father_name} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="father_name" />
                                </div>
                                <div className="form-group mb-2">
                                    <label htmlFor="husband_name" className="block text-sm font-medium text-gray-700">Husband's Name:</label>
                                    <input type="text" value={davData?.husband_name} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="husband_name" />
                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-2 mb-2 gap-4">


                                    <div className=" my-3 form-group">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Gender:</p>
                                        <div className="flex space-x-4 flex-wrap">
                                            <input type="text" value={davData?.gender} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="gender" />

                                        </div>
                                    </div>

                                    <div className=" my-3 form-group">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Marital Status:</p>
                                        <div className="flex space-x-4 flex-wrap">
                                            <input type="text" value={davData?.marital_status} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="marital_status" />

                                        </div>
                                    </div>
                                </div>

                                <div className="md:grid grid-cols-1 md:grid-cols-2 mb-2 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="pin_code" className="block text-sm font-medium text-gray-700">Pin_code:</label>
                                        <input type="text" value={davData?.pin_code} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="pin_code" />
                                    </div>

                                    <div className=" my-3 form-group">
                                        <label htmlFor="state" className="block text-sm font-medium text-gray-700">State:</label>
                                        <input type="text" value={davData?.state} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="state" />
                                    </div>


                                </div>
                                <div className=" my-3 form-group">
                                    <label htmlFor="landmark" className="block text-sm font-medium text-gray-700">Prominent Landmark:</label>
                                    <input type="text" value={davData?.landmark} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="landmark" />
                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-1 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="police_station" className="block text-sm font-medium text-gray-700">Nearest Police Station:</label>
                                        <input type="text" value={davData?.police_station} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="police_station" />
                                    </div>

                                </div>

                                <div className="col-span-2">
                                    <p className="text-sm font-medium text-gray-700">Period of Stay:</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label>From Date:</label>
                                            <input type="text" value={formatDatedmy(davData?.from_date)} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="from_date" />
                                        </div>
                                        <div>
                                            <label>To Date:</label>
                                            <input type="text" value={formatDatedmy(davData?.to_date)} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="to_date" />
                                        </div>
                                    </div>
                                </div>

                                <div className=" my-3 form-group">
                                    <label htmlFor="id_type" className="block text-sm font-medium text-gray-700">Type of ID Attached:</label>
                                    <input type="text" value={davData?.id_type} className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="id_type" name="id_type" />
                                </div>

                                <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="id_proof" className="block text-sm font-medium text-gray-700">Upload ID:</label>
                                        <div className="mt-2 w-1/3">
                                            {
                                                identityProofUrls && identityProofUrls.length > 0 ? (
                                                    identityProofUrls.map((url, index) => (
                                                        <FileViewer key={index} fileUrl={url} className="w-full max-w-xs" />
                                                    ))
                                                ) : (
                                                    <p>No identity Proof  available.</p>
                                                )
                                            }
                                        </div>
                                    </div>

                                    <div className="my-3 form-group">
                                        <label htmlFor="home_photo" className="block text-sm font-medium text-gray-700">
                                            Home Photos:
                                        </label>
                                        <div className="mt-2 w-1/3">
                                            {
                                                homePhotoUrls && homePhotoUrls.length > 0 ? (
                                                    homePhotoUrls.map((url, index) => (
                                                        <FileViewer key={index} fileUrl={url} className="w-full max-w-xs" />
                                                    ))
                                                ) : (
                                                    <p>No home photo available.</p>
                                                )
                                            }
                                        </div>
                                    </div>

                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="locality_proof" className="block text-sm font-medium text-gray-700">Locality Photos:</label>
                                        <div className="mt-2 w-1/3">
                                            {
                                                localityUrls && localityUrls.length > 0 ? (
                                                    localityUrls.map((url, index) => (
                                                        <FileViewer key={index} fileUrl={url} className="w-full max-w-xs" />
                                                    ))
                                                ) : (
                                                    <p>No locality Proof available.</p>
                                                )
                                            }
                                        </div>
                                    </div>
                                    <div className="form-group my-3">
                                        <label htmlFor="nof_yrs_staying" className="block text-sm font-medium text-gray-700">No of years staying in the address:</label>
                                        <div className="mt-2 w-1/3">
                                            <input type="text" value={davData?.years_staying} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="years_staying" />

                                        </div>
                                    </div>
                                </div>
                                <button className='bg-[#3e76a5] mt-4 text-white p-3 rounded-md' onClick={generatePdf} type='button'>Download PDF</button>
                            </div>
                        </>
                    )}




            </form>


        </>
    );
};

export default CandidateDAV;