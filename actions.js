import { getRandomInt, setPosition, getEventforwand, cleanPosition } from './helpers.js';
//add urge to move
window.getEventforwand = getEventforwand;
function move_left(event, value) {
    if (!can_do_something(event)) return;
    //check probability
    if (value < 0 && Math.random() > value) return;
    event.direction = 1;
    let new_pos = event.x - 1;
    if (event.x < 0) {
        new_pos = event.max_x - 1;
    }
    if (setPosition(new_pos, event.y, event)) {
        event.energy -= event.move_cost;//only decrement energy when action is taken
    }
}

function move_right(event, value) {
    if (!can_do_something(event)) return;
    //check probability
    if (value < 0 && Math.random() > value) return;
    event.direction = 2;
    let new_pos = event.x + 1;
    if (event.x >= event.max_x) {
        new_pos = 0;
    }
    if (setPosition(new_pos, event.y, event)) {
        event.energy -= event.move_cost;//only decrement energy when action is taken
    }
}

function move_up(event, value) {
    if (!can_do_something(event)) return;
    //check probability
    if (value < 0 && Math.random() > value) return;
    event.direction = 3;
    let new_pos = event.y - 1;
    if (event.y < 0) {
        new_pos = event.max_y - 1;
    }
    if (setPosition(event.x, new_pos, event)) {
        event.energy -= event.move_cost;//only decrement energy when action is taken
    }
}

function move_down(event, value) {
    if (!can_do_something(event)) return;
    //check probability
    if (value < 0 && Math.random() > value) return;
    event.direction = 4;
    let new_pos = event.y + 1;
    if (event.y >= event.max_y) {
        new_pos = 0;
    }
    if (setPosition(event.x, new_pos, event)) {
        event.energy -= event.move_cost;//only decrement energy when action is taken
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

function grab_food(event, value) {
    if (!can_do_something(event)) return;
    if (value < 0 && Math.random() > value && !event.holding) return;
    const target = getEventforwand(event.x, event.y, event.direction);
    if (target && target.killed && target.edible) {
        event.holding = target;
        cleanPosition(target.x, target.y);
        target.deleted = true;
    }
}
function steal_food(event, value) {
    if (!can_do_something(event)) return;
    if (value < 0 && Math.random() > value && !event.holding) return;
    const target = getEventforwand(event.x, event.y, event.direction);
    if (target && target.holding) {
        event.holding = target.holding;
        target.holding = null;
    }
}
function eat_food(event, value) {
    if (value < 0 && Math.random() > value) return;
    const target = event.holding || getEventforwand(event.x, event.y, event.direction);
    if (target && target.killed && target.edible && (event.energy / event.max_energy) < CAN_EAT) {
        event.eated++;
        event.holding = null;
        if (event.hp < event.max_hp) {
            //recover HP    
            event.hp += 10;
            if (event.hp > event.max_hp) event.hp = event.max_hp;
        }

        //boost energy
        event.energy += 10;
        if (event.energy > event.max_energy) event.energy = event.max_energy;

        cleanPosition(target.x, target.y);
        target.deleted = true;
    }
}

function hit(event, value) {
    if (!can_do_something(event) ||
    event.energy < event.atk_cost ||
    (event.age / event.max_age) < ABLE_TO_HIT) return;

    if (value < 0 && Math.random() > value) return;
    const target = getEventforwand(event.x, event.y, event.direction);
    if (target && !target.killed) {
        event.energy -= event.atk_cost;
        target.last_hp = target.hp;
        target.hp -= event.atk;
        if (target.hp <= 0) {
            target.killed = true;
            target.killer = event;
            if(DEAD_COLOR) target.color = DEAD_COLOR; //dead
            if(KILLER_COLOR) event.color = KILLER_COLOR; //killer
            event.kills++;
        }
    }
}

function reproduces(event, value) {
    if (!can_do_something(event) ||
        event.energy < event.reproduce_cost ||
        (event.age / event.max_age) < ABLE_TO_REPRODUCE) return;

    if (value < 0 && Math.random() > value) return;
    const target = getEventforwand(event.x, event.y, event.direction);
    if (target && !target.killed &&
        (target.age / target.max_age) >= ABLE_TO_REPRODUCE &&
        target.energy >= target.reproduce_cost) {
        event.energy -= event.reproduce_cost;
        target.energy -= target.reproduce_cost;
        event.reproduced++;
        target.reproduced++;
    }
}


const actions = [move_left, move_right, move_up, move_down, move_random, move_foward, move_backward, rest, eat_food, reproduces, grab_food, steal_food, hit];
export default actions;