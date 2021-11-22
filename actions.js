import { getRandomInt, setPosition, getEventforwand, cleanPosition } from './helpers.js';

function move_left(event, value) {
    //check probability
    if (value < 0 && Math.random() > value) return;
    event.direction = 1;
    const new_pos = event.x - 1;
    if (event.x > 0) setPosition(new_pos, event.y, event);
}

function move_right(event, value) {
    //check probability
    if (value < 0 && Math.random() > value) return;
    event.direction = 2;
    const new_pos = event.x + 1;
    if (event.x < event.max_x) setPosition(new_pos, event.y, event);
}

function move_up(event, value) {
    //check probability
    if (value < 0 && Math.random() > value) return;
    event.direction = 3;
    const new_pos = event.y - 1;
    if (event.y > 0) setPosition(event.x, new_pos, event);
}

function move_down(event, value) {
    //check probability
    if (value < 0 && Math.random() > value) return;
    event.direction = 4;
    const new_pos = event.y + 1;
    if (event.y < event.max_y) setPosition(event.x, new_pos, event);
}

function move_foward(event, value){
    //check probability
    if (value < 0 && Math.random() > value) return;
    if(!event.direction) event.direction = getRandomInt(1, 5)
    move_to_direction(event, value);

}

function move_to_direction(event, value){
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
// function follow_close(event, value){
//     //follow close event
//     if (value < 0 && Math.random() > value) return;
//     for (let x = 0; x < 2; x++) {
//         for (let y = 0; y < 2; y++) {
//             const target = getEventforwand(event.x + x, event.y + y, event.direction);
//             if (target){
//                 event.direction = target.direction;
//                 move_to_direction(event, value);
//                 return;
//             }
//         }
//     }
// }

function move_random(event, value) {
    if (value < 0 && Math.random() > value) return;
    event.direction = getRandomInt(1, 5);
    move_to_direction(event, value);
}

function hit(event, value){
    if (value < 0 && Math.random() > value) return;
    const target = getEventforwand(event.x, event.y, event.direction);
    if(target){
        target.last_hp = target.hp;
        target.hp -= event.atk;
        if(target.hp <= 0){
            target.killed = true;
            cleanPosition(target.x, target.y);
        }
    }
}

const actions = [move_left, move_right, move_up, move_down, move_random, move_to_direction, hit];
export default actions;