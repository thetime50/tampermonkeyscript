/**
 * play-site 站点页：注入桥，供页面登录同步（pst / 本地）
 * 协议见 play-site doc/tm-site-tool-play-site-login.md
 */
function getPlaySiteCfg(getPSHandle){ // 这里不能用const = ()=>{}
    const playSiteHandle = getPSHandle()
    console.log(1)
    return [
        // {
        //     includes: '//pst.thetime50.com/',
        //     cb: () => playSiteHandle.ensureBridge(),
        // }
    ]
}
