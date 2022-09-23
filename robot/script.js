const roads = [
  "Alice's House-Bob's House", "Alice's House-Cabin",
  "Alice's House-Post Office", "Bob's House-Town Hall",
  "Daria's House-Ernie's House", "Daria's House-Town Hall",
  "Ernie's House-Grete's House", "Grete's House-Farm",
  "Grete's House-Shop", "Marketplace-Farm",
  "Marketplace-Post Office", "Marketplace-Shop",
  "Marketplace-Town Hall", "Shop-Town Hall"
];

function buildGraph(edges) {
  let graph = Object.create(null);

  function addEdge(from, to) {
    if (graph[from] == null) {
      graph[from] = [to];
    } else {
      graph[from].push(to);
    }
  }
  for (let [from, to] of edges.map(r => r.split("-"))) {
    addEdge(from, to);
    addEdge(to, from);
  }
  return graph;
}

const roadGraph = buildGraph(roads);

class VillageState {
  constructor(place, parcels) {
    this.place = place;
    this.parcels = parcels;
  }

  move(destination) {
    if (!roadGraph[this.place].includes(destination)) {
      return this;
    } else {
      let parcels = this.parcels.map(p => {
        if (p.place != this.place) return p;
        return {
          place: destination,
          address: p.address
        };
      }).filter(p => p.place != p.address);
      return new VillageState(destination, parcels);
    }
  }
}

let first = new VillageState(
  "Post Office",
  [{
    place: "Post Office",
    address: "Alice's House"
  }]
);
let next = first.move("Alice's House");

// console.log(next.place);
// console.log(next.parcels);
// console.log(first.place);

function runRobot(state, robot, memory) {
  for (let turn = 0;; turn++) {
    if (state.parcels.length == 0) {
      console.log(`Done in ${turn} turns`);
      break;
    }
    let action = robot(state, memory);
    state = state.move(action.direction);
    memory = action.memory;
    console.log(`Moved to ${action.direction}`);
  }
}

function randomPick(array) {
  let choice = Math.floor(Math.random() * array.length);
  return array[choice];
}

// ------------- RANDOM ROBOT -------------

function randomRobot(state) {
  return {
    direction: randomPick(roadGraph[state.place])
  };
}

VillageState.random = function (parcelCount = 5) {
  let parcels = [];
  for (let i = 0; i < parcelCount; i++) {
    let address = randomPick(Object.keys(roadGraph));
    let place;
    do {
      place = randomPick(Object.keys(roadGraph));
    } while (place == address);
    parcels.push({
      place,
      address
    });
  }
  return new VillageState("Post Office", parcels);
}

// runRobot(VillageState.random(), randomRobot);

// ------------- ROUTE ROBOT -------------

const mailRoute = [
  "Alice's House", "Cabin", "Alice's House", "Bob's House",
  "Town Hall", "Daria's House", "Ernie's House",
  "Grete's House", "Shop", "Grete's House", "Farm",
  "Marketplace", "Post Office"
];

function routeRobot(state, memory) {
  if (memory.length == 0) {
    memory = mailRoute;
  }
  return {
    direction: memory[0],
    memory: memory.slice(1)
  };
}

// runRobot(VillageState.random(), routeRobot, []);

function findRoute(graph, from, to) {
  let work = [{at: from,route: []}];
  for (let i = 0; i < work.length; i++) {
    let {at,route} = work[i];
    for (let place of graph[at]) {
      if (place == to) return route.concat(place);
      if (!work.some(w => w.at == place)) {
        work.push({at: place, route: route.concat(place)});
      }
    }
  }
}

function goalOrientedRobot({place,parcels}, route) {
  if (route.length == 0) {
    let parcel = parcels[0];
    if (parcel.place != place) {
      route = findRoute(roadGraph, place, parcel.place);
    } else {
      route = findRoute(roadGraph, place, parcel.address);
    }
  }
  return {direction: route[0],memory: route.slice(1)};
}

// runRobot(VillageState.random(),goalOrientedRobot, []);

