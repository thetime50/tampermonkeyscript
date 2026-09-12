/**
 * play-site 站点页：注入桥，供页面登录同步（pst / 本地）
 * 协议见 play-site doc/tm-site-tool-play-site-login.md
 */
function getPlaySiteCfg(getPSHandle){ // 这里不能用const = ()=>{}
    const playSiteHandle = getPSHandle()
    playSiteHandle.ensureBridge() // 通过插件暴露给全局，让其他项目页面可以用
    return [
        // {
        //     includes: '//pst.thetime50.com/',
        //     cb: () => playSiteHandle.ensureBridge(),
        // }
    ]
}
