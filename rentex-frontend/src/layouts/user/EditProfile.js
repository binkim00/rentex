import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "utils/auth";
import { useAuth } from "contexts/AuthContext";
import api from "api/client";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import UserHeader from "./UserHeader";

import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import MDSnackbar from "components/MDSnackbar";

function EditProfile() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const formatPhoneNumberForDisplay = (numStr) => {
    if (!numStr) return "";
    const cleaned = String(numStr).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3,4})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return numStr; // 포맷팅에 실패하면 원본 값 반환
  };

  const [form, setForm] = useState({
    name: "",
    nickname: "",
    contactPhone: "",
    role: "USER",
    contactEmail: "",
    businessNo: "",
  });

  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, color: "info", title: "", message: "" });
  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = getToken();
        if (!token) {
          navigate("/authentication/sign-in");
          return;
        }
        const res = await api.get("/users/me");
        const data = res.data;

        setForm({
          name: data.name || "",
          nickname: data.nickname || "",
          contactPhone: data.contact_phone || data.phone || "",
          role: data.role || "USER",
          contactEmail: data.contact_email || "",
          businessNo: data.business_no || "",
        });
      } catch (e) {
        setErr(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleConfirm = async () => {
    if (!editingField) return;

    const fieldMapping = {
      name: "name",
      nickname: "nickname",
      contactPhone: "contact_phone",
      contactEmail: "contact_email",
      businessNo: "business_no",
    };
    const backendFieldName = fieldMapping[editingField];

    // ✨ 수정된 부분: "phone" -> "contactPhone"
    const valueToSubmit =
      editingField === "contactPhone"
        ? tempValue.replace(/-/g, "") || null
        : tempValue.trim() || null;

    const payload = { [backendFieldName]: valueToSubmit };

    try {
      await api.patch("/users/me", payload);
      // 서버로 전송한 값(valueToSubmit)과 동일한 형태로 로컬 상태를 업데이트합니다.
      const updatedValue = editingField === "contactPhone" ? valueToSubmit : tempValue;
      setForm((prev) => ({ ...prev, [editingField]: updatedValue }));
      setEditingField(null);
      setSnackbar({
        open: true,
        color: "success",
        title: "성공",
        message: "정보가 성공적으로 수정되었습니다.",
      });
    } catch (e) {
      setSnackbar({
        open: true,
        color: "error",
        title: "오류 발생",
        message: e.response?.data?.message || "정보 수정에 실패했습니다.",
      });
    }
  };

  const handleEdit = (fieldName, currentValue) => {
    setEditingField(fieldName);
    // 전화번호 필드를 수정할 때는 화면에 표시되던 포맷팅된 값을 초기값으로 설정합니다.
    if (fieldName === "contactPhone") {
      setTempValue(formatPhoneNumberForDisplay(currentValue));
    } else {
      setTempValue(currentValue);
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setTempValue("");
  };

  const handlePhoneChange = (e) => {
    const formattedPhoneNumber = e.target.value
      .replace(/\D/g, "")
      .replace(/^(\d{0,3})(\d{0,4})(\d{0,4}).*/, "$1-$2-$3")
      .replace(/-{1,2}$/g, "");
    setTempValue(formattedPhoneNumber);
  };

  const handleWithdrawal = async () => {
    if (window.confirm("정말로 탈퇴하시겠습니까? 탈퇴 후에는 계정을 복구할 수 없습니다.")) {
      try {
        await api.delete("/users/me");

        // ✨ AuthContext의 logout 함수를 호출합니다.
        logout();

        setSnackbar({
          open: true,
          color: "success",
          title: "성공",
          message: "성공적으로 회원 탈퇴되었습니다.",
        });

        // 상태가 업데이트되는 동안 잠시 기다린 후 메인 페이지로 이동합니다.
        setTimeout(() => {
          navigate("/authentication/sign-in");
        }, 1000);
      } catch (e) {
        setSnackbar({
          open: true,
          color: "error",
          title: "탈퇴 실패",
          message: e.response?.data?.message || "회원 탈퇴에 실패했습니다.",
        });
      }
    }
  };

  const renderProfileField = (label, fieldName, isPhone = false) => {
    const currentValue = form[fieldName];
    const isEditing = editingField === fieldName;

    const displayValue = isPhone ? formatPhoneNumberForDisplay(currentValue) : currentValue;

    return (
      <MDBox display="flex" justifyContent="space-between" alignItems="center" py={2}>
        <MDTypography variant="subtitle2" fontWeight="medium" sx={{ minWidth: "100px" }}>
          {label}
        </MDTypography>
        {isEditing ? (
          <Stack direction="row" spacing={1} alignItems="center" width="100%">
            <MDInput
              fullWidth
              value={tempValue}
              onChange={isPhone ? handlePhoneChange : (e) => setTempValue(e.target.value)}
              placeholder={isPhone ? "010-1234-5678" : ""}
            />
            <MDButton variant="gradient" color="info" size="small" onClick={handleConfirm}>
              확인
            </MDButton>
            <MDButton variant="outlined" color="secondary" size="small" onClick={handleCancel}>
              취소
            </MDButton>
          </Stack>
        ) : (
          <Stack direction="row" spacing={2} alignItems="center" sx={{ width: "100%" }}>
            <MDTypography
              variant="body2"
              color={currentValue ? "text" : "secondary"}
              sx={{ flexGrow: 1 }}
            >
              {displayValue || "정보를 입력해주세요"}
            </MDTypography>
            <MDButton
              variant="text"
              color="info"
              onClick={() => handleEdit(fieldName, currentValue)}
            >
              수정
            </MDButton>
          </Stack>
        )}
      </MDBox>
    );
  };

  if (loading) {
    return <>...</>;
  }
  if (err) {
    return <>...</>;
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <UserHeader showEditButton={false} showPenaltyPoints={false} showImageEditButton={true}>
        <MDBox mt={5} mb={3}>
          <Grid container justifyContent="center">
            <Grid item xs={12} md={8} lg={6}>
              <Card>
                <MDBox p={3}>
                  <MDTypography variant="h5" mb={2}>
                    기본 정보
                  </MDTypography>

                  {renderProfileField(form.role === "PARTNER" ? "사명" : "이름", "name")}
                  <Divider />
                  {renderProfileField("닉네임", "nickname")}
                  <Divider />
                  {renderProfileField("연락처", "contactPhone", true)}
                  <Divider />

                  {form.role === "PARTNER" && (
                    <>
                      {renderProfileField("기업 메일", "contactEmail")}
                      <Divider />
                      {renderProfileField("사업자 번호", "businessNo")}
                      <Divider />
                    </>
                  )}

                  <MDBox mt={4}>
                    <MDButton color="error" variant="outlined" fullWidth onClick={handleWithdrawal}>
                      회원 탈퇴
                    </MDButton>
                  </MDBox>
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        </MDBox>
      </UserHeader>
      <Footer />
      <MDSnackbar
        color={snackbar.color}
        icon={snackbar.color === "success" ? "check" : "warning"}
        title={snackbar.title}
        open={snackbar.open}
        onClose={closeSnackbar}
        close={closeSnackbar}
        bgWhite
      >
        {snackbar.message}
      </MDSnackbar>
    </DashboardLayout>
  );
}

export default EditProfile;