/* MEASURING A ROBOT
 * It’s hard to objectively compare robots by just letting them solve a few scenarios. Maybe one robot just happened 
 * to get easier tasks or the kind of tasks that it is good at, whereas the other didn’t.
 * Write a function compareRobots that takes two robots (and their starting memory). 
 * It should generate 100 tasks and let each of the robots solve each of these tasks. 
 * When done, it should output the average number of steps each robot took per task.
 * For the sake of fairness, make sure you give each task to both robots, rather than generating different tasks per robot.
 */

function compareRobots(robot1, memory1, robot2, memory2) {

  let sumRobot1 = 0;
  let sumRobot2 = 0;

  const tasksToBeDone = 100;

  for (let task = 0; task < tasksToBeDone; task++) {
    const state = VillageState.random();
    sumRobot1 += getStepsNumber(state, robot1, memory1);
    sumRobot2 += getStepsNumber(state, robot2, memory2);
  }

  const avgSteps1 = sumRobot1 / tasksToBeDone;
  const avgSteps2 = sumRobot2 / tasksToBeDone;
  console.log(`Average steps for ${robot1.name}: ${avgSteps1}`);
  console.log(`Average steps for ${robot2.name}: ${avgSteps2}`);
}

function getStepsNumber(state, robot, memory) {
  for (let turn = 0;; turn++) {
    if (state.parcels.length == 0) {
      return turn;
    }
    let action = robot(state, memory);
    state = state.move(action.direction);
    memory = action.memory;
  }
}

compareRobots(routeRobot, [], goalOrientedRobot, []);

/* ROBOT EFFICIENCY
 * Can you write a robot that finishes the delivery task faster than goalOrientedRobot? 
 * If you observe that robot’s behavior, what obviously stupid things does it do? How could those be improved?
 * If you solved the previous exercise, you might want to use your compareRobots function to verify whether you improved the robot.
 */

function myFastRobot({place,parcels}, route) {

  const allRoutes = [];

  for (parcel of parcels) {
    if (parcel.place != place) {
      allRoutes.push({
        path: findRoute(roadGraph, place, parcel.place),
        type: "pick-up"
      });
    }

    allRoutes.push({
      path: findRoute(roadGraph, place, parcel.address),
      type: "delivery"
    });
  }
 
  const sortedByLength = allRoutes.sort((a, b) => a.path.length - b.path.length);

  // those for pick-up takes priority over those for delivery, so I sort them once again according to that
  const sortedRoutes = sortedByLength.sort((a, b) => {
    if (a.type === "pick-up" && b.type === "delivery") {
      return -1
    } else return 1;
  });

  if (route.length == 0) {
    let route = sortedRoutes[0];
    return {direction: route.path[0],memory: []};
  }

  return {direction: route.path[0],memory: route.path.slice(1)};
}

compareRobots(myFastRobot, [], goalOrientedRobot, []);

/*
* Write a new class PGroup, similar to the Group class from Chapter 6, which stores a set of values. 
* Like Group, it has add, delete, and has methods.
* Its add method, however, should return a new PGroup instance with the given member added and leave the old one unchanged. 
* Similarly, delete creates a new instance without a given member.
* The class should work for values of any type, not just strings. It does not have to be efficient when used with large amounts of values.
* The constructor shouldn’t be part of the class’s interface (though you’ll definitely want to use it internally).
* Instead, there is an empty instance, PGroup.empty, that can be used as a starting value.
* Why do you need only one PGroup.empty value, rather than having a function that creates a new, empty map every time?
*/

class PGroup {
  constructor(setOfValues) {
    this.group = setOfValues;
  }

  add(value){
    if(this.has(value)){
      return this;
    } 
    else {
      return new PGroup([...this.group, value]);
    }
  }

  delete(value){
    if(!this.has(value)){
      return this;
    }
    else{
      const filtered = this.group.filter(el => el!= value);
      return new PGroup(filtered);
    }
  }

  has(value){
    return this.group.includes(value);
  }
}

PGroup.empty = new PGroup([]);

let a = PGroup.empty.add("a");
let ab = a.add("b");
let b = ab.delete("a");

console.log(b.has("b"));
// → true
console.log(a.has("b"));
// → false
console.log(b.has("a"));
// → false