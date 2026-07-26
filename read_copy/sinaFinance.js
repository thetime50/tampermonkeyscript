const sinaFinanceCfg = (() => {
    // 新浪财经 
    async function sinaFinanceAutoCloseWindow(){
        const type = "23,11,12,41,31,33,71,73,81"
        // let typeMap = {
        //     "11": "A 股",
        //     "12": "B 股",
        //     "13": "权证",
        //     "14": "期货",
        //     "15": "债券",
        //     "21": "开基",
        //     "22": "ETF",
        //     "23": "LOF",
        //     "24": "货基",
        //     "25": "QDII",
        //     "26": "封基",
        //     "31": "港股",
        //     "32": "窝轮",
        //     "33": "港指数",
        //     "41": "美股",
        //     "42": "外期",
        //     "71": "外汇",
        //     "73": "OTC",
        //     "81": "债券",
        //     "82": "债券"
        // }
        
        let symbolIds = JSON.parse(localStorage.getItem('symbolIds')) || []

        let compareIndexH5Is = $(await waitElement('#compareIndexH5 .is'))
        compareIndexH5Is.on('click', 'a[x-symbol]', async function(e) {
            e.preventDefault()
            let symbolId = $(this).attr('x-symbol')
            $('#compareTxtH5').val(symbolId)
            await delay(10)
            // $('#compareBtnH5').trigger('click')
            document.querySelector('#compareBtnH5').click()
        })
        compareIndexH5Is.on('click', 'label', function(e) {
            e.preventDefault()
            let symbolId = $(this).siblings('a').attr('x-symbol')
            $(this).closest('.i').remove()
            let idx = symbolIds.findIndex(v => v.id === symbolId)
            if (idx > -1) {
                symbolIds.splice(idx, 1)
                localStorage.setItem('symbolIds', JSON.stringify(symbolIds))
            }
        })
        compareIndexH5Is.css({
            top: 'unset',
            bottom: '25px',
            width: '130px',
        })

        async function queryScript(url){
            let script = document.createElement('script')
            script.src = url
            document.body.appendChild(script)
            return new Promise((resolve, reject) => {
                script.onload = () => {
                    resolve(script.responseText)
                    document.body.removeChild(script)
                }
                script.onerror = () => {
                    reject(new Error('queryScript error:'+url))
                    document.body.removeChild(script)
                }
            })
        }
        async function searchSymbol(symbolId){
            // https://suggest3.sinajs.cn/suggest/type=23,11,12,41,31,33,71,73,81&key=d&name=suggestdata_1781734566181
            // 使用 script标签请求 返回值在neam里面
            const name = `suggestdata_${Date.now()}`
            let url = `https://suggest3.sinajs.cn/suggest/type=${type}&key=${symbolId}&name=${name}`
            let res = await queryScript(url)
            const data = window[name]
            if (data) {
                return data.split(';').map(v=>v.split(','))
            }
            return null
        }
        function addSymbolItem(symbolId, name){
            let $item = $('<div class="i" style="display: flex;"></div>')
                .css({flex: '1'})
            $item.append($('<a href="javascript:void(0)">')
                .attr('x-symbol', symbolId).text(name).css({
                    flex: '1 1 auto',
                })
            )
            $item.append(' ')
            $item.append($('<label>').text('x').css({
                flex: '0 0 auto',
                width: '20px',
                height: '20px',
                textAlign: 'center',
            }))
            compareIndexH5Is.append($item)
        }
        symbolIds.forEach(v=>{
            addSymbolItem(v.id, v.name)
        })

        setInterval(async ()=>{
            let addNewSymbol = false
            // 自动关闭窗口 间隔0.3s循环执行
            document.querySelectorAll('[class*="close"]').forEach(el=>{
                if (el.style.display !== 'none' && el.offsetParent !== null) {
                    // console.log('click', el)
                    el.click()
                }
            })
            /* 如果selectAll #h5CompareCon>[data-symbol] 有值 去重加入symbolIds数组
            */
            let symbolEls = document.querySelectorAll('#h5CompareCon>[data-symbol]')
            let ids = compareIndexH5Is.find('a').map((i, el) => {
                return el.getAttribute('x-symbol') || 
                    el.getAttribute('symbol')
            }).get()
            for(let i = 0; i < symbolEls.length; i++) {
                let v = symbolEls[i]
                let symbolId = v.getAttribute('data-symbol')
                if (!ids.includes(symbolId)) {
                    // let name = $(v).text().trim() || symbolId
                    let symbolData = await searchSymbol(symbolId)
                    let name = symbolData[0] && symbolData[0][4] || $(v).text().trim() || symbolId
                    symbolIds.push({id: symbolId, name})
                    addSymbolItem(symbolId, name)
                    addNewSymbol = true
                }
            }
            if (addNewSymbol) {
                localStorage.setItem('symbolIds', JSON.stringify(symbolIds))
            }
        }, 300)
    }

    return {
        re:/\/\/finance.sina.com.cn\/realstock\/company\/\w+\/nc.shtml/,
        cb: sinaFinanceAutoCloseWindow,
    }
})()
