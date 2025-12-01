// Wrapper module to load ssh2 at runtime
// This avoids Turbopack trying to bundle the native module
// Using eval() to prevent Turbopack from statically analyzing the require() call
let ssh2Module: any = null;

function getSsh2() {
  if (!ssh2Module) {
    // Use eval to load the module - this prevents Turbopack from analyzing it
    // eslint-disable-next-line no-eval
    ssh2Module = eval('require')('ssh2');
  }
  return ssh2Module;
}

// Export a function that returns the Client class
export function getClient() {
  return getSsh2().Client;
}

export type ClientChannel = any;
export default getSsh2();

