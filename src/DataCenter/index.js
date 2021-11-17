import produce from "immer";
import NotificationControl from "../NotificationControl";

let _instance = null

const GLOBAL_DATA_CHANGE = 'GLOBAL_DATA_CHANGE'
const nullFn = () => {
}

class DataCenter {
    constructor() {
        if (_instance) {
            throw new Error('单例模式，禁止new DataCenter()')
        }
        this.globalData = null
        this.deps = {};
    }

    static getInstance() {
        _instance = _instance || new this();
        return _instance
    }

    initGlobalData = (data) => {
        if (data === this.globalData) {
            console.warn(' state has not changed！');
            return {
                setGlobalData: nullFn,
                setGlobalDataAsync: nullFn,
                onGlobalStateChange: nullFn,
                offGlobalStateChange: nullFn,
            }
        } else {
            this.globalData = data
            NotificationControl.sendNotification(GLOBAL_DATA_CHANGE, null, this.globalData)
            return this.getMicroAppStateActions(`global-${+new Date()}`);
        }
    }

    getMicroAppStateActions = (appInstanceId) => {
        return {
            setGlobalData: (cb) => {
                const preData = this.globalData;
                this.globalData = produce(this.globalData, draft => {
                    cb && cb(draft)
                })
                if (preData !== this.globalData) {
                    NotificationControl.sendNotification(GLOBAL_DATA_CHANGE, preData, this.globalData)
                }
            },
            setGlobalDataAsync: (cb) => {
                const preData = this.globalData;
                const newState = produce(this.globalData, async draft => {
                    cb && (await cb(draft))
                })
                return newState.then(res => {
                    this.globalData = res;
                    if (preData !== this.globalData) {
                        NotificationControl.sendNotification(GLOBAL_DATA_CHANGE, preData, this.globalData)
                    }
                })
            },

            onGlobalStateChange: (listener) => {
                this.deps[appInstanceId] = listener;
                NotificationControl.addNotificationListener(GLOBAL_DATA_CHANGE, listener)
            },
            offGlobalStateChange: () => {
                NotificationControl.removeNotificationListener(GLOBAL_DATA_CHANGE, this.deps[appInstanceId])
            },
            getGlobalData: () => this.globalData
        }
    }

}


export default DataCenter.getInstance()



