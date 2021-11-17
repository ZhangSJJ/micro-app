import React, { useEffect } from 'react'


const About = () => {
    useEffect(() => {
        window.zzz = 'zhangsj'
    }, [])
    return (
        <div>
            <h2>About</h2>
            <div onClick={(e) => {
                alert(window.zzz)
            }}>点击我
            </div>
        </div>
    );
}
export default About;

