const $ = new Env('network-info-event');

let arg;
if (typeof $argument != 'undefined') {
  arg = Object.fromEntries($argument.split('&').map(item => item.split('=')));
}

!(async () => {
  let primaryAddress;
  let ssid;
  if (typeof $network !== 'undefined') {
    await $.wait(2000);
    $.log($network);
    primaryAddress = $.lodash_get($network, 'v4.primaryAddress');
    ssid = $.lodash_get($network, 'wifi.ssid');
  } else if (typeof $config !== 'undefined') {
    await $.wait(3000);
    try {
      let conf = $config.getConfig();
      $.log(conf);
      conf = JSON.parse(conf);
      ssid = $.lodash_get(conf, 'ssid');
    } catch (e) {}
  }

  // const $network = {
  //   finished: false,
  //   supportsIPv4: false,
  //   isCellular: false,
  //   supportsIPv6: false,
  //   wifi: { finished: false, ssid: 'greatdongan5' },
  // }

  const [{ CN_IP = '-', CN_ADDR = '-' }, { PROXY_IP = '-', PROXY_ADDR = '-' }] = await Promise.all([
    getDirectInfo(),
    getProxyInfo(),
  ]);
  $.log(CN_IP, CN_ADDR, PROXY_IP, PROXY_ADDR);
  const lastNetworkInfoEvent = $.getjson('lastNetworkInfoEvent');

  let notifyTitle;
  const cnRegex = /(电信|联通|移动)/;
  const match = CN_IP.match(cnRegex);
  if (match) {
    switch (match[0]) {
      case '电信':
        notifyTitle = 'babylove';
        break;
      case '联通':
        notifyTitle = 'Baby';
        break;
      case '移动':
        notifyTitle = '该死你用的移动';
        break;
      default:
        notifyTitle = '其他';
    }
  } else {
    notifyTitle = '其他';
  }

  if (
    CN_IP !== $.lodash_get(lastNetworkInfoEvent, 'CN_IP') ||
    PROXY_IP !== $.lodash_get(lastNetworkInfoEvent, 'PROXY_IP')
  ) {
    $.setjson({ CN_IP, PROXY_IP }, 'lastNetworkInfoEvent');
    await notify(notifyTitle, `${CN_ADDR}`, `${PROXY_ADDR}\n${ssid || ''} ${primaryAddress || ''}`);
  } else {
    $.log('IP 相同 不发送通知');
  }
})()
  .catch(async e => {
    $.logErr(e);
    $.logErr($.toStr(e));

    await notify('网络信息', `❌`, `${$.lodash_get(e, 'message') || $.lodash_get(e, 'error') || e}`);
  })
  .finally(async () => {
    $.done();
  });

