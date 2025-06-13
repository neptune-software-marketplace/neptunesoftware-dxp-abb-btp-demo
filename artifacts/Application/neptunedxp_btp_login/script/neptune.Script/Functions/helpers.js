function externalAuthUserLogoutUsingPopup(url, closePopupAfterSecs=5000) {
    return new Promise((resolve, reject) => {
        const logoutPopup = window.open(url, '_blank', 'location=no,width=5,height=5,left=-1000,top=3000');
        
        // if pop-ups are blocked signout window.open will return null
        if (!logoutPopup) return resolve();
        
        logoutPopup.blur && logoutPopup.blur();

        if (isCordova()) {
            logoutPopup.addEventListener('loadstop', () => {
                logoutPopup.close();
                resolve();
            });
        } else {
            logoutPopup.onload = () => {
                logoutPopup.close();
                resolve();
            };

            logoutPopup.blur && logoutPopup.blur();

            setTimeout(() => {
                logoutPopup.close();
                resolve();
            }, closePopupAfterSecs);
        }
    });
}