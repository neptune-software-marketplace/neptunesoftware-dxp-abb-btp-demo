// Remove Leading Zeros
// With a function that takes one argument
function removeLeadingZeros(arg) {
    const stringText = arg.toString();
    const formattedText = stringText.replace(/^0+/, "");
    return formattedText;
}

// Call API

// const bp = modelPageDetail.getData();

// console.log(modelPageDetail.getData());
App.setBusy(true);

const formData = modelPageDetail.getData();
const formValidated = modelAddressFormValidation.getData();
formValidated.id = modelPageDetail.getProperty("/id");
formValidated.Status = "Validated";
formValidated.SendToSAP = true;

var options = {
    parameters: {
        where: "", // Optional
    },
    data: formValidated,
};

// Save to DXP Tables
apiUpdateBusinessPartnerAPI(options).then(function (data) {
    console.log(data);
    
    const sPath = BusinessPartnerOData.createKey("/A_BusinessPartnerAddress", {
        BusinessPartner: removeLeadingZeros(formData.BusinessPartner),
        AddressID: removeLeadingZeros(formData.AddressID),
    });

    BusinessPartnerOData.update(
        sPath,
        {
            StreetName: formValidated.StreetName,
            HouseNumber: formValidated.HouseNumber,
            PostalCode: formValidated.PostalCode,
            CityName: formValidated.CityName,
            Country: formValidated.Country,
        },
        {
            success: function (oData) {
                App.setBusy(false);
                sap.m.MessageToast.show("Data saved succesfully");
                PageDetail.fireNavButtonPress();
            },
            error: function (oError) {
                App.setBusy(false);
                sap.m.MessageToast.show("Error occured!", oError);
            },
        }
    );
});