// 通知
async function notify(title, subt, desc, opts) {
  $.msg(title, subt, desc, opts);
}
async function getDirectInfo() {
  let CN_IP;
  let CN_ADDR;
  try {
    const res = await $.http.get({
      url: `http://mip.chinaz.com`,
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Language': 'zh-CN,zh-TW;q=0.9,zh;q=0.8,en;q=0.7,en-GB;q=0.6,en-US;q=0.5',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.14',
      },
    });
    let body = String($.lodash_get(res, 'body'));
    CN_IP = body.match(/您的IP.*?>(.*?)<\//)[1];
    CN_ADDR = body
      .match(/地址.*?>(.*?)<\//)[1]
      .replace('中国', '')
      .replace('上海上海', '上海')
      .replace('北京北京', '北京');
  } catch (e) {
    $.logErr(e);
    $.logErr($.toStr(e));
  }
  if (!CN_IP || !CN_ADDR) {
    try {
      const res = await $.http.get({
        url: 'http://cip.cc',
        headers: { 'User-Agent': 'curl/7.16.3 (powerpc-apple-darwin9.0) libcurl/7.16.3' },
      });
      let body = String($.lodash_get(res, 'body'));
      CN_IP = body.match(/IP\s*(:|：)\s*(.*?)\s/)[2];
      CN_ADDR = `${body.match(/地址\s*(:|：)\s*(.*)/)[2].replace(/中国\s*/, '') || ''} ${
        body.match(/运营商\s*(:|：)\s*(.*)/)[2].replace(/中国\s*/, '') || ''
      }`;
    } catch (e) {
      $.logErr(e);
      $.logErr($.toStr(e));
    }
  }
  return { CN_IP, CN_ADDR };
}
async function getProxyInfo() {
  let PROXY_IP;
  let PROXY_ADDR;

  try {
    const res = await $.http.get({
      url: `http://ip-api.com/json?lang=zh-CN`,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/109.0.0.0',
      },
    });
    let body = String($.lodash_get(res, 'body'));
    PROXY_IP = $.lodash_get(body, 'query');
    PROXY_ADDR = [$.lodash_get(body, 'city'), $.lodash_get(body, 'isp')].join(' ');
  } catch (e) {
    $.logErr(e);
    $.logErr($.toStr(e));
  }

  if (!PROXY_IP || !PROXY_ADDR) {
    try {
      const res = await $.http.get({
        url: `https://wtfismyip.com/json`,
        headers: {
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (iPhone CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/109.0.0.0',
        },
      });
      let body = String($.lodash_get(res, 'body'));
      PROXY_IP = $.lodash_get(body, 'YourFuckingIPAddress');
      PROXY_ADDR = [$.lodash_get(body, 'YourFuckingLocation'), $.lodash_get(body, 'YourFuckingISP')].join('\n');
    } catch (e) {
      $.logErr(e);
      $.logErr($.toStr(e));
    }
  }
  return { PROXY_IP, PROXY_ADDR };
}
// prettier-ignore
function Env(t,s){class e{constructor(t){this.env=t}send(t,s="GET"){t="string"==typeof t?{url:t}:t;let e=this.get;return"POST"===s&&(e=this.post),new Promise((s,i)=>{e.call(this,t,(t,e,r)=>{t?i(t):s(e)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,s){this.name=t,this.http=new e(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,s),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $environment&&$environment["surge-version"]}isLoon(){return"undefined"!=typeof $loon}isShadowrocket(){return"undefined"!=typeof $rocket}isStash(){return"undefined"!=typeof $environment&&$environment["stash-version"]}toObj(t,s=null){try{return JSON.parse(t)}catch{return s}}toStr(t,s=null){try{return JSON.stringify(t)}catch{return s}}getjson(t,s){let e=s;const i=this.getdata(t);if(i)try{e=JSON.parse(this.getdata(t))}catch{}return e}setjson(t,s){try{return this.setdata(JSON.stringify(t),s)}catch{return!1}}getScript(t){return new Promise(s=>{this.get({url:t},(t,e,i)=>s(i))})}runScript(t,s){return new Promise(e=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=s&&s.timeout?s.timeout:r;const[o,h]=i.split("@"),a={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(a,(t,s,i)=>e(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),s=this.path.resolve(process.cwd(),this.dataFile),e=this.fs.existsSync(t),i=!e&&this.fs.existsSync(s);if(!e&&!i)return{};{const i=e?t:s;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),s=this.path.resolve(process.cwd(),this.dataFile),e=this.fs.existsSync(t),i=!e&&this.fs.existsSync(s),r=JSON.stringify(this.data);e?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(s,r):this.fs.writeFileSync(t,r)}}lodash_get(t,s,e){const i=s.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return e;return r}lodash_set(t,s,e){return Object(t)!==t?t:(Array.isArray(s)||(s=s.toString().match(/[^.[\]]+/g)||[]),s.slice(0,-1).reduce((t,e,i)=>Object(t[e])===t[e]?t[e]:t[e]=Math.abs(s[i+1])>>0==+s[i+1]?[]:{},t)[s[s.length-1]]=e,t)}getdata(t){let s=this.getval(t);if(/^@/.test(t)){const[,e,i]=/^@(.*?)\.(.*?)$/.exec(t),r=e?this.getval(e):"";if(r)try{const t=JSON.parse(r);s=t?this.lodash_get(t,i,""):s}catch{}return s}return s}setdata(t,s){let e=!1;if(/^@/.test(s)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(s),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const s=JSON.parse(h);this.lodash_set(s,r,t),e=this.setval(JSON.stringify(s),i)}catch(s){const o={};this.lodash_set(o,r,t),e=this.setval(JSON.stringify(o),i)}}else e=this.setval(t,s);return e}getval(t){return this.isSurge()||this.isShadowrocket()||this.isLoon()||this.isStash()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,s){return this.isSurge()||this.isShadowrocket()||this.isLoon()||this.isStash()?$persistentStore.write(t,s):this.isQuanX()?$prefs.setValueForKey(t,s):this.isNode()?(this.data=this.loaddata(),this.data[s]=t,this.writedata(),!0):this.data&&this.data[s]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,s=(()=>{})){if(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isShadowrocket()||this.isLoon()||this.isStash())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1}),$httpClient.get(t,(t,e,i)=>{!t&&e&&this.isNeedRewrite&&s(e)});else if(this.isQuanX()){if(this.isNeedRewrite){t.method="GET",t.headers=t.headers||{},t.headers.Cookie?t.headers.Cookie= t.headers.Cookie:this.isSurge()&&(t.headers.Cookie=t.headers.cookie),t.headers.Referer=t.url}}else this.isNode()&&this.initGotEnv(t),(t =>{this.got(t).then(t=>{const e=t.body.indexOf("http://")>-1?"":t.body;if(s(null,t.body,t),t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(s,null),this.setdata(JSON.stringify(this.ckjar),this.name)}this.isNeedRewrite&&s(null,e)}).catch(t=>{this.isNeedRewrite&&s(t),this.logErr(t)})(t)}}
post(t,s=(()=>{})){if(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isShadowrocket()||this.isLoon()||this.isStash())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1}),$httpClient.post(t,(t,e,i)=>{!t&&e&&this.isNeedRewrite&&s(e)}));else if(this.isQuanX()){if(this.isNeedRewrite){t.method="POST",t.headers=t.headers||{},t.headers.Cookie?t.headers.Cookie=t.headers.Cookie:this.isSurge()&&(t.headers.Cookie=t.headers.cookie),t.headers.Referer=t.url}}else this.isNode()&&this.initGotEnv(t),(t =>{this.got(t).then(t=>{const e=t.body.indexOf("http://")>-1?"":t.body;if(s(null,t.body,t),t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(s,null),this.setdata(JSON.stringify(this.ckjar),this.name)}this.isNeedRewrite&&s(null,e)}).catch(t=>{this.isNeedRewrite&&s(t),this.logErr(t)})(t)}}
/**
 * 模拟数据，用于调试脚本时模拟接口返回的数据
 * @param {string} path 请求的路径，可以是本地路径或URL
 * @param {object} options 附加的请求参数
 * @return 返回解析后的数据
 */
async mockResponse(path, options = {}) {
  if (!path) return null;
  const urlRegex = /^http[s]?:\/\/.+$/;
  if (urlRegex.test(path)) {
    // 请求外部URL
    try {
      const response = await this.http.get(path, options);
      return JSON.parse(response.body);
    } catch (error) {
      this.logErr(`请求外部URL出错：${error.message}`);
      return null;
    }
  } else {
    // 读取本地文件
    try {
      const data = await this.read(path);
      return JSON.parse(data);
    } catch (error) {
      this.logErr(`读取本地文件出错：${error.message}`);
      return null;
    }
  }
}
/**
 * 读取文件内容
 * @param {string} path 文件路径
 * @param {string} encoding 文件编码，默认为utf-8
 * @returns {Promise<string>} 返回文件内容
 */
read(path, encoding = "utf-8") {
  return new Promise((resolve, reject) => {
    if (this.isNode()) {
      this.fs.readFile(path, encoding, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    } else {
      resolve("");
    }
  });
}
/**
 * 日志记录
 * @param {string} message 日志内容
 * @param {string} title 日志标题
 */
log(message, title = this.name) {
  const time = new Date().toLocaleString();
  this.logs.push(`${title} - ${time} - ${message}`);
}
/**
 * 错误日志记录
 * @param {Error} error 错误对象
 * @param {string} title 错误日志标题
 */
logErr(error, title = this.name) {
  this.log(`${title} - 错误 - ${error}`);
}
/**
 * 打印日志
 * @param {boolean} silent 是否静默打印日志，默认false，设置为true时不会在控制台输出日志
 */
printLogs(silent = false) {
  if (!silent) {
    for (const log of this.logs) {
      console.log(log);
    }
  }
}
/**
 * 向通知中心发送通知
 * @param {string} title 标题
 * @param {string} subTitle 副标题
 * @param {string} message 内容
 * @param {object} options 附加的参数
 */
notify(title, subTitle, message, options = {}) {
  if (this.isSurge() || this.isLoon() || this.isQuanX()) {
    $notification.post(title, subTitle, message);
  } else if (this.isNode()) {
    if (options.url) {
      this.sendNotificationToBot(title, subTitle, message, options);
    } else {
      console.log("发送通知失败：未提供机器人Webhook地址");
    }
  } else {
    console.log("当前环境不支持通知功能");
  }
}
/**
 * 使用机器人发送通知
 * @param {string} title 标题
 * @param {string} subTitle 副标题
 * @param {string} message 内容
 * @param {object} options 附加的参数
 */
sendNotificationToBot(title, subTitle, message, options) {
  const body = {
    title,
    subTitle,
    message,
    ...options,
  };
  const { url, method = "POST", headers = {} } = options;
  const reqOptions = {
    url,
    method,
    headers,
    body: JSON.stringify(body),
  };
  this.http
    .send(reqOptions)
    .then((response) => {
      this.log(`通知发送成功：${response.body}`);
    })
    .catch((error) => {
      this.logErr(`通知发送失败：${error.message}`);
    });
}
/**
 * 等待指定时间
 * @param {number} ms 等待的时间，单位毫秒
 * @returns {Promise<void>}
 */
wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

