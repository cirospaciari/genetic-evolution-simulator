export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}
export function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}
export function hasEvent(x, y){
    return ((MAP_GRID[x] || {})[y]);
}
export function setPosition(x, y, event){
    if(hasEvent(x, y)) return false;

    MAP_GRID[x] = MAP_GRID[x] || {}
    MAP_GRID[x][y] = event;

    cleanPosition(event.x, event.y);
    event.x = x;
    event.y = y;
    return true;
}
export function cleanPosition(x, y){
    MAP_GRID[x] = MAP_GRID[x] || {}
    MAP_GRID[x][y] = undefined;
    delete MAP_GRID[x][y];
}

export function getEventforwand(x, y, direction){

    switch(direction){
        case 1: //left
            return hasEvent(x - 1, y);
        case 2: //right
            return hasEvent(x + 1, y);
        case 3: //up
            return hasEvent(x, y - 1);
        case 4:
            return hasEvent(x, y + 1);
        default:
            return undefined;
    }
    
}
export function genomeColor(genome) {
    const front = genome[0];
    const back = genome[genome.length - 1];

    return '#' + ((genome.length & 1)
    | ((front.source_type)    << 1)
    | ((back.source_type)     << 2)
    | ((front.sink_type)      << 3)
    | ((back.sink_type)       << 4)
    | ((front.source_id & 1) << 5)
    | ((front.sink_id & 1)   << 6)
    | ((back.source_id & 1)  << 7)).toString(16).padStart(6, '0').substr(0, 6);
}