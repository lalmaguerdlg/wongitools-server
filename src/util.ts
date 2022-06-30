import { networkInterfaces } from 'os';

export function getAvailableAddresses(): Record<string, string[]> {
  const nets = networkInterfaces();
  const results: Record<string, string[]> = {};
  for (const name of Object.keys(nets)) {

    const netInter = nets[name];
    if (netInter) {
      for (const net of netInter) {
        const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
        if (net.family === familyV4Value && !net.internal) {
          if (!results[name]) {
            results[name] = [];
          }
          results[name].push(net.address);

        }
      }
    }
  }
  return results;
}

export function getFirstLocalInterfaceAddress() {
  const addresses = getAvailableAddresses();
  const result = Object.values(addresses)[0][0];
  
  return result
}

import { ChildProcessWithoutNullStreams } from "child_process";
import { Transform } from "stream";

export default class LineTagTransform extends Transform {
  lastLineData = '';
  tag = '';

  constructor(tag?: string) {
    super({ objectMode: true });

    this.tag = tag || '';
    if (tag && !tag.endsWith(' ')) this.tag += ' ';
  }

  _transform(chunk: Buffer | string | any, encoding: string, callback: Function) {
    let data: string = chunk.toString().replace(/\r(?!\n)/, '\n\r');
    if (this.lastLineData) data = this.lastLineData + data;

    let lines = data.split(/\r?\n/);
    this.lastLineData = lines.splice(lines.length - 1, 1)[0];

    for (const line of lines) {
      if (line.startsWith('\r')) {
        this.push(`\r${this.tag}${line.substring(1)}`);
      } else {
        this.push(`${this.tag}${line}`)
      }
    }
    callback();
  }

  _flush(callback: Function) {
    if (this.lastLineData) {
      if (this.lastLineData.startsWith('\r')) {
        this.push(`\r${this.tag}${this.lastLineData.substring(1)}`);
      } else {
        this.push(`\n${this.tag}${this.lastLineData}`)
      }
    }
    this.lastLineData = '';
    callback();
  }

  static wrapStreams(child: ChildProcessWithoutNullStreams, tag?: string, stdout: NodeJS.WriteStream = process.stdout, stderr: NodeJS.WriteStream = process.stderr) {
    child.stdout.pipe(new LineTagTransform(tag)).pipe(stdout);
    child.stderr.pipe(new LineTagTransform(tag)).pipe(stderr);
  }
}