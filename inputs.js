import { getEventforwand, getRandomInt } from './helpers.js';

function has_event_forwand(brain) {
    const event = brain.event;
    //TODO: calculate urge
    return getEventforwand(event.x, event.y, event.direction) ? 1.0 : 0.0;
}

function was_damaged(brain) {
    const event = brain.event;
    //if health was changed
    if (event.last_hp < event.hp) {
        return 1.0 - health_percentage(brain);
    }
    return 0.0;
}

function was_heal(brain) {
    const event = brain.event;
    //if health was changed
    if (event.last_hp > event.hp) {
        return 1.0 - health_percentage(brain);
    }
    return 0.0;
}

function has_low_health(brain) {
    return health_percentage(brain) < 0.2 ? 1.0 : 0.0;
}
function has_low_energy(brain) {
    return energy_percentage(brain) < 0.2 ? 1.0 : 0.0;
}

function health_percentage(brain) {
    const event = brain.event;
    return event.hp / event.max_hp;
}

function has_someone_forward(brain) {
    const event = brain.event;
    if (event.direction) event.direction = getRandomInt(1, 5);
    return getEventforwand(event.x, event.y, event.direction || 1) ? 1.0 : 0.0;
}

function has_lost_energy(brain) {
    const event = brain.event;
    //if health has changed
    if (event.last_energy < event.energy) {
        event.last_energy_change = Date.now();
        event.last_energy_drop = event.age;
        return 1.0 - energy_percentage(brain);
    }
    return 0.0;
}

function has_gain_energy(brain) {
    const event = brain.event;
    //if health has changed
    if (event.last_energy > event.energy) {
        return 1.0 - energy_percentage(brain);
    }
    return 0.0;
}


function energy_percentage(brain) {
    const event = brain.event;
    return event.energy / event.max_energy;
}

function has_someone_around(brain) {
    const event = brain.event;

    //max distance is
    //Math.hypot(2, 2);
    //2.8284271247461903

    let distance = null;
    for (let x = 0; x < 2; x++) {
        for (let y = 0; y < 2; y++) {
            for (let i = 1; i < 5; i++) { //TODO:calculate distance and urge to move
                if (getEventforwand(event.x + x, event.y + y, i)) {
                    const event_distance = Math.hypot(event.x + x - event.x, event.x + y - event.y) / 2.8284271247461903;
                    if (distance == null)
                        distance = event_distance;
                    else
                        distance = Math.min(event_distance, distance);
                }
            }
        }
    }
    if (distance == null) return 0.0;

    //1.0 = closest distance
    //0.0 = out of site
    return 1.0 - distance;
}

const inputs = [Math.random, has_event_forwand, was_damaged, was_heal, has_someone_around, health_percentage, has_someone_forward, energy_percentage, was_damaged, was_heal, has_gain_energy, has_lost_energy, has_low_energy, has_low_health];
export default inputs;