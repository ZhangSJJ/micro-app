import React, { useEffect, useState } from "react";


const Home = () => {

    const [msg, setMsg] = useState('')

    let mount = true
    useEffect(() => {
        // fetch('api.php?key=free&appid=0&msg=你好呀').then(res => res.json()).then(res => {
        //     mount && setMsg(res.content)
        // });
        return () => {
            mount = false
        }

    }, [])

    return (
        <div className="move">这里是 sub-app-react home ---{msg}</div>
    );
}

export default Home
