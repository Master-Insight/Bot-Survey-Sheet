import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Subimos dos niveles para eliminar 'app/pkg'
const projectRoot = join(__dirname, '..', '..');

export default projectRoot;