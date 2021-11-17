/**
 * @author zhangshangjie@miningyum.com
 * @time 2019/10/09
 */


// 单事件监听
const _singleSubscriptionsMap = {};

// 多事件监听
const _multiSubscriptionsMap = {};
const _notificationState = {
    // A_B_C: {
    //   A: false,
    //   B: false,
    //   c: false
    // }
};

export default class NotificationControl {
    static addNotificationListener(key, fn) {
        let operateMap = _singleSubscriptionsMap;
        if (isArray(key)) {
            const keyArr = [...key];
            key = key.join('$');
            operateMap = _multiSubscriptionsMap;
            _notificationState[key] = keyArr.reduce((ret, item) => {
                ret[item] = false;
                return ret;
            }, {});
        }
        operateMap[key] = operateMap[key] || new Set();
        !operateMap[key].has(fn) && operateMap[key].add(fn);
    }

    static sendNotification(notificationType, ...params) {
        // console.log(notificationType, '-----------------------------------');

        // eslint-disable-next-line camelcase
        Object.keys(_notificationState).forEach(key_key => key_key.indexOf(notificationType) !== -1
            && (_notificationState[key_key][notificationType] = true));

        // eslint-disable-next-line camelcase
        Object.keys(_multiSubscriptionsMap).forEach(key_key => {
            if (key_key.indexOf(notificationType) !== -1) {
                if (key_key.split('$').every(key => _notificationState[key_key][key])) {
                    (_multiSubscriptionsMap[key_key] || new Set()).forEach(fn => fn.apply(fn, params));
                    // 清空状态
                    key_key.split('$').forEach(key => _notificationState[key_key][key] = false)
                }
            }
        });

        (_singleSubscriptionsMap[notificationType] || new Set()).forEach(fn => fn.apply(fn, params));
    }

    static removeNotificationListener(key, fn) {
        let operateMap = _singleSubscriptionsMap;
        if (isArray(key)) {
            key = key.join('$');
            operateMap = _multiSubscriptionsMap;
        }
        if (fn) {
            operateMap[key] && operateMap[key].delete(fn);
        } else {
            operateMap[key] = new Set();
        }
    }
}

const isArray = key => Object.prototype.toString.call(key) === '[object Array]';
