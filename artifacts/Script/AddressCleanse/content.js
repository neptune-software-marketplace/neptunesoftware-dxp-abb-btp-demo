const { street, housenumber, city, postcode, country } = req.body;
const user = req.user.username;

let mixed = "";
if (street) {
    mixed = mixed + street;
}
if (housenumber) {
    mixed = mixed + " " + housenumber;
}

// data to be sent to the POST request
let _data = {
    addressInput: {
        country: country,
        mixed: mixed,
        locality: city,
        region: "",
        postcode: postcode,
    },
    outputFields: [
        "std_addr_prim_name_full",
        "std_addr_prim_number_full",
        "std_addr_address_delivery",
        "std_addr_locality_full",
        "std_addr_region_full",
        "std_addr_postcode_full",
        "std_addr_country_2char",
        "std_addr_country_name",
        "addr_latitude",
        "addr_longitude"
    ],
    addressSettings: {
        casing: "mixed",
        diacritics: "include",
        streetFormat: "countryCommonStyle",
        postalFormat: "countryCommonStyle",
        regionFormat: "countryCommonStyle",
        scriptConversion: "none",
    },
};

log.info(_data);


const opts = {
    
    parameters: {},
    headers: {"Content-Type": "application/json"},
    data: {},
    body: JSON.stringify(_data),
}

try {
    // Send api request.
    const response = await apis.addressCleanse(opts);
    // Log response data
    console.log(response.data);

    result = response.data;

    complete();


} catch(error) {
    log.error("Error in request: ", error);
    return fail();
}