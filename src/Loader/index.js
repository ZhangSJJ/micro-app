import { importEntry } from 'import-html-entry'
import { createContext, removeContext } from '@alicloud/console-os-browser-vm';
import { APP_STATUS } from "../ConstValues";


export const loadHtml = async (appInfo) => {
    try {
        const { name, activeRule, container, entry, context } = appInfo
        appInfo.status = APP_STATUS.LOADING
        const res = await importEntry(entry);
        appInfo.status = APP_STATUS.LOADED

        const { assetPublicPath, execScripts, getExternalScripts, getExternalStyleSheets, template } = res

        appendTmplToHtml(appInfo, template)

        getExternalStyleSheets().then(css => {
            console.log(css)
        })

        overrideAppendOrInsert()

        const jsArr = await getExternalScripts();
        jsArr.forEach(js => {
            const run = window.eval(`
          (() => function({ window, self, globalThis, history, location, document }) {
             // 微前端框架注入
            window.__MICRO_APP__ = "__MICRO_APP__";
            ${js}
          })()
        `)
            run(context);
        })
        const { bootstrap, mount, unmount } = context.window[name];
        appInfo.bootstrap = bootstrap.bind(context.window[name])
        appInfo.mount = mount.bind(context.window[name])
        appInfo.unmount = unmount.bind(context.window[name])

    } catch (e) {
        console.error(e)
        appInfo.status = APP_STATUS.LOAD_ERR
    }
}

/**
 * 预加载子包资源
 * @param entry
 */
export const prefetch = entry => {
    window.requestIdleCallback(async () => {
        const { getExternalScripts, getExternalStyleSheets } = await importEntry(entry);
        window.requestIdleCallback(getExternalStyleSheets);
        window.requestIdleCallback(getExternalScripts);
    });
}

/**
 * 处理template之后添加到子应用节点
 * @param appInfo
 * @param templateStr
 */
const appendTmplToHtml = (appInfo, templateStr) => {
    let { containerNode, container, name } = appInfo;
    if (!containerNode) {
        containerNode = document.querySelector(container);
    }

    if (!containerNode) {
        console.error(`子应用挂载的节点:${container}不存在！`)
        return;
    }

    const appInstanceId = `MICRO_APP_WRAPPER_${name}_${+new Date()}_${Math.floor(Math.random() * 1000)}`;
    containerNode.innerHTML = `<div id="${appInstanceId}" data-name="${name}">${templateStr}</div>`;

    appInfo.containerNode = containerNode;
    appInfo.entryDom = containerNode.firstChild;
    appInfo.appInstanceId = appInstanceId;
}

/**
 * 对动态创建的<style>、<link>、<script>进行（appendChild、insertBefore）操作
 * 通过@alicloud/console-os-browser-vm创建独立的sandbox之后，再重写appendChild和insertBefore方法
 * 目的是将子应用中动态创建的style标签等添加到子应用节点容器中，而不是主应用的head中
 * 乾坤中是通过重写createElement，在创建元素时添加标记，在appendChild等操作的时候判断这个标记，做相应的处理（overrideMethod or originMethod）
 * 所以只有createElement的元素才能被添加到子节点中，而从页面选取一个元素通过document.head.appendChild添加，就添加到了主应用的head中
 */
const overrideAppendOrInsert = () => {

    // 此处暂未对子应用动态添加的link和script没有做处理！只考虑了动态style标签的场景（例如style-loader）

    const rawHeadAppendChild = HTMLHeadElement.prototype.appendChild;
    const rawHeadRemoveChild = HTMLHeadElement.prototype.removeChild;
    const rawBodyAppendChild = HTMLBodyElement.prototype.appendChild;
    const rawBodyRemoveChild = HTMLBodyElement.prototype.removeChild;
    const rawHeadInsertBefore = HTMLHeadElement.prototype.insertBefore;
    const rawRemoveChild = HTMLElement.prototype.removeChild;

    rawHeadAppendChild === HTMLHeadElement.prototype.appendChild && (HTMLHeadElement.prototype.appendChild = getAppendInsertOrRemove(rawHeadAppendChild))
    rawBodyAppendChild === HTMLBodyElement.prototype.appendChild && (HTMLBodyElement.prototype.appendChild = getAppendInsertOrRemove(rawBodyAppendChild))
    rawHeadInsertBefore === HTMLHeadElement.prototype.insertBefore && (HTMLHeadElement.prototype.insertBefore = getAppendInsertOrRemove(rawHeadInsertBefore))

    rawHeadRemoveChild === HTMLHeadElement.prototype.removeChild && (HTMLHeadElement.prototype.removeChild = getAppendInsertOrRemove(rawHeadRemoveChild))
    rawBodyRemoveChild === HTMLBodyElement.prototype.removeChild && (HTMLBodyElement.prototype.removeChild = getAppendInsertOrRemove(rawBodyRemoveChild))
    rawRemoveChild === HTMLElement.prototype.removeChild && (HTMLElement.prototype.removeChild = getAppendInsertOrRemove(rawRemoveChild))
}

const getAppendInsertOrRemove = (originFn) => {
    return function (el, ...args) {
        const appInfo = AppCenter.getCurrentRunningApp()
        if (el.ownerContext && appInfo && appInfo.appInstanceId) {
            // el.ownerContext: 说明当前元素是子应用通过createElement创建的
            const mountDom = document.getElementById(appInfo.appInstanceId)
            return originFn.call(mountDom, el, ...args)
        } else {
            return originFn.call(this, el, ...args)
        }
    };
}
