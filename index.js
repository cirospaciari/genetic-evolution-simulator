
import { getBrainFrom, mutateGenome, randomGenome, encodeGenome, genomeToMermaid, decodeGenome } from './neural_net.js';
import { genomeColor, getRandomInt, hasEvent, setPosition, renderMermaid } from './helpers.js'


function getRandomAvailablePosition() {
    let position = null;
    do {
        position = { x: getRandomInt(0, MAP_TILES), y: getRandomInt(0, MAP_TILES) }
    } while (hasEvent(position.x, position.y));
    return position;

}
function create_event(genome) {
    return {
        ...getRandomAvailablePosition(), color: genomeColor(genome), holding: null, age: 0, max_x: MAP_TILES, max_y: MAP_TILES, 
        max_age: event_stats.max_age || 100,
        deleted: false,
        reproduced: 0,
        edible: true,
        killer: null,
        eated: 0,
        kills: 0, 
        hp: event_stats.hp || event_stats.max_hp || 100, 
        reproduce_cost: 0, 
        max_hp: event_stats.max_hp || 100, 
        move_cost: 0, 
        energy: event_stats.energy || event_stats.max_energy || 100,
        max_energy: event_stats.max_energy || 100,
        atk: event_stats.atk || 20,
        atk_cost: event_stats.atk_cost || 10, 
        energy_regeneration_period: event_stats.energy_regeneration_period || 10, 
        passthrough: false
    };
}
function create_food_event() {
    return { ...getRandomAvailablePosition(), color: "#00F100", killed: true, plant: true, deleted: false, passthrough: true, edible: true };
}
function create_rock_event() {
    return { ...getRandomAvailablePosition(), color: "#E8E8E8", killed: true, plant: false, deleted: false, passthrough: true, edible: false };
}
function populateFood() {
    const foods = [];
    for (let i = 0; i < RANDOM_FOOD_QUANTITY; i++) {
        const event = create_food_event();
        setPosition(event.x, event.y, event);
        foods.push(event);
    }
    return foods;
}

function populateRocks() {
    const foods = [];
    for (let i = 0; i < RANDOM_ROCK_QUANTITY; i++) {
        const event = create_rock_event();
        setPosition(event.x, event.y, event);
        foods.push(event);
    }
    return foods;
}

function randomBrain() {

    const genome = randomGenome(GENES_QUANTITY);
    const event = create_event(genome);
    setPosition(event.x, event.y, event);
    const brain = getBrainFrom(genome, event, NEURONS_QUANTITY);
    return brain;
}


export function randomPopulation(quantity) {
    const population = new Array(quantity);
    for (let i = 0; i < population.length; i++)
        population[i] = randomBrain();
    return population;
}



let events = randomPopulation(POPULATION_SIZE);
let obstacles = [...populateFood(), ...populateRocks()];

