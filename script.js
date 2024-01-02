const getAccessToken = () => {
  var match = document.cookie.match(new RegExp('(^| )access_token=([^;]+)'));
  if (match) return match[2];
}

const getPrices = (accessToken) => {
  let isSellersPage = location.href.includes("/selling/");
  let products = [...document.getElementsByTagName("div")].filter(ele => ele.getAttribute("data-testid") && ele.getAttribute("data-testid") !== 'productListItem__attributes' && ele.getAttribute("data-testid").includes("productListItem__"));  
  
  products.forEach(product => {
    const listingDetailsContainer = product.parentElement.parentElement.nextSibling;
    if (listingDetailsContainer) {
      const priceContainer = [...listingDetailsContainer.children].find(x => x.tagName === 'DIV')?.firstChild;
      const shippingCostElementExists = [...priceContainer.children].filter(label => label.getAttribute("aria-label") === "Shipping costs").length > 0;
      if (!shippingCostElementExists) {
        chrome.runtime.sendMessage({ productId: product.getAttribute("data-testid").split('__')[1], accessToken, sellersPage: isSellersPage}, (response) => {
          if (response && response?.id && response?.national_shipping_cost) {
            // console.log(response);
            let totalPrice = parseFloat(response.national_shipping_cost);
            let discountedPriceElement = [...priceContainer.children].find(label => label.getAttribute("aria-label") === "Discounted price");
            let priceElement = [...priceContainer.children].find(label => label.getAttribute("aria-label") === "Price");
  
            if (priceElement) {
              priceElement.setAttribute("style", "font-size:12px;padding-right:4px;")
              totalPrice += parseFloat(priceElement.textContent.substring(1));
            } else if (discountedPriceElement) {
              discountedPriceElement.setAttribute("style", "font-size:12px;")
              totalPrice += parseFloat(discountedPriceElement.textContent.substring(1));
            }
  
            let shippingCostElement = document.createElement("p");
            shippingCostElement.setAttribute("aria-label", "Shipping costs")
            shippingCostElement.setAttribute("type", "text")
            shippingCostElement.setAttribute("class", "Price-styles__DiscountPrice-sc-88086281-1 fRxqiS buybSP")
            shippingCostElement.setAttribute("style", "font-size:12px;color:#e70404;")
            shippingCostElement.textContent = ' + $' + response?.national_shipping_cost
            
            let totalPriceElement = document.createElement("p");
            totalPriceElement.setAttribute("aria-label", "Total costs")
            totalPriceElement.setAttribute("type", "text")
            totalPriceElement.setAttribute("class", "Price-styles__DiscountPrice-sc-88086281-1 fRxqiS buybSP")
            totalPriceElement.setAttribute("style", "font-size:16px;")
            totalPriceElement.innerHTML = '$' + totalPrice.toFixed(2);
            
            if (response?.created_date) {
              let createdDate = new Date(response?.created_date);
              let timeDiff = Math.floor((Date.now() - createdDate.getTime()) / 1000);

              let createdString = `${timeDiff} seconds ago`;


              // > 60 SECONDS
              if (timeDiff >= 60) {
                timeDiff = Math.floor(timeDiff / 60);
                createdString = `${timeDiff} minutes ago`;

                // > 60 MINUTES
                if (timeDiff >= 60) {
                  timeDiff = Math.floor(timeDiff / 60);
                  createdString = `${timeDiff} hours ago`;

                  // > 24 hours
                  if (timeDiff >= 24) {
                    timeDiff = Math.floor(timeDiff / 24);
                    createdString = `${timeDiff} days ago`;

                    // > 30 days
                    if (timeDiff >= 30) {
                      timeDiff = Math.floor(timeDiff / 30);
                      createdString = `${timeDiff} months ago`;
                    }
                  }
                }
              }

              totalPriceElement.innerHTML += `<span style="font-size:10px;padding-left:10px;">${createdString}</span>`
            }
            
            if (response?.free_shipping_in_multiple_items && response?.free_shipping_in_multiple_items == true) {
              let freeBundleString = `<span style="font-size:12px;padding-left:6px;color:#0f8329">free`
              if (response?.user && response?.user?.selling_count) {
                freeBundleString += ` w/${response?.user?.selling_count}`
              }
              freeBundleString += `</span>`
              totalPriceElement.innerHTML += freeBundleString
            } else if (response?.multiple_items_shipping_price && response?.multiple_items_shipping_price === 'highest') {
              let bundlesString = `<span style="font-size:12px;padding-left:6px;color:#0f70b7">flatfee`
              if (response?.user && response?.user?.selling_count) {
                bundlesString += ` w/${response?.user?.selling_count}`
              }
              bundlesString += `</span>`
              totalPriceElement.innerHTML += bundlesString
            }
            
            listingDetailsContainer.prepend(totalPriceElement);
            priceContainer.appendChild(shippingCostElement);
            
            if (isSellersPage && (response?.gender || response?.condition || response?.brand)) {
              let gender = 'U';
              if (response?.gender === 'male') {
                gender = 'M';
              } else if (response?.gender === 'female') {
                gender = 'F';
              }

              let condition = 'U';
              if (response?.condition) {
                condition = response?.condition;
  
                if (condition.includes('_')) {
                  condition = condition.split('_')[1];
                }
                condition = condition.charAt(0).toUpperCase() + condition.slice(1);
              }

              let brand = 'U';
              if (response?.brand) {
                brand = response?.brand.split('-').map(b => b.charAt(0).toUpperCase() + b.slice(1)).join(' ');
              }

              let productDetailsElement = document.createElement("p");
              productDetailsElement.setAttribute("aria-label", "Shipping costs")
              productDetailsElement.setAttribute("type", "text")
              productDetailsElement.setAttribute("class", "Price-styles__DiscountPrice-sc-88086281-1 fRxqiS buybSP")
              productDetailsElement.setAttribute("style", "font-size:12px;")
              productDetailsElement.textContent = `${gender} / ${condition} / ${brand}`
              
              priceContainer.appendChild(productDetailsElement);
            }
          }
        });
      }
    }
  });
}

let accessToken = getAccessToken();

getPrices(accessToken);

let interval = setInterval(() => {
  if (!chrome.runtime?.id) {
    clearInterval(interval);
    return;
  }

  getPrices(accessToken)
}, 1000)