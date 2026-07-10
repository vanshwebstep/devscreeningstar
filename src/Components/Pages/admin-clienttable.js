import React, { useEffect, useState, useCallback ,useRef} from 'react';
import "../../App.css";
import { MultiSelect } from 'react-multi-select-component';

const ClientManagementData = () => {
    const [services, setServices] = useState([]);
    const [packageList, setPackageList] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedData, setSelectedData] = useState({});
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

    const fetchServices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const storedToken = localStorage.getItem("token") || '';
            const res = await fetch(`https://api.screeningstar.co.in/Screeningstar/service`, {
                headers: {
                    'Authorization': `Bearer ${storedToken}`,
                },
            });

            if (!res.ok) {
                const newToken = res.token || res._token || storedToken || '';
                if (newToken) {
                    console.log('token saved succesfully')
                    localStorage.setItem("_token", newToken);
                }
                throw new Error(`Network response was not ok: ${res.status}`)
            };


            const newToken = res.token || res._token || storedToken || '';
            if (newToken) {
                console.log('token saved succesfully')
                localStorage.setItem("_token", newToken);
            }
            const result = await res.json();
            if (!result || !Array.isArray(result)) throw new Error('Invalid response format');

            const processedServices = result.map(item => ({
                id: item.id,
                service_name: item.serviceName,
                service_group: item.group,
                sub_service_name: item.sub_serviceName,
                service_code: item.servicecode,
                price: '',
                selectedPackages: []
            }));
            setServices(processedServices);
        } catch (error) {
            console.error("Error fetching services:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPackages = useCallback(async () => {
        setError(null);
        const storedToken = localStorage.getItem("token") || '';
        try {
            if (!storedToken) throw new Error('No token found in local storage');

            const res = await fetch(`https://api.screeningstar.co.in/Screeningstar/package`, {
                headers: {
                    'Authorization': `Bearer ${storedToken}`,
                },
            });

            if (!res.ok){
                const newToken = res.token || res._token || storedToken || '';
                if (newToken) {
                    console.log('token saved succesfully');
                    localStorage.setItem("_token", newToken);
                }
                throw new Error(`Network response was not ok: ${res.status}`);
            }
            const newToken = res.token || res._token || storedToken || '';
            if (newToken) {
                console.log('token saved succesfully');
                localStorage.setItem("_token", newToken);
            }
            const result = await res.json();
            const processedPackages = result.map(item => ({
                ...item,
                id: item.id,
            }));
            setPackageList(processedPackages);
        } catch (error) {
            console.error("Error fetching packages:", error);
            setError(error.message);
        }
    }, []);

    useEffect(() => {
        fetchServices();
        fetchPackages();
    }, [fetchServices, fetchPackages]);

    const handlePackageChange = (selectedList, serviceId) => {
        const updatedPackages = selectedList.map(item => item.value);
        setSelectedData(prev => ({
            ...prev,
            [serviceId]: {
                ...prev[serviceId],
                selectedPackages: updatedPackages,
            }
        }));
    };

    const handleChange = (e, serviceId) => {
        const { name, value } = e.target;
        setSelectedData(prev => ({
            ...prev,
            [serviceId]: {
                ...prev[serviceId],
                [name]: value
            }
        }));
    };

    const handleCheckboxChange = (serviceId) => {
        setSelectedData(prev => ({
            ...prev,
            [serviceId]: {
                ...prev[serviceId],
                selected: !prev[serviceId]?.selected
            }
        }));
    };
      useEffect(() => {
    if (tableScrollRef.current) {
      setScrollWidth(tableScrollRef.current.scrollWidth + "px");
    }
  }, [services, loading]); 

    const handleSubmit = () => {
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
  <div className="table-container rounded-lg">
      {/* Top Scroll */}
      <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
        <div className="top-scroll-inner" style={{ width: scrollWidth }} />
      </div>

      {/* Actual Table Scroll */}
      <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>  
                <table className="min-w-full">
                <thead>
                    <tr className='bg-[#073d88]'>
                        <th className="py-2 md:py-3 px-4 text-white border-r border-b text-left uppercase whitespace-nowrap">Group</th>
                        <th className="py-2 md:py-3 px-4 text-white border-r border-b text-left uppercase whitespace-nowrap">Service code</th>
                        <th className="py-2 md:py-3 px-4 text-white border-r border-b text-left uppercase whitespace-nowrap">Verification Service</th>
                        <th className="py-2 md:py-3 px-4 text-white border-r border-b text-left uppercase whitespace-nowrap">Price</th>
                        <th className="py-2 md:py-3 px-4 text-white border-r border-b text-left uppercase whitespace-nowrap">Select Package</th>
                    </tr>
                </thead>
                <tbody>
                    {services.reduce((acc, item, index) => {
                        const isSameGroup = index > 0 && item.service_group === services[index - 1].service_group;

                        if (!isSameGroup) {
                            acc.push(
                                <tr key={`group-${item.id}`} className='bg-[#073d88]'>
                                    <th className="py-2 md:py-3 px-4 text-white border-r border-b text-center uppercase whitespace-nowrap">{item.service_group}</th>
                                    <th className="py-2 md:py-3 px-4 text-white border-r border-b text-left uppercase whitespace-nowrap"></th>
                                    <th className="py-2 md:py-3 px-4 text-white border-r border-b text-left uppercase whitespace-nowrap">{item.service_name}</th>
                                    <th className="py-2 md:py-3 px-4 text-white border-r border-b text-left uppercase whitespace-nowrap"></th>
                                    <th className="py-2 md:py-3 px-4 text-white border-r border-b text-left uppercase whitespace-nowrap"> </th>
                                </tr>
                            );
                        }

                        acc.push(
                            <tr key={item.id}>
                                <td className="py-2 md:py-3 px-4 border-l border-r border-b whitespace-nowrap"></td>
                                <td className="py-2 md:py-3 px-4 border-l border-r border-b whitespace-nowrap">{item.service_code}</td>
                                <td className="py-2 md:py-3 px-4 border-l border-r border-b whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        className='me-2'
                                        checked={!!selectedData[item.id]?.selected}
                                        onChange={() => handleCheckboxChange(item.id)}
                                    /> {item.sub_service_name}
                                </td>
                                <td className="py-2 md:py-3 px-4 border-r border-b whitespace-nowrap">
                                    <input
                                        type="number"
                                        name="price"
                                        value={selectedData[item.id]?.price || ''}
                                        onChange={(e) => handleChange(e, item.id)}
                                        className='outline-none'
                                    />
                                </td>
                                <td className="py-2 md:py-3 px-4 border-r border-b whitespace-nowrap uppercase text-left">
                                    <MultiSelect
                                        options={packageList.map(pkg => ({ label: pkg.packageName, value: pkg.id }))}
                                        value={packageList.filter(pkg => (selectedData[item.id]?.selectedPackages || []).includes(pkg.id))
                                            .map(pkg => ({ label: pkg.packageName, value: pkg.id }))}
                                        onChange={(selectedList) => handlePackageChange(selectedList, item.id)}
                                        labelledBy="Select Package"
                                    />
                                </td>
                            </tr>
                        );

                        return acc;
                    }, [])}
                </tbody>
            </table>
            <button onClick={handleSubmit} className="p-6 py-3 bg-[#2c81ba] text-white font-bold rounded-md hover:bg-[#0f5381]">
                Submit & Log Data
            </button>
        </div>
        </div>
    );
};

export default ClientManagementData;
