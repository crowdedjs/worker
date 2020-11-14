import crowded from "./crowded.js"
import app from 'web-worker:./worker.js'
//let app = new Worker('../src/worker.js')





function bootWorker(objValue, secondsOfSimulation, millisecondsBetweenFrames, locationValue, bootCallback, tickCallback, nonce){
  let worker = app();
  function nextTick(arr){
    worker.postMessage(["tick" + nonce, ...arr]);
  }
  
  worker.onmessage = async function (event) {
    if (event.data.type == "doneBoot" + nonce) {
      worker.postMessage(["tick" + nonce, JSON.stringify([]), JSON.stringify([]), JSON.stringify([])])
      bootCallback();
    }
    else if (event.data.type == "agentUpdate" + nonce) {
      tickCallback(event, nextTick);
    }
  }
  worker.postMessage(["boot", objValue, secondsOfSimulation, locationValue, nonce]);

}



export default bootWorker;