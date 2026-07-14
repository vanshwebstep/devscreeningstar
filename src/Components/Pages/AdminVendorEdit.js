import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { useApiLoading } from "../ApiLoadingContext";
import { VendorForm } from "./AdminVendorOnboarding";

const API = "http://localhost:5000";

const AdminVendorEdit = () => {
  const { vendorId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { validateAdminLogin, setApiLoading } = useApiLoading();
  const [vendor, setVendor] = useState(location.state?.vendor || null);
  const [loading, setLoading] = useState(!location.state?.vendor);

  const backRoute = Number(vendor?.status) === 0 ? "/admin-inactive-vendor-listing" : "/admin-vendor-listing";

  const fetchVendor = useCallback(async () => {
    if (vendor) return;
    const admin = JSON.parse(localStorage.getItem("admin") || "{}");
    const token = localStorage.getItem("_token");
    if (!admin?.id || !token) {
      navigate("/admin-login");
      return;
    }

    setLoading(true);
    setApiLoading(true);
    try {
      await validateAdminLogin();
      const response = await fetch(`${API}/vendor/detail?vendor_id=${vendorId}&admin_id=${admin.id}&_token=${token}`);
      const result = await response.json();
      const newToken = result.token || result._token;
      if (newToken) localStorage.setItem("_token", newToken);
      if (!response.ok || !result.status) throw new Error(result.message || "Unable to fetch vendor.");
      setVendor(result.vendor);
    } catch (error) {
      Swal.fire("Error", error.message || "Unable to fetch vendor.", "error");
      if (String(error.message || "").toLowerCase().includes("login")) navigate("/admin-login");
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  }, [navigate, setApiLoading, validateAdminLogin, vendor, vendorId]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  if (loading) {
    return (
      <div className="bg-white border border-black p-10 text-center">
        <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin m-auto"></div>
      </div>
    );
  }

  if (!vendor) {
    return <div className="bg-white border border-black p-10 text-center text-red-500">Vendor not found</div>;
  }

  return (
    <div className="bg-[#c1dff2] border border-black">
      <h2 className="md:text-2xl text-xl font-bold py-3 text-left text-[#4d606b] px-3 border">
        EDIT VENDOR
      </h2>
      <VendorForm
        mode="edit"
        initialVendor={vendor}
        onSaved={() => navigate(backRoute)}
        onCancel={() => navigate(backRoute)}
      />
    </div>
  );
};

export default AdminVendorEdit;