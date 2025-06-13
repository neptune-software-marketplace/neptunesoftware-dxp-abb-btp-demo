let logonScreen = {
    smtpVerified: false,
    isExternal: false,
    sapData: undefined,

    showForm: function(form) {
        formLogin.setVisible(false);
        formForgot.setVisible(false);
        formNewPassword.setVisible(false);

        if (form === `login`) {
            formLogin.setVisible(true);
            AppCacheShellTitle.setText(`Logon`);

        } else if (form === `forgotPassword`) {
            formForgot.setVisible(true);
            AppCacheShellTitle.setText(`Forgot Password`);

        } else if (form === `newPassword`) {
            formNewPassword.setVisible(true);
            AppCacheShellTitle.setText(`New Password`);
        }
        
    },

    getLogonTypes: function () {
        let query = "";

        // From Browser
        if (location.pathname.toLowerCase().indexOf("/launchpad/") > -1) {
            let path = location.pathname.split("/");
            query = "?launchpad=" + path[path.length - 1];
        }

        $.ajax({
            type: "GET",
            url: "/user/logon/types" + query,
            success: function (data) {
                logonScreen.setSettings(data);
            },
            error: function (result, status) {},
        });
    },

    setSettings: function (data) {

        data.logonTypes.sort(sort_by("name", false));
        logonScreen.smtpVerified = data.showForgotPassword;

        // External Registration of Users
        if (data.launchpadIsExternal) logonScreen.isExternal = true;

        // Logon Types
        let idps = [];

        // Add Local Login
        if (!data.disableLocalAuth) {
            inLoginTypes.addItem(
                new sap.ui.core.Item({
                    key: "local",
                    text: "Local",
                })
            );
        }

        // Add Other Login
        data.logonTypes.forEach(function (item) {
            if (!item.show) return;

            switch (item.type) {
                case "saml":
                case "ldap":
                case "azure-bearer":
                case "oauth2":
                case "openid-connect":
                case "sap":
                    logonScreen.addFormLogon(item);
                    break;
            }
        });

        // Set Default Selected
        let selectedLoginType = localStorage.getItem("selectedLoginType");
        if (selectedLoginType === "local" && data.disableLocalAuth) {
            selectedLoginType = undefined;
        }

        if (data.defaultLoginIDP) {
            data.logonTypes.forEach(function (item) {
                if (data.defaultLoginIDP === item.id) inLoginTypes.setSelectedKey(item.id);
            });
        } else if (selectedLoginType) {
            inLoginTypes.setSelectedKey(selectedLoginType);
        } else {
            if (data.disableLocalAuth) {
                inLoginTypes.setSelectedItem(inLoginTypes.getItems()[0]);
            } else {
                inLoginTypes.setSelectedKey("local");
            }
        }

        let language = data.defaultLanguage || 'EN';
        const langSearchParam = new URLSearchParams(location.search).get('lang') ?? false;
        if (langSearchParam) {
            language = langSearchParam.trim().toUpperCase();
        }

        const laiso = language.toLowerCase();
        const promises = [];
        const allLibs = sap.ui.getCore().getLoadedLibraries();

        for (var lib in allLibs) {
            if (allLibs[lib].loadResourceBundle) {
                promises.push(allLibs[lib].loadResourceBundle(laiso));
            }
        }

        Promise.all(promises).finally(function() {
            sap.ui.getCore().getConfiguration().setLanguage(laiso);
        });

        fetch("/public/js/LoginTranslation.json")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error fetching login translations");
                }
                return response.json();
            })
            .then(loginTranslations => {
                
                loginTranslations.filter(obj => obj.ISOCODE === language).forEach(obj => {

                    const field = neptune.byId(obj.FIELD_NAME);
                    const translation = obj.TRANSLATION;

                    if (field && translation) {
                        if (obj.ATTRIBUTE === "tooltip") {
                            field.setTooltip(translation);

                        } else if (obj.ATTRIBUTE === "title") {
                            field.setTitle(translation);

                        } else if (obj.ATTRIBUTE === "placeholder") {
                            field.setPlaceholder(translation);

                        } else if (obj.ATTRIBUTE === "text") {
                            field.setText(translation);

                        } else {
                            console.warn("Error translation", field, obj.ATTRIBUTE)
                        }
                    }
                });
            })
            .catch(error => console.error("Error loading JSON:", error));

        // Set hide/show username/password
        logonScreen.setInputFields();

        // Get System Name/Description
        if (data.settings.name) {
            AppCache_txtSystemName.setText(data.settings.name);
        }
        if (data.settings.description){
            AppCache_txtSystemDescription.setText(data.settings.description);
        }

        // Launchpad Config
        if (data.settingsLaunchpad && data.settingsLaunchpad.config) {
            if (data.settingsLaunchpad.config.hideLoginSelection) inLoginTypes.setVisible(false);
            if (data.settingsLaunchpad.config.loginTitle)
                AppCache_txtSystemName.setText(data.settingsLaunchpad.config.loginTitle);
            if (data.settingsLaunchpad.config.loginSubTitle)
                AppCache_txtSystemDescription.setText(data.settingsLaunchpad.config.loginSubTitle);
        }
        
        if (Array.isArray(data.customizing) && data.customizing.length) {
            const customizing = data.customizing[0] || {};
            const translation = Array.isArray(customizing?.translation) ? customizing.translation : [];
            const local = translation.find(obj => obj.language === language) || {};

            if (customizing.loginImage) {
                document.documentElement.style.setProperty(
                    "--customBackgroundImage",
                    "url(" + customizing.loginImage + ")"
                );
                const pageDomRef = pageShell.getDomRef();
                pageDomRef.classList.remove("nepNavigationPage");
                pageDomRef.classList.add("nepCustomBackground");
            }

            if (customizing.topIcon) {
                var link = document.querySelector("link[rel='shortcut icon']");
                if (!link) {
                    link = document.createElement("link");
                    link.rel = "icon";
                    document.head.appendChild(link);
                }
                link.href = customizing.topIcon;
            }

            // Background Color
            setTimeout(function () {
                if (customizing.loginBackgroundColor) {
                    let style = document.createElement("style");
                    style.innerHTML =
                        ".nepPanLogon { background-color: " +
                        customizing.loginBackgroundColor +
                        " !important}" +
                        ".sapUiTheme-neptune_horizon_dark .nepPanLogon { background-color: " +
                        customizing.loginBackgroundColor +
                        " !important}" +
                        document.head.appendChild(style);
                }
            }, 200);

            // Texts
            if (customizing.txtLogin1Enable) {
                let text = customizing.txtLogin1Label;
                if (local.txtLogin1Label) text = local.txtLogin1Label;

                AppCache_boxLogonLink.setVisible(true);
                linkLoginText1.setText(text);
                linkLoginText1.setVisible(true);
                text1 = customizing.txtLogin1;
            }

            if (customizing.txtLogin2Enable) {
                let text = customizing.txtLogin2Label;
                if (local.txtLogin2Label) text = local.txtLogin2Label;

                AppCache_boxLogonLink.setVisible(true);
                linkLoginText2.setText(text);
                linkLoginText2.setVisible(true);
                linkLoginSep1.setVisible(true);
                text2 = customizing.txtLogin2;
            }

            if (customizing.txtLogin3Enable) {
                let text = customizing.txtLogin3Label;
                if (local.txtLogin3Label) text = local.txtLogin3Label;

                AppCache_boxLogonLink.setVisible(true);
                linkLoginText3.setText(text);
                linkLoginText3.setVisible(true);
                linkLoginSep2.setVisible(true);
                text3 = customizing.txtLogin3;
            }
        }

        // Call Custom Settings
        setSettingsCustom(data);
    },

    setInputFields: function () {

        function _setSep() {
            if (linkCode.getVisible() && linkLogoff.getVisible()) {
                linkSep.setVisible(true);
            }
            if (linkLogoff.getVisible() && linkForgot.getVisible()) {
                linkSep1.setVisible(true);
            }
            if (linkCode.getVisible() && linkForgot.getVisible()) {
                linkSep.setVisible(true);
            }
        }

        let selected = {
            type: 'local'
        };
        let logonId = inLoginTypes.getSelectedKey();
        if (logonId) {
            const logonType = ModelData.FindFirst(formLogons, 'id', logonId);    
            if (logonType) {
                selected = logonType;
            }
        }
        
        localStorage.setItem('selectedLoginType', selected.type);
        localStorage.setItem('p9logonData', JSON.stringify(selected));
        
        [inLoginName, inLoginPassword, linkCode, linkSep, linkLogoff, linkSep1, linkForgot].forEach(field => field.setVisible(false))

        if (['local', 'ldap', 'sap'].includes(selected.type)) {
            inLoginName.setVisible(true);
            inLoginPassword.setVisible(true);

            if (['local', 'sap'].includes(selected.type)) {
                if (logonScreen.isExternal) linkCode.setVisible(true);
                if (logonScreen.smtpVerified && !isMobile) linkForgot.setVisible(true);
                localStorage.removeItem("p9logonData");
                _setSep();
                return;
            }
        }
        
        if (['azure-bearer', 'openid-connect'].includes(selected.type)) {
            linkLogoff.setVisible(true);
        }
        _setSep();
    },

    addFormLogon: function (data) {
        formLogons.push(data);

        inLoginTypes.addItem(
            new sap.ui.core.Item({
                key: data.id,
                text: data.name,
            })
        );

        inLoginTypes.setVisible(true);
    },

    requestActivationCode: function (rec) {
        const url = isMobile ? AppCache.Url : "";
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: url + "/user/activation",
            data: JSON.stringify(rec),
            success: function (data) {
                jQuery.sap.require("sap.m.MessageToast");
                sap.m.MessageToast.show(data.status);
            },
            error: function (result, status) {
                jQuery.sap.require("sap.m.MessageToast");
                sap.m.MessageToast.show(result.responseJSON.status);
            },
        });
    },

    forgotPassword: function () {
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: "/user/forgot/generate",
            data: JSON.stringify({
                username: inForgotUsername.getValue().toLowerCase(),
            }),
            success: function (data) {
                sap.m.MessageToast.show(
                    "A password reset link has been sent to the email address connected with the account"
                );
                setTimeout(function () {
                    logonScreen.showForm(`login`);
                }, 300);
            },
        });
    },

    resetSapPassword: function ({ detail, path }) {
        if (inNewPassword.getValue() !== inNewPassword2.getValue()) {
            sap.m.MessageToast.show("Password confirmation doesn't match password");
        } else if (!inNewPassword.getValue()) {
            sap.m.MessageToast.show("Please provide a password");
        } else {
            appShell.setBusy(true);
            $.ajax({
                type: "POST",
                contentType: "application/json",
                url: `/user/logon/sap/${path}`,
                data: JSON.stringify({
                    detail,
                    password: inNewPassword.getValue(),
                }),
                success: function (data) {
                    appShell.setBusy(false);
                    if (data.status === "UpdatePassword") {
                        jQuery.sap.require("sap.m.MessageToast");
                        sap.m.MessageToast.show(data.message);
                        inNewPassword.setValueState("Error");
                        inNewPassword2.setValueState("Error");
                    } else {
                        logonScreen.sapData = undefined;
                        location.reload();
                    }
                },
                error: function (result, status) {
                    appShell.setBusy(false);

                    jQuery.sap.require("sap.m.MessageBox");
                    sap.m.MessageBox.show(result.responseJSON.status, {
                        title: "Error",
                        icon: "ERROR",
                        actions: ["CLOSE"],
                        onClose: function () {},
                    });

                    inNewPassword.setValueState("Error");
                    inNewPassword2.setValueState("Error");
                },
            });
        }
    },

    resetPassword: function () {
        if (logonScreen.sapData) {
            return logonScreen.resetSapPassword(logonScreen.sapData);
        }

        const url = new URL(location.href);
        const token = url.searchParams.get("token");

        if (inNewPassword.getValue() !== inNewPassword2.getValue()) {
            sap.m.MessageToast.show("Password confirmation doesn't match password");
        } else if (!inNewPassword.getValue()) {
            sap.m.MessageToast.show("Please provide a password");
        } else {
            appShell.setBusy(true);
            $.ajax({
                type: "POST",
                contentType: "application/json",
                url: "/user/forgot/reset",
                data: JSON.stringify({
                    token,
                    password: inNewPassword.getValue(),
                }),
                success: function (data) {
                    appShell.setBusy(false);
                    sap.m.MessageToast.show("Password updated");

                    setTimeout(function () {
                        const redirect = new URL(location.href).searchParams.get("redirect");
                        if (redirect) {
                            location.href = decodeURIComponent(redirect);
                        } else {
                            logonScreen.showForm("login");
                            window.history.pushState(
                                {},
                                document.title,
                                location.href.split("?token=")[0]
                            );
                        }
                    }, 500);
                },
                error: function (result, status) {
                    appShell.setBusy(false);

                    jQuery.sap.require("sap.m.MessageBox");
                    sap.m.MessageBox.show(result.responseJSON.status, {
                        title: "Error",
                        icon: "ERROR",
                        actions: ["CLOSE"],
                        onClose: function () {},
                    });

                    inNewPassword.setValueState("Error");
                    inNewPassword2.setValueState("Error");
                },
            });
        }
    },
};
