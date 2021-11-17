import AppCenter from "../AppCenter";
import { IFRAME_SRC } from "../ConstValues";

export const reroute = (pathname) => {
    if (pathname === '/') {
        AppCenter.renderFirstApp();
        return
    }
    const { actives, unmounts } = AppCenter.getAppListStatus(pathname)
    Promise.all([
        ...actives.map(app => AppCenter.mountApp(app)),
        ...unmounts.map(app => AppCenter.unmountApp(app)),
    ])

    console.log(pathname)
}

export const enhanceHistory = () => {
    // 默认处理主应用的history
    const oriHistoryPush = window.history.pushState
    window.oriHistoryPush = oriHistoryPush.bind(window.history); // 仅仅作用为更改url链接
    const oriHistoryReplace = window.history.replaceState
    window.oriHistoryReplace = oriHistoryReplace.bind(window.history);// 仅仅作用为更改url链接
    // 处理主应用点击跳转自应用
    window.history.pushState = function () {
        console.log('pushState=====', arguments)
        oriHistoryPush.apply(window.history, arguments)
        arguments[2] && reroute(arguments[2])

    }
    window.history.replaceState = function () {
        console.log('replaceState=====', arguments)
        oriHistoryReplace.apply(window.history, arguments)
        arguments[2] && reroute(arguments[2])
    }


    // 浏览器返回，前进，go，back
    window.addEventListener('popstate', function listener() {
        console.log('listener-----popstate')
        reroute(location.pathname)
    })

    window.addEventListener('hashchange', function listener() {
        reroute(location.pathname)
    })
}

/**
 * 将子应用路由切换后的url体现在主应用中
 */
export const enhanceSubAPPHistory = ({ history, window: subAppWindow, location: subAppLocation }) => {
    const oriHistoryPush = history.pushState
    const oriHistoryReplace = history.replaceState
    // 处理主应用点击跳转自应用
    history.pushState = function () {
        console.log('sub-app-pushState=====', arguments)
        oriHistoryPush.apply(history, arguments)
        const appInfo = AppCenter.getCurrentRunningApp()
        const path = arguments[2]
        if (path && appInfo) {
            window.oriHistoryReplace('', '', `${appInfo.activeRule}${path}`)
        }


    }
    history.replaceState = function () {
        console.log('sub-app-replaceState=====', arguments)
        oriHistoryReplace.apply(history, arguments)
        const appInfo = AppCenter.getCurrentRunningApp()
        const path = arguments[2]
        if (path && appInfo) {
            window.oriHistoryReplace('', '', `${appInfo.activeRule}${path}`)
        }
    }


    // 浏览器返回，前进，go，back
    subAppWindow.addEventListener('popstate', function listener() {
        const appInfo = AppCenter.getCurrentRunningApp()
        let path = subAppLocation.pathname
        path = path === IFRAME_SRC ? '/' : path
        if (path && appInfo) {
            window.oriHistoryReplace('', '', `${appInfo.activeRule}${path}`)
        }
    })

    subAppWindow.addEventListener('hashchange', function listener() {
        const appInfo = AppCenter.getCurrentRunningApp()
        let path = subAppLocation.pathname
        path = path === IFRAME_SRC ? '/' : path
        if (path && appInfo) {
            window.oriHistoryReplace('', '', `${appInfo.activeRule}${path}`)
        }
    })
}
