/**
 * Timo Robot
 * 提莫数据采集机器人
 * version: v1.9.0
 * date: 2022-03-01
 **/
// Hook Ajax
const href = window.location.href
var ENV = window.location.href.indexOf('https://zs.kwaixiaodian.com') >= 0 ? 'KS' : 'DY'

if (href.indexOf('https://buyin.jinritemai.com/') >= 0 || href.indexOf('https://zs.kwaixiaodian.com/') >= 0 || href.indexOf('https://compass.jinritemai.com') >= 0) {
// Hook Ajax
const href = window.location.href
function ajaxEventTrigger(event) {
  var ajaxEvent = new CustomEvent(event, { detail: this });
  window.dispatchEvent(ajaxEvent);
}
var oldXHR = window.XMLHttpRequest;
var oldXHRSend = window.XMLHttpRequest.prototype.send;
window.addEventListener('ajaxReadyStateChange', function (event) {
  //console.log('XMLHttpRequest2')
  //console.log('ajaxReadyStateChange')
  if (event.detail.readyState == 4 && event.detail.status == 200) {
    ajaxDataParser(event.detail)
  }
});
function newXHR() {
  var realXHR = new oldXHR();
  realXHR.addEventListener('readystatechange', function () { ajaxEventTrigger.call(this, 'ajaxReadyStateChange'); }, false);
  return realXHR;
}
if (ENV == 'DY') {
  //console.log('DY挂载监听接口')
  var originXHR_open = XMLHttpRequest.prototype.open;
  var originXHR_send = XMLHttpRequest.prototype.send;
  window.XMLHttpRequest.prototype.open = function open(method, url, bool) {
    originXHR_open.apply(this, arguments);
  }
  window.XMLHttpRequest.prototype.send = function send(_data) {
    this.addEventListener('readystatechange', function(){
      //console.log('挂载监听接口 readystatechange')
      ajaxEventTrigger.call(this, 'ajaxReadyStateChange');
    }, false);
    originXHR_send.apply(this, arguments);
  };
} else {
  window.XMLHttpRequest = newXHR;
}

//jq
const jqueryScript = document.createElement("script");
jqueryScript.type = "text/javascript";
jqueryScript.src = 'https://code.jquery.com/jquery-2.2.4.min.js'
document.getElementsByTagName('head')[0].appendChild(jqueryScript);

function delcommafy (num){
  if((num + '').trim() == ''){
     return "";
  }
  num=num.replace(/,/gi,'');
  num = num.split('\n')[0];
  num = num.split(' ')[0];
  return num;
}

function initSessionStorgeData () {
  sessionStorage.setItem('downGoodInfo', '{}')
  sessionStorage.setItem('plugGoodList', '[]')
  sessionStorage.setItem('dh_dy_live_info', '{}')
  // 抖音服务端时间
  sessionStorage.setItem('dyLiveUpateTime', '')
  sessionStorage.setItem('goodUpateTime', '')
  sessionStorage.setItem('history_live_room_info', '{}')
  sessionStorage.setItem('history_live_room_info_lock', '0')
  // 开播锁 / 下播锁
  // sessionStorage.setItem('bgOpenLiveLock', '0')
  // sessionStorage.setItem('bgDownLiveLock', '0')
}

// 抖音数据抓取代码开始
function getDyGoodInfo (obj) {
  return {
    // 平台商品ID
    goodId: obj.product_id,
    // 平台商品图片
    goodImg: obj.cover,
    // 平台商品名称
    goodName: obj.title,
    // 售价
    salePrice: (obj.min_price / 100).toFixed(2),
    // 售出
    saleNum: obj.pay_order_num,
    // 库存
    stockNum: obj.stock_num,
    // 成交金额
    amount: (obj.pay_order_gmv / 100).toFixed(2),
  }
}
function getDyGoodsDomDatas () {
  // 获取商品数据
  var goodsDom = ''
  if (document.getElementById('app').childNodes.length > 1) {
    goodsDom = document.getElementById('app').childNodes[1].childNodes[1].childNodes[1].childNodes[0].childNodes[1].childNodes[0].childNodes
  } else {
    goodsDom = document.getElementById('app').childNodes[0].childNodes[1].childNodes[1].childNodes[0].childNodes[1].childNodes[0].childNodes
  }
  // 无上架商品
  if (goodsDom[0].innerText === '直播间内没有商品，快去添加吧') {
    return {
      upGoodInfo: {
        goodId: null,
      },
      plugGoodList: [],
    }
  }
  const commonInfoObj = goodsDom[0].childNodes[0].childNodes
  if (commonInfoObj[0].innerText.split('\n')[0] === '无库存') {
    commonInfoObj[0].innerText.split('\n').shift()
  }
  let goodInfo = getDyGoodInfo(commonInfoObj[0])
  let goodCarList = []
  const goodCarDomListArr = Array.prototype.slice.call(commonInfoObj)
  goodCarDomListArr.map((item) => {
    goodCarList.push(getDyGoodInfo(item))
  })
  return {
    upGoodInfo: {
      ...goodInfo,
    },
    plugGoodList: goodCarList,
  }
}

function getDyLiveRoomDomDatas (obj) {
  return {
    // 实时在线人数
    onlineUserNum: obj.online_user_cnt,
    // 累计观看人数
    allUserNum: obj.watch_cnt,
    // 新增粉丝数
    newFansNum: obj.incr_fans_cnt,
    // 成交金额
    allAmount: obj.pay_order_gmv,
    // 成交订单数
    orderNum: obj.pay_order_cnt,
    // 成交人数占比
    orderUserPer: `${obj.deal_ratio || 0}%`,
  }
}

function getDyStorageDatas () {
  // 获取直播间数据
  if (!sessionStorage.getItem('userInfo')) {
    return {
      userId: null,
      plat: 2,
      userName: null,
    }
  }
  const userInfoObj = JSON.parse(sessionStorage.getItem('userInfo'))
  return {
    userId: userInfoObj.origin_uid,
    plat: 2,
    userName: userInfoObj.user_name,
  }
}

function isDyLiving () {
  // 获取直播间数据
  const liveStatusText = document.getElementById('app').innerText
  if (liveStatusText.indexOf('\n直播中') >= 0) {
    return true
  }
  initSessionStorgeData()
  return false
}
// 抖音数据抓取结束

// 快手数据抓取开始
function getKsGoodInfo (obj, index) {
  const arr = obj.childNodes
  // 缓存获取真实id
  const ksGoods = JSON.parse(sessionStorage.getItem('dh_ks_Goods') || '[]')
  let currentGood = {}
  if (ksGoods && ksGoods.length) {
    const pointArr = ksGoods.filter((item) => item.itemTitle.replace(/\s*/g,"") === arr[0].childNodes[0].childNodes[1].childNodes[0].innerText.replace(/\s*/g,""))
    if (!pointArr.length) {
    } else if (pointArr.length == 1) {
      currentGood = pointArr[0]
    } else {
      const recordGoodItem = ksGoods[index]
      const str1 = recordGoodItem.itemTitle.replace(/\s*/g,"")
      const str2 = arr[0].childNodes[0].childNodes[1].childNodes[0].innerText.replace(/\s*/g,"")
      if (str1 == str2) {
        currentGood = recordGoodItem
      }
    }
  }
  const imgUrlStr = arr[0].childNodes[0].childNodes[0].innerHTML.split('src=\"')[1].split('?')[0]
  return {
    // 平台商品ID
    goodId: obj.dataset.rowKey.indexOf('-') >= 0 ? obj.dataset.rowKey.split('-')[1] : obj.dataset.rowKey,
    // 平台商品图片
    goodImg: imgUrlStr || '',
    // 平台商品名称
    goodName: arr[0].childNodes[0].childNodes[1].childNodes[0].innerText,
    // 售价
    salePrice: delcommafy(arr[0].childNodes[0].childNodes[1].childNodes[1].innerText.split('￥')[1]),
    // 售出
    saleNum: delcommafy(arr[2].innerText.split(' ')[0]),
    // 库存
    stockNum: delcommafy(arr[1].innerText),
    // 成交金额
    amount: delcommafy(arr[3].innerText),
  }
}
function getNewKsGoodsDomDatas () {
  const gooodsDom = isNewKsNotice() ? document.getElementById('root').childNodes[0].childNodes[1].childNodes[0].childNodes[1].childNodes[2].childNodes[0].childNodes[0].childNodes[2].childNodes[1].childNodes : document.getElementById('root').childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[2].childNodes[0].childNodes[0].childNodes[2].childNodes[1].childNodes
  if (gooodsDom[0].innerText.indexOf('暂无上车商品') >= 0) {
    // 无上架商品
    return {
      upGoodInfo: {
        goodId: null,
      },
      plugGoodList: [],
    }
  }
  // 从DOM抓取
  const pointGooodDom = gooodsDom[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[2].childNodes
  let goodCarList = []
  const goodCarDomListArr = Array.prototype.slice.call(pointGooodDom)
  goodCarDomListArr.map((item, index) => {
    if (getKsGoodInfo(item, index).goodId) {
      goodCarList.push(getKsGoodInfo(item, index))
    }
  })
  return {
    upGoodInfo: getKsGoodInfo(pointGooodDom[0], 0),
    plugGoodList: goodCarList,
  }
}
function getCookieInfoByName (name) {
  var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
  if(arr=document.cookie.match(reg))
  return unescape(arr[2]);
  else
  return null;
}

function getKsStorageDatas () {
  const userDom = document.getElementById('root').childNodes[0].childNodes[0].innerText
  return {
    userId: getCookieInfoByName('sellerId') || null,
    userName: userDom.split('\n')[userDom.split('\n').length - 1] || null,
    plat: 1,
  }
}
function getNewKsLiveRoomDomDatas () {
  // 获取直播间数据
  const liveRoomDom = isNewKsNotice() ? document.getElementById('root').childNodes[0].childNodes[1].childNodes[0].childNodes[1].childNodes[3].childNodes[0].childNodes[0].childNodes[1].childNodes : document.getElementById('root').childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[3].childNodes[0].childNodes[0].childNodes[1].childNodes
  return {
    // 实时在线人数
    onlineUserNum: liveRoomDom[0].innerText.split('实时观看人数\n')[1].split('\n人')[0],
    // 累计观看人数
    allUserNum: liveRoomDom[3].innerText.split('累计观众数 ')[1],
    // 平均观看时长(秒)
    avgWatchTime: liveRoomDom[4].innerText.split('人均观看时长\n')[1].split('\n')[0].split(',').join(''),
    // 新增粉丝数
    newFansNum: liveRoomDom[3].innerText.split('累计新增粉丝\n')[1].split('\n')[0],
    // 成交金额
    allAmount: liveRoomDom[1].innerText.split('累计成交金额\n')[1].split('\n')[0],
    // 成交订单数
    orderNum: liveRoomDom[2].innerText.split('累计订单数\n')[1].split('\n')[0],
    // 商品点击次数
    goodClickNum: liveRoomDom[2].innerText.split('商品点击 ')[1],
    // 在线粉丝占比
    onlineFansPer: liveRoomDom[0].innerText.split('在线粉丝占比 ')[1],
    // 成交粉丝占比
    dealFansPer: liveRoomDom[1].innerText.split('成交粉丝占比 ')[1],
    // 成交转化占比
    dealChangePer: liveRoomDom[4].innerText.split('成交转化率 ')[1],
  }
}
function isNewKsNotice () {
  const liveRoomDom = document.getElementById('root').childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes
  if (liveRoomDom.length === 1 && liveRoomDom[0].className.indexOf('ant-alert') === 0) {
    return true
  }
  return false
}
function isNewKsLiving () {
  const liveRoomDom = document.getElementById('root').childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes
  if (liveRoomDom.length === 1 && liveRoomDom[0].className.indexOf('ant-alert') === -1) {
    initSessionStorgeData()
    return false
  }
  // 停播
  if (document.getElementsByClassName('ant-modal-wrap').length) {
    const arr = Array.from(document.getElementsByClassName('ant-modal-wrap'))
    let flag = true
    arr.forEach(ele => {
      if (ele.innerText.indexOf('直播结束') >= 0) {
        initSessionStorgeData()
        flag = false
      }
    })
    return flag
  }
  return true
}
function getDyLiveUpdateTimes () {
  const currentTime = sessionStorage.getItem('dyLiveUpateTime') || new Date().getTime()
  return currentTime
}
function getGoodUpdateTimes () {
  const currentTime = sessionStorage.getItem('goodUpateTime') || new Date().getTime()
  return currentTime
}
// 快手数据抓取结束

// 快手数据获取
function getKsResourse () {
  const userInfo = getKsStorageDatas()
  const upGoodsInfoRes = getNewKsGoodsDomDatas()
  const liveRoomDomData = getNewKsLiveRoomDomDatas()
  const isLive = isNewKsLiving()

  const serverTimestamp = getGoodUpdateTimes()
  const params = {
    ...userInfo,
    ...upGoodsInfoRes,
    ...liveRoomDomData,
    serverTimestamp,
    uuid: localStorage.getItem('dh_uuid')
  }
  // 获取直播间id
  if (!isLive) {
    return
  }
  if (ENV === 'DY') {
    if (sessionStorage.getItem('dh_dy_roomId')) {
      params.roomId = sessionStorage.getItem('dh_dy_roomId')
    } else {
      if (sessionStorage.getItem('is_open_live') === '1') {
        params.roomId = null
        sessionStorage.setItem('is_open_live', '0')
        // 下播
        params.downGoodInfo = upGoodsInfoRes
        sendDatas('https://api-livedata.ywwl.com/api/data-collector/callback/submit-douyin-zhibo-live-info-data', params)
        // 不开播
        if (bgOpenLiveLock) {
          sendBackgroundLiveInfo(userInfo, {
            uuid: localStorage.getItem('dh_uuid'),
            roomId: bgOpenLiveLock,
          }, 2)
          bgOpenLiveLock = 0
        }
        return
      } else {
        // 不开播
        if (bgOpenLiveLock) {
          sendBackgroundLiveInfo(userInfo, {
            uuid: localStorage.getItem('dh_uuid'),
            roomId: bgOpenLiveLock,
          }, 2)
          bgOpenLiveLock = 0
        }
        params.roomId = null
        // 未开播
        console.log('未开播')
        return
      }
    }
  } else {
    params.roomId = sessionStorage.getItem('dh_ks_roomId') || ''
  }
  if (!params.roomId) {
    console.log('无直播间ID：', params)
    return
  }

  console.log('发送前，直播间数据')
  // 发送直播间数据信息
  sendLiveInfo({
    ...userInfo,
    roomId: params.roomId,
    uuid: params.uuid,
    timeStamp: new Date().getTime(),
  }, liveRoomDomData)
  // 发送直播间商品数据信息
  console.log('发送前，直播间商品数据')
  sendLiveGoodsInfo(params)

  // 发送直播开播数据信息
  if (bgOpenLiveLockTime == 0 || bgOpenLiveLockTime >= 15) {
    bgOpenLiveLock = ENV === 'DY' ? params.roomId : `${params.userId}-${bgOpenLiveLockStr()}`
    bgOpenLiveLockTime = 0
    sendBackgroundLiveInfo(userInfo, params, 0)
  }
  bgOpenLiveLockTime += 1
}

// 抖音商品数据上报
function sendDyGoodsResourse (roomId, goodsLists, time) {
  const userInfo =  getDyStorageDatas()
  let goodInfo = goodsLists.length ? getDyGoodInfo(goodsLists[0]) : []
  let goodCarList = []
  goodsLists.map((item) => {
    goodCarList.push(getDyGoodInfo(item))
  })
  const liveInfos = JSON.parse(sessionStorage.getItem('dh_dy_live_info') || '{}')
  sendLiveGoodsInfo({
    onlineUserNum: liveInfos.online_user_cnt || 0,
    ...userInfo,
    roomId,
    upGoodInfo: {
      ...goodInfo,
    },
    plugGoodList: goodCarList,
    serverTimestamp: time,
    uuid: localStorage.getItem('dh_uuid'),
  })
}

// 抖音直播间数据上报
var dyCookieLock = 0
function sendDyLiveRoomResourse (liveInfos, time) {
  var dyStorageDatas = getDyStorageDatas()
  const userInfo = dyStorageDatas
  dyCookieLock += 1
  sendLiveInfo({
    ...userInfo,
    roomId: sessionStorage.getItem('dh_dy_roomId') || '',
    uuid: localStorage.getItem('dh_uuid'),
    serverTimestamp: time,
    timeStamp: new Date().getTime(),
  }, getDyLiveRoomDomDatas(liveInfos))

  // 发送cookie
  if ((dyCookieLock % 120) == 0 && dyStorageDatas.userId) {
    sendBackgroundCookie(dyStorageDatas, localStorage.getItem('dh_uuid'))
  }

  // 发送直播开播数据信息
  if (bgOpenLiveLockTime == 0 || bgOpenLiveLockTime >= 5) {
    if (sessionStorage.getItem('dh_dy_roomId')) {
      bgOpenLiveLock = sessionStorage.getItem('dh_dy_roomId')
      bgOpenLiveLockTime = 0
      sendBackgroundLiveInfo(userInfo, {
        roomId: sessionStorage.getItem('dh_dy_roomId'),
        uuid: localStorage.getItem('dh_uuid'),
      }, 0)
    }
  }
  bgOpenLiveLockTime += 1
}

// 上报采集端
var bgOpenLiveLock = 0
var bgOpenLiveLockTime = 0
function bgOpenLiveLockStr () {
  const liveInfoDom = document.getElementById('root').childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0].innerText.split('直播时间 ')[1].split('\n·\n直播时长')[0]
  return liveInfoDom || ''
}
function sendBackgroundLiveInfo (userInfo, params, liveStatus) {
  // bgOpenLiveLock bgDownLiveLock
  if (!params.roomId) {
    return
  }
  if (!isAimPage()) {
    return
  }
  if (liveStatus == 2) {
    bgOpenLiveLockTime = 0
  }
  // sendDatas('https://api-dtcollector.ywwl.com/collector/web/task/upLiveStatus', {
  //   liveStreamId: ENV === 'DY' ? params.roomId : `${params.userId}-${bgOpenLiveLockStr()}`,
  //   live_cookie: getCookie(ENV, 'LIVE'),
  //   user_name: userInfo.userName,
  //   client: params.uuid,
  //   userId: userInfo.userId,
  //   liveStatus,
  // })
}

function getCookie (plat, type) {
  if (plat == 'DY') {
    return document.cookie
  }
  return type == 'LIVE' ? '' : sessionStorage.getItem('ks_bg_pass_cookie') || ''
}

function sendBackgroundCookie (userInfo, uuid) {
  // 环境
  // ENV DY KS
  sendDatas('https://api-dtcollector.ywwl.com/collector/web/task/upCookie', {
    taskType: userInfo.plat == 2 ? 23 : 15,
    taskCookie: getCookie(ENV),
    user_name: userInfo.userName,
    client: uuid,
    userId: userInfo.userId,
  })
}

// 上报直播间数据
function sendLiveInfo (commonInfo, liveRoomInfo) {
  // 平台区分
  // getDyLiveUpdateTimes
  if (commonInfo.plat == 2) {
    // 发送直播间数据信息
    sendDatas('https://api-livedata.ywwl.com/api/data-collector/callback/submit-douyin-zhibo-live-info-data', {
      ...commonInfo,
      ...liveRoomInfo,
    })
    return
  }
  // 直播间指标记录缓存
  if (sessionStorage.getItem('history_live_room_info')) {
    if (JSON.stringify(liveRoomInfo) === sessionStorage.getItem('history_live_room_info')) {
      // 当前记录和历史缓存一样
      sessionStorage.setItem('history_live_room_info_lock', Number(sessionStorage.getItem('history_live_room_info_lock') || '0') + 1)
      if (Number(sessionStorage.getItem('history_live_room_info_lock')) <= 20) {
        // 发送直播间数据信息
        sendDatas('https://api-livedata.ywwl.com/api/data-collector/callback/submit-douyin-zhibo-live-info-data', {
          ...commonInfo,
          ...liveRoomInfo,
        })
      }
    } else {
      // 当前记录和历史缓存不一样
      sessionStorage.setItem('history_live_room_info_lock', '0')
      // 更新历史记录缓存
      sessionStorage.setItem('history_live_room_info', JSON.stringify(liveRoomInfo))
      // 发送直播间数据信息
      sendDatas('https://api-livedata.ywwl.com/api/data-collector/callback/submit-douyin-zhibo-live-info-data', {
        ...commonInfo,
        ...liveRoomInfo,
      })
    }
  } else {
    sessionStorage.setItem('history_live_room_info_lock', '0')
    // 更新历史记录缓存
    sessionStorage.setItem('history_live_room_info', JSON.stringify(liveRoomInfo))
    // 发送直播间数据信息
    sendDatas('https://api-livedata.ywwl.com/api/data-collector/callback/submit-douyin-zhibo-live-info-data', {
      ...commonInfo,
      ...liveRoomInfo,
    })
  }
}

// 上报直播间商品数据
function sendLiveGoodsInfo (params) {
  // 发送直播间商品数据信息
  // 小黄车商品记录缓存
  sessionStorage.setItem('plugGoodList', JSON.stringify(params.plugGoodList))
  // 有商品
  if (params.upGoodInfo.goodId) {
    const sendParams = {
      uuid: params.uuid,
      roomId: params.roomId,
      userId: params.userId,
      plat: params.plat,
      timeStamp: new Date().getTime(),
      onlineUserNum: params.onlineUserNum || '',
      upGoodInfo: params.upGoodInfo,
      plugGoodList: params.plugGoodList,
      serverTimestamp: params.serverTimestamp,
    }
    if (sessionStorage.getItem('downGoodInfo')) {
      let downGoodInfo = JSON.parse(sessionStorage.getItem('downGoodInfo'))
      if (!downGoodInfo.goodId) {
        // 无历史上榜商品
        // params.downGoodInfo = {}
        sessionStorage.setItem('downGoodInfo', JSON.stringify(params.upGoodInfo))
        // 抓取脚本数据 无历史榜首商品
        sendDatas('https://api-livedata.ywwl.com/api/data-collector/callback/submit-goods-info-data', sendParams)
      } else if (downGoodInfo.goodId !== params.upGoodInfo.goodId) {
        // 有历史上榜商品且与当前榜首数据不同
        if (params.plugGoodList.filter((item) => item.goodId === downGoodInfo.goodId)[0]) {
          downGoodInfo.saleNum = params.plugGoodList.filter((item) => item.goodId === downGoodInfo.goodId)[0].saleNum
        }
        sessionStorage.setItem('downGoodInfo', JSON.stringify(params.upGoodInfo))
        // 抓取脚本数据 榜首商品变化
        sendDatas('https://api-livedata.ywwl.com/api/data-collector/callback/submit-goods-info-data', sendParams)
      } else {
        // 有历史上榜商品且与当前榜首数据相同
        // 抓取脚本数据 榜首商品不变
        sendDatas('https://api-livedata.ywwl.com/api/data-collector/callback/submit-goods-info-data', sendParams)
      }
    }
  } else {
    // 抓取脚本数据 无商品
    console.log('无商品!')
  }
}

// 上报抖音直播间平均在线人数信息
function sendDyPerLiveUserNumInfo (params) {
  // 发送抖音直播间平均在线人数信息
}

function GetQueryString(name) {
  const url = window.location.href
  const reg = new RegExp('(\\?|&)' + name + '=([^&]*)(&|$)', 'i')
  const r = url.match(reg)

  if (r !== null) {
    return unescape(r[2])
  }
  return null
}

function isAimPage () {
  const href = window.location.href
  if (href.indexOf('https://buyin.jinritemai.com/dashboard/live/control') >= 0 || href.indexOf('https://zs.kwaixiaodian.com/control') >= 0 || href.indexOf('https://zs.kwaixiaodian.com/page/helper') >= 0) {
    return true
  }
  return false
}

function initPageData () {
  // uuid
  if (!localStorage.getItem('dh_uuid')) {
    const uuid = generateUUID()
    localStorage.setItem('dh_uuid', uuid)
  }
  initSessionStorgeData()
  sendBackgroundCookie(ENV === 'DY' ? getDyStorageDatas() : getKsStorageDatas(), localStorage.getItem('dh_uuid'))
  setTimeout(() => {
    sendBackgroundCookie(ENV === 'DY' ? getDyStorageDatas() : getKsStorageDatas(), localStorage.getItem('dh_uuid'))
  }, 10000)
  // 快手轮询上报
  if (ENV === 'KS') {
    setInterval(() => {
      let isLive = isNewKsLiving()
      if (isLive) {
        getKsResourse()
      } else {
        // 不开播
        if (bgOpenLiveLock) {
          sendBackgroundLiveInfo(getKsStorageDatas(), {
            uuid: localStorage.getItem('dh_uuid'),
            roomId: bgOpenLiveLock,
          }, 2)
          bgOpenLiveLock = 0
        }
      }
    }, 1000)
  }
}

/*** 编辑内容开始 */
// 数据处理
const ajaxDataParser = (responseDetails) => {
  // responseDetails 包含请求返回的所以信息
  // [TiMo] 抖音请求结果：
  if (responseDetails.responseURL.indexOf('/api/livepc/promotions/') >= 0) {
    const detail = JSON.parse(responseDetails.response)
    if (detail.code == 0) {
      sessionStorage.setItem('goodUpateTime', detail.extra.now)
      if (detail.data.extra.room_id === '0') {
        sessionStorage.setItem('dh_dy_roomId', '')
      } else {
        sessionStorage.setItem('dh_dy_roomId', detail.data.extra.room_id || '')
        sessionStorage.setItem('is_open_live', '1')
        // 抖音商品信息上报
        sendDyGoodsResourse(detail.data.extra.room_id, detail.data.promotions || [], detail.extra.now)
      }
    }
  }

  if (responseDetails.responseURL.indexOf('/api/anchor/livepc/promotions') >= 0) {
    const detail = JSON.parse(responseDetails.response)
    if (detail.code == 0) {
      sessionStorage.setItem('goodUpateTime', detail.extra.now)
      if (detail.data.extra.room_id === '0') {
        sessionStorage.setItem('dh_dy_roomId', '')
      } else {
        sessionStorage.setItem('dh_dy_roomId', detail.data.extra.room_id || '')
        sessionStorage.setItem('is_open_live', '1')
        // 抖音商品信息上报
        sendDyGoodsResourse(detail.data.extra.room_id, detail.data.promotions || [], detail.extra.now)
      }
    }
  }
 
  // 抖音直播间信息上报
  if (responseDetails.responseURL.indexOf('/livepc/realtime') >= 0) {
    const detail = JSON.parse(responseDetails.response)
    if (detail.code == 0) {
      sessionStorage.setItem('dyLiveUpateTime', detail.extra.now)
      sessionStorage.setItem('dh_dy_live_info', JSON.stringify(detail.data || {}))
      sendDyLiveRoomResourse(detail.data, detail.extra.now)
    }
  }

  // 抖音直播间信息
  if (responseDetails.responseURL.indexOf('/api/livepc/author/setcurrent/') >= 0) {
    let requestHeaders = responseDetails._requestHeaders || []
    let xSecsdkCsrfToken = ''
    requestHeaders.forEach((element) => {
      const key = element[0]
      const val = element[1]
      if (Array.isArray(element) && key && key === 'x-secsdk-csrf-token') {
        xSecsdkCsrfToken = val
        sessionStorage.setItem('dh_dy_x_secsdk_csrf_token', xSecsdkCsrfToken)
      }
    });
  }

  // [TiMo] 快手请求结果：
  if (responseDetails.responseURL.indexOf('/assistant/live/current') >= 0) {
    const detail = JSON.parse(responseDetails.response)
    if (detail.result == 1) {
      const { liveBaseInfo, shopCarItem } = detail.data.centerConsoleInfo
      sessionStorage.setItem('goodUpateTime', new Date(detail.serverTimestamp).getTime())
      const roomIdUrl = liveBaseInfo.hlsPlayUrl[0]
      const roomIdUrlStr = roomIdUrl.split('.flv?')[0].split('/')[roomIdUrl.split('.flv?')[0].split('/').length - 1]
      const roomIdUrlStrArr = roomIdUrl.split('.flv?')[0].split('/')[roomIdUrl.split('.flv?')[0].split('/').length - 1].split('_')
      // sessionStorage.setItem('dh_ks_roomId', roomIdUrlStr.slice(0, 11))
      if (roomIdUrlStr.length == 11) {
        sessionStorage.setItem('dh_ks_roomId', roomIdUrlStr.slice(0, 11))
      } else {
        roomIdUrlStrArr.map((item) => {
          if (item.length == 11) {
            sessionStorage.setItem('dh_ks_roomId', item)
          }
        })
      }
      if (!sessionStorage.getItem('dh_ks_roomId')) {
        sessionStorage.setItem('dh_ks_roomId', roomIdUrlStr.slice(0, 11))
      }
      sessionStorage.setItem('dh_ks_Goods', JSON.stringify(shopCarItem.itemList || []))
    }
  }
}

function sendDatas(url, obj) {
  console.log('发送。。。')
  /* 创建 XMLHttpRequest 对象 */
  var httpRequest = new XMLHttpRequest()
  httpRequest.open('POST', url, true)
  httpRequest.setRequestHeader('Content-type', 'application/json')
  httpRequest.send(JSON.stringify({
    ...obj,
    requestId: generateUUID(),
    sendPlat: 1,
  }));//发送请求 将json写入send中
  httpRequest.onreadystatechange = function () {
    if (httpRequest.readyState == 4 && httpRequest.status == 200) {
      var json = httpRequest.responseText;
      //获取到服务端返回的数据
    }
  };
}

// 生成uuid
function generateUUID() {
  var d = new Date().getTime();
  if(window.performance && typeof window.performance.now === "function"){
      d += performance.now()
  }
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (d + Math.random()*16)%16 | 0;
      d = Math.floor(d/16);
      return (c=='x' ? r : (r&0x3|0x8)).toString(16);
  });
  return uuid
}

