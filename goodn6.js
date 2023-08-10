/*

Goodnotes6


[rewrite_local]
^https:\/\/isi\.csan\.goodnotes\.com\/.+\/(receipts$|subscribers\/?(.*?)*$) url script-response-body https://raw.githubusercontent.com/Yu9191/Script/main/goodn6.js
^https:\/\/isi\.csan\.goodnotes\.com\/.+\/(receipts$|subscribers\/?(.*?)*$) url script-request-header https://raw.githubusercontent.com/Yu9191/Script/main/goodn6.js

[mitm]
hostname = isi.csan.goodnotes.com

*/



const baby = {}; 

try {
  const responseBody = typeof $response !== "undefined" ? $response.body : null;
  const love = JSON.parse(responseBody);

  const namea = "apple_access";
  const nameb = "crossplatform_access";
  const jsid = "com.goodnotes.gn6_one_time_unlock_3999";

  if (typeof $response === "undefined") {
  
    const requestHeaders = $request.headers;
    
    if ("x-revenuecat-etag" in requestHeaders) {
      delete requestHeaders["x-revenuecat-etag"];
    }
    if ("X-RevenueCat-ETag" in requestHeaders) {
      delete requestHeaders["X-RevenueCat-ETag"];
    }

    baby.headers = requestHeaders;
  } else if (love && love.subscriber) {

    const data = {
      "Author": "love",
      "Telegram": "love",
      "warning": "study",
      "purchase_date": "2022-09-09T09:09:09Z"
    };

    if (!love.subscriber.subscriptions) {
      love.subscriber.subscriptions = {};
    }
    love.subscriber.subscriptions[jsid] = {
      ...data,
      "original_purchase_date": "2022-09-09T09:09:09Z",
      "purchase_date": "2022-09-09T09:09:09Z",
      "store": "app_store",
      "ownership_type": "PURCHASED"
    };

    if (!love.subscriber.entitlements) {
      love.subscriber.entitlements = {};
    }
    love.subscriber.entitlements[namea] = { ...data, "product_identifier": jsid };
    love.subscriber.entitlements[nameb] = { ...data, "product_identifier": jsid };

    baby.body = JSON.stringify(love);
  }
} catch (error) {
  console.error("An error occurred:", error.message);
}

$done(baby); 
