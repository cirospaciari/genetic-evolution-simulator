import { getRandomInt, setPosition, getEventforwand, cleanPosition } from './helpers.js';
//add urge to move

function move_left(event, value) {
    if (!can_do_something(event)) return;
    //check probability
    if (value < 0 && Math.random() > value) return;
    event.direction = 1;
    const new_pos = event.x - 1;
    if (event.x > 0 && setPosition(new_pos, event.y, event)) {
        event.energy--;//only decrement energy when action is taken
    }
}

function move_right(event, value) {
    if (!can_do_something(event)) return;
    //check probability
    if (value < 0 && Math.random() > value) return;
    event.direction = 2;
    const new_pos = event.x + 1;
    if (event.x < event.max_x && setPosition(new_pos, event.y, event)) {
        event.energy--;//only decrement energy when action is taken
    }
}

function move_up(event, value) {
    if (!can_do_something(event)) return;
    //check probability
    if (value < 0 && Math.random() > value) return;
    event.direction = 3;
    const new_pos = event.y - 1;
    if (event.y > 0 && setPosition(event.x, new_pos, event)) {
        event.energy--;//only decrement energy when action is taken
    }
}

function move_down(event, value) {
    if (!can_do_something(event)) return;
    //check probability
    if (value < 0 && Math.random() > value) return;
    event.direction = 4;
    const new_pos = event.y + 1;
    if (event.y < event.max_y && setPosition(event.x, new_pos, event)) {
        event.energy--;//only decrement energy when action is taken
    }
}

function move_foward(event, value) {
    if (!can_do_something(event)) return;
    //check probability
    if (value < 0 && Math.random() > value) return;
    if (!event.direction) event.direction = getRandomInt(1, 5);
    move_to_direction(event, value);
}

function move_backward(event, value) {
    if (!can_do_something(event)) return;
    //check probability
    if (value < 0 && Math.random() > value) return;
    if (!event.direction) event.direction = getRandomInt(1, 5);
    event.direction = get_opose_direction(event.direction);
    move_to_direction(event, value);
}

function get_opose_direction(direction) {
    switch (direction) {
        case 1:
            return 2;
        case 2:
            return 1;
        case 3:
            return 4;
        case 4:
        default:
            return 3;
    }
}


function move_to_direction(event, value) {

    switch (event.direction) {
        case 1:
            return move_left(event, value);
        case 2:
            return move_right(event, value);
        case 3:
            return move_up(event, value);
        case 4:
        default:
            return move_down(event, value);
    }
}

function can_do_something(event) {
    if (event.is_moving || event.is_resting) return false;
    if (event.energy <= 0) return false;
    return true;
}
function move_random(event, value) {
    if (!can_do_something(event)) return;
    if (value < 0 && Math.random() > value) return;
    event.direction = getRandomInt(1, 5);
    move_to_direction(event, value);
}
function rest(event, value) {
    if (value < 0 && Math.random() > value) return;
    event.is_resting = true;
}

function eat_meat(event, value) {
    if (value < 0 && Math.random() > value) return;
    const target = getEventforwand(event.x, event.y, event.direction);
    if (target && target.killed) {
        event.eated++;
        
        if(event.hp < event.max_hp){
            //recover HP    
            event.hp += 10;
            if(event.hp > event.max_hp) event.hp = event.max_hp;
        }

        if(event.energy < event.max_energy){
            //boost energy
            event.energy += 10;
            if(event.energy > event.max_energy) event.energy = event.max_energy;
        }
        cleanPosition(target.x, target.y);
    }
}
function hit(event, value) {
    if (!can_do_something(event) && event.energy >= event.atk_cost) return;
    if (value < 0 && Math.random() > value) return;
    const target = getEventforwand(event.x, event.y, event.direction);
    if (target) {
        event.energy -= event.atk_cost;
        target.last_hp = target.hp;
        target.hp -= event.atk;
        if (target.hp <= 0) {
            target.killed = true;
            target.killer = event;
            event.kills++;
        }
    }
}
function reproduces(event, value){
    if (!can_do_something(event) && event.energy >= event.reproduce_cost) return;
    if (value < 0 && Math.random() > value) return;
    const target = getEventforwand(event.x, event.y, event.direction);
    if (target && !target.killed && target.energy >= target.reproduce_cost && (!target.partner || target.partner === event)) {
        event.energy -= event.reproduce_cost;
        target.energy -= target.reproduce_cost;
        target.partner = event;
        event.partner = target;
        event.reproduced++;
        // target.reproduced++;
    }
}
const actions = [move_left, move_right, move_up, move_down, move_random, move_foward, move_backward, rest, hit, eat_meat, reproduces];
export default actions;