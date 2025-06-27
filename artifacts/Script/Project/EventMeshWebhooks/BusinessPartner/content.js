let payload = req.body; // request data body.

// Check if payload is in body
if (Object.keys(payload).length === 0) {
    // Get the payload from readableState Buffer
    log.info("Payload not in req.body");

    // This works in LTS23
    const buffer = req._readableState.buffer.head.data;

    payload = JSON.parse(buffer);
}

log.info(payload);

try {
    await p9.events.publish("businessPartnerChange", payload);
    log.info("Event published");
    //complete();
} catch (error) {
    log.error("Error publishing event: " + error);
    fail();
}


