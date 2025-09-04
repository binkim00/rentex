import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "api/client";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "layouts/authentication/components/Footer";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";

import PageHeader from "layouts/dashboard/header/PageHeader";
import { useCategories } from "components/Hooks/useCategories";
import CameraAltIcon from "@mui/icons-material/CameraAlt";

// ★ 표시용 URL 정규화 유틸
import { getImageUrl } from "utils/imageUrl";

function PartnerItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { categories, subCategories, fetchSubCategories } = useCategories();

  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    subCategoryId: "",
    dailyPrice: 0,
    stockQuantity: 0,
    description: "",
    detailDescription: "",
    status: "AVAILABLE",
    partnerId: null,
  });

  // ★ 기존에 서버가 준 상세 이미지 URL들(원본 그대로 보관)
  const [existingDetailUrls, setExistingDetailUrls] = useState([]);
  // ★ 사용자가 이번 편집에서 추가한 새 파일들만 분리
  const [newDetailFiles, setNewDetailFiles] = useState([]);

  // 썸네일
  const [thumbnail, setThumbnail] = useState(null); // 새로 업로드한 썸네일 파일
  const [previewUrl, setPreviewUrl] = useState(null); // 화면 표시용 썸네일 URL

  // 조회
  useEffect(() => {
    api
      .get(`/partner/items/${id}`)
      .then((res) => {
        const d = res.data || {};
        setForm({
          name: d.name || "",
          categoryId: d.categoryId || "",
          subCategoryId: d.subCategoryId || "",
          dailyPrice: d.dailyPrice || 0,
          stockQuantity: d.stockQuantity || 0,
          description: d.description || "",
          detailDescription: d.detailDescription || "",
          status: d.status || "AVAILABLE",
          partnerId: d.partnerId || null,
        });

        // ★ 썸네일은 표시용으로만 getImageUrl 적용
        setPreviewUrl(d.thumbnailUrl ? getImageUrl(d.thumbnailUrl) : null);

        // ★ 상세이미지: 서버 원본 문자열 배열을 그대로 보관 (전송 시 사용)
        setExistingDetailUrls(Array.isArray(d.detailImages) ? d.detailImages : []);
        setNewDetailFiles([]); // 새 파일 초기화
      })
      .catch(() => alert("장비 상세 정보를 불러오는데 실패했습니다."));
  }, [id]);

  // 소분류 로딩
  useEffect(() => {
    if (!form.categoryId) return setForm((prev) => ({ ...prev, subCategoryId: "" }));
    fetchSubCategories(form.categoryId);
  }, [form.categoryId, fetchSubCategories]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" && value !== "" ? Number(value) : value,
    }));
  };

  // 썸네일 업로드
  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file); // 전송용
      setPreviewUrl(URL.createObjectURL(file)); // 표시용
    }
  };

  // 상세 이미지 추가
  const handleDetailImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    const total = existingDetailUrls.length + newDetailFiles.length + files.length;
    if (total > 5) {
      alert("상세 이미지는 최대 5개까지 업로드 가능합니다.");
      return;
    }
    setNewDetailFiles((prev) => [...prev, ...files]);
  };

  // 상세 이미지 제거(인덱스는 "표시 순서" 기준: 기존 URL들 먼저, 그 다음 새 파일들)
  const removeDetailImage = (idx) => {
    const existingCount = existingDetailUrls.length;
    if (idx < existingCount) {
      // 기존 URL 제거
      setExistingDetailUrls((prev) => prev.filter((_, i) => i !== idx));
    } else {
      // 새 파일 제거
      const fileIdx = idx - existingCount;
      setNewDetailFiles((prev) => prev.filter((_, i) => i !== fileIdx));
    }
  };

  // 전송 페이로드 구성
  const buildFormData = () => {
    // 서버로 보낼 DTO(JSON)에는 "삭제하지 않은 기존 이미지 URL"만 담아 보냄
    const dto = {
      ...form,
      detailImages: existingDetailUrls, // ★ 서버 원본 문자열 그대로 사용
    };

    const fd = new FormData();
    fd.append("item", new Blob([JSON.stringify(dto)], { type: "application/json" }));

    if (thumbnail) fd.append("thumbnail", thumbnail); // 썸네일(선택)
    newDetailFiles.forEach((file) => fd.append("detailImages", file)); // 새 상세 이미지 파일들

    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/partner/items/${id}`, buildFormData(), {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("수정 성공!");
      navigate(`/partner/items/${id}`);
    } catch (error) {
      console.error("수정 실패:", error.response?.data || error.message);
      alert("수정 실패!");
    }
  };

  // ★ 화면 표시용 합성 배열: 기존(URL) → 새 파일 순
  const displayImages = [
    ...existingDetailUrls.map((raw) => ({ kind: "url", src: getImageUrl(raw) })),
    ...newDetailFiles.map((file) => ({ kind: "file", src: URL.createObjectURL(file) })),
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <PageHeader title="장비 수정" bg="linear-gradient(60deg, #1b6bffff, #3b90ffff)" />

      <MDBox sx={{ background: "#f5f7fa", minHeight: "100vh", py: 5 }}>
        <Card sx={{ p: 4, borderRadius: 3, boxShadow: 3, maxWidth: 1000, mx: "auto" }}>
          <MDTypography variant="h5" gutterBottom mb={5}>
            🛠 장비 수정
          </MDTypography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* 왼쪽: 썸네일 */}
              <Grid item xs={12} md={6}>
                <MDTypography variant="body2" mb={1}>
                  썸네일 이미지
                </MDTypography>
                <div
                  style={{
                    width: "100%",
                    height: 270,
                    border: "2px dashed #ccc",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    background: "#fafafa",
                    cursor: "pointer",
                    transition: "border-color 0.2s, background 0.2s",
                    marginBottom: 16,
                  }}
                  onClick={() => document.getElementById("thumbnail-upload").click()}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3b90ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#ccc")}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="썸네일"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <CameraAltIcon style={{ fontSize: 40, color: "#aaa" }} />
                  )}
                </div>
                <input
                  id="thumbnail-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleThumbnailChange}
                />
              </Grid>

              {/* 오른쪽: 기본 정보 */}
              <Grid item xs={12} md={6}>
                <MDInput
                  label="장비명"
                  name="name"
                  fullWidth
                  required
                  value={form.name}
                  onChange={handleChange}
                />

                <MDBox sx={{ mt: 3 }}>
                  <MDTypography variant="body2" mb={1}>
                    대분류
                  </MDTypography>
                  <select
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      height: 40,
                      borderRadius: 4,
                      border: "1px solid #ccc",
                      paddingLeft: 8,
                    }}
                  >
                    <option value="">대분류 선택</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </MDBox>

                <MDBox sx={{ mt: 2 }}>
                  <MDTypography variant="body2" mb={1}>
                    소분류
                  </MDTypography>
                  <select
                    name="subCategoryId"
                    value={form.subCategoryId}
                    onChange={handleChange}
                    disabled={!form.categoryId || subCategories.length === 0}
                    required
                    style={{
                      width: "100%",
                      height: 40,
                      borderRadius: 4,
                      border: "1px solid #ccc",
                      paddingLeft: 8,
                    }}
                  >
                    <option value="">소분류 선택</option>
                    {subCategories.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.name}
                      </option>
                    ))}
                  </select>
                </MDBox>

                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={6}>
                    <MDInput
                      label="대여 단가"
                      name="dailyPrice"
                      type="number"
                      fullWidth
                      required
                      value={form.dailyPrice}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <MDInput
                      label="재고 수량"
                      name="stockQuantity"
                      type="number"
                      fullWidth
                      required
                      value={form.stockQuantity}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>

                <MDBox sx={{ mt: 2 }}>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: 40,
                      borderRadius: 4,
                      border: "1px solid #ccc",
                      paddingLeft: 8,
                    }}
                    required
                  >
                    <option value="AVAILABLE">사용 가능</option>
                    <option value="UNAVAILABLE">사용 불가</option>
                  </select>
                </MDBox>
              </Grid>

              {/* 설명 */}
              <Grid item xs={12}>
                <MDInput
                  label="설명"
                  name="description"
                  multiline
                  rows={3}
                  fullWidth
                  value={form.description}
                  onChange={handleChange}
                />
              </Grid>

              {/* 상세 설명 */}
              <Grid item xs={12}>
                <MDInput
                  label="상세 설명"
                  name="detailDescription"
                  multiline
                  rows={5}
                  fullWidth
                  value={form.detailDescription}
                  onChange={handleChange}
                />
              </Grid>

              {/* 상세 이미지 */}
              <Grid item xs={12}>
                <MDTypography variant="h6" mb={1}>
                  상세 이미지 (최대 5개)
                </MDTypography>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                  {/* 표시 순서: 기존 URL → 새 파일 */}
                  {displayImages.map((img, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: 120,
                        height: 120,
                        border: "2px dashed #ccc",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        overflow: "hidden",
                        background: "#fafafa",
                      }}
                    >
                      <img
                        src={img.src}
                        alt={`상세-${idx}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => (e.currentTarget.style.opacity = 0.2)}
                      />

                      <button
                        type="button"
                        onClick={() => removeDetailImage(idx)}
                        style={{
                          position: "absolute",
                          top: -5,
                          right: -5,
                          background: "red",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: 20,
                          height: 20,
                          cursor: "pointer",
                        }}
                        title="삭제"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {/* 업로드 슬롯 */}
                  {displayImages.length < 5 && (
                    <div
                      onClick={() => document.getElementById("detail-upload").click()}
                      style={{
                        width: 120,
                        height: 120,
                        border: "2px dashed #ccc",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        background: "#fafafa",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ color: "#aaa", fontSize: 24 }}>+</span>
                    </div>
                  )}
                </div>

                <input
                  id="detail-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleDetailImagesChange}
                />
              </Grid>
            </Grid>

            <MDBox mt={4} display="flex" justifyContent="flex-end" gap={1}>
              <MDButton
                variant="outlined"
                color="secondary"
                onClick={() => navigate("/partner/items")}
              >
                목록으로
              </MDButton>
              <MDButton type="submit" color="info">
                저장하기
              </MDButton>
            </MDBox>
          </form>
        </Card>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default PartnerItemDetail;
