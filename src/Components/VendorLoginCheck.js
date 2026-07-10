import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const VendorLoginCheck = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      const vendor = JSON.parse(localStorage.getItem("vendor") || "null");
      const token = localStorage.getItem("vendor_token");
      if (!vendor?.id || !token) {
        localStorage.removeItem("vendor");
        localStorage.removeItem("vendor_token");
        navigate("/vendor-login");
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/vendor/verify-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendor_id: vendor.id, _token: token }),
        });
        const result = await response.json();
        if (!response.ok || !result.status) throw new Error(result.message || "Unauthorized");
        if (result.token) localStorage.setItem("vendor_token", result.token);
        if (result.vendorData) localStorage.setItem("vendor", JSON.stringify(result.vendorData));
        setLoading(false);
      } catch (error) {
        localStorage.removeItem("vendor");
        localStorage.removeItem("vendor_token");
        navigate("/vendor-login");
      }
    };

    verify();
  }, [navigate]);

  if (loading) {
    return <div className="flex w-full justify-center items-center h-screen"><div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div></div>;
  }

  return children;
};

export default VendorLoginCheck;
