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
            <div style={{height: 400, overflow: "auto"}}>
                <Spin indicator={<span>123</span>} spinning={count % 2 == 0}>
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