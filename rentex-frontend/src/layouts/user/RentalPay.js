// src/layouts/user/RentalPay.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { getImageUrl } from "utils/imageUrl";

import api from "api/client";

function RentalPay() {
  const location = useLocation();
  const navigate = useNavigate();

  // 👉 RentalRequest에서 넘어온 데이터
  const { item, startDate, endDate, quantity } = location.state || {};

  const [agree, setAgree] = useState(false);
  const [paying, setPaying] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastSeverity, setToastSeverity] = useState("success");

  // 금액 계산
  const unitPrice = item?.dailyPrice ?? 0;
  const days =
    startDate && endDate
      ? Math.max(
          1,
          (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24) + 1,
        )
      : 1;
  const amount = unitPrice * quantity * days;

  const handlePay = async () => {
    try {
      setPaying(true);
      setToastSeverity("info");
      setToastMsg("결제 진행 중... 잠시만 기다려주세요.");
      setToastOpen(true);

      await api.post("/rentals/request", {
        itemId: item.id,
        startDate,
        endDate,
        quantity,
        amount,
        method: "CARD",
      });

      setTimeout(() => {
        setToastSeverity("success");
        setToastMsg("결제가 완료되었습니다! 대여 내역으로 이동합니다.");
        setToastOpen(true);
        setTimeout(() => navigate("/mypage/rentals", { replace: true }), 1500);
      }, 2000);
    } catch (e) {
      console.error("결제 실패:", e);

      const backendMsg = e?.response?.data?.message;
      setToastSeverity("error");
      setToastMsg(backendMsg || "결제에 실패했습니다. 다시 시도해주세요.");
      setToastOpen(true);

      // 벌점 차단일 경우는 뒤로 이동 ❌
      if (!backendMsg?.includes("벌점")) {
        setTimeout(() => navigate(-1), 2000);
      }
    }
  };

  if (!item) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox p={3}>
          <MDTypography color="error">잘못된 접근입니다.</MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={3}>
          {/* 장비 정보 */}
          <Grid item xs={12} md={5}>
            <Card sx={{ p: 2 }}>
              <MDTypography variant="h6" mb={2}>
                📦 장비 정보
              </MDTypography>
              <img
                src={getImageUrl(item.thumbnailUrl)}
                alt={item.name}
                style={{ width: "100%", borderRadius: "8px", marginBottom: "10px" }}
              />
              <MDTypography variant="h5">{item.name}</MDTypography>
              <MDTypography variant="body2" color="textSecondary">
                {item.category?.name} / {item.subCategory?.name}
              </MDTypography>
              <MDTypography variant="body2">
                일일 대여료: {unitPrice.toLocaleString()}원
              </MDTypography>
            </Card>
          </Grid>

          {/* 결제 정보 */}
          <Grid item xs={12} md={7}>
            <Card sx={{ p: 3 }}>
              <MDTypography variant="h6" mb={2}>
                💳 결제 정보
              </MDTypography>
              <MDTypography variant="body1">
                대여 기간: {startDate} ~ {endDate}
              </MDTypography>
              <MDTypography variant="body1">대여 일수: {days}일</MDTypography>
              <MDTypography variant="body1">수량: {quantity}개</MDTypography>
              <Divider sx={{ my: 2 }} />
              <MDTypography variant="h5" fontWeight="bold">
                총 결제 금액: {amount.toLocaleString()}원
              </MDTypography>

              <FormControlLabel
                control={<Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)} />}
                label="결제 진행에 동의합니다."
              />

              <MDBox mt={2} display="flex" gap={1}>
                <MDButton color="info" onClick={handlePay} disabled={!agree || paying}>
                  {paying ? (
                    <>
                      <CircularProgress size={18} sx={{ color: "white", mr: 1 }} />
                      결제 중...
                    </>
                  ) : (
                    "결제하기"
                  )}
                </MDButton>
                <MDButton
                  variant="outlined"
                  color="dark"
                  onClick={() => navigate(-1)}
                  disabled={paying}
                >
                  돌아가기
                </MDButton>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      <Snackbar
        open={toastOpen}
        autoHideDuration={2200}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          variant="filled"
          onClose={() => setToastOpen(false)}
          severity={toastSeverity}
          sx={{ width: "100%" }}
        >
          {toastMsg}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}

export default RentalPay;
