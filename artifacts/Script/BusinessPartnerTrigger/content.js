log.info("Received Event:" + JSON.stringify(payload));

// Payload example coming from Event Mesh
// {
//     "data": {
//         "BusinessPartner": "1000265"
//     },
//     "datacontenttype": "application/json",
//     "id": "15167317-3601-1fe0-92eb-8a34a6bcc2cf",
//     "source": "/default/sap.s4.beh/S4HCLNT100",
//     "specversion": "1.0",
//     "time": "2025-06-17T09:20:32Z",
//     "type": "sap.s4.beh.businesspartner.v1.BusinessPartner.Changed.v1"
// }

const businessPartnerID = payload?.data?.BusinessPartner;
const type = payload?.type;

if (businessPartnerID) {
    let businesspartners = [];

    const opts = {
        parameters: {
            $top: "",
            $skip: "",
            $filter: `BusinessPartner eq '${businessPartnerID}'`,
            $inlinecount: "",
            $orderby: "",
            $select: "",
            $expand: "to_BusinessPartnerAddress",
        },
        headers: {},
        data: {},
        body: {},
    };

    try {
        // Send api request.
        const response = await apis.A_BusinessPartner(opts);

        businesspartners = response?.data?.d?.results;

        if (businesspartners.length > 0) {
            const businesspartner = businesspartners.find(
                (x) => x.BusinessPartner === businessPartnerID
            );

            const entity = await entities.businesspartners.findOne({
                BusinessPartner: businessPartnerID,
            });

            // Destructure OData object
            const {
                BusinessPartner,
                BusinessPartnerFullName,
                to_BusinessPartnerAddress: {
                    results: [
                        { AddressID, CityName, Country, HouseNumber, PostalCode, StreetName },
                    ],
                },
            } = businesspartner;

            const bp = {
                BusinessPartner,
                FullName: BusinessPartnerFullName,
                AddressID,
                CityName,
                Country,
                HouseNumber,
                PostalCode,
                StreetName,
                Status:
                    type === "sap.s4.beh.businesspartner.v1.BusinessPartner.Changed.v1"
                        ? "Modified"
                        : "New",
                SendToSAP: false,
            };

            log.info(bp);

            // Update or Insert
            if (entity) {
                // Check if something changed, we are only checking for Address changes here
                if (
                    entity.StreetName === bp.StreetName &&
                    entity.HouseNumber === bp.HouseNumber &&
                    entity.PostalCode === bp.PostalCode &&
                    entity.CityName === bp.CityName &&
                    entity.Country === bp.Country
                ) {
                    // Do nothing
                } else {
                    await entities.businesspartners.update(entity.id, bp);
                    p9.events.publish("bpTableUpdate", {});
                }
            } else {
                await entities.businesspartners.insert(bp);
                p9.events.publish("bpTableUpdate", {});
            }
        } else {
            log.info("No BP found");
        }

        complete();
    } catch (error) {
        log.error("Error in request: ", error);
        return fail();
    }
}
