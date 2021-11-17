/**
 * @author Kuitos
 * @since 2020-04-13
 */



const fnRegexCheckCacheMap = new WeakMap();
export function isConstructable(fn) {
    // prototype methods might be changed while code running, so we need check it every time
    const hasPrototypeMethods =
        fn.prototype && fn.prototype.constructor === fn && Object.getOwnPropertyNames(fn.prototype).length > 1;

    if (hasPrototypeMethods) return true;

    if (fnRegexCheckCacheMap.has(fn)) {
        return fnRegexCheckCacheMap.get(fn);
    }

    /*
      1. 有 prototype 并且 prototype 上有定义一系列非 constructor 属性
      2. 函数名大写开头
      3. class 函数
      满足其一则可认定为构造函数
     */
    let constructable = hasPrototypeMethods;
    if (!constructable) {
        // fn.toString has a significant performance overhead, if hasPrototypeMethods check not passed, we will check the function string with regex
        const fnString = fn.toString();
        const constructableFunctionRegex = /^function\b\s[A-Z].*/;
        const classRegex = /^class\b/;
        constructable = constructableFunctionRegex.test(fnString) || classRegex.test(fnString);
    }

    fnRegexCheckCacheMap.set(fn, constructable);
    return constructable;
}

const naughtySafari = typeof document.all === 'function' && typeof document.all === 'undefined';
const callableFnCacheMap = new WeakMap();
export const isCallable = (fn) => {
    if (callableFnCacheMap.has(fn)) {
        return true;
    }

    const callable = naughtySafari ? typeof fn === 'function' && typeof fn !== 'undefined' : typeof fn === 'function';
    if (callable) {
        callableFnCacheMap.set(fn, callable);
    }
    return callable;
};

const boundedMap = new WeakMap();
export function isBoundedFunction(fn) {
    if (boundedMap.has(fn)) {
        return boundedMap.get(fn);
    }
    /*
     indexOf is faster than startsWith
     see https://jsperf.com/string-startswith/72
     */
    const bounded = fn.name.indexOf('bound ') === 0 && !fn.hasOwnProperty('prototype');
    boundedMap.set(fn, bounded);
    return bounded;
}




let currentRunningApp = null;
/**
 * get the app that running tasks at current tick
 */
export function getCurrentRunningApp() {
    return currentRunningApp;
}
export function setCurrentRunningApp(appInstance) {
    // set currentRunningApp and it's proxySandbox to global window, as its only use case is for document.createElement from now on, which hijacked by a global way
    currentRunningApp = appInstance;
}
const functionBoundedValueMap = new WeakMap();
export function getTargetValue(target, value) {
    /*
      仅绑定 isCallable && !isBoundedFunction && !isConstructable 的函数对象，如 window.console、window.atob 这类，不然微应用中调用时会抛出 Illegal invocation 异常
      目前没有完美的检测方式，这里通过 prototype 中是否还有可枚举的拓展方法的方式来判断
      @warning 这里不要随意替换成别的判断方式，因为可能触发一些 edge case（比如在 lodash.isFunction 在 iframe 上下文中可能由于调用了 top window 对象触发的安全异常）
     */
    if (isCallable(value) && !isBoundedFunction(value) && !isConstructable(value)) {
        const cachedBoundFunction = functionBoundedValueMap.get(value);
        if (cachedBoundFunction) {
            return cachedBoundFunction;
        }
        const boundValue = Function.prototype.bind.call(value, target);
        // some callable function has custom fields, we need to copy the enumerable props to boundValue. such as moment function.
        // use for..in rather than Object.keys.forEach for performance reason
        // eslint-disable-next-line guard-for-in,no-restricted-syntax
        for (const key in value) {
            boundValue[key] = value[key];
        }
        // copy prototype if bound function not have but target one have
        // as prototype is non-enumerable mostly, we need to copy it from target function manually
        if (value.hasOwnProperty('prototype') && !boundValue.hasOwnProperty('prototype')) {
            // we should not use assignment operator to set boundValue prototype like `boundValue.prototype = value.prototype`
            // as the assignment will also look up prototype chain while it hasn't own prototype property,
            // when the lookup succeed, the assignment will throw an TypeError like `Cannot assign to read only property 'prototype' of function` if its descriptor configured with writable false or just have a getter accessor
            // see https://github.com/umijs/qiankun/issues/1121
            Object.defineProperty(boundValue, 'prototype', { value: value.prototype, enumerable: false, writable: true });
        }
        functionBoundedValueMap.set(value, boundValue);
        return boundValue;
    }
    return value;
}
const getterInvocationResultMap = new WeakMap();
export function getProxyPropertyValue(getter) {
    const getterResult = getterInvocationResultMap.get(getter);
    if (!getterResult) {
        const result = getter();
        getterInvocationResultMap.set(getter, result);
        return result;
    }
    return getterResult;
}
