import {dirname} from 'node:path/posix';
export class SftpReleaseStore {
  constructor(call) {this.call=call;this.directories=new Map();}
  get(path){return this.call('readFile',path);}
  async exists(path){try{await this.call('stat',path);return true;}catch(error){if(error.code===2)return false;throw error;}}
  mkdir(path){return this.call('mkdir',path,{mode:0o755});}
  async ensure(path){
    if(!path||path==='.')return;
    if(!this.directories.has(path))this.directories.set(path,(async()=>{
      await this.ensure(dirname(path));
      try{await this.mkdir(path);}catch(error){const info=await this.call('stat',path);if(!info.isDirectory())throw error;}
    })());
    return this.directories.get(path);
  }
  async put(path,bytes){await this.ensure(dirname(path));await this.call('writeFile',path,bytes,{mode:0o644});}
  rename(from,to){return this.call('ext_openssh_rename',from,to);}
  remove(path){return this.call('unlink',path);}
  rmdir(path){return this.call('rmdir',path);}
}
