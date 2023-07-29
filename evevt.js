const $ = new Env('network-info-event');

const httpApiPort = 6166;
const httpApiPassword = '7177m';

const arg = typeof $argument !== 'undefined' ? Object.fromEntries($argument.split('&').map(item => item.split('='))) : {};

!(async () => {
  const httpApiOptions = {
    hostname: '127.0.0.1',
    port: httpApiPort,
    path: '/v1',
    timeout: 10000,
  };

  const { CN_IP = '-', CN_ADDR = '-' } = await getDirectInfo(httpApiOptions);
  const { PROXY_IP = '-', PROXY_ADDR = '-' } = await getProxyInfo(httpApiOptions);
  $.log(CN_IP, CN_ADDR, PROXY_IP, PROXY_ADDR);

  let networkType = '其他';
  if (typeof $network !== 'undefined') {
    networkType = $network['cellular'] ? '移动' : ($network['wifi'] ? 'Wi-Fi' : '其他');
  }

  let title;
  let subTitle;
  let content;

  if (networkType === '移动') {
    title = '该死你用的移动';
    subTitle = `当前网络: ${networkType}`;
    content = `${CN_IP} | ${PROXY_IP}\n${CN_ADDR}\n${PROXY_ADDR}\nWi-Fi名称：${$network['wifi']['ssid'] || ''}\n本地IP：${$network['v4']['primaryAddress'] || ''}`;
  } else if (networkType === 'Wi-Fi') {
    title = 'Baby';
    subTitle = `当前网络: ${networkType}`;
    content = `${CN_IP} | ${PROXY_IP}\n${CN_ADDR}\n${PROXY_ADDR}\nWi-Fi名称：${$network['wifi']['ssid'] || ''}\n本地IP：${$network['v4']['primaryAddress'] || ''}`;
  } else {
    title = 'babylove';
    subTitle = `当前网络: ${networkType}`;
    content = `${CN_IP} | ${PROXY_IP}\n${CN_ADDR}\n${PROXY_ADDR}`;
  }

  await notify(title, subTitle, content);
})()
  .catch(async e => {
    $.logErr(e);
    $.logErr($.toStr(e));
    await notify('网络信息', '❌', `${e.message || e.error || e}`);
  })
  .finally(async () => {
    $.done();
  });

// 通知
async function notify(title, subt, desc, opts) {
  const method = 'POST';
  const url = `http://${httpApiOptions.hostname}:${httpApiPort}/${httpApiPassword}/sendMessage`;
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  const body = `title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(subt)}&body=${encodeURIComponent(desc)}`;
  const httpOptions = {
    hostname: httpApiOptions.hostname,
    port: httpApiPort,
    path: `/${httpApiPassword}/sendMessage`,
    method,
    headers,
    timeout: httpApiOptions.timeout,
  };

  await httpRequest(httpOptions, body);
}

async function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = require('http').request(options, (res) => {
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => (rawData += chunk));
      res.on('end', () => resolve(rawData));
    });

    req.on('error', (e) => reject(e));
    if (body) req.write(body);
    req.end();
  });
}

async function getDirectInfo(httpApiOptions) {
  let CN_IP = '-';
  let CN_ADDR = '-';
  try {
    const res = await httpRequest({ ...httpApiOptions, path: `${httpApiOptions.path}/v1/scripting/mip.chinaz.com` });
    const body = JSON.parse(res);
    CN_IP = body['return']['CN_IP'] || '-';
    CN_ADDR = body['return']['CN_ADDR'] || '-';
  } catch (e) {
    $.logErr(e);
    $.logErr($.toStr(e));
  }
  return { CN_IP, CN_ADDR };
}

async function getProxyInfo(httpApiOptions) {
  let PROXY_IP = '-';
  let PROXY_ADDR = '-';

  try {
    const res = await httpRequest({ ...httpApiOptions, path: `${httpApiOptions.path}/v1/scripting/ip-api.com/json` });
    const body = JSON.parse(res);
    PROXY_IP = body['return']['query'] || '-';
    PROXY_ADDR = `${body['return']['city'] || ''} ${body['return']['isp'] || ''}`;
  } catch (e) {
    $.logErr(e);
    $.logErr($.toStr(e));
  }

  return { PROXY_IP, PROXY_ADDR };
}

