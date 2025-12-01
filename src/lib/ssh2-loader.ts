// Wrapper module to load ssh2 at runtime
// This avoids webpack/Turbopack trying to bundle the native module
// Using eval() to prevent static analysis of the require() call
import type { Client, ClientChannel } from 'ssh2';

let ssh2Module: typeof import('ssh2') | null = null;

function getSsh2() {
  if (!ssh2Module) {
    // Use eval to load the module - this prevents bundlers from analyzing it
    // eslint-disable-next-line no-eval
    ssh2Module = eval('require')('ssh2');
  }
  return ssh2Module;
}

// Export a function that returns the Client class
export function getClient(): typeof Client {
  return getSsh2().Client;
}

// Export the ClientChannel type
export type { ClientChannel };

export default getSsh2();
