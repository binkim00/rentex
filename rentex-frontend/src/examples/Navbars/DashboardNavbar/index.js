import { useState, useEffect } from "react";
import MDTypography from "components/MDTypography";

// react-router components
import { useLocation, Link, useNavigate } from "react-router-dom";

// prop-types
import PropTypes from "prop-types";

// @mui material
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/Icon";
import Menu from "@mui/material/Menu";
import Icon from "@mui/material/Icon";

// custom components
import MDBox from "components/MDBox";
import MDInput from "components/MDInput";
import Breadcrumbs from "examples/Breadcrumbs";
import NotificationItem from "examples/Items/NotificationItem";

// ✅ 스타일 import
import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarMobileMenu,
} from "examples/Navbars/DashboardNavbar/styles";

// context
import {
  useMaterialUIController,
  setTransparentNavbar,
  setMiniSidenav,
  setOpenConfigurator,
} from "context";

// ✅ 토큰 유틸 & API 클라이언트
import { getToken, clearToken } from "utils/auth";
import api from "api/client";

function DashboardNavbar({ absolute, light, isMini }) {
  const [navbarType, setNavbarType] = useState();
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav, transparentNavbar, fixedNavbar, openConfigurator, darkMode } = controller;
  const [openMenu, setOpenMenu] = useState(false);
  const route = useLocation().pathname.split("/").slice(1);
  const [nickname, setNickname] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    api
      .get("/users/me") // ✅ baseURL 자동 + 토큰 자동 첨부됨
      .then((res) => {
        setNickname(res.data.nickname);
      })
      .catch((err) => {
        console.error("사용자 정보 불러오기 실패:", err);
      });
  }, []);

  // 로그아웃
  const handleLogout = async () => {
    try {
      clearToken();
      navigate("/authentication/sign-in");
    } catch (err) {
      console.error("로그아웃 실패:", err);
    }
  };

  useEffect(() => {
    if (fixedNavbar) setNavbarType("sticky");
    else setNavbarType("static");

    function handleTransparentNavbar() {
      setTransparentNavbar(dispatch, (fixedNavbar && window.scrollY === 0) || !fixedNavbar);
    }

    window.addEventListener("scroll", handleTransparentNavbar);
    handleTransparentNavbar();

    return () => window.removeEventListener("scroll", handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);
  const handleOpenMenu = (event) => setOpenMenu(event.currentTarget);
  const handleCloseMenu = () => setOpenMenu(false);

  const renderMenu = () => (
    <Menu anchorEl={openMenu} open={Boolean(openMenu)} onClose={handleCloseMenu} sx={{ mt: 2 }}>
      <NotificationItem icon={<Icon>email</Icon>} title="Check new messages" />
      <NotificationItem icon={<Icon>podcasts</Icon>} title="Manage Podcast sessions" />
      <NotificationItem icon={<Icon>shopping_cart</Icon>} title="Payment successfully completed" />
    </Menu>
  );

  const iconsStyle = ({ palette: { dark, white, text }, functions: { rgba } }) => ({
    color: () => {
      let colorValue = light || darkMode ? white.main : dark.main;
      if (transparentNavbar && !light) {
        colorValue = darkMode ? rgba(text.main, 0.6) : text.main;
      }
      return colorValue;
    },
  });

  return (
    <AppBar
      position={absolute ? "absolute" : navbarType}
      color="inherit"
      sx={(theme) => ({
        ...navbar(theme, { transparentNavbar, absolute, light, darkMode }),
      })}
    >
      <Toolbar>
        <MDBox color="inherit" mb={{ xs: 1, md: 0 }}>
          <Breadcrumbs icon="home" title={route[route.length - 1]} route={route} light={light} />
        </MDBox>
        {isMini ? null : (
          <MDBox display="flex" alignItems="center" ml="auto">
            <MDBox pr={1}>
              <MDInput label="Search here" />
            </MDBox>

            {/* ✅ 닉네임 표시 + 기본 간격 */}
            {nickname && (
              <MDBox display="flex" alignItems="center" pr={2} sx={{ ml: 1 }}>
                <MDTypography variant="button" fontWeight="medium">
                  👤 {nickname} 님
                </MDTypography>
              </MDBox>
            )}

            <IconButton size="small" color="inherit" onClick={handleLogout} sx={{ ml: 1 }}>
              <Icon>logout</Icon>
            </IconButton>

            <MDBox color={light ? "white" : "inherit"}>
              <Link to="/authentication/sign-in">
                <IconButton size="small" disableRipple sx={{ ml: 1 }}>
                  <Icon sx={iconsStyle}>account_circle</Icon>
                </IconButton>
              </Link>

              <IconButton
                size="small"
                disableRipple
                color="inherit"
                onClick={handleMiniSidenav}
                sx={{ ml: 1 }}
              >
                <Icon sx={iconsStyle} fontSize="medium">
                  {miniSidenav ? "menu_open" : "menu"}
                </Icon>
              </IconButton>

              <IconButton
                size="small"
                disableRipple
                color="inherit"
                onClick={handleConfiguratorOpen}
                sx={{ ml: 1 }}
              >
                <Icon sx={iconsStyle}>settings</Icon>
              </IconButton>

              <IconButton
                size="small"
                disableRipple
                color="inherit"
                onClick={handleOpenMenu}
                sx={{ ml: 1 }}
              >
                <Icon sx={iconsStyle}>notifications</Icon>
              </IconButton>
              {renderMenu()}
            </MDBox>
          </MDBox>
        )}
      </Toolbar>
    </AppBar>
  );
}

DashboardNavbar.defaultProps = {
  absolute: false,
  light: false,
  isMini: false,
};

DashboardNavbar.propTypes = {
  absolute: PropTypes.bool,
  light: PropTypes.bool,
  isMini: PropTypes.bool,
};

export default DashboardNavbar;
