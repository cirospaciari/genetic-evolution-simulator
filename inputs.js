import { getEventforwand } from './helpers.js';

function random_input() {
    return Math.random();
}
let last_time = Date.now();

function time_diff() {
    const now = Date.now()
    const diff = last_time - now;
    last_time = now;

    return Math.tanh(diff);
}

function has_event_forwand(brain) {
    const event = brain.event;
    //TODO: calculate urge
    return getEventforwand(event.x, event.y, event.direction) ? 1.0 : 0.0;
}

function has_damage(brain) {
    const event = brain.event;
    //TODO: calculate more urge if has more damage
    return event.last_hp !== undefined && event.last_hp != event.hp ? 1.0 : 0.0;
}

function has_someone_around(brain) {
    const event = brain.event;

    for (let i = 1; i < 5; i++) //TODO: calculate  urge to move
        if (getEventforwand(event.x, event.y, i)) return 1.0;
    return 0.0;
}

function has_someone_close(brain) {
    const event = brain.event;

    for (let x = 0; x < 2; x++) {
        for (let y = 0; y < 2; y++) {
            for (let i = 1; i < 5; i++) { //TODO:calculate distance and urge to move
                if (getEventforwand(event.x + x, event.y + y, i)) return 1.0;
            }
        }
    }
    return 0.0;
}

const inputs = [random_input, time_diff, has_event_forwand, has_damage, has_someone_around, has_someone_close];
export default inputs;