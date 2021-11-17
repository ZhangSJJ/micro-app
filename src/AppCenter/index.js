import { match } from 'path-to-regexp'

import { APP_STATUS, FIRST_APP_MOUNT, IFRAME_SRC } from "../ConstValues";
import NotificationControl from '../NotificationControl'
import DataCenter from '../DataCenter'
import { loadHtml, prefetch } from "../Loader";
import { isRootPath, isSlowNetwork } from "../utils";
import { createContext } from "@alicloud/console-os-browser-vm";
import { enhanceSubAPPHistory } from "../Route";


let _instance = null

class AppCenter {
    constructor() {
        if (_instance) {
            throw new Error('单例模式，禁止new AppCenter()')
        }
        this.defaultMountApp = ''; // 第一个渲染的app名称
        this.appList = []; // app列表
        this.lifeCycle = {} // 主应用的生命周期
        this.currentRunningApp = null; // 当前正在运行的子应用
    }

    static getInstance() {
        _instance = _instance || new this();
        return _instance
    }

    setAppList(appList = []) {
        // Each app only needs to be registered once
        const unregisteredApps = appList.filter((app) => !this.appList.some(registeredApp => registeredApp.name === app.name));
        this.appList = [...this.appList, ...unregisteredApps];
        unregisteredApps.forEach(app => {
            app.status = APP_STATUS.UNLOAD;
        })
    }

    setAppLifeCycle(liftCycle) {
        this.lifeCycle = liftCycle
    }

    getAppList() {
        return this.appList
    }

    prefetch() {
        const listener = () => {
            NotificationControl.removeNotificationListener(FIRST_APP_MOUNT, listener)

            const unLoadArr = this.appList.filter(i => i.status === APP_STATUS.UNLOAD)
            if (!navigator.onLine || isSlowNetwork()) {
                // Don't prefetch if in a slow network or offline
                return;
            }
            unLoadArr.forEach(({ entry }) => prefetch(entry))

        }
        NotificationControl.addNotificationListener(FIRST_APP_MOUNT, listener)
    }

    /**
     * 获取第一个要渲染的app
     */
    getFirstAppInfo() {
        // 1、判断当前是不是根目录
        const defaultMountAppInfo = this.appList.find(({ name }) => name === this.defaultMountApp) || this.appList[0];
        if (isRootPath()) {
            return defaultMountAppInfo
        }
        const actives = [];
        this.appList.forEach(app => {
            const { activeRule, subActiveRules = [] } = app;
            const isActive = match(activeRule, { end: false })(window.location.pathname)
            // 1、先看匹配到哪个子应用
            if (isActive) {
                // 在看是否匹配到子应用某个页面
                let subActiveParam = null
                try {
                    subActiveRules.find(subPageRule => {
                        const isSubActive = match(`${activeRule}${subPageRule}`, { decode: decodeURIComponent })(window.location.pathname);
                        if (isSubActive) {
                            subActiveParam = isSubActive
                            return true
                        }
                    })
                } catch (e) {
                    console.error(`配置的子应用路由规则匹配出错\n：${e}`)
                }

                app.subActiveParam = subActiveParam;
                actives.push(app)
            }
        })
        return actives[0] || defaultMountAppInfo
    }

    async renderFirstApp() {
        const appInfo = this.getFirstAppInfo();
        if (appInfo.status === APP_STATUS.MOUNTED) {
            // 如果已经mounted了，直接发消息
            NotificationControl.sendNotification(FIRST_APP_MOUNT)
            return
        }
        await this.mountApp(appInfo)
        NotificationControl.sendNotification(FIRST_APP_MOUNT)
        // 做一个路由的更改
        const { subActiveParam, activeRule } = appInfo
        window.oriHistoryReplace('', '', subActiveParam && subActiveParam.path || activeRule)
    }

