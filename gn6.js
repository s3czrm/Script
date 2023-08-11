/*

Goodnotes6
thanks @聪


[rewrite_local]
^https:\/\/isi\.csan\.goodnotes\.com\/.+\/(receipts$|subscribers\/?(.*?)*$) url script-response-body https://raw.githubusercontent.com/Yu9191/Script/main/gn6.js
^https:\/\/isi\.csan\.goodnotes\.com\/.+\/(receipts$|subscribers\/?(.*?)*$) url script-request-header https://raw.githubusercontent.com/Yu9191/Script/main/gn6.js

[mitm]
hostname = isi.csan.goodnotes.com
*/

const baby = {};
const love = JSON.parse(typeof $response !== "undefined" && $response.body || null);

const namea = "apple_access";
const nameb = "crossplatform_access";
const jsid = "com.goodnotes.gn6_one_time_unlock_3999";

if (typeof $response === "undefined") {
  delete $request.headers["x-revenuecat-etag"];
  delete $request.headers["X-RevenueCat-ETag"];
  baby.headers = $request.headers;
} else if (love && love.subscriber) {
  const data = {
    "Author": "聪",
    "Telegram": "聪",
    "warning": "仅供学习，禁止转载或售卖",
    "purchase_date": "2022-09-09T09:09:09Z"
  };
  
  love.subscriber.subscriptions[jsid] = {
    "Author": "聪",
    "Telegram": "聪",
    "warning": "仅供学习，禁止转载或售卖",
    "original_purchase_date": "2022-09-09T09:09:09Z",
    "purchase_date": "2022-09-09T09:09:09Z",
    "store": "app_store",
    "ownership_type": "PURCHASED"
  };
  
  const entitlementData = JSON.parse(JSON.stringify(data));
  entitlementData.product_identifier = jsid;

  love.subscriber.entitlements[namea] = entitlementData;
  love.subscriber.entitlements[nameb] = entitlementData;
  
  baby.body = JSON.stringify(love);
}

$done(baby);
