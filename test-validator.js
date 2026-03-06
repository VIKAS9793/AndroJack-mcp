import { androidCodeValidator } from "./build/tools/validator.js";

async function run() {
  const code = `
    class MyViewModel: ViewModel() {
      fun test() {
        GlobalScope.launch {
          // Bad
        }
      }
    }
  `;
  const res = await androidCodeValidator(code, "kotlin", 24, 36);
  console.log(res);
}

run().catch(console.error);