function GetQueryString(name) {
  const url = window.location.href
  const reg = new RegExp('(\\?|&)' + name + '=([^&]*)(&|$)', 'i')
  const r = url.match(reg)
  if (r !== null) {
    return unescape(r[2])
  }
  return null
}

// 生成遥望插件
// 是否展示隐藏场记、场控电脑
var ywBtnVis = false
var ywCKBoxVis = false
var ywJJBoxVis = false
var ywBarrageVis = false
var ywCJ2BoxVis = false
var CJ2LiveListParams = {
  platformUserId: '',
  livePlatformRoomInfoId: '',
  anchorNo: '',
}
var ywCjAddGoodInputValue = ''
var ywCjAddMsgInputValue = ''
var ywLiveStatusInfo = {}
var ywJJLiveExplainInfo = {}
var ywJJTimer = null
var ywCJ2Timer = null
// 指标下拉列表数据
var ywQuotaSelectLists = []
var ywQuotaZbLists = []
var openCjCkBtnTimes = 0
function openCjCkBtn(type) {
  openCjCkBtnTimes += 1
  const newDisplay = type ? 'block' : 'none';
  document.getElementById('yw_btn_cj2').style.display = newDisplay
  document.getElementById('yw_btn_ck').style.display = newDisplay
  document.getElementById('yw_btn_jj').style.display = newDisplay
  document.getElementById('yw_btn_barrage').style.display = newDisplay
  if (!type) {
    ywCkBoxVis = false
    ywJJBoxVis = false
    ywBarrageVis = false
    ywCJ2BoxVis = false
    $('#yw_CJ2_box').css('display', 'none')
    $('#yw_ck_box').css('display', 'none')

  }
  if (openCjCkBtnTimes == 1) {
    // 讲解
    $('#yw_btn_jj').off('click').click(function () {
      ywCJ2BoxVis = false
      ywCkBoxVis = false
      ywJJBoxVis = !ywJJBoxVis
      openYwJJBox(ywJJBoxVis)
    })
    $('#yw_btn_barrage').off('click').click(function () {
      /* 创建 XMLHttpRequest 对象 */
      var httpRequest = new XMLHttpRequest()
      httpRequest.open('GET', 'https://test-gateway.ywwl.com/ywwl-dianhu-oper/api/zhibo/fieldcontrol/zhubo/info', true)
      httpRequest.setRequestHeader('Content-type', 'application/json')
      httpRequest.setRequestHeader('X-TOKEN', sessionStorage.getItem('dh_token'))
      httpRequest.send();
      httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
          var json = httpRequest.responseText;
          json = JSON.parse(json)
          if (json.success) {
            ywLiveStatusInfo = json.data
            if (ywLiveStatusInfo.userNo) {
              if (!ywLiveStatusInfo.isOpen) {
                alert('暂未开播，无法使用！')
                return
              }
              $('#yw_barrage_box').css('display', 'none')
              // 发弹幕
              ywCJ2BoxVis = false
              ywCkBoxVis = false
              ywBarrageVis = !ywBarrageVis
              openYwBarrageBox(ywBarrageVis)
            } else {
              alert('暂未绑定主播，无法使用场控、场记、发弹幕功能!')
            }
          } else if (json.code == 1000 || json.code == 17020002) {
            sessionStorage.removeItem('dh_token')
            window.open(`https://yun-test.ywwl.com/login?redirectUrl=${window.location.href.indexOf('token') >= 0 ? window.location.href.split('?')[0] : window.location.href}`, '_self')
          } else {
            alert(json.msg)
          }
        }
      };
    })
    $('#yw_btn_cj2').off('click').click(function () {
      const platform = ENV === 'DY' ? 2 : 1;
      const params = {
        // TODO
				// platformUserId: ywLiveStatusInfo.userNo,
				platformUserId: 'Yingzi971128',
				platform: platform,
			}
			$.ajax({
				url: 'https://test-gateway.ywwl.com/ywwl-ksTools/tool/studioAnchor/list',
				method: 'GET',
				data: params,
				headers: {
					'X-TOKEN': sessionStorage.getItem('dh_token'),
					'Content-type': 'application/json',
				},
        success: function (res) {
          if (res.success) {
            $('#yw_ck_box').css('display', 'none')
						ywCJ2BoxVis = !ywCJ2BoxVis
						ywCkBoxVis = false
						ywJJBoxVis = false
            ywBarrageVis = false
            const list = res?.data
            CJ2LiveListParams = list[0]
            openYwCj2Box(ywCJ2BoxVis)
            getCJ2LiveList(true)
						var selectItem =
							"<select id='cj2_select' style='width: 216px;height: 32px;background: #ffffff;border-radius: 2px;border: 1px solid #d9d9d9;	padding: 0 12px;font-size: 14px;color: #333333;' placeholder='请输入'>"
						for (let i = 0; i < list.length; i++) {
							selectItem += `<option value=${i}>${
								list[i]?.anchorName || i
							}</option>`
						}
						selectItem += '</select>'
						$('#cj2_select').replaceWith(selectItem)
						// $('#cj2_select').searchableSelect({
						// 	//选择了已有的弹幕内容
						// 	afterSelectItem: function (value) {
            //     const selectObj = list.find((item) => item.id === value)
            //     console.log('select:', item);
						// 		// $('#barrageComments').val(selectObj.comments.join('\n'))
						// 	},
						// })
            $('#cj2_content').on('change', '#cj2_select', function (e) {
              const index = e.target.value
              CJ2LiveListParams = list[index]
              getCJ2LiveList()
						})
						
					} else {
            alert(res.msg ? res.msg : '当前无直播场次，请开播后再试!')
					}
				},
			})
    })
    $('#yw_btn_ck').off('click').click(function() {
      /* 创建 XMLHttpRequest 对象 */
      var httpRequest = new XMLHttpRequest()
      httpRequest.open('GET', 'https://test-gateway.ywwl.com/ywwl-dianhu-oper/api/zhibo/fieldcontrol/zhubo/info', true)
      httpRequest.setRequestHeader('Content-type', 'application/json')
      httpRequest.setRequestHeader('X-TOKEN', sessionStorage.getItem('dh_token'))
      httpRequest.send();
      httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
          var json = httpRequest.responseText;
          json = JSON.parse(json)
          if (json.success) {
            ywLiveStatusInfo = json.data
            if (ywLiveStatusInfo.userNo) {
              if (ywLiveStatusInfo.isOpen) {
                window.open(`https://dianhu.ywwl.com/dashboard?roomId=${ywLiveStatusInfo.roomId}&token=${sessionStorage.getItem('dh_token')}`)
                return
              }
              $('#yw_cj_box').css('display', 'none')
              ywCJ2BoxVis = false
              ywJJBoxVis = false
              ywBarrageVis = false
              ywCKBoxVis = !ywCKBoxVis
              openYwCkBox(ywCKBoxVis)
            } else {
              alert('暂未绑定主播，无法使用场控、场记功能!')
            }
          } else if (json.code == 1000 || json.code == 17020002) {
            sessionStorage.removeItem('dh_token')
            window.open(`https://yun-test.ywwl.com/login?redirectUrl=${window.location.href.indexOf('token') >= 0 ? window.location.href.split('?')[0] : window.location.href}`, '_self')
          } else {
            alert(json.msg)
          }
        }
      };
    })
  }
}
//获取弹幕列表
function getBarrigeList() {
  var params = {
      type: 1,
      anchorUserId: sessionStorage.getItem('dl_anchorUserId')
  }
  $.ajax({
      url: 'https://test-gateway.ywwl.com/ywwl-ksTools/api/live/manage/material/getAll',
      method: 'GET',
      data: params,
      headers: {
          'X-TOKEN': sessionStorage.getItem('dh_token'),
          'Content-type': 'application/json'
      },
      success: function(res) {
          const list = res?.data?.list;
          var textHead = "<select placeholder='请输入弹幕'>";
          for (let i = 0; i < list.length; i++) {
              textHead += `<option value=${list[i].id}>${list[i].title}</option>`
          }
          textHead += '</select>';
          $('#segment').html(textHead);
          $('select').searchableSelect({
              //选择了已有的弹幕内容
              afterSelectItem: function(value) {
                  const selectObj = list.find(item => item.id === value);
                  $('#barrageComments').val(selectObj.comments.join('\n'));
              }
          });
      }
  })
}
// 获取电狼接口需要的AnchorUserId
function getDlAnchorUserId() {
  const params = {
    userNo: ywLiveStatusInfo.userNo,
    platform: 2
  }
  $.ajax({
    url: 'https://test-gateway.ywwl.com/ywwl-ksTools/platform/account/info',
    method: 'GET',
    data: params,
    headers: {
        'X-TOKEN': sessionStorage.getItem('dh_token'),
        'Content-type': 'application/json'
    },
    success: function(res) {
      sessionStorage.setItem("dl_anchorUserId", res.data.platformUserId);
    }
  })
}
function stopBarrageTask() {
  const params = {
    taskNo: sessionStorage.getItem("dl_barrageTaskNo"),
  }
  $.ajax({
    url: 'https://test-gateway.ywwl.com/ywwl-ksTools/api/live/operate/stopTask',
    method: 'GET',
    data: params,
    headers: {
        'X-TOKEN': sessionStorage.getItem('dh_token'),
        'Content-type': 'application/json'
    },
    success: function(res) {
      if (res.success) {
        alert("停止成功")
        getBarrageTaskList()
      } else {
        alert(res.msg)
      }
    }
  })
}
function updateBarrageTask() {
  const comments = $('#barrageComments').val();
  const barrageStaySend = $('#barrageStaySend')[0].checked;
  const barrageDuration = $('#barrageDuration').val();
  if (!comments) {
    alert('请输入弹幕');
    return;
  }
  if (barrageStaySend && (!barrageDuration || +barrageDuration <= 0)) {
    alert('请输入持续时长');
    return;
  }
  const params = {
      taskNo: sessionStorage.getItem("dl_barrageTaskNo"),
      duration: barrageDuration,
      liveOperateType: barrageStaySend ? 2 : 1,
      platformType: 1,
      comments: comments.split("\n"),
      anchorUserId: sessionStorage.getItem('dl_anchorUserId')
  }
  $.ajax({
    url: 'https://test-gateway.ywwl.com/ywwl-ksTools/api/live/operate/modifyTask',
    method: 'POST',
    data: JSON.stringify(params),
    headers: {
        'X-TOKEN': sessionStorage.getItem('dh_token'),
        'Content-type': 'application/json'
    },
    success: function(res) {
      if (res.success) {
        alert('更新成功')
        getBarrageTaskList()
      } else {
        alert(res.msg)
      }
    }
  })
}
function addBarrageTask() {
  const comments = $('#barrageComments').val();
  const barrageSelectNum = $('#barrageSelectNum').val();
  const barrageStaySend = $('#barrageStaySend')[0].checked;
  const barrageDuration = $('#barrageDuration').val();
  if (!comments) {
    alert('请输入弹幕');
    return;
  }
  if (+barrageSelectNum < 0) {
    alert('请输入正确账号数');
    return;
  }
  if (barrageStaySend && (!barrageDuration || +barrageDuration <= 0)) {
    alert('请输入持续时长');
    return;
  }
  const sendText = "发送执行中...";
  if ($("#barrage-send").text() === sendText) {
    return;
  }
  const params = {
      duration: barrageDuration,
      selectNum: barrageSelectNum,
      liveOperateType: barrageStaySend ? 2 : 1,
      goalCount: barrageSelectNum,
      platformType: 1,
      comments: comments.split('\n'),
      liveStreamId: sessionStorage.getItem('dh_dy_roomId'),
      anchorUserId: sessionStorage.getItem('dl_anchorUserId')
  }
  $("#barrage-send").text(sendText);
  $.ajax({
    url: 'https://test-gateway.ywwl.com/ywwl-ksTools/api/live/operate/comment/task',
    method: 'POST',
    data: JSON.stringify(params),
    headers: {
        'X-TOKEN': sessionStorage.getItem('dh_token'),
        'Content-type': 'application/json'
    },
    success: function(res) {
      if (res.success) {
        getBarrageTaskList();        
      } else {
        alert(res.msg);
        $("#barrage-send").text('发送');
      }
    },
    error: function(err) {
      alert(err.msg)
      $("#barrage-send").text('发送');
    }
  })
}
// 添加弹幕素材
function addBarrage() {
  const addTitle = $('#barrage-add-title').val();
  if (!addTitle) {
      alert('请输入标题');
      return;
  }
  const comments = $('#barrageComments').val();
  if (!comments) {
    alert('请输入弹幕');
    return;
  }
  const params = {
      title: addTitle,
      type: 1,
      platformType: 1,
      comments: comments.split('\n'),
      anchorUserId: sessionStorage.getItem('dl_anchorUserId')
  }
  $.ajax({
      url: 'https://test-gateway.ywwl.com/ywwl-ksTools/api/live/manage/material/addOrEdit',
      method: 'POST',
      data: JSON.stringify(params),
      headers: {
          'X-TOKEN': sessionStorage.getItem('dh_token'),
          'Content-type': 'application/json'
      },
      success: function() {
          $('#barrage-title-delete,#barrageModal-cancel-button').off('click');
          $('#barrageModal-confirm').off('click');
          $('#barrage-add-title').val('')
          $('#barrageModal').hide();
          getBarrigeList();
      },
      error: function(err) {
          alert(err)
      }
  })
}
// function showSendBarrageFail(failList) {
//   let failString = "";
//   for (let i = 0; i < failList.length; i++) {
//     failString += `<div style='display:flex;justify-content:space-between;padding:10px;background-color: #ededed;'>
//     <div>${failList[i].failReason}</div>
//     <div>${failList[i].totalNumber}</div>
//     </div>`
//   }
//   $("#barrage-fail-list").html(failString);
//   $("#barrage-fail-modal").show();
// }
// 获取正在发送的弹幕任务列表
function getBarrageTaskList(firstTime) {
  $.ajax({
    url: 'https://test-gateway.ywwl.com/ywwl-ksTools/api/live/anchor/operate/task/list',
    method: 'GET',
    data: {
      pageIndex: 1,
      pageSize: 20,
      status: 2,
      anchorUserId: sessionStorage.getItem('dl_anchorUserId')
    },
    headers: {
        'X-TOKEN': sessionStorage.getItem('dh_token'),
        'Content-type': 'application/json'
    },
    success: function(res) {
      const taskList = res.data.list;
      // 当不存在正在发送的弹幕任务时，显示发送按钮
      if (!taskList || !taskList.length) {
        if (!document.getElementById("barrage-send")) {
          $("#barrage-action").empty();
          $("#barrage-action").append("<button id='barrage-send' style='width: 328px;    height: 32px;    line-height: 32px;    background-color: #1890FF;    color: #fff;    border-radius: 4px;    border: none;    margin-top: 10px;    cursor: pointer;'>发送</button>")
          $('#barrage-send').on('click', function() {
            addBarrageTask();
          })
        }
      } else {
        sessionStorage.setItem("dl_barrageTaskNo", taskList[0].taskNo);
        // $.ajax({
        //   url: 'https://test-gateway.ywwl.com/ywwl-ksTools/api/live/anchor/operate/task/fail/list',
        //   method: 'GET',
        //   data: {
        //     taskNo: taskList[0].taskNo
        //   },
        //   headers: {
        //       'X-TOKEN': sessionStorage.getItem('dh_token'),
        //       'Content-type': 'application/json'
        //   },
        //   success: function(res) {
        //     const failList = res.data;
        //     //const failList = [{failReason: '未知异常', totalNumber: 1}]
        //     const failCount = failList.length;
        //     let taskMessage;
        //     if (failCount) {
        //       taskMessage = "<div style='margin-top:10px;font-size:14px;'>成功发送<span style='color:1890FF;'>" + taskList[0].successTaskCount + "</span>条，失败<span style='color:#F15A5A;'>" + failCount + "</span>条<span id='show-barrage-fail' style='margin-left:10px;color:#1890FF;cursor: pointer;'>失败原因</span></div>"
        //     } else {
        //       taskMessage = "<div style='margin-top:10px;font-size:14px;'>成功发送<span style='color:1890FF;'>" + taskList[0].successTaskCount + "</span>条，失败<span style='color:#F15A5A;'>" + failCount + "</span>条</div>"
        //     }
        //     $("#barrage-message").empty();
        //     $("#barrage-message").html(taskMessage);
        //     if (failCount) {
        //       if (!document.getElementById("barrage-fail-modal")) {
        //         const barrageFailModal = document.createElement('div');
        //         barrageFailModal.setAttribute('id', 'barrage-fail-modal');
        //         barrageFailModal.setAttribute("style", "display:none;box-sizing: border-box;width: 400px;padding: 20px;position: fixed;        top: 30%;        left: 60%;        z-index: 1000;        background-color: #fff;        box-shadow: 0px 1px 5px 0px rgba(38, 38, 38, 0.1);        border-radius: 4px;        border: 1px solid #F2F2F2;font-size: 14px;")
        //         barrageFailModal.innerHTML = "<div style='display: flex;justify-content: space-between;font-weight: 600;font-size: 20px;color: #333;            margin-bottom: 20px;'><div><span style='display: inline-block;                    width: 20px;                    height: 20px;                    text-align: center;                    font-size: 14px;                    background-color: #1890FF;                    color: #fff;                    border-radius: 50%;                    margin-right: 10px;                    position: relative;                    bottom: 3px;'>!</span>提示</div><span id='barrage-fail-delete' style='color: #A6A6A6;                font-weight: 400;                cursor: pointer;'>x</span></div><div style='display:flex;justify-content:space-between;padding:10px;background-color: #ededed;'><div>失败原因</div><div>统计数量</div></div><div id='barrage-fail-list'></div><div style='margin-top: 20px;            text-align: right;'><button id='barrage-fail-confirm' style='width: 60px;                height: 32px;                line-height: 32px;                border-radius: 4px;                border: none;                cursor: pointer;background-color: #1890FF;    color: #fff;    margin-right: 10px;'>确定</button><button id='barrage-fail-cancel' style='width: 60px;                height: 32px;                line-height: 32px;                border-radius: 4px;                border: none;                cursor: pointer;'>取消</button></div>";
        //         document.body.appendChild(barrageFailModal);
        //         $("#barrage-fail-cancel,#barrage-confirm-cancel,#barrage-fail-delete").on("click", function() {
        //           $("#barrage-fail-modal").hide();
        //         })
        //       }
        //       $("#show-barrage-fail").on("click", function() {
        //         showSendBarrageFail(failList)
        //       })
        //     }
        //   }
        // })
          // 当存在正在发送的弹幕任务时，显示更新和停止按钮
          $("#barrage-action").empty();
          $("#barrage-action").html("<button id='barrageUpdate' style='width:80px;height:32px;border:1px solid #D8D8D8;background-color:#fff;border-radius:4px;margin-right:10px;margin-top:10px;cursor:pointer;'>更新文案</button><button id='barrageStop' style='width:230px;height:32px;border-radius:4px;margin-top:10px;border: none;background-color:#F15A5A;color:#fff;cursor:pointer;'>停止</button>")
          // 第一次加载，存在任务时，填充任务信息
          if (firstTime) {
            $.ajax({
              url: 'https://test-gateway.ywwl.com/ywwl-ksTools/api/live/anchor/task/info',
              method: 'GET',
              data: {
                taskNo: taskList[0].taskNo
              },
              headers: {
                  'X-TOKEN': sessionStorage.getItem('dh_token'),
                  'Content-type': 'application/json'
              },
              success: function(res) {
                const taskInfo = res.data;
                $('#barrageDuration').val(taskInfo.duration);
                $('#barrageSelectNum').val(taskInfo.deviceNum);
                $('#barrageStaySend')[0].checked = taskInfo.liveOperateType === 2;
                $('#barrageComments').val(taskInfo.comments.join("\n"));
              }
            })
          }
          // 更新弹幕
          $('#barrageUpdate').on('click', function() {
            updateBarrageTask()
          })
          // 停止发送弹幕
          $('#barrageStop').on('click', function() {
            stopBarrageTask()
          })
        }
    }
})
}
var barrageTaskTimer;
// 打开发弹幕弹窗
function openYwBarrageBox(visible) {
  if (visible) {
    getDlAnchorUserId();
    $('#yw_barrage_box').show();
    $('#chooseBarrage').on('click', function() {
      if (!$('#segment').html()) {
          getBarrigeList();
      }
    })
    // 添加弹幕素材
    $('#barrage-add-item').on('click', function() {
      if (!document.getElementById("barrageModal")) {
        const barrageModal = document.createElement('div');
        barrageModal.setAttribute('id', 'barrageModal');
        barrageModal.setAttribute('style', 'display:none;box-sizing:border-box;width:400px;height:160px;padding:20px;position:fixed;top:20%;left:70%;z-index:1000;background-color:#fff;box-shadow:0 1px 5px 0 rgba(38,38,38,0.1);border-radius:4px;border:1px solid #F2F2F2;');
        barrageModal.innerHTML = "<div style='display: flex;            justify-content: space-between;            font-weight: 600;            font-size: 20px;            color: #333;            margin-bottom: 20px;'><div><span style='display: inline-block;                    width: 20px;                    height: 20px;                    text-align: center;                    font-size: 14px;                    background-color: #1890FF;                    color: #fff;                    border-radius: 50%;                    margin-right: 10px;                    position: relative;                    bottom: 3px;'>!</span>提示</div><span id='barrage-title-delete' style='color: #A6A6A6;                font-weight: 400;                cursor: pointer;'>x</span></div><div style='font-weight: 400;            color: #666666;            font-size: 14px;'><input id='barrage-add-title' style='width: 350px;                height: 30px;                padding: 5px;                border-radius: 2px;                border: 1px solid #D9D9D9;                outline: none;' placeholder='素材标题' /></div><div style='margin-top: 20px;            text-align: right;'><button id='barrageModal-confirm' style='width: 60px;                height: 32px;                line-height: 32px;                border-radius: 4px;                border: none;                cursor: pointer;background-color: #1890FF;    color: #fff;    margin-right: 10px;'>确定</button><button id='barrageModal-cancel-button' style='width: 60px;                height: 32px;                line-height: 32px;                border-radius: 4px;                border: none;                cursor: pointer;'>取消</button></div>";
        document.body.appendChild(barrageModal);
      }
      $('#barrageModal').show();
      $('#barrage-title-delete,#barrageModal-cancel-button').on('click', function() {
          $('#barrageModal').hide();
      })
      $('#barrageModal-confirm').on('click', function() {
        addBarrage()
      })
    })
    getBarrageTaskList(true);
    barrageTaskTimer = setInterval(() => {
      getBarrageTaskList(); 
    }, 3000)
    // 获取发送弹幕的列表
  }
}
function openYwCj2Box () {
	// 描述页面
	$('#yw_CJ2_box').show()
	// 动效
	const BtnDefault = document.getElementById('cj2_button')
	BtnDefault.onmouseover = function () {
		BtnDefault.style.backgroundColor = '#096dd9'
	}
	BtnDefault.onmouseout = function () {
		BtnDefault.style.backgroundColor = '#1890ff'
	}
	const CloseBtn = document.getElementById('cj2_wrap_close')
	CloseBtn.onmouseover = function () {
		CloseBtn.style.border = '1px solid #666'
	}
	CloseBtn.onmouseout = function () {
		CloseBtn.style.border = '1px solid #a6a6a6'
	}
	$('#cj2_button')
		.off('click')
		.click(function () {
			//判断计时器是否为空
			if (ywCJ2Timer !== null) {
				clearInterval(ywCJ2Timer)
				ywCJ2Timer = null
			}
			// ywCJ2Timer = setInterval(getCJ2LiveList, 10000)
			getCJ2LiveList()
		})

	// 代理绑定函数
  $('#cj2_row_list').on('blur', 'input', function (e) {
    const val = e.target.value
    const oldtime = $(this).data('time')
    const date = dateFormat(new Date(oldtime), 'YYYY-MM-DD')
    const ssms = dateFormat(new Date(oldtime), 'ss.hs')
    $(this).data('time', `${date} ${val}:${ssms}`)
		// 时间校验正确才提交
		if (!val) return
		var index = $(this).data('id')
		CJ2SubmitUpdate(index)
	})
	$('#cj2_row_list').on('blur', 'textarea', function (e) {
		var index = $(this).data('id')
		CJ2SubmitUpdate(index)
  })
	$('#cj2_row_list').on('click', '.cj2_delete', function (e) {
		var liveRecordId = $(this).data('id')
		CJ2DeleteItem(liveRecordId)
	})
  
}
function openYwJJBox () {
  // 描述页面
  $('#yw_JJ_box').show()
  // 如果定时器存在就显示
  if (ywJJTimer) {
    $('#wrap_foot_descript').show()
    $('#wrap_btn_stop').show()
    $('#wrap_btn_default').hide()
  } else {
    $('#wrap_foot_descript').hide()
    $('#wrap_btn_stop').hide()
    $('#wrap_btn_default').show()
  }
  // 动效
  const BtnDefault = document.getElementById("wrap_btn_default")
  BtnDefault.onmouseover=function(){
    BtnDefault.style.backgroundColor="#096dd9";
  }
  BtnDefault.onmouseout=function(){
    BtnDefault.style.backgroundColor="#1890ff";
  }
  const BtnStop = document.getElementById("wrap_btn_stop")
  BtnStop.onmouseover=function(){
    BtnStop.color="#096dd9";
    BtnStop.style.border="1px solid #096dd9";
  }
  BtnStop.onmouseout=function(){
    BtnStop.style.color="#1890ff";
    BtnStop.style.border="1px solid #1890ff";
  }
  const CloseBtn = document.getElementById("wrap_close")
  CloseBtn.onmouseover=function(){
    CloseBtn.style.border="1px solid #666";
  }
  CloseBtn.onmouseout=function(){
    CloseBtn.style.border="1px solid #a6a6a6";
  }
  $('#wrap_btn_default').off('click').click(function () {
    //判断计时器是否为空
    if (ywJJTimer !== null) {
      clearInterval(ywJJTimer);
      ywJJTimer = null;
    }
    ywJJTimer = setInterval(getJJLiveExplainStart, 10000);
    getJJLiveExplainStart()
    setTimeout(() => {
      $('#yw_JJ_box').hide()
    }, 1000)
  })
}

