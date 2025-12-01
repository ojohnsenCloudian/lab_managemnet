let ssh2Module: any = null;

function getSsh2() {
  if (!ssh2Module) {
    ssh2Module = eval('require')('ssh2');
  }
  return ssh2Module;
}

export function getClient() {
  return getSsh2().Client;
}

export type ClientChannel = any;
export default getSsh2();
