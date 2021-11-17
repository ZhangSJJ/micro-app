import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Link } from 'react-router-dom'

import ReactDom from 'react-dom'

import { start, registryApp, setDefaultMountApp, initGlobalData } from '../../../src/index'

import { showName } from './utils'
import './css/index.css'

showName('zhangsj')


const App = () => {
    const [msg, setMsg] = useState();

    useEffect(() => {
        const getChatInfo = async () => {
            const res = await fetch('api.php?key=free&appid=0&msg=你好呀').then(res => res.json());
            setMsg(res.content)
        }
        getChatInfo()
    }, [])

    return (
        <div>Main-App-React --- {msg}
            <div className="App">
                <Router>
                    <div>
                        <nav>
                            <ul>
                                <li>
                                    <Link to="/">Home</Link>
                                </li>
                                <li>
                                    <Link to="/react16">sub-app-react16</Link>
                                </li>
                                <li>
                                    <Link to="/sub-app-react">sub-app-react</Link>
                                </li>
                                <li>
                                    <Link to="/vue">sub-app-vue</Link>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </Router>
                <div className="move">style move</div>
            </div>
        </div>
    );
}

ReactDom.render(<App />, document.getElementById('root'))

registryApp([
    {
        name: 'myReact',
        activeRule: '/sub-app-react',
        subActiveRules: ['/react/:id?'],
        container: '#micro-container',
        entry: 'http://localhost:8082',
    },
    {
        name: 'vue',
        activeRule: '/vue',
        container: '#micro-container',
        entry: 'http://localhost:8080',
    }
], {})

setDefaultMountApp('vue');

start()


const { onGlobalStateChange, setGlobalData, setGlobalDataAsync } = initGlobalData({
    app: 'micro-app-master',
    user: {
        name: 'zhangsj'
    }
})

window.mainSetGlobalData = setGlobalData
window.mainSetGlobalDataAsync = setGlobalDataAsync

onGlobalStateChange((a, b) => {
    console.log('pre: ', a)
    console.log('now: ', b)
})




