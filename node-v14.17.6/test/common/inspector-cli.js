'use strict';
const common = require('../common');
const spawn = require('child_process').spawn;

const BREAK_MESSAGE = new RegExp('(?:' + [
  'assert', 'break', 'break on start', 'debugCommand',
  'exception', 'other', 'promiseRejection',
].join('|') + ') in', 'i');

const TIMEOUT = common.platformTimeout(5000);

function isPreBreak(output) {
  return /Break on start/.test(output) && /1 \(function \(exports/.test(output);
}

function startCLI(args, flags = [], spawnOpts = {}) {
  let stderrOutput = '';
  const child =
    spawn(process.execPath, [...flags, 'inspect', ...args], spawnOpts);

  const outputBuffer = [];
  function bufferOutput(chunk) {
    if (this === child.stderr) {
      stderrOutput += chunk;
    }
    // TODO(trott): Figure out why the "breakpoints restored." message appears
    // in unpredictable places especially on AIX in CI. We shouldn't be
    // excluding it, but it gets in the way of the output checking for tests.
    outputBuffer.push(chunk.replace(/\n*\d+ breakpoints restored\.\n*/mg, ''));
  }

  function getOutput() {
    return outputBuffer.join('\n').replace(/\b/g, '');
  }

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', bufferOutput);
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', bufferOutput);

  if (process.env.VERBOSE === '1') {
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  }

  return {
    flushOutput() {
      const output = this.output;
      outputBuffer.length = 0;
      return output;
    },

    waitFor(pattern) {
      function checkPattern(str) {
        if (Array.isArray(pattern)) {
          return pattern.every((p) => p.test(str));
        }
        return pattern.test(str);
      }

      return new Promise((resolve, reject) => {
        function checkOutput() {
          if (checkPattern(getOutput())) {
            tearDown();
            resolve();
          }
        }

        function onChildClose(code, signal) {
          tearDown();
          let message = 'Child exited';
          if (code) {
            message += `, code ${code}`;
          }
          if (signal) {
            message += `, signal ${signal}`;
          }
          message += ` while waiting for ${pattern}; found: ${this.output}`;
          if (stderrOutput) {
            message += `\n STDERR: ${stderrOutput}`;
          }
          reject(new Error(message));
        }

        const timer = setTimeout(() => {
          tearDown();
          reject(new Error([
            `Timeout (${TIMEOUT}) while waiting for ${pattern}`,
            `found: ${this.output}`,
          ].join('; ')));
        }, TIMEOUT);

        function tearDown() {
          clearTimeout(timer);
          child.stdout.removeListener('data', checkOutput);
          child.removeListener('close', onChildClose);
        }

        child.on('close', onChildClose);
        child.stdout.on('data', checkOutput);
        checkOutput();
      });
    },

    waitForPrompt() {
      return this.waitFor(/>\s+$/);
    },

    waitForInitialBreak() {
      return this.waitFor(/break (?:on start )?in/i)
        .then(() => {
          if (isPreBreak(this.output)) {
            return this.command('next', false)
              .then(() => this.waitFor(/break in/));
          }
        });
    },

    get breakInfo() {
      const output = this.output;
      const breakMatch =
        output.match(/break (?:on start )?in ([^\n]+):(\d+)\n/i);

      if (breakMatch === null) {
        throw new Error(
          `Could not find breakpoint info in ${JSON.stringify(output)}`);
      }
      return { filename: breakMatch[1], line: +breakMatch[2] };
    },

    ctrlC() {
      return this.command('.interrupt');
    },

    get output() {
      return getOutput();
    },

    get rawOutput() {
      return outputBuffer.join('').toString();
    },

    parseSourceLines() {
      return getOutput().split('\n')
        .map((line) => line.match(/(?:\*|>)?\s*(\d+)/))
        .filter((match) => match !== null)
        .map((match) => +match[1]);
    },

    writeLine(input, flush = true) {
      if (flush) {
        this.flushOutput();
      }
      if (process.env.VERBOSE === '1') {
        process.stderr.write(`< ${input}\n`);
      }
      child.stdin.write(input);
      child.stdin.write('\n');
    },

    command(input, flush = true) {
      this.writeLine(input, flush);
      return this.waitForPrompt();
    },

    stepCommand(input) {
      this.writeLine(input, true);
      return this
        .waitFor(BREAK_MESSAGE)
        .then(() => this.waitForPrompt());
    },

    quit() {
      return new Promise((resolve) => {
        child.stdin.end();
        child.on('close', resolve);
      });
    },
  };
}
module.exports = startCLI;
