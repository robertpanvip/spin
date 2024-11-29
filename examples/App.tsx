import {useState} from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.scss'
import Spin from "../src";

function App() {
    const [count, setCount] = useState(0);
    return (
        <>
            {/*<div style={{height: 200, overflow: "auto"}}>

                 <div style={{height: 900}}/>
            </div>*/}
            <div className="card">
                <button onClick={() => setCount((count) => count + 1)}>
                    count is {count}
                </button>
                <p>
                    Edit <code>src/App.tsx</code> and save to test HMR
                </p>
            </div>
            <div id='wrapper' style={{height: 400, overflow: "auto"}}>
                <Spin
                    indicator={
                        <span style={{fontSize: 100}}>
                            <svg viewBox="0 0 1024 1024" focusable="false" width="1em"
                                 height="1em" fill="currentColor">
                                <path
                                    d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path>
                            </svg>
                        </span>
                    }
                    tip='Loading'
                    spinning={count % 2 == 0}
                >
                    <div style={{height: 600, border: '1px solid'}}>
                        <a href="https://vitejs.dev" target="_blank">
                            <img src={viteLogo} className="logo" alt="Vite logo"/>
                        </a>
                        <a href="https://react.dev" target="_blank">
                            <img src={reactLogo} className="logo react" alt="React logo"/>
                        </a>
                    </div>
                </Spin>
            </div>
            <h1>Vite + React</h1>

            <p className="read-the-docs">
                Click on the Vite and React logos to learn more
            </p>
            {/* <div style={{height: 500}}/>*/}
        </>
    )
}

export default App