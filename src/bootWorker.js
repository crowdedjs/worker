import crowded from "./crowded.js"
import app from 'web-worker:./worker.js'
//let app = new Worker('../src/worker.js')

function nextTick(arr){
  app.postMessage(["tick", ...arr]);
}

function bootWorker(objValue, secondsOfSimulation, millisecondsBetweenFrames, locationValue, bootCallback, tickCallback){
  app.onmessage = async function (event) {
    if (event.data.type == "doneBoot") {
      app.postMessage(["tick", JSON.stringify([]), JSON.stringify([]), JSON.stringify([])])
      bootCallback();
    }
    else if (event.data.type == "agentUpdate") {
      tickCallback(event, nextTick);
    }
  }
  app.postMessage(["boot", objValue, secondsOfSimulation, locationValue]);

}



export default bootWorker;