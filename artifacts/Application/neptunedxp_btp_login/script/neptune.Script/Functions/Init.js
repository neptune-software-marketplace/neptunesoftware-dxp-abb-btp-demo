let formLogons = [];
let text1 = "";
let text2 = "";
let text3 = "";

// Custom Login App - Mobile Client
let isMobile = false;
if (typeof AppCache !== "undefined" && AppCache.isMobile) isMobile = true;

// Add Function to AppCache object when inside Launchpad
if (isMobile) AppCache.loginAppSetSettings = logonScreen.setSettings;

// Forgot Password
const url = new URL(location.href);
const searchParams = url.searchParams;
const token = searchParams.get("token");

if (token) {
    formLogin.setVisible(false);
    formForgot.setVisible(false);
    formNewPassord.setVisible(true);

    const passwordReason = searchParams.get("reason");
    if (passwordReason === "expired") {
        txtFormNewPassRequired.setVisible(false);
        txtFormNewPassExpired.setVisible(true);
    } else {
        txtFormNewPassRequired.setVisible(true);
        txtFormNewPassExpired.setVisible(false);
    }
}

// Startup
if (!isMobile) {
    localStorage.removeItem("p9azuretoken");
    localStorage.removeItem("p9azuretokenv2");
    setTimeout(function () {
        logonScreen.getLogonTypes();
    }, 10);
}

// Phone
setTimeout(function () {
    if (sap.ui.Device.system.phone) {
        flexLogon.setHeight("100%");
        flexLogon.setWidth("100%");
        flexLogon.addStyleClass("nepFlexPhone");
        panLogonLocal.setWidth("100%");
        panLogonLocal.setHeight("100%");
        panLogonLocal.removeStyleClass("nepPanLogonBorder");
    }
}, 100);

/*
The global setTimeout() method sets a timer which executes a function or specified piece of code once the timer expires.
*/

// Custom Init - Happens only once when mounting the component
sap.ui.getCore().attachInit(function (startParams) {
    setTimeout(function () {

        // Check if in iframe
        const inIframe = window.self !== window.top;

        if (inIframe) {
            // Try silent BTP login
            btpLogin();
        } else {
            // Fallback to standard login page
            oApp.setVisible(true);
        }
        
    }, 500);
});

function getParameterValue(field, url) {
    var windowLocationUrl = url ? url : href;
    var reg = new RegExp("[?&]" + field + "=([^&#]*)", "i");
    var string = reg.exec(windowLocationUrl);
    return string ? string[1] : null;
}

function btpLogin() {
    let logonid = inLoginTypes.getSelectedKey() || "local";
    let logonType = ModelData.FindFirst(formLogons, "id", logonid);

    // Currently supported with SAP Cloud Identity Services are SAML and OpenID connect
    switch (logonType.type) {

        case "saml":

            let pathSearchAndHash =
                (location.pathname.substring(1) ? location.pathname : "") +
                location.search +
                location.hash;
            window.location.replace(
                "/user/logon/" +
                    logonType.type +
                    "/" +
                    logonType.path +
                    "?path=" +
                    encodeURIComponent(pathSearchAndHash)
            );

            break;

        case "openid-connect":
            const path = logonType.path;
            const iFrame = document.getElementById("loginBTP");

            iFrame.addEventListener("load", function (event) {
                const href = iFrame.contentWindow.location.href;
                if (href.match("code=")) {
                    const authResponse = getHashParamsFromUrl(href, path);
                    planet9LoginWithCode(authResponse, path);
                }
            });

            iFrame.src = "/user/logon/openid-connect/" + path;

            break;

        default:
            console.error("Unhandled logon type");
            
            // Fallback on standard custom login application
            oApp.setVisible(true);
            break;
    }
}

// Sorter Function
let sort_by = function (field, reverse, primer) {
    let key = primer
        ? function (x) {
              return primer(x[field]);
          }
        : function (x) {
              return x[field];
          };
    reverse = !reverse ? 1 : -1;
    return function (a, b) {
        return (a = key(a)), (b = key(b)), reverse * ((a > b) - (b > a));
    };
};
