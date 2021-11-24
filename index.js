
import { getBrainFrom, mutateGenome, randomGenome, encodeGenome, genomeToMermaid, decodeGenome } from './neural_net.js';
import { genomeColor, getRandomInt, hasEvent, setPosition, renderMermaid } from './helpers.js'


function getRandomAvailablePosition() {
    let position = null;
    do {
        position = { x: getRandomInt(0, MAP_TILES), y: getRandomInt(0, MAP_TILES) }
    } while (hasEvent(position.x, position.y));
    return position;

}

function randomBrain() {

    const genome = randomGenome(GENES_QUANTITY);
    const event = { ...getRandomAvailablePosition(), color: genomeColor(genome), age: 0, max_x: MAP_TILES, max_y: MAP_TILES, hp: 100, energy: 150, max_energy: 150, max_hp: 100, atk: 10 };
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

    events.forEach((brain) => {

        const event = brain.event;

        if (!event.killed && event.age < 300) { //dies on age 300
            ctx.fillStyle = event.color;
            ctx.fillRect(event.x * EVENT_SIZE, event.y * EVENT_SIZE, EVENT_SIZE, EVENT_SIZE);

            event.last_hp = event.hp;
            event.last_energy = event.energy;
            event.is_moving = false;
            event.is_resting = false;
            if (event.age - event.last_energy_drop > 2 && event.energy < event.max_energy) event.energy++;
            brain.update();

            event.age++;
        }
    });

    if (events.some((brain) => brain.event.age < MAX_AGE && !brain.event.killed)) {
        setTimeout(draw, INTERVAL);//continues
    } else {
        if (generation < GENERATIONS) { //stop
            generation++;
            const kills = events.filter((brain) => brain.event.killed).length;
            const parents = events.filter(survival);
            MAP_GRID = {};
            const genome_ranking = {};
            events = [];
            //filter and start new generation
            while (events.length < POPULATION_SIZE) {
                for (let i = 0; i < parents.length && events.length < POPULATION_SIZE; i++) {
                    const brain = parents[i];
                    let new_genome = brain.genome;
                    const encoded_genome = encodeGenome(brain.genome);
                    genome_ranking[encoded_genome] = genome_ranking[encoded_genome] || 0;
                    genome_ranking[encoded_genome]++;

                    if (Math.random() < MUTATION_RATE) new_genome = mutateGenome(new_genome);
                    const event = { ...brain.event, ...getRandomAvailablePosition(), age: 0, color: genomeColor(new_genome), hp: 100, energy: 150, killed: false };
                    setPosition(event.x, event.y, event);
                    const new_brain = getBrainFrom(new_genome, event, brain.total_neurons);
                    events.push(new_brain);
                }
            }
            const sorted_genomes = Object.entries(genome_ranking).sort((a, b) => b[1] - a[1]);
            diversity_label.textContent = sorted_genomes.length; 

            most_popular_genomes.innerHTML = '';
            sorted_genomes.filter((value, index)=> index < 100).map((value, index)=> {

                const link = document.createElement('a');
                link.href = `/genome/?neurons=${NEURONS_QUANTITY}&genome=${encodeURIComponent(value[0])}`;
                link.innerHTML = `${index+1}&#186; (${value[1]}) `;
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

            setTimeout(draw, INTERVAL);//continues
        }
    }

}


// resize the canvas to fill browser window dynamically
window.addEventListener('resize', resizeCanvas, false);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
}

resizeCanvas();