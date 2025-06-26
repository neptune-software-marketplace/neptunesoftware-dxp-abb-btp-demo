const businesspartners = xhr.responseJSON;

businesspartners.sort((a, b) => {
    return b.updatedAt - a.updatedAt;
});

modeltabData.setData(businesspartners);