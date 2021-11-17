import AppCenter from './AppCenter'
import DataCenter from './DataCenter'
import { enhanceHistory } from './Route'

export const registryApp = (appList, life) => {
    AppCenter.setAppLifeCycle(life)
    AppCenter.setAppList(appList)
}

export const setDefaultMountApp = appName => {
    AppCenter.defaultMountApp = appName
}

export const start = () => {
    const appList = AppCenter.getAppList()
    if (!appList.length) {
        console.error('请配置子应用信息!')
        return
    }
    // 1、监听路由变化
    enhanceHistory();

    // 2、预加载子应用资源
    AppCenter.prefetch()

    // 3、渲染第一个子应用
    AppCenter.renderFirstApp();

}

export const initGlobalData = DataCenter.initGlobalData;

// TODO：两个问题待解决
// 1、如何将子应用的css样式添加到sub-view-port中而不是head中 (已解决：参照qiankun解决)
// 2、如何初始化渲染子应用的二级页面 （已解决：主应用通过配置子应用的路由规则（subActiveRules）子应用渲染完了之后做一个页面跳转）
// 3、全局state（已解决：发布订阅模式）
