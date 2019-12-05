// ==UserScript==
// @name         zero reader login
// @namespace    http://localhost:8080/
// @version      0.2
// @description  自动登录脚本 最终可以免登录获取数据但是没实现自动登录
// @author       You
// @match        http://localhost:8080/*
// @grant        none
// @updateURL    https://thetime50.github.io/tampermonkeyscript/zero_reader_login.js
// ==/UserScript==
//import axios from 'axios'
//let axios=import('https://unpkg.com/axios@0.19.0/lib/axios.js')
//let axios=require('https://unpkg.com/axios@0.19.0/index.js')

/**
 * 向外部暴漏一个函数 ajax
 * @param {*} url 请求路径，默认为空
 * @param {*} data 请求参数，默认为空对象
 * @param {*} type 请求方法，默认为GET
 */
function ajax (url = '', data = {}, type = 'GET',cfg={}) {
  // 返回值 Promise对象
  return new Promise(function (resolve, reject) {
    // 异步执行ajax请求
    let promise // 接收axios返回值的promise
    if (type === 'GET') { // 发送 get 请求
      let dataStr = ''
      Object.keys(data).forEach(key => {
        dataStr += key + '=' + data[key] + '&'
      })
      if (dataStr !== '') {
        dataStr = dataStr.substring(0, dataStr.lastIndexOf('&'))
        url = url + '?' + dataStr
      }
      promise = axios.get(url, cfg)
    } else { // 发送 post 请求
      promise = axios.post(url, data, cfg)
    }
    promise.then(response => {
      resolve(response.data)
    })
      .catch(error => {
        reject(error)
      })
  })
}
// const reqLibraries = (pageNum, pageSize, q) => ajax(BASE_URL + '/libraries', { page_num: pageNum, page_size: pageSize, q })
const reqLogin = (cfg) => ajax('/api/libraries', { page_num: 0, page_size: 0, q:'' },'GET',cfg)

function importModule(src,id){
    let pfun=function(resolve,reject){
        var js = document.createElement('script'),
            head = document.getElementsByTagName('head')[0];
        try {
            if(id){
                var oldJs=document.getElementById(id)
                oldJs.parentElement.removeChild(oldJs)
            }
        } catch (e) {
            reject(e)
        }
        js.src = src;
        if(id){
            js.id=id
        }
        js.addEventListener('load',resolve)
        head.appendChild(js);
    }
    return new Promise(pfun)
}
function putObj(obj,len){
    console.log(JSON.stringify(obj))
}

(async function() {
    'use strict';
    console.log("Tampermonkey zero reader login",location)
    let axios = await importModule('https://unpkg.com/axios/dist/axios.min.js')
    //let axios = await import('https://unpkg.com/axios/dist/axios.min.js')//这样不行
    //console.log(axios)
    //console.log(await reqLogin({Authorization: 'Basic emVyb21ha2U6eGYsNzUxNTE3Ng=='}))//这样不行
    putObj(await reqLogin({auth: {
        username: '',
        password: ''
    }}))
    //console.log(axios)
    // Your code here...
})();