    async mountApp(appInfo) {
        appInfo.urlChangeToUmount = false;// 在进行下面的过程中（在mounted之前）可能由于url的切换被更改为true
        if (appInfo.status === APP_STATUS.MOUNTED) {
            return;
        }
        this.setCurrentRunningApp(appInfo)

        const { subActiveParam, activeRule } = appInfo

        // 创建js隔离环境
        if (!appInfo.context) {
            appInfo.context = await createContext({ url: IFRAME_SRC });
            appInfo.context.self = appInfo.context.window;
            appInfo.context.globalThis = appInfo.context.window;

            // 子应用默认渲染根路径
            let retPath = '/';
            if (subActiveParam && subActiveParam.path) {
                // 如果匹配到子应用的子页面，做一个子应用的路由跳转
                retPath = subActiveParam.path.replace(activeRule, '')
            }
            appInfo.context.history.pushState('', '', retPath)
            // 监听子应用路由变化
            enhanceSubAPPHistory(appInfo.context)
        }

        await loadHtml(appInfo)

        // 全局数据监听处理
        const { setGlobalData, setGlobalDataAsync, onGlobalStateChange, offGlobalStateChange, getGlobalData } = DataCenter.getMicroAppStateActions(appInfo.appInstanceId)
        appInfo.setGlobalData = setGlobalData
        appInfo.setGlobalDataAsync = setGlobalDataAsync
        appInfo.onGlobalStateChange = onGlobalStateChange
        appInfo.offGlobalStateChange = offGlobalStateChange
        appInfo.getGlobalData = getGlobalData

        if (appInfo.status === APP_STATUS.LOADED || appInfo.status === APP_STATUS.UNMOUNT) {
            // 资源文件加载成功--->开始渲染
            await this.runBootstrap(appInfo)

            if (appInfo.urlChangeToUmount) {
                // 当url迅速切换导致正在mount的app还没有mount完（可能是unload、loading、load_err、bootstrapping、mounting状态）
                await this.runUnmount(appInfo)
                return
            }
            await this.runMount(appInfo)
        }
    }

    async unmountApp(appInfo) {
        appInfo.urlChangeToUmount = true;
        if (appInfo.status === APP_STATUS.MOUNTED) {
            // 已经mount或者正在mont（还没执行mount的app）
            await this.runUnmount(appInfo)
        }
    }

    async runBootstrap(appInfo) {
        appInfo.status = APP_STATUS.BOOTSTRAPPING
        if (appInfo.bootstrap) {
            try {
                await appInfo.bootstrap(appInfo)
            } catch (e) {
                console.error(e)
            }
        }
        appInfo.status = APP_STATUS.BOOTSTRAPPED
    }

    async runMount(appInfo) {
        appInfo.status = APP_STATUS.MOUNTING
        if (appInfo.mount) {
            try {
                await appInfo.mount(appInfo)
            } catch (e) {
                console.error(e)
            }
        }
        appInfo.status = APP_STATUS.MOUNTED
    }

    async runUnmount(appInfo) {
        appInfo.status = APP_STATUS.UNMOUNTING
        if (appInfo.unmount) {
            try {
                await appInfo.unmount(appInfo)
            } catch (e) {
                console.error(e)
            }
        }
        appInfo.status = APP_STATUS.UNMOUNT
    }


    getAppListStatus(pathname) {
        const actives = []; // 需要mount的app
        let unmounts = []; // 需要unmount的app
        this.appList.forEach(app => {
            const isActive = match(app.activeRule, { end: false })(pathname)
            if (isActive) {
                actives.push(app)
            } else {
                unmounts.push(app)
            }
        })
        // 如果没有匹配到路由，则渲染你默认app
        const defaultMountAppInfo = this.appList.find(({ name }) => name === this.defaultMountApp) || this.appList[0];
        if (!actives.length && defaultMountAppInfo) {
            actives.push(defaultMountAppInfo)
            // unmount中过滤掉默认渲染的app
            unmounts = unmounts.filter(i => i.name !== defaultMountAppInfo.name)
            // 由于路由不匹配，所以做一个url变更
            window.oriHistoryReplace('', '', defaultMountAppInfo.activeRule)
        }
        return { actives, unmounts }
    }

    getCurrentRunningApp() {
        return this.currentRunningApp;
    }

    setCurrentRunningApp(appInfo) {
        this.currentRunningApp = appInfo;
    }
}

window.AppCenter = AppCenter.getInstance()
export default window.AppCenter
