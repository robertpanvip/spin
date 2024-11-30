import {useState} from 'react'
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
                    tip='Loading'
                    spinning={count % 2 == 0}
                >
                    <div style={{height: 600, border: '1px solid'}}>
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