import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route, Link, Switch } from "react-router-dom";

import About from "./pages/About";
import Home from "./pages/Home";


import './css/index.css'
import { reroute } from "../../../src/Route";


const App = () => {

    return (
        <Router basename={window.__MICRO_APP__ ? '/react' : '/'}>
            <div className='nav-bar'>
                <ul>
                    <li>
                        <Link to="/">Sub-App-React---Home</Link>
                    </li>
                    <li>
                        <Link to="/about">Sub-App-React---About</Link>
                    </li>
                </ul>
                <hr />
                <Switch>
                    <Route exact path="/">
                        <Home />
                    </Route>
                    <Route path="/about" component={About} />
                </Switch>
            </div>
        </Router>
    );
}

const render = (props) => {
    const { containerNode } = props;
    ReactDOM.render(<App />, containerNode ? containerNode.querySelector('#root') : document.querySelector('#root'));
}


if (!window.__MICRO_APP__) {
    render({});
}


export const bootstrap = (props) => {
    console.log('sub-app-react bootstrap')
}

export const mount = (props) => {
    var styleElement = document.createElement('style')
    styleElement.type = 'text/css'
    styleElement.innerHTML='.zsjjj:{}'
    document.head.appendChild(styleElement)


    console.log('sub-app-react mount')
    render(props)

    const {onGlobalStateChange}=props

    onGlobalStateChange((a, b) => {
        console.log('sub-app-pre: ', a)
        console.log('sub-app-now: ', b)
    })

}

export const unmount = (props) => {
    console.log('sub-app-react unmount')
    const { containerNode, offGlobalStateChange } = props;
    ReactDOM.unmountComponentAtNode(containerNode ? containerNode.querySelector('#root') : document.querySelector('#root'));
    offGlobalStateChange()
}



