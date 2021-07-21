//importScripts("./crowded.js")
import "./crowded.js"

let CrowdAgentParams = crowded.CrowdAgentParams;
let RecastTestMeshBuilder = crowded.RecastTestMeshBuilder;
let NavMesh = crowded.NavMesh;
let NavMeshQuery = crowded.NavMeshQuery;
let Crowd = crowded.Crowd;
let ObstacleAvoidanceParams = crowded.ObstacleAvoidanceParams;

class CrowdSimApp {

  static updateFlags = CrowdAgentParams.DT_CROWD_ANTICIPATE_TURNS | CrowdAgentParams.DT_CROWD_OPTIMIZE_VIS
    | CrowdAgentParams.DT_CROWD_OPTIMIZE_TOPO | CrowdAgentParams.DT_CROWD_OBSTACLE_AVOIDANCE;
  static query;
  crowd;
  static agents = [];
  static ext;
  static filter;
  ap;
  md;
  navmesh;

  bootMesh(objFileContents) {
    this.nmd = RecastTestMeshBuilder.fromFile(objFileContents).getMeshData();
    this.navmesh = new NavMesh(this.nmd, 6, 0);
    this.query = new NavMeshQuery(this.navmesh);
    this.crowd = new Crowd(500, 0.6, this.navmesh);
    let params = new ObstacleAvoidanceParams();
    params.velBias = 0.5;
    params.adaptiveDivs = 5;
    params.adaptiveRings = 2;
    params.adaptiveDepth = 1;
    this.crowd.setObstacleAvoidanceParams(0, params);

    this.ap = this.getAgentParams(this.updateFlags);
    this.ext = this.crowd.getQueryExtents();
    this.filter = this.crowd.getFilter(0);
  }

  getAgentParams(updateFlags) {
    let ap = new CrowdAgentParams();
    ap.radius = 0.6;
    ap.height = 2;
    ap.maxAcceleration = 8.0;
    ap.maxSpeed = 2.5; //Originally 3.5f
    ap.collisionQueryRange = ap.radius * 1;
    ap.pathOptimizationRange = ap.radius * 30;
    ap.updateFlags = updateFlags;
    ap.obstacleAvoidanceType = 0;
    ap.separationWeight = 1; //Originally 2f
    return ap;
  }
}

let cache = [];

class App extends CrowdSimApp {
  currentMillisecond = 0;
  millisecondsBetweenFrames = 40; //40ms between frames, or 25fps
  currentTick = 0;

  constructor(objFileContents, secondsOfSimulation, locationFileContents) {
    super();
    this.objFileContents = objFileContents;
    this.secondsOfSimulation = secondsOfSimulation;
    this.locations = locationFileContents;
  }
  boot(nonce) {
    this.bootMesh(this.objFileContents);
    postMessage({ type: "doneBoot"+nonce });
    //this.tick([], [], []);
  }
  getAgentDefinitions() {
    return { type: "agentDefinitions", agents: JSON.stringify(CrowdSimApp.agents) };
  }

  async tick(newAgents, newDestinations, leavingAgents) {
    let self = this;
    if (!this.crowd) return;
    let i = this.currentTick++;
    if (i < 1) {
      // initialize all agent's id

    }
    for (let agent of newAgents) {
      CrowdSimApp.agents.push(agent);
      let start = this.getStart(agent);
      let idx = this.crowd.addAgent(start, this.getAgentParams(CrowdSimApp.updateFlags));
      agent.idx = idx;
      let nearest = this.query.findNearestPoly(this.getEnd(agent), this.ext, this.filter);
      this.crowd.requestMoveTarget(agent.idx, nearest.getNearestRef(), nearest.getNearestPos());
      agent.hasEntered = true;
      agent.inSimulation = true;
    }
    for (let agent of newDestinations) {
      let nearest = this.query.findNearestPoly(this.getEnd(agent), this.ext, this.filter);
      this.crowd.requestMoveTarget(agent.idx, nearest.getNearestRef(), nearest.getNearestPos());
    }
    for (let agent of leavingAgents) {
      agent.inSimulation = false;
      CrowdSimApp.agents.find(a=>a.idx==agent.idx).inSimulation = false;
      this.crowd.removeAgent(agent.idx);
    }

    
    this.crowd.update(1 / 25.0, null, i);

    let toPost = [];
    for (let a = 0; a < CrowdSimApp.agents.length; a++) {
      let agent = CrowdSimApp.agents[a];
      let toAdd = {
        hasEntered: agent.hasEntered,
        inSimulation: agent.inSimulation,
      };
      if (agent.hasEntered && agent.inSimulation) {
        let internalAgent = this.crowd.getAgent(agent.idx);
        let pos = internalAgent.npos;
        toAdd.x = pos[0];
        toAdd.y = pos[1];
        toAdd.z = pos[2];
        toAdd.idx = agent.idx;
        toAdd.id = agent.id;
        toPost.push(toAdd);
      }
    }
    postMessage({ type: "agentUpdate" + nonce, agents: JSON.stringify(toPost), frame: i });
  }
  getStart(agent) {
    return [agent.startX, agent.startY, agent.startZ]
  }
  getEnd(agent) {
    return [agent.destX, agent.destY, agent.destZ]
  }
}

let app;
let nonce = "";
onmessage = function (msg) {
  if (!msg.data) return;
  if (msg.data[0] == "boot") {
    app = new App(msg.data[1], msg.data[2], msg.data[3]);
    nonce = msg.data[4];
    app.boot(nonce);
  }
  else if (msg.data[0] == "tick" + nonce) {
    app.tick(JSON.parse(msg.data[1]), JSON.parse(msg.data[2]), JSON.parse(msg.data[3]))
  }
}

export default App;