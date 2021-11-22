import { getRandomArbitrary, getRandomInt } from './helpers.js';
import inputs from './inputs.js';
import actions from './actions.js';

export const NeuronType = {
    INPUT: 1,  // always a source
    ACTION: 1,  // always a sink
    NEURON: 0,  // can be either a source or sink
}

function excite(brain, connections, input_value, origin_trace) {
    connections?.forEach((connection) => {
        //transform in value between -1 and 1
        const connection_input_value = Math.tanh(connection.weight * input_value * connection.quantity);

        //action
        if (connection.type) {
            const action = actions[connection.id];
            action && action(brain.event, connection_input_value);

            //neuron
        } else if (origin_trace[connection.id]) { //if has some loop

            const neuron = brain.neurons[connection.id];
            if (neuron) {
                //add in weight in this connection for the next time this neuron get excited
                if (neuron.weight < 4 && neuron.weight > -4) {
                    neuron.weight = ((neuron.weight + input_value) + neuron.weight / 2);
                    if (neuron.weight < -4) neuron.weight = -4;
                    if (neuron.weight > 4) neuron.weight = 4;
                }
            }

        } else { //avoid loops
            origin_trace[connection.id] = true;
            const neuron = brain.neurons[connection.id];
            neuron && excite(brain, neuron, input_value, origin_trace);
        }
    })
}

function update_brain(brain) {
    inputs.forEach((input, index) => {
        //response value between -1 and 1
        const input_value = input(brain);
        if (input_value > 0) {  //if its more than 0 so do something
            excite(brain, brain.inputs[index], input_value, {});
        }
    })
}

export function gene(source, sink, weight) {
    weight = weight || 0;
    if (weight < -4.0) weight = -4.0;
    if (weight > 4.0) weight = 4.0;

    return {
        source_type: source.type, // SENSOR or NEURON
        source_id: (source.id || 0) % 32767,
        sink_type: sink.type,   // NEURON or ACTION
        sink_id: (sink.id || 0) % 32767,
        weight: weight
    }
}

function bit_toggle(num, bit) {
    //bit test ? bit clean : bit_set
    return ((num >> bit) % 2 != 0) ? num & ~(1 << bit) : num | 1 << bit;
}

function floatToUint32(value) {
    return new DataView(new Float32Array([value]).buffer).getUint32(0, false);
}
function uint32ToFloat(value) {
    return new DataView(new Uint32Array([value]).buffer).getFloat32(0, false);
}

export function randomGenome(gene_quantity) {
    const genome = new Array(gene_quantity);
    for (let i = 0; i < genome.length; i++)
        genome[i] = randomGene();
    return genome;
}

export function randomGene() {
    const array = new Uint32Array(2);
    crypto.getRandomValues(array);

    const view = new DataView(array.buffer);
    const source = view.getUint16(0, false);
    const sink = view.getUint16(2, false);
    const weight = view.getFloat32(4, false);
    return gene({
        type: source >> 15,
        id: source & ~(1 << 15),
    },
        {
            type: sink >> 15,
            id: sink & ~(1 << 15),
        },
        weight);
}
export function mutateGenome(genome){
    const mutate_idx = getRandomInt(0, genome.length);

    const new_gene = mutateGene(genome[mutate_idx]);
    const new_genome = [...genome];
    new_genome[mutate_idx] = new_gene;
    return new_genome;
}
export function mutateGene(gene) {
    const flipped_bit = getRandomInt(0, 32);
    gene = { ...gene };
    switch (flipped_bit) {
        case 0:
            gene.source_type = gene.source_type ? 0 : 1;
        case 16:
            gene.sink_type = gene.sink_type ? 0 : 1;
        default:
            if (flipped_bit < 16)
                gene.source_id = bit_toggle(gene.source_id, flipped_bit) % 32767;
            else if (flipped_bit < 32)
                gene.sink_id = bit_toggle(gene.sink_id, flipped_bit - 16) % 32767;
            else {
                gene.weight = uint32ToFloat(bit_toggle(floatToUint32(gene.weight), flipped_bit - 32));
                if (gene.weight < -4) gene.weight = -4;
                if (gene.weight > 4) gene.weight = 4;
            }
    }
    return gene;
}



export function encodeGene(gene) {
    //max source/sink id 32767
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint16(0, (gene.source_type << 15) + gene.source_id, false);
    view.setUint16(2, (gene.sink_type << 15) + gene.sink_id, false);
    return view.getUint32(0).toString(16) + '-' + floatToUint32(gene.weight).toString(16);
}

export function decodeGene(encoded_gene) {
    let [data, weight] = encoded_gene.split('-');

    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, parseInt(data, 16), false);

    const source = view.getUint16(0, false);
    const sink = view.getUint16(2, false);

    return gene({
        type: source >> 15,
        id: source & ~(1 << 15),
    },
        {
            type: sink >> 15,
            id: sink & ~(1 << 15),
        },
        uint32ToFloat(parseInt(weight, 16)));
}

export function getBrainFrom(genome, event, total_neurons) {

    const brain = {
        genome,
        event,
        inputs: {},
        neurons: {},
        age: 0,
        total_neurons,
        update: () => update_brain(brain)
    }

    genome.forEach((gene) => {
        const source_id = gene.source_type ? (gene.source_id % inputs.length) : (gene.source_id % total_neurons);
        const connections = gene.source_type ? brain.inputs : brain.neurons;
        const connection = connections[source_id] = connections[source_id] || [];
        const sink_id = gene.sink_type ? gene.sink_id % actions.length : gene.sink_id % total_neurons;
        const current_connection = connection.find((c) => c.type === gene.sink_type && c.id === sink_id);
        //if has more than one connection for the same output get avg weight and add in quantity
        if (current_connection) {
            current_connection.weight = (current_connection.weight + gene.weight) / 2;
            if (current_connection.weight < -4) current_connection.weight = -4;
            if (current_connection.weight > 4) current_connection.weight = 4;

            current_connection.quantity++;
        } else {
            connection.push({ type: gene.sink_type, id: sink_id, weight: gene.weight, quantity: 1 });
        }
        connections[source_id] = connection;
    });

    return brain;
}