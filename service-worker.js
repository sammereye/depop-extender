const getProduct = async (request, sendResponse) => {
  let productId = request?.productId;
  let accessToken = request?.accessToken;
  let sellersPage = request?.sellersPage;

  if (productId && accessToken) {
    var myHeaders = new Headers();
    myHeaders.append("accept", "application/json, text/plain, */*");
    myHeaders.append("authorization", `Bearer ${accessToken}`);
    myHeaders.append("cache-control", "no-cache");

    var requestOptions = {
      method: 'GET',
      headers: myHeaders,
    };

    let productFetch = await fetch(`https://api.depop.com/api/v1/products/${productId}/`, requestOptions)
    let data = await productFetch.json();

    if (!sellersPage) {
      if (data?.user_id) {
        let sellerPreferencesFetch = await fetch(`https://api.depop.com/api/v2/user/seller-preferences/${data?.user_id}/`, requestOptions)
        let sellerPreferencesData = await sellerPreferencesFetch.json();
        data = {...data, ...sellerPreferencesData}
  
        if ((data?.multiple_items_shipping_price && data?.multiple_items_shipping_price === 'highest') || data?.free_shipping_in_multiple_items && data?.free_shipping_in_multiple_items === true) {
          let sellerFetch = await fetch(`https://api.depop.com/api/v1/users/${data?.user_id}/`, requestOptions)
          let sellerData = await sellerFetch.json();
          data = {...data, ...{
            user: sellerData
          }}
        }
      }
    }

    sendResponse(data);
  }
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    getProduct(request, sendResponse);

    return true;
  }
);