const isDate = (value) => {
  let date = value;
  if (value instanceof Date) {
    date = value;
  } else if (
    typeof value === 'string' &&
    String(value).length >= 13 &&
    !isNaN(value)
  ) {
    date = Number(value);
  } else if (typeof value === 'string' && value.includes('-')) {
    date = value.replace(/-/g, '/');
  }
  return new Date(date) && String(new Date(date)) !== 'Invalid Date';
};
const dateFormat = (date, format) => {
  if (!isDate(date)) return null;
  // 时间格式化函数
  let time;
  if (!isNaN(date)) {
    date = Number(date);
  } else if (typeof date === 'string' && date.includes('-')) {
    date = date.replace(/-/g, '/');
  }
  time = new Date(date);
  const o = {
		YYYY: time.getFullYear(),
		YY: `${time.getFullYear()}`.slice(-2),
		MM: `0${time.getMonth() + 1}`.slice(-2),
		M: time.getMonth() + 1,
		DD: `0${time.getDate()}`.slice(-2),
		D: time.getDate(),
		HH: `0${time.getHours()}`.slice(-2),
		H: time.getHours(),
		hh: `0${time.getHours() % 12}`.slice(-2),
		h: time.getHours() % 12,
		mm: `0${time.getMinutes()}`.slice(-2),
		m: time.getMinutes(),
		ss: `0${time.getSeconds()}`.slice(-2),
		s: time.getSeconds(),
		hs: time.getMilliseconds(),
		w: (function () {
			return ['日', '一', '二', '三', '四', '五', '六'][time.getDay()]
		})(),
	}
  for (const k in o) {
    format = format.replace(k, o[k]);
  }
  return format;
};
/**
 * 获取场控数据
 * @param {*} isExplain 是否是点击开始讲解
 */
