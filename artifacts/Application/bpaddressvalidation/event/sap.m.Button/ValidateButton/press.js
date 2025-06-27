App.setBusy(true);

const bp = modelPageDetail.getData();

const payload = {
    street: bp.StreetName,
    housenumber: bp.HouseNumber,
    city: bp.CityName,
    postcode: bp.PostalCode,
    country: bp.Country,
};

var options = { data: payload };

// Call API
apiAddressCleanseAPI(options).then(function (data) {
    console.log(data);
    updateFields(data);

    App.setBusy(false);
});

function updateFields(data) {
    // data = {
    //     std_addr_locality_full: "Köln",
    //     addr_longitude: 6.91152,
    //     std_addr_prim_name_full: "Weinsbergstraße",
    //     std_addr_postcode_full: "50825",
    //     std_addr_prim_number_full: "190a",
    //     addr_latitude: 50.94599,
    //     std_addr_region_full: "Nordrhein-Westfalen",
    //     std_addr_address_delivery: "Weinsbergstraße 190a",
    //     std_addr_country_2char: "DE",
    //     std_addr_country_name: "Deutschland",
    // };

    const validationFormData = {
        StreetName: data.std_addr_prim_name_full,
        HouseNumber: data.std_addr_prim_number_full,
        PostalCode: data.std_addr_postcode_full,
        CityName: data.std_addr_locality_full,
        Country: data.std_addr_country_2char,
    };

    let reference = "VBoxMap"

    if (sap.n) {
        reference = sap.n.currentView.getId() + "--VBoxMap";
    }

    setTimeout(function () {
        var map = L.map(reference).setView([data.addr_latitude, data.addr_longitude], 18);

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution:
                '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        L.marker([data.addr_latitude, data.addr_longitude]).addTo(map);
    }, 100);

    modelAddressFormValidation.setData(validationFormData);
    VBox1.setVisible(true);
    VBoxMap.setVisible(true);
}
