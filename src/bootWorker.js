import crowded from "./crowded.js"
import app from 'web-worker:./worker.js'
//let app = new Worker('../src/worker.js')





function bootWorker(objValue, secondsOfSimulation, millisecondsBetweenFrames, locationValue, bootCallback, tickCallback, nonce){
  
  function nextTick(arr){
    app.postMessage(["tick" + nonce, ...arr]);
  }
  
  app.onmessage = async function (event) {
    if (event.data.type == "doneBoot" + nonce) {
      app.postMessage(["tick" + nonce, JSON.stringify([]), JSON.stringify([]), JSON.stringify([])])
      bootCallback();
    }
    else if (event.data.type == "agentUpdate" + nonce) {
      tickCallback(event, nextTick);
    }
  }
  app.postMessage(["boot", objValue, secondsOfSimulation, locationValue, nonce]);

}



export default bootWorker;