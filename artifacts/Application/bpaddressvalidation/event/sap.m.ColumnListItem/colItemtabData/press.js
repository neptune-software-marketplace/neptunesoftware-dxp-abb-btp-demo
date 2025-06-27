console.log(oEvent.getParameter("selectedItem"));

const bp = oEvent.getSource().getBindingContext().getObject();

modelPageDetail.setData(bp);
modelAddressFormValidation.setData({});



App.to(PageDetail);
