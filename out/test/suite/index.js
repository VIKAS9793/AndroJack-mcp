"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const path = require("path");
const Mocha = require("mocha");
const glob_1 = require("glob");
async function run() {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'tdd',
        color: true
    });
    const testsRoot = path.resolve(__dirname, '..');
    const files = await (0, glob_1.glob)('**/**.test.js', { cwd: testsRoot });
    // Add files to the test suite
    files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));
    try {
        return new Promise((c, e) => {
            // Run the mocha test
            mocha.run(failures => {
                if (failures > 0) {
                    e(new Error(`${failures} tests failed.`));
                }
                else {
                    c();
                }
            });
        });
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
//# sourceMappingURL=index.js.map