let ssh2Module: any = null;

function getSsh2() {
  if (!ssh2Module) {
    // Use eval to load the module - this prevents bundlers from analyzing it
    // eslint-disable-next-line no-eval
    ssh2Module = eval('require')('ssh2');
  }
  return ssh2Module;
}

export function getClient() {
  return getSsh2().Client;
}

export type ClientChannel = any;
export default getSsh2();