let generation = 0;
const canvas = document.getElementById('viewport');
const ctx = canvas.getContext('2d');
generation_label.textContent = 0;
survival_rate_label.textContent = '100%';
kills_rate_label.textContent = '0%';
let last_draw = Date.now();
let fps = 0;
function draw() {
    if (generation >= GENERATIONS) return;

    document.title = `FPS: ${fps}`;
    const delta = (Date.now() - last_draw) / 1000;
    last_draw = Date.now();
    fps = 1 / delta;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    obstacles.forEach((event) => {
        if (!event.deleted) {
            ctx.fillStyle = event.color;
            ctx.fillRect(event.x * EVENT_SIZE, event.y * EVENT_SIZE, EVENT_SIZE, EVENT_SIZE);
        }
    });
    events.forEach((brain) => {

        const event = brain.event;
        if (!event.deleted) {
            ctx.fillStyle = event.color;
            ctx.fillRect(event.x * EVENT_SIZE, event.y * EVENT_SIZE, EVENT_SIZE, EVENT_SIZE);
        }
        if (!event.killed && event.age < event.max_age) { //dies on age MAX_AGE
            event.last_hp = event.hp;
            event.last_energy = event.energy;
            event.is_moving = false;
            if (event.age - event.last_energy_change > event.energy_regeneration_period && event.energy < event.max_energy) {
                event.energy++;
                event.last_energy_change = event.age;
                event.is_resting = false;
            }
            brain.update();

            event.age++;
        } else {
            event.killed = true; //killed by old age or murder
        }
    });

    if (events.some((brain) => !brain.event.killed)) {
        setTimeout(draw, INTERVAL);//continues
    } else {
        if (generation < GENERATIONS) { //stop
            generation++;
            const died = events.filter((brain) => brain.event.killed);
            const kills = events.filter((brain) => brain.event.killer).length;
            const eated = events.filter((brain) => brain.event.eated).length;
            const parents = events.filter(survival);
            MAP_GRID = {};
            //place random food and rocks
            obstacles = [...populateFood(), ...populateRocks()];

            const genome_ranking = {};
            events = [];
            if (parents.length) {

                //filter and start new generation
                while (events.length < POPULATION_SIZE) {
                    for (let i = 0; i < parents.length && events.length < POPULATION_SIZE; i++) {
                        const brain = parents[i];
                        const encoded_genome = encodeGenome(brain.genome);

                        for (let j = 0; j < brain.event.reproduced && events.length < POPULATION_SIZE; j++) {
                            genome_ranking[encoded_genome] = genome_ranking[encoded_genome] || 0;
                            genome_ranking[encoded_genome]++;

                            let new_genome = brain.genome;
                            if (Math.random() < MUTATION_RATE) new_genome = mutateGenome(new_genome);
                            const event = create_event(new_genome);
                            setPosition(event.x, event.y, event);
                            const new_brain = getBrainFrom(new_genome, event, brain.total_neurons);
                            events.push(new_brain);
                        }
                    }
                }
            } else {
                //no body survives :/
                //just re-create with mutations
                while (events.length < POPULATION_SIZE) {
                    for (let i = 0; i < died.length && events.length < POPULATION_SIZE; i++) {
                        const brain = died[i];
                        let new_genome = brain.genome;
                        const encoded_genome = encodeGenome(brain.genome);
                        genome_ranking[encoded_genome] = genome_ranking[encoded_genome] || 0;
                        genome_ranking[encoded_genome]++;

                        if (Math.random() < MUTATION_RATE) new_genome = mutateGenome(new_genome);
                        const event = create_event(new_genome);
                        setPosition(event.x, event.y, event);
                        const new_brain = getBrainFrom(new_genome, event, brain.total_neurons);
                        events.push(new_brain);
                    }
                }

            }

            const sorted_genomes = Object.entries(genome_ranking).sort((a, b) => b[1] - a[1]);
            diversity_label.textContent = sorted_genomes.length;

            most_popular_genomes.innerHTML = '';
            sorted_genomes.filter((value, index) => index < 100).map((value, index) => {

                const link = document.createElement('a');
                link.href = `/genome/?neurons=${NEURONS_QUANTITY}&genome=${encodeURIComponent(value[0])}`;
                link.innerHTML = `${index + 1}&#186; (${value[1]}) `;
                link.target = "__blank";
                most_popular_genomes.appendChild(link);
            })


            const most_popular_entry = sorted_genomes[0];
            if (most_popular_entry) {
                const most_popular = most_popular_entry[0];
                most_popular_genome.textContent = most_popular;
                const mermaid_code = genomeToMermaid(decodeGenome(most_popular), NEURONS_QUANTITY);
                renderMermaid(mermaid_code);
            }


            // renderMermaid()
            generation_label.textContent = generation;
            survival_rate_label.textContent = (100.0 / POPULATION_SIZE * parents.length).toFixed(2) + '%';
            kills_rate_label.textContent = (100.0 / POPULATION_SIZE * kills).toFixed(2) + '%';
            eat_rate_label.textContent = (100.0 / POPULATION_SIZE * eated).toFixed(2) + '%';

            setTimeout(draw, INTERVAL);//continues
        }
    }

}


// resize the canvas to fill browser window dynamically
// window.addEventListener('resize', resizeCanvas, false);

// function resizeCanvas() {
//     canvas.width = window.innerWidth;
//     canvas.height = window.innerHeight;
//     draw();
// }

// resizeCanvas();
canvas.width = MAP_SIZE;
canvas.height = MAP_SIZE;
draw();