function getCJ2LiveList (isExplain = false) {
  const params = {
    isExplain,
		platformUserId: CJ2LiveListParams.platformUserId,
		livePlatformRoomInfoId: CJ2LiveListParams.livePlatformRoomInfoId,
		anchorNo: CJ2LiveListParams.anchorNo,
		platform: ENV === 'DY' ? 2 : 1,
		pageSize: -1,
		pageIndex: 1,
	}
	/* 创建 XMLHttpRequest 对象 */
	$.ajax({
		url: 'https://test-gateway.ywwl.com/ywwl-ksTools/tool/liveRecord/page',
		method: 'GET',
		data: params,
		headers: {
			'X-TOKEN': sessionStorage.getItem('dh_token'),
			'Content-type': 'application/json',
		},
		success: function (res) {
			if (
				res.success &&
				Array.isArray(res?.data?.list) &&
				res?.data?.list.length
			) {
				const list = res?.data?.list
				var selectItem = ''
				for (let i = 0; i < list.length; i++) {
					const item = list[i]
					selectItem += `<div class=cj2_row_item data-id="${i}" style="background:#fff;border-radius:2px;border:2px solid #d9d9d9;display:flex;justify-content:space-between;padding:12px 16px;margin-bottom:8px"><div class=cj2_left_part style=flex:1><div class=cj2_top style=display:flex;align-items:center><div class=cj2_number style=min-width:24px;height:24px;background:#1890ff;border-radius:2px;padding:5px;text-align:center;box-sizing:border-box;font-size:14px;font-weight:500;color:#fff;line-height:100%;margin-right:10px>${
						list.length - i
					}</div><div class=cj2_time_span style=display:flex;align-items:center;justify-content:space-around><div class=cj2_time_s><input type=time class=cj2_time_input_s data-id="${i}" data-time="${
						item?.explainStartTimeStr || ''
					}" data-liverecordid="${item.liveRecordId}" value="${
						isDate(item?.explainStartTimeStr)
							? dateFormat(item.explainStartTimeStr, 'HH:mm')
							: ''
					}" style="width:100px;height:32px;background:#fff;border-radius:2px;border:1px solid #d9d9d9;cursor:pointer" name=appt-time id="cj2_time_strat"></div><div class=cj2_time_line style="margin:0 4px;font-size:14px;font-weight:500;color:#333">-</div><div class=cj2_time_e><input type=time data-id="${i}" data-time="${
						item?.explainEndTimeStr || ''
					}" value="${
						isDate(item?.explainEndTimeStr)
							? dateFormat(item.explainEndTimeStr, 'HH:mm')
							: ''
					}" style="width:100px;height:32px;background:#fff;border-radius:2px;border:1px solid #d9d9d9;cursor:pointer" class=cj2_time_input_e id="cj2_time_end"></div></div></div><div class=cj2_other style=display:flex;align-items:center;margin-top:6px>${
						!item?.goodsName
							? `<img class=cj2_delete data-id="${item?.liveRecordId}" style=width:16px;height:16px;cursor:pointer;margin-right:18px src=https://cdn.ywwl.com/bps/timorobot/cj2_delete.png alt="删除">`
							: ''
					}<div id=cj2_detail_name style=width:230px;height:44px;line-height:1.5;font-size:14px;font-weight:500;color:#333;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;word-break:break-all>${
						item.goodsName || ''
					}</div></div></div><textarea rows=5 cols=5 data-id="${i}" class=cj2_right_part placeholder=备注 style=width:108px;height:80px;background:#f2f2f2;border-radius:2px;margin-left:16px;padding:8px;box-sizing:border-box>${
						item?.goodsRemark || ''
					}</textarea></div>`
				}
				$('#cj2_row_list').html(selectItem)
			} else {
				$('#cj2_row_list').html(
					`<div style="width: 100%;height: 100%;display: flex;align-items: center;justify-content: center;">暂无数据<div>`
				)
			}
		},
	})
}
  /**
   * 删除单条记录
   * @param {*} index 
   */
  function CJ2DeleteItem (liveRecordId) {
    const params = {
			liveRecordId,
		}
    $.ajax({
			url: 'https://test-gateway.ywwl.com/ywwl-ksTools/tool/liveRecord/delete',
			method: 'POST',
			data: JSON.stringify(params),
			headers: {
				'X-TOKEN': sessionStorage.getItem('dh_token'),
				'Content-type': 'application/json',
			},
			success: function (res) {
				if (res.success) {
					// alert('更新成功')
					getCJ2LiveList()
				} else {
					alert(res.msg)
				}
			},
		})
  }
/**
 * 场记每条记录更新拿当前一行最新数据提交
 *
 * @param {*} index
 */
function CJ2SubmitUpdate (index) {
  let params = {
		liveRecordId: $($('.cj2_time_input_s')[index]).data('liverecordid'),
		explainStartTimeStr: $($('.cj2_time_input_s')[index]).data('time'),
		explainEndTimeStr: $($('.cj2_time_input_e')[index]).data('time'),
		goodsRemark: $('.cj2_right_part')[index].value,
	}
  $.ajax({
		url: 'https://test-gateway.ywwl.com/ywwl-ksTools/tool/liveRecord/save',
		method: 'POST',
		data: JSON.stringify(params),
		headers: {
			'X-TOKEN': sessionStorage.getItem('dh_token'),
			'Content-type': 'application/json',
		},
		success: function (res) {
			if (res.success) {
				// alert('更新成功')
				getCJ2LiveList()
			} else {
				alert(res.msg)
			}
		},
	})
  // $('.')
}
  // 获取场控数据
function getJJLiveExplainStart() {
  /* 创建 XMLHttpRequest 对象 */
  ywJJLiveExplainInfo={}
  var httpRequest = new XMLHttpRequest()
  httpRequest.open('POST', 'https://test-gateway.ywwl.com/ywwl-ksTools/live/explain/start', true)
  httpRequest.setRequestHeader('Content-type', 'application/json')
  httpRequest.setRequestHeader('X-TOKEN', sessionStorage.getItem('dh_token'))
  httpRequest.send(JSON.stringify({
    anchorId: ywLiveStatusInfo.userNo,
    cookie: document.cookie,
    xtoken: sessionStorage.getItem('dh_dy_x_secsdk_csrf_token'),
  }));
  httpRequest.onreadystatechange = function () {
    if (httpRequest.readyState == 4 && httpRequest.status == 200) {
      var json = httpRequest.responseText;
      json = JSON.parse(json)
      if (json.success) {
        ywJJLiveExplainInfo = json.data || {};
        // console.log('data:', ywJJLiveExplainInfo);
      } else if (json.code == 1000 || json.code == 17020002) {
        sessionStorage.removeItem('dh_token')
        window.open(`https://yun-test.ywwl.com/login?redirectUrl=${window.location.href.indexOf('token') >= 0 ? window.location.href.split('?')[0] : window.location.href}`, '_self')
      } else {
        // alert(json.msg)
      }
      openJJReault()
    }
  }
}
function openJJReault () {
  $('#wrap_foot_descript').show()
  $('#wrap_btn_stop').show().off('click').click(function () {
    clearInterval(ywJJTimer)
    ywJJTimer = null
    $('#wrap_foot_descript').hide()
    $('#wrap_btn_default').show()
    $('#wrap_btn_stop').hide()
  })
  $('#wrap_btn_default').hide()
  $('#wrap_foot_descript_success').hide()
  $('#wrap_foot_descript_time').hide()
  $('#wrap_foot_descript_fail').hide()
  if (JSON.stringify(ywJJLiveExplainInfo) === "{}") {
    $('#wrap_foot_descript_fail').text('网络异常').show()
  } else {
    $('#wrap_foot_descript_time').text(`${ywJJLiveExplainInfo && ywJJLiveExplainInfo.createAt ? ywJJLiveExplainInfo.createAt : ''}`).show()
    if (ywJJLiveExplainInfo.resultCode ==='success') {
      $('#wrap_foot_descript_success').text(`${ywJJLiveExplainInfo && ywJJLiveExplainInfo.resultMsg ? ywJJLiveExplainInfo.resultMsg : '点击成功'}`).show()
    } else {
      $('#wrap_foot_descript_fail').text(`${ywJJLiveExplainInfo && ywJJLiveExplainInfo.resultMsg ? ywJJLiveExplainInfo.resultMsg : '点击失败'}`).show()
    }
  }
}
function openYwCjBox(type) {
  ywCjAddGoodInputValue = ''
  ywCjAddMsgInputValue = ''
  document.getElementById('yw_cj_box_add_input').value = ''
  document.getElementById('yw_cj_box_info_add_input').value = ''
  document.getElementById('yw_cj_box').style.display = type ? 'block' : 'none'
  // 开始讲解、结束讲解
  if (type) {
    getCjGoodLists()
    getCjMsgLists()
  }
}
function addZbItem(e) {
  $('.addZbBtn').off('click').click(function() {
    ywQuotaZbLists.push({
      quotaCondition: '',
      quotaSymbol: '',
      quotaValue: '',
      remindMsg: '',
      remindTimesPerhour: 0,
      quotaStatus: 1,
    })
    setCKDomLists()
  })
}
function openYwCkBox(type) {
  document.getElementById('yw_ck_box').style.display = type ? 'block' : 'none'
  if (type) {
    // 请求数据
    getCKLists()
  }
}
// 更新商品讲解
function upDateYwGood(id, type) {
  /* 创建 XMLHttpRequest 对象 */
  var httpRequest = new XMLHttpRequest()
  httpRequest.open('POST', 'https://test-gateway.ywwl.com/ywwl-dianhu-oper/api/zhibo/fieldcontrol/goods/setTime', true)
  httpRequest.setRequestHeader('Content-type', 'application/json')
  httpRequest.setRequestHeader('X-TOKEN', sessionStorage.getItem('dh_token'))
  httpRequest.send(JSON.stringify({
    anchorNo: ywLiveStatusInfo.userNo,
    goodsId: id,
    type,
  }));
  httpRequest.onreadystatechange = function () {
    if (httpRequest.readyState == 4 && httpRequest.status == 200) {
      var json = httpRequest.responseText;
      json = JSON.parse(json)
      if (json.success) {
        // 更新场记
        getCjGoodLists()
      } else if (json.code == 1000 || json.code == 17020002) {
        sessionStorage.removeItem('dh_token')
        window.open(`https://yun-test.ywwl.com/login?redirectUrl=${window.location.href.indexOf('token') >= 0 ? window.location.href.split('?')[0] : window.location.href}`, '_self')
      } else {
        alert(json.msg)
      }
    }
  }
}
// 新增自定义商品
function addYwGoodCj() {
  /* 创建 XMLHttpRequest 对象 */
  var httpRequest = new XMLHttpRequest()
  httpRequest.open('POST', 'https://test-gateway.ywwl.com/ywwl-dianhu-oper/api/zhibo/fieldcontrol/goods/add', true)
  httpRequest.setRequestHeader('Content-type', 'application/json')
  httpRequest.setRequestHeader('X-TOKEN', sessionStorage.getItem('dh_token'))
  httpRequest.send(JSON.stringify({
    anchorNo: ywLiveStatusInfo.userNo,
    goodsName: ywCjAddGoodInputValue,
  }));
  httpRequest.onreadystatechange = function () {
    if (httpRequest.readyState == 4 && httpRequest.status == 200) {
      var json = httpRequest.responseText;
      json = JSON.parse(json)
      if (json.success) {
        ywCjAddGoodInputValue = ''
        document.getElementById('yw_cj_box_add_input').value = ''
        getCjGoodLists()
      } else if (json.code == 1000 || json.code == 17020002) {
        sessionStorage.removeItem('dh_token')
        window.open(`https://yun-test.ywwl.com/login?redirectUrl=${window.location.href.indexOf('token') >= 0 ? window.location.href.split('?')[0] : window.location.href}`, '_self')
      } else {
        alert(json.msg)
      }
    }
  }
}
// 新增场记消息
function addYwCjMsg() {
  /* 创建 XMLHttpRequest 对象 */
  var httpRequest = new XMLHttpRequest()
  httpRequest.open('POST', 'https://test-gateway.ywwl.com/ywwl-dianhu-oper/api/zhibo/fieldcontrol/event/add', true)
  httpRequest.setRequestHeader('Content-type', 'application/json')
  httpRequest.setRequestHeader('X-TOKEN', sessionStorage.getItem('dh_token'))
  httpRequest.send(JSON.stringify({
    anchorNo: ywLiveStatusInfo.userNo,
    eventContent: ywCjAddMsgInputValue,
  }));
  httpRequest.onreadystatechange = function () {
    if (httpRequest.readyState == 4 && httpRequest.status == 200) {
      var json = httpRequest.responseText;
      json = JSON.parse(json)
      if (json.success) {
        ywCjAddMsgInputValue = ''
        document.getElementById('yw_cj_box_info_add_input').value = ''
        getCjMsgLists()
      } else if (json.code == 1000 || json.code == 17020002) {
        sessionStorage.removeItem('dh_token')
        window.open(`https://yun-test.ywwl.com/login?redirectUrl=${window.location.href.indexOf('token') >= 0 ? window.location.href.split('?')[0] : window.location.href}`, '_self')
      } else {
        alert(json.msg)
      }
    }
  }
}
// 获取场控数据
function getCKLists() {
  /* 创建 XMLHttpRequest 对象 */
  var httpRequest = new XMLHttpRequest()
  httpRequest.open('GET', `https://test-gateway.ywwl.com/ywwl-dianhu-oper/api/zhibo/fieldcontrol/quota/list?anchorNo=${ywLiveStatusInfo.userNo}`, true)
  httpRequest.setRequestHeader('Content-type', 'application/json')
  httpRequest.setRequestHeader('X-TOKEN', sessionStorage.getItem('dh_token'))
  httpRequest.send();
  httpRequest.onreadystatechange = function () {
    if (httpRequest.readyState == 4 && httpRequest.status == 200) {
      var json = httpRequest.responseText;
      json = JSON.parse(json)
      if (json.success) {
        ywQuotaZbLists = json.data.list
        setCKDomLists()
      } else if (json.code == 1000 || json.code == 17020002) {
        sessionStorage.removeItem('dh_token')
        window.open(`https://yun-test.ywwl.com/login?redirectUrl=${window.location.href.indexOf('token') >= 0 ? window.location.href.split('?')[0] : window.location.href}`, '_self')
      } else {
        alert(json.msg)
      }
    }
  }
}
function changeCondition(e) {
  $('.quotaConditionSelect').off('change').change(function() {
    var val = $(this).val()
    var attr = $(this).attr('indexKey')
    if (val !== ywQuotaZbLists[Number(attr)].quotaCondition) {
      ywQuotaZbLists[Number(attr)].quotaCondition = val
      ywQuotaZbLists[Number(attr)].quotaSymbol = ''
      ywQuotaZbLists[Number(attr)].quotaValue = ''
      setCKDomLists()
    }
  })
}
function changeSymbolSelect(e) {
  $('.quotaSymbolSelect').off('change').change(function() {
    var val = $(this).val()
    var attr = $(this).attr('indexKey')
    ywQuotaZbLists[Number(attr)].quotaSymbol = val
    $('.quotaValueCompany')[Number(attr)].innerText = val === '增长' || val === '下降' ? '%' : '';
  })
}
function changeSymbolValue(e) {
  $('.quotaValue').off('on').on('input', function() {
    var val = $(this).val()
    var attr = $(this).attr('indexKey')
    ywQuotaZbLists[Number(attr)].quotaValue = val
  })
}
function changeRemindMsgValue(e) {
  $('.remindMsg').off('on').on('input', function() {
    var val = $(this).val()
    var attr = $(this).attr('indexKey')
    ywQuotaZbLists[Number(attr)].remindMsg = val
  })
}
function changeRemindTimesPerhour(e) {
  $('.remindTimesPerhour').off('on').on('input', function() {
    var val = $(this).val()
    var attr = $(this).attr('indexKey')
    console.log('val =>', val, val.replace(/^(0+)|[^\d]+/g, ''))
    ywQuotaZbLists[Number(attr)].remindTimesPerhour = val.replace(/^(0+)|[^\d]+/g, '')
    $('.remindTimesPerhour')[Number(attr)].value = val.replace(/^(0+)|[^\d]+/g, '')
    $('.remindLimitBtn')[Number(attr)].checked = val.replace(/^(0+)|[^\d]+/g, '') ? false : true
  })
}
function changeRemindLimitBtn(e) {
  $('.remindLimitBtn').off('change').change(function() {
    var attr = $(this).attr('indexKey')
    ywQuotaZbLists[Number(attr)].remindTimesPerhour = 0
    $('.remindTimesPerhour')[Number(attr)].value = ''
  })
}
function quotaSymbolZbDelete(e) {
  $('.quotaSymbolZbDelete').off('click').click(function() {
    var attr = $(this).attr('indexKey')
    if (ywQuotaZbLists[Number(attr)].quotaId) {
      sendSampleSymbolZbDelete(ywQuotaZbLists[Number(attr)].quotaId, Number(attr))
    } else {
      ywQuotaZbLists.splice(Number(attr), 1);
      setCKDomLists()
    }
  })
}
function sendSampleSymbolZbDelete(id, index) {
  /* 创建 XMLHttpRequest 对象 */
  var httpRequest = new XMLHttpRequest()
  httpRequest.open('GET', `https://test-gateway.ywwl.com/ywwl-dianhu-oper/api/zhibo/fieldcontrol/quota/delete?quotaId=${id}`, true)
  httpRequest.setRequestHeader('Content-type', 'application/json')
  httpRequest.setRequestHeader('X-TOKEN', sessionStorage.getItem('dh_token'))
  httpRequest.send();
  httpRequest.onreadystatechange = function () {
    if (httpRequest.readyState == 4 && httpRequest.status == 200) {
      var json = httpRequest.responseText;
      json = JSON.parse(json)
      if (json.success) {
        ywQuotaZbLists.splice(index, 1);
        setCKDomLists()
      } else if (json.code == 1000 || json.code == 17020002) {
        sessionStorage.removeItem('dh_token')
        window.open(`https://yun-test.ywwl.com/login?redirectUrl=${window.location.href.indexOf('token') >= 0 ? window.location.href.split('?')[0] : window.location.href}`, '_self')
      } else {
        alert(json.msg)
      }
    }
  }
}
function changeQuotaStatus(e) {
  $('.quotaStatusBtn').off('click').click(function() {
    var attr = $(this).attr('indexKey')
    if (ywQuotaZbLists[Number(attr)].quotaId) {
      sendQuotaStatus(ywQuotaZbLists[Number(attr)].quotaId, Number(attr))
    } else {
      ywQuotaZbLists[Number(attr)].quotaStatus = ywQuotaZbLists[Number(attr)].quotaStatus == 1 ? 0 : 1;
      setCKDomLists()
    }
  })
}
function sendQuotaStatus(id, index) {
  /* 创建 XMLHttpRequest 对象 */
  var httpRequest = new XMLHttpRequest()
  httpRequest.open('GET', `https://test-gateway.ywwl.com/ywwl-dianhu-oper/api/zhibo/fieldcontrol/quota/setStatus?quotaId=${id}`, true)
  httpRequest.setRequestHeader('Content-type', 'application/json')
  httpRequest.setRequestHeader('X-TOKEN', sessionStorage.getItem('dh_token'))
  httpRequest.send();
  httpRequest.onreadystatechange = function () {
    if (httpRequest.readyState == 4 && httpRequest.status == 200) {
      var json = httpRequest.responseText;
      json = JSON.parse(json)
      if (json.success) {
        ywQuotaZbLists[index].quotaStatus = json.data.quotaStatus
        setCKDomLists()
      } else if (json.code == 1000 || json.code == 17020002) {
        sessionStorage.removeItem('dh_token')
        window.open(`https://yun-test.ywwl.com/login?redirectUrl=${window.location.href.indexOf('token') >= 0 ? window.location.href.split('?')[0] : window.location.href}`, '_self')
      } else {
        alert(json.msg)
      }
    }
  }
}
function sendquotaSymbolZbList(e) {
  $('.sendquotaSymbolZbList').off('click').click(function() {
    ywQuotaZbLists.forEach((ele) => {
      ele.anchorNo = ywLiveStatusInfo.userNo
      ele.remindTimesPerhour = ele.remindTimesPerhour ? ele.remindTimesPerhour : 0
    })
    /* 创建 XMLHttpRequest 对象 */
    var httpRequest = new XMLHttpRequest()
    httpRequest.open('POST', 'https://test-gateway.ywwl.com/ywwl-dianhu-oper/api/zhibo/fieldcontrol/quota/saveBatch', true)
    httpRequest.setRequestHeader('Content-type', 'application/json')
    httpRequest.setRequestHeader('X-TOKEN', sessionStorage.getItem('dh_token'))
    httpRequest.send(JSON.stringify({
      list: ywQuotaZbLists,
    }));
    httpRequest.onreadystatechange = function () {
      if (httpRequest.readyState == 4 && httpRequest.status == 200) {
        var json = httpRequest.responseText;
        json = JSON.parse(json)
        if (json.success) {
          getCKLists()
        } else if (json.code == 1000 || json.code == 17020002) {
          sessionStorage.removeItem('dh_token')
          window.open(`https://yun-test.ywwl.com/login?redirectUrl=${window.location.href.indexOf('token') >= 0 ? window.location.href.split('?')[0] : window.location.href}`, '_self')
        } else {
          alert(json.msg)
        }
      }
    }
  })
}
function cancelquotaSymbolZbList(e) {
  $('.cancelquotaSymbolZbList').off('click').click(function() {
    getCKLists()
  })
}
function setCKDomLists() {
  // ywQuotaSelectLists
  // ywQuotaZbLists
  var yw_ck_box_lists = document.getElementById('yw_ck_box_lists')
  var ckItems = ''
  ywQuotaZbLists.forEach((zbEle, index) => {
    var ckItem = `<form><div class="yw_ck_box_item" style="padding: 10px;background: ${index%2 === 0 ? '#fff' : 'transparent'};"><div style="margin-bottom:10px;padding:10px 0;border-bottom:1px solid #e7e7e7;"><span style="font-weight:bold;">配置${index + 1}</span><span style="float:right;"><span class="quotaStatusBtn" style="position:relative;display:inline-block;width:42px;height:22px;border-radius:30px;background: ${zbEle.quotaStatus == 1 ? '#0676ed' : '#ccc'};margin-right: 20px;color: transparent;cursor:pointer;" indexKey="${index}">${zbEle.quotaStatus == 1 ? '可用' : '禁用'}<span style="position:absolute;top:0;width:22px;height:22px;border-radius:50%;background:#fff;left:${zbEle.quotaStatus == 1 ? '0px' : '20px'};"></span></span><img src="https://yw-yx.oss-cn-hangzhou.aliyuncs.com/lanhai/Shape%402x.png?v=2" style="display:inline-block;width:20px;height:20px;text-align:center;cursor:pointer;margin-top:-6px;" class="quotaSymbolZbDelete" indexKey="${index}" /></span></div><div>选择条件：<select style="width:150px;height:30px;margin-right: 5px;border: 1px solid #c0c0c0;border-radius: 4px;" class="quotaConditionSelect" indexKey="${index}"><option value="" style="display:none;"></option>`
    ywQuotaSelectLists.forEach((ele) => {
      if (ele.quotaCondition === zbEle.quotaCondition) {
        ckItem += `<option value="${ele.quotaCondition}" selected>${ele.quotaCondition}</option>`
      } else {
        ckItem += `<option value="${ele.quotaCondition}">${ele.quotaCondition}</option>`
      }
    })
    ckItem += `</select><select style="width:50px;height:30px;margin-right: 5px;border: 1px solid #c0c0c0;border-radius: 4px;" class="quotaSymbolSelect" indexKey="${index}"><option value="" style="display:none;"></option>`
    if (zbEle.quotaCondition) {
      ywQuotaSelectLists.filter(item => item.quotaCondition === zbEle.quotaCondition)[0].quotaSymbolList.forEach((symbolEle) => {
        if (symbolEle === zbEle.quotaSymbol) {
          ckItem += `<option value="${symbolEle}" selected>${symbolEle}</option>`
        } else {
          ckItem += `<option value="${symbolEle}">${symbolEle}</option>`
        }
      })
    }

    ckItem += `</select><input style="width:120px;height:30px;border: 1px solid #c0c0c0;border-radius: 4px;" class="quotaValue" indexKey="${index}" value="${zbEle.quotaValue}"/><span class="quotaValueCompany" style="margin-left:5px;">${zbEle.quotaSymbol === '增长' || zbEle.quotaSymbol === '下降' ? '%' : ''}</span><span></span></div><div style="margin-top:10px;">提醒语：<textarea style="vertical-align:top;margin-left:14px;border: 1px solid #c0c0c0;border-radius: 4px;width:330px;" rows="3" cols="52" class="remindMsg" indexKey="${index}">${zbEle.remindMsg}</textarea></div><div style="margin-top:10px;">提醒频率：每小时 ≤ <input style="width: 50px;margin-right:10px;border: 1px solid #c0c0c0;border-radius: 4px;margin-left:5px;" class="remindTimesPerhour" type="number" value="${zbEle.remindTimesPerhour || ''}" indexKey="${index}"/>`
    if (!zbEle.remindTimesPerhour) {
      ckItem += `<input type="checkbox" style="vertical-align: middle;margin-right:5px;" checked indexKey="${index}" class="remindLimitBtn">`
    } else {
      ckItem += `<input type="checkbox" style="vertical-align: middle;margin-right:5px;margin-top:-1px;" indexKey="${index}" class="remindLimitBtn">`
    }
    ckItem += `不限制</div></div></form>`
    ckItems += ckItem
  })
  var addItem = '<div class="addZbBtn" style="position:absolute;width:320px;bottom:49px;left:0;cursor:pointer;color:#fff;width:100%;height:40px;line-height:40px;background:#5856d6;text-align:center;margin-top:35px;">新增配置</div>'
  yw_ck_box_lists.innerHTML = ckItems + addItem
  changeCondition()
  changeSymbolSelect()
  changeSymbolValue()
  changeRemindMsgValue()
  changeRemindTimesPerhour()
  quotaSymbolZbDelete()
  changeQuotaStatus()
  changeRemindLimitBtn()
  // 场控新增配置
  addZbItem()
}
// 主播状态
function getYwLiveStatus() {
  /* 创建 XMLHttpRequest 对象 */
  var httpRequest = new XMLHttpRequest()
  httpRequest.open('GET', 'https://test-gateway.ywwl.com/ywwl-dianhu-oper/api/zhibo/fieldcontrol/zhubo/info', true)
  httpRequest.setRequestHeader('Content-type', 'application/json')
  httpRequest.setRequestHeader('X-TOKEN', sessionStorage.getItem('dh_token'))
  httpRequest.send();
  httpRequest.onreadystatechange = function () {
    if (httpRequest.readyState == 4 && httpRequest.status == 200) {
      var json = httpRequest.responseText;
      json = JSON.parse(json)
      if (json.success) {
        ywLiveStatusInfo = json.data
        if (ywLiveStatusInfo.userNo) {
          $('#yw_btn_main').css('borderRadius', '0 6px 6px 0')
          ywBtnVis = !ywBtnVis
          openCjCkBtn(ywBtnVis)
          // return new Promise((resolve, reject) => {
          //     resolve(ywLiveStatusInfo)
          // });
          // return new Promise(function(resolve, reject) {
          //   if (json.success){}
          //   return resolve(ywLiveStatusInfo)
          // });
        } else {
          alert('暂未绑定主播，无法使用场控、场记功能!')
        }
      } else if (json.code == 1000 || json.code == 17020002) {
        sessionStorage.removeItem('dh_token')
        window.open(`https://yun-test.ywwl.com/login?redirectUrl=${window.location.href.indexOf('token') >= 0 ? window.location.href.split('?')[0] : window.location.href}`, '_self')
      } else {
        alert(json.msg)
      }
    }
  };
}
// 指标数据
function getYwQuotaSelectList() {
  /* 创建 XMLHttpRequest 对象 */
  var httpRequest = new XMLHttpRequest()
  httpRequest.open('GET', 'https://test-gateway.ywwl.com/ywwl-dianhu-oper/api/zhibo/fieldcontrol/quota/selectList', true)
  httpRequest.setRequestHeader('Content-type', 'application/json')
  httpRequest.setRequestHeader('X-TOKEN', sessionStorage.getItem('dh_token'))
  httpRequest.send();
  httpRequest.onreadystatechange = function () {
    if (httpRequest.readyState == 4 && httpRequest.status == 200) {
      var json = httpRequest.responseText;
      json = JSON.parse(json)
      if (json.success) {
        ywQuotaSelectLists = json.data.list || []
      } else if (json.code == 1000 || json.code == 17020002) {
        sessionStorage.removeItem('dh_token')
        window.open(`https://yun-test.ywwl.com/login?redirectUrl=${window.location.href.indexOf('token') >= 0 ? window.location.href.split('?')[0] : window.location.href}`, '_self')
      } else {
        alert(json.msg)
      }
    }
  };
}
function ywCjHandleInit() {
  // 输入框事件
  $('#yw_cj_box_add_input').off('on').on('input', function() {
    var val = $(this).val()
    ywCjAddGoodInputValue = val
  })
  $('#yw_cj_box_info_add_input').off('on').on('input', function() {
    var val = $(this).val()
    ywCjAddMsgInputValue = val
  })
  // 场记分类按钮
  $('#yw_cj_box_goodjs').off('click').click(() => {
    // 跟新场记
    getCjGoodLists()
    document.getElementById('yw_cj_box_good_lists').style.display = 'block'
    document.getElementById('yw_cj_box_diy_lists').style.display = 'none'
    document.getElementById('yw_cj_box_diy_good_add').style.display = 'block'
    document.getElementById('yw_cj_box_info_add').style.display = 'none'
    document.getElementById('yw_cj_box_goodjs').style.color = '#061058'
    document.getElementById('yw_cj_box_goodjs').style.borderRadius = '12px 12px 0px 0px'
    document.getElementById('yw_cj_box_goodjs').style.background = '#f8f8f8'
    document.getElementById('yw_cj_box_gooddiy').style.color = '#D9F8FF'
    document.getElementById('yw_cj_box_gooddiy').style.borderRadius = '12px 12px 0px 0px'
    document.getElementById('yw_cj_box_gooddiy').style.background = 'transparent'
  })
  $('#yw_cj_box_gooddiy').off('click').click(() => {
    // 跟新diy场记
    getCjMsgLists()
    document.getElementById('yw_cj_box_good_lists').style.display = 'none'
    document.getElementById('yw_cj_box_diy_lists').style.display = 'block'
    document.getElementById('yw_cj_box_diy_good_add').style.display = 'none'
    document.getElementById('yw_cj_box_info_add').style.display = 'block'
    document.getElementById('yw_cj_box_gooddiy').style.color = '#061058'
    document.getElementById('yw_cj_box_gooddiy').style.borderRadius = '12px 12px 0px 0px'
    document.getElementById('yw_cj_box_gooddiy').style.background = '#f8f8f8'
    document.getElementById('yw_cj_box_goodjs').style.color = '#D9F8FF'
    document.getElementById('yw_cj_box_goodjs').style.borderRadius = '12px 12px 0px 0px'
    document.getElementById('yw_cj_box_goodjs').style.background = 'transparent'
  })
  sendquotaSymbolZbList()
  cancelquotaSymbolZbList()
}
// 创建YW工具
function createdYwTools () {
  var yw_Btn = document.createElement("div");
  yw_Btn.setAttribute("id", "yw_btn");
  yw_Btn.style.position = 'fixed';
  yw_Btn.style.zIndex = '9999';
  yw_Btn.style.bottom = '215px';
  yw_Btn.style.right = '8px';
  yw_Btn.style.width = '40px';
  // 主按钮
  var mainBtn = document.createElement("div");
  mainBtn.setAttribute("id", "yw_btn_main");
  mainBtn.innerHTML = "<img src='https://yw-yx.oss-cn-hangzhou.aliyuncs.com/lanhai/tubiaochajian%402x.png' style='width:25px;' />"
  mainBtn.style.width = '40px';
  mainBtn.style.height = '40px';
  mainBtn.style.color = '#fff';
  mainBtn.style.textAlign = 'center';
  mainBtn.style.marginBottom = '5px';
  mainBtn.style.lineHeight = '36px';
  mainBtn.style.background = '#0676ED';
  mainBtn.style.borderRadius = '6px';
  mainBtn.style.cursor = 'pointer';
  // 场记
  var cjBtn = document.createElement("div");
  cjBtn.setAttribute("id", "yw_btn_cj2");
  cjBtn.innerHTML = "场记"
  cjBtn.style.position = 'absolute';
  cjBtn.style.left = '-144px';
  cjBtn.style.top = '0px';
  cjBtn.style.height = '40px';
  cjBtn.style.lineHeight = '40px';
  cjBtn.style.color = '#FFF';
  cjBtn.style.background = '#4A99EC';
  cjBtn.style.textAlign = 'center';
  cjBtn.style.cursor = 'pointer';
  cjBtn.style.alignItems = 'center';
  cjBtn.style.justifyContent = 'center';
  cjBtn.style.display = 'none';
  cjBtn.style.padding = '0px 15px';
  cjBtn.style.overflow = 'hidden';
  // 场控
  var ckBtn = document.createElement("div");
  ckBtn.setAttribute("id", "yw_btn_ck");
  ckBtn.innerHTML = "直播场控"
  ckBtn.style.position = 'absolute';
  ckBtn.style.left = '-86px';
  ckBtn.style.top = '0px';
  ckBtn.style.height = '40px';
  ckBtn.style.lineHeight = '40px';
  ckBtn.style.color = '#FFF';
  ckBtn.style.background = '#4A99EC';
  ckBtn.style.textAlign = 'center';
  ckBtn.style.cursor = 'pointer';
  ckBtn.style.alignItems = 'center';
  ckBtn.style.justifyContent = 'center';
  ckBtn.style.display = 'none';
  ckBtn.style.padding = '0px 15px';
  ckBtn.style.overflow = 'hidden';
  // 讲解
  var jjBtn = document.createElement("div");
  jjBtn.setAttribute("id", "yw_btn_jj");
  jjBtn.innerHTML = "点讲解"
  jjBtn.style.position = 'absolute';
  jjBtn.style.left = '-285px';
  jjBtn.style.top = '0px';
  jjBtn.style.height = '40px';
  jjBtn.style.lineHeight = '40px';
  jjBtn.style.color = '#FFF';
  jjBtn.style.background = '#4A99EC';
  jjBtn.style.textAlign = 'center';
  jjBtn.style.cursor = 'pointer';
  jjBtn.style.alignItems = 'center';
  jjBtn.style.justifyContent = 'center';
  jjBtn.style.display = 'none';
  jjBtn.style.padding = '0px 15px';
  jjBtn.style.overflow = 'hidden';
  // 发弹幕
  var barrageBtn = document.createElement("div");
  barrageBtn.setAttribute("id", "yw_btn_barrage");
  barrageBtn.innerHTML = "发弹幕"
  barrageBtn.style.position = 'absolute';
  barrageBtn.style.left = '-215px';
  barrageBtn.style.top = '0px';
  barrageBtn.style.height = '40px';
  barrageBtn.style.lineHeight = '40px';
  barrageBtn.style.color = '#FFF';
  barrageBtn.style.background = '#4A99EC';
  barrageBtn.style.textAlign = 'center';
  barrageBtn.style.cursor = 'pointer';
  barrageBtn.style.alignItems = 'center';
  barrageBtn.style.justifyContent = 'center';
  barrageBtn.style.display = 'none';
  barrageBtn.style.padding = '0px 15px';
  barrageBtn.style.overflow = 'hidden';
  // 选择框js
  var searchableSelectJs = document.createElement('script');
  searchableSelectJs.type = "text/javascript";
  searchableSelectJs.src = 'https://cdn.ywwl.com/bps/v5/upload/jquery.searchableSelect.js?v=' + (new Date().getTime());
  document.getElementsByTagName('head')[0].appendChild(searchableSelectJs);
  // 选择框css
  var searchableSelectCss = document.createElement('link');
  searchableSelectCss.type = 'text/css';
  searchableSelectCss.rel = 'stylesheet';
  searchableSelectCss.href = 'https://cdn.ywwl.com/bps/v5/upload/jquery.searchableSelect.css?v=' + (new Date().getTime());
  document.getElementsByTagName('head')[0].appendChild(searchableSelectCss);
  // 弹幕容器
  var barrageBox = document.createElement("div");
  barrageBox.setAttribute("id", "yw_barrage_box");
  barrageBox.setAttribute("style", "display:none;box-sizing:border-box;width:368px;padding:20px;position:fixed;top:20%;left:44%;z-index:1000;background-color:#fff;box-shadow:0 1px 5px 0 rgba(38,38,38,0.1);border-radius:4px;border:1px solid #F2F2F2;");
  barrageBox.innerHTML = "<div style='display: flex;justify-content: space-between;font-weight: 600;font-size: 20px;color: #333;margin-bottom: 20px;'><span>弹幕工具</span><div id='wrap_close' class='wrap_close' style='width: 16px;	height: 16px;	border-radius: 2px;border: 1px solid #a6a6a6;				display: flex;justify-content: center;align-items: center;cursor: pointer;'><div class='content' style='width: 8px; border: 1px solid #a6a6a6'></div></div></div><textarea id='barrageComments' autocomplete='off' style='width: 320px;height: 70px; padding: 5px;border-radius: 2px;border: 1px solid #D9D9D9;border-bottom: none;outline: none;' placeholder='请输入弹幕...' rows='4'></textarea><div style='display: flex;justify-content: space-around;align-items: center;width: 320px;position: relative;bottom: 5px;border: 1px solid #D9D9D9; border-top: none;color: #1890FF;height: 32px;line-height: 32px;font-size: 14px;'><div style='cursor: pointer;' id='chooseBarrage'>请选择素材</div><span class='barrage-divider'>|</span><div style='cursor: pointer;' id='barrage-add-item'>添加为素材</div></div><div id='segment'></div><div style='color: #666;font-size: 14px;'><div style='margin-top: 10px;'><input name='barrageStaySend' type='checkbox' id='barrageStaySend'><label style='margin-left:5px;' for='barrageStaySend'>持续发送</label></div><div style='margin-top: 10px;'>持续时长</div><div><input maxlength='2' style='width: 104px;height: 30px;line-height: 30px;padding: 5px;border-radius: 2px;border: 1px solid #D9D9D9;margin-top: 10px;outline: none;' id='barrageDuration' /><span>分钟</span><span>&nbsp;&nbsp;1~60分钟</span></div><div style='margin-top: 10px;'>使用账号数</div><div><input style='width: 104px;height: 30px;line-height: 30px; padding: 5px;border-radius: 2px;border: 1px solid #D9D9D9;margin-top: 10px;outline: none;' id='barrageSelectNum' /></div></div><div id='barrage-action'></div><div id='barrage-message'></div>";

  // 场记容器
  var cjBox = document.createElement("div");
  cjBox.setAttribute("id", "yw_cj_box");
  cjBox.innerHTML = "<p id='yw_cj_box_title' style='padding:35px 40px 75px;color: #fff;background:#0676ED;font-size:17px;position:relative;'><img src='https://yw-yx.oss-cn-hangzhou.aliyuncs.com/lanhai/Group3%402x.png' style='width:175px;' /><img src='https://yw-yx.oss-cn-hangzhou.aliyuncs.com/lanhai/guanji%402x.png' style='position:absolute;width:20px;height:20px;cursor:pointer;right:20px;top:40px;' class='closeCj' /></p><div style='position:absolute;top:101px;left:0;'><span id='yw_cj_box_goodjs' style='display:inline-block;width:141px;height:36px;line-height:36px;background: #f8f8f8;border-radius: 12px 12px 0px 0px;cursor:pointer;text-align:center;color:#061058;font-size:12px;font-weight:bold;'>商品计时</span><span id='yw_cj_box_gooddiy' style='display:inline-block;width:141px;height:36px;line-height:36px;color:#D9F8FF;cursor:pointer;text-align:center;font-size:12px;font-weight:bold;'>自定义</span></div><div style='padding:15px 40px;'><div style='color:#fff;padding: 0 10px;background:#0676ED;border-radius:8px;line-height:32px;box-shadow:rgb(121 121 121 / 10%) 0px 0px 7px 7px;'>场记记录在“大数据平台-直播数据-场记”报表查看</div></div><div id='yw_cj_box_good_lists' style='height: 300px;overflow-y: auto;overFlow:auto;margin: 0 40px;scrollbar-width: none;'></div><div id='yw_cj_box_diy_lists' style='height: 300px;overflow-y: auto;overFlow:auto;margin: 0 40px;display:none;scrollbar-width: none;'></div><div id='yw_cj_box_diy_good_add' style='padding: 10px 40px;background:linear-gradient(180deg, #F0F0F6 0%, #FFFFFF 100%);'><input id='yw_cj_box_add_input' style='margin-right: 20px;width: 318px;border:none;background-color: transparent;' placeholder='输入自定义商品名称，添加到最下方'/><span id='yw_cj_box_diy_good_add_btn' style='display:inline-block;width:62px;height:28px;line-height:28px;text-align:center;color:#fff;background: #00C9A7;cursor:pointer;font-size: 12px;border-radius:4px;'><img src='https://yw-yx.oss-cn-hangzhou.aliyuncs.com/lanhai/Shape%402x2.png' style='width:12px;margin-right:3px;margin-top:-3px;' />添加</span></div><div id='yw_cj_box_info_add' style='display:none;padding: 10px 40px;background:linear-gradient(180deg, #F0F0F6 0%, #FFFFFF 100%);'><input id='yw_cj_box_info_add_input' style='margin-right: 20px;width: 318px;border:none;background-color: transparent;' placeholder='请输入内容，不超过50个字' /><span id='yw_cj_box_info_add_btn' style='display:inline-block;width:62px;height:28px;line-height:28px;text-align:center;color:#fff;background: #00C9A7;cursor:pointer;font-size: 12px;border-radius:4px;'><img src='https://yw-yx.oss-cn-hangzhou.aliyuncs.com/lanhai/tijiao%402x.png' style='width:12px;margin-right:3px;margin-top:-3px;' />添加</span></div>"
  cjBox.style.position = 'fixed';
  cjBox.style.top = '75px';
  cjBox.style.right = '290px';
  cjBox.style.width = '480px';
  cjBox.style.background = 'linear-gradient(180deg, #F0F0F6 0%, #FFFFFF 100%';
  cjBox.style.display = 'none';
  cjBox.style.boxShadow = 'rgb(121 121 121 / 10%) 0px 0px 10px 10px';
  // 场控容器
  var ckBox = document.createElement("div");
  ckBox.setAttribute("id", "yw_ck_box");
  ckBox.innerHTML = "<p id='yw_ck_box_title' style='padding:35px 40px 35px;color: #fff;background:#5856d6;font-size:17px;position:relative;'><img src='https://yw-yx.oss-cn-hangzhou.aliyuncs.com/lanhai/Group3%402x.png' style='width:175px;' /><img src='https://yw-yx.oss-cn-hangzhou.aliyuncs.com/lanhai/guanji%402x.png' style='position:absolute;width:20px;height:20px;cursor:pointer;right:20px;top:40px;' class='closeCk' /></p><div id='yw_ck_box_lists' style='height: 300px;overflow-y: auto;padding: 20px 15px;scrollbar-width: none;'></div><div id='yw_ck_box_diy_good_add' style='padding:52px 0 10px;text-align:center;'><div style='display:inline-block;'><span id='yw_ck_box_cancel_btn' style='display:inline-block;width:90px;height:27px;line-height:27px;text-align:center;border-radius:4px;color:#fff;background: #ccc;cursor:pointer;margin-right:20px;' class='cancelquotaSymbolZbList'>取消</span><span id='yw_ck_box_save_btn' style='display:inline-block;width:90px;height:27px;line-height:27px;text-align:center;border-radius:4px;color:#fff;background: #5856d6;cursor:pointer;' class='sendquotaSymbolZbList'>保存</span></div></div>"
  ckBox.style.position = 'fixed';
  ckBox.style.top = '75px';
  ckBox.style.right = '290px';
  ckBox.style.width = '480px';
  ckBox.style.background = 'linear-gradient(180deg, #F0F0F6 0%, #FFFFFF 100%';
  ckBox.style.display = 'none';
  ckBox.style.boxShadow = 'rgb(121 121 121 / 10%) 0px 0px 10px 10px';
  // 场记2容器
  var cj2Box = document.createElement("div");
  cj2Box.setAttribute("id", "yw_CJ2_box");
  cj2Box.innerHTML = `<div id=cj2 style="height:406px;background:#fff;box-shadow:0 1px 5px 0 rgba(38,38,38,.1);border-radius:4px;box-sizing:border-box;padding:20px;border:1px solid #f2f2f2;display:block"><div class=cj2_head style=display:flex;justify-content:space-between><div class=cj2_title style=font-size:20px;color:#333>场记工具</div><div id=cj2_wrap_close style="width:16px;height:16px;border-radius:2px;border:1px solid #a6a6a6;display:flex;justify-content:center;align-items:center;cursor:pointer"><div class=content style="width:8px;border:1px solid #a6a6a6"></div></div></div><div id=cj2_content><div class=cj2_search style=margin-top:16px;display:flex;justify-content:space-between><select placeholder=请选择主播 id=cj2_select style="width:216px;height:32px;background:#fff;border-radius:2px;border:1px solid #d9d9d9;padding:0 12px;font-size:14px;color:#333"></select><div id=cj2_button style=width:70px;height:32px;line-height:100%;box-sizing:border-box;background:#1890ff;border-radius:4px;padding:10px;font-size:12px;font-weight:500;color:#fff;cursor:pointer>开始讲解</div></div><div id=cj2_row_list style=height:290px;overflow-x:hidden;overflow-y:auto;margin-top:16px><div style="width: 100%;height: 100%;display: flex;align-items: center;justify-content: center;">暂无数据<div></div></div></div>`
  cj2Box.style.position = 'fixed';
  cj2Box.style.top = '75px';
  cj2Box.style.right = '290px';
  cj2Box.style.width = '480px';
  cj2Box.style.background = 'linear-gradient(180deg, #F0F0F6 0%, #FFFFFF 100%';
  cj2Box.style.display = 'none';
  cj2Box.style.boxShadow = 'rgb(121 121 121 / 10%) 0px 0px 10px 10px';
  // 场控容器
  var jjBox = document.createElement("div");
  jjBox.setAttribute("id", "yw_JJ_box");
  jjBox.innerHTML = `<div><div class=wrap_header style=display:flex;justify-content:space-between><div class=wrap_title style=font-size:20px;color:#333>讲解自动点击工具</div><div id=wrap_close class=wrap_close style="width:16px;height:16px;border-radius:2px;border:1px solid #a6a6a6;display:flex;justify-content:center;align-items:center;cursor:pointer"><div class=content style="width:8px;border:1px solid #a6a6a6"></div></div></div><div class=wrap_descript style=color:#666;font-size:14px;margin-top:16px>开始点击后，会每10秒自动点击一次讲解，使用户可以在直播间看到商品弹窗</div><div id=wrap_btn_default class="wrap_btn wrap_btn_default" style="font-size:14px;margin-top:16px;box-sizing:border-box;width:100%;border-radius:4px;padding:9px;text-align:center;cursor:pointer;background-color:#1890ff;border:1px solid #1890ff;color:#fff">开始点击</div><div id=wrap_btn_stop class="wrap_btn wrap_btn_stop" style="font-size:14px;display:none;margin-top:16px;box-sizing:border-box;width:100%;border-radius:4px;padding:9px;text-align:center;cursor:pointer;background-color:#fff;color:#1890ff;border:1px solid #1890ff">停止点击</div><div id=wrap_foot_descript style=margin-top:20px;font-size:14px;font-weight:400;color:#666;display:none>执行记录： <span id=wrap_foot_descript_time>16:02:10</span> <span id=wrap_foot_descript_success style=margin-left:10px;color:#23cbb7;display:none>点击成功</span> <span id=wrap_foot_descript_fail style=margin-left:10px;color:#f15a5a;display:none>点击失败</span></div></div>`
  jjBox.style.position = 'fixed';
  jjBox.style.top = '75px';
  jjBox.style.right = '290px';
  jjBox.style.width = '368px';
  jjBox.style.boxSizing = 'border-box';
  jjBox.style.padding = '20px';
  jjBox.style.background = '#fff';
  jjBox.style.display = 'none';
  jjBox.style.boxShadow = '0px 1px 5px 0px rgba(38, 38, 38, 0.1)';
  jjBox.style.borderRadius = '4px';
  jjBox.style.border = '1px solid #f2f2f2';


  const href = window.location.href
  if (ENV === 'DY') {
    document.getElementById('portal').appendChild(yw_Btn);
  } else {
    document.getElementById('root').appendChild(yw_Btn);
  }
  //  else {
  //   document.getElementById('app').appendChild(yw_Btn);
  // }
  document.getElementById('yw_btn').appendChild(mainBtn);
  document.getElementById('yw_btn').appendChild(cjBtn);
  document.getElementById('yw_btn').appendChild(ckBtn);
  document.getElementById('yw_btn').appendChild(barrageBtn);
  document.getElementById('yw_btn').appendChild(jjBtn);
  // document.getElementById('yw_btn').appendChild(cjBox);
  document.getElementById('yw_btn').appendChild(ckBox);
  document.getElementById('yw_btn').appendChild(jjBox);
  document.getElementById('yw_btn').appendChild(cj2Box);
  document.getElementById('yw_btn').appendChild(barrageBox);
  $('#yw_btn_main').off('click').click(function() {
    if (ywBtnVis) {
      ywBtnVis = !ywBtnVis
      openCjCkBtn(ywBtnVis)
      $('#yw_btn_main').css('borderRadius', '6px')
      return
    }
    if (!sessionStorage.getItem('dh_token')) {
      window.open(`https://yun-test.ywwl.com/login?redirectUrl=${window.location.href.indexOf('token') >= 0 ? window.location.href.split('?')[0] : window.location.href}`, '_self')
      return
    } else {
      /* 创建 XMLHttpRequest 对象 */
      var httpRequest = new XMLHttpRequest()
      httpRequest.open('GET', 'https://test-gateway.ywwl.com/ywwl-admin/desktop/home/common/function/list', true)
      httpRequest.setRequestHeader('Content-type', 'application/json')
      httpRequest.setRequestHeader('X-TOKEN', sessionStorage.getItem('dh_token'))
      httpRequest.send();
      httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
          var json = httpRequest.responseText;
          json = JSON.parse(json)
          if (json.success) {
            getYwLiveStatus()
            getYwQuotaSelectList()
          } else if(json.code == 1000 || json.code == 17020002) {
            sessionStorage.removeItem('dh_token')
            window.open(`https://yun-test.ywwl.com/login?redirectUrl=${window.location.href.indexOf('token') >= 0 ? window.location.href.split('?')[0] : window.location.href}`, '_self')
          } else {
            alert(json.msg)
          }
        }
      };
    }
  })
  $('.closeCk').off('click').click(() => {
    ywCkBoxVis = false
    $('#yw_ck_box').css('display', 'none')
  })
  $('.wrap_close').off('click').click(() => {
    ywJJBoxVis = false
    ywBarrageVis = false
    clearInterval(barrageTaskTimer)
    $('#yw_barrage_box').hide()
    $('#yw_JJ_box').hide()
  })
   $('#cj2_wrap_close').off('click').click(() => {
    ywCJ2BoxVis = false
    $('#yw_CJ2_box').hide()
  })
}

window.onload = function() {
  const dh_token = GetQueryString('token')
  if (dh_token) {
    sessionStorage.setItem('dh_token', dh_token)
  }
  const href = window.location.href
  setTimeout(() => {
    if (href.indexOf('https://buyin.jinritemai.com/dashboard/live/control') >= 0 || href.indexOf('https://zs.kwaixiaodian.com/control') >= 0 || href.indexOf('https://zs.kwaixiaodian.com/page/helper') >= 0) {
      initPageData()
    }
    if (href.indexOf('https://buyin.jinritemai.com') >= 0 || href.indexOf('https://zs.kwaixiaodian.com') >= 0) {
      // 场记场控工具
      setTimeout(() => {
        if (!document.getElementById('yw_btn')) {
          createdYwTools();
        }
      }, 5000)
    }
  }, 3000)
}

};
