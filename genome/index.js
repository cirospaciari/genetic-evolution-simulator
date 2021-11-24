import { genomeToMermaid, decodeGenome } from '../neural_net.js';
import { renderMermaid } from '../helpers.js';

const params = new URLSearchParams(document.location.search);
const neurons = parseInt(params.get('neurons') || 0, 10);
const genome = params.get('genome');
genome_code.textContent = genome;
const mermaid_code = genomeToMermaid(decodeGenome(genome), neurons);
renderMermaid(mermaid_